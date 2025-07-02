import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { IconGenerationModel } from "@/models/icon-generation";

export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户登录
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // 最多50条
    const status = searchParams.get('status'); // 可选的状态过滤

    // 3. 验证状态参数
    const validStatuses = ['pending', 'generating', 'completed', 'failed'];
    const statusFilter = status && validStatuses.includes(status) ? status : undefined;

    // 4. 查询用户的生成历史
    const result = await IconGenerationModel.getUserHistory(
      session.user.uuid,
      page,
      limit,
      statusFilter
    );

    // 5. 获取用户统计信息
    const stats = await IconGenerationModel.getUserStats(session.user.uuid);

    return NextResponse.json({
      success: true,
      data: {
        icons: result.records,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: (page - 1) * limit + limit < result.total
        },
        stats
      }
    });

  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}