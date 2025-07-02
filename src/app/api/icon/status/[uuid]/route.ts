import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { IconGenerationModel } from "@/models/icon-generation";

export async function GET(
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

    // 3. 查询生成记录
    const generation = await IconGenerationModel.findByUserAndUuid(
      session.user.uuid,
      uuid
    );

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // 3. 返回状态信息
    const response: any = {
      uuid: generation.uuid,
      status: generation.status,
      prompt: generation.prompt,
      style: generation.style,
      format: generation.format,
      credits_cost: generation.credits_cost,
      created_at: generation.created_at,
      started_at: generation.started_at,
      completed_at: generation.completed_at
    };

    // 4. 根据状态添加相应信息
    if (generation.status === 'completed') {
      // 优先使用新的双格式字段，fallback到旧字段保持兼容性
      response.image_url = generation.r2_url; // 兼容旧字段
      response.svg_url = generation.svg_r2_url;
      response.png_url = generation.png_r2_url;
      response.file_size = generation.file_size; // 兼容旧字段
      response.svg_file_size = generation.svg_file_size;
      response.png_file_size = generation.png_file_size;
      response.generation_time = generation.generation_time;
    } else if (generation.status === 'failed') {
      response.error_message = generation.error_message;
    } else if (generation.status === 'generating') {
      // 计算预估剩余时间
      const elapsedTime = generation.started_at 
        ? Math.floor((Date.now() - new Date(generation.started_at).getTime()) / 1000)
        : 0;
      const estimatedTotal = 30; // 估计总时间30秒
      response.estimated_remaining = Math.max(0, estimatedTotal - elapsedTime);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}