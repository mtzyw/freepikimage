import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { IconGenerationModel } from "@/models/icon-generation";

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户登录
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 解析请求体
    const { uuids } = await request.json();
    
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return NextResponse.json(
        { error: "Invalid uuids array" },
        { status: 400 }
      );
    }

    // 3. 验证所有UUID都属于当前用户并删除
    let deletedCount = 0;
    const results = await Promise.all(
      uuids.map(async (uuid: string) => {
        try {
          // 先验证是否属于用户
          const generation = await IconGenerationModel.findByUserAndUuid(
            session.user.uuid,
            uuid
          );
          
          if (generation) {
            const deleted = await IconGenerationModel.deleteByUuid(uuid);
            if (deleted) {
              deletedCount++;
              return { uuid, success: true };
            }
          }
          
          return { uuid, success: false, error: "Not found or access denied" };
        } catch (error) {
          return { uuid, success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
      })
    );

    return NextResponse.json({
      success: true,
      deletedCount,
      results
    });

  } catch (error) {
    console.error('Batch delete API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}