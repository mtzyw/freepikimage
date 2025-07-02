import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { IconGenerationModel } from "@/models/icon-generation";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // 1. 验证用户登录
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 获取参数
    const { uuid } = await params;

    // 3. 查询生成记录，确保是用户自己的
    const generation = await IconGenerationModel.findByUserAndUuid(
      session.user.uuid,
      uuid
    );

    if (!generation) {
      return NextResponse.json(
        { error: "Icon not found or access denied" },
        { status: 404 }
      );
    }

    // 4. 删除记录
    await IconGenerationModel.deleteByUuid(uuid);

    return NextResponse.json({
      success: true,
      message: "Icon deleted successfully"
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}