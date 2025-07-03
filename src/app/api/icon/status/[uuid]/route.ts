import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { IconGenerationModel } from "@/models/icon-generation";
import { CacheService } from "@/services/cache";
import { increaseCredits, CreditsTransType } from "@/services/credit";

// 超时时间：100秒
const GENERATION_TIMEOUT_MS = 100 * 1000;

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
    let generation = await IconGenerationModel.findByUserAndUuid(
      session.user.uuid,
      uuid
    );

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // 4. 检查超时任务
    if (generation.status === 'generating' && generation.started_at) {
      const startTime = new Date(generation.started_at).getTime();
      const now = Date.now();
      const elapsedTime = now - startTime;

      if (elapsedTime > GENERATION_TIMEOUT_MS) {
        console.log(`⚠️ Task ${uuid} timed out after ${elapsedTime/1000}s, marking as failed`);
        
        // 更新数据库状态为失败
        const timeoutUpdate = {
          status: 'failed' as const,
          error_message: '生成失败，积分已退还。',
          completed_at: new Date()
        };

        const updateSuccess = await IconGenerationModel.updateByUuid(uuid, timeoutUpdate);
        
        if (updateSuccess) {
          // 退还积分给用户
          try {
            await increaseCredits({
              user_uuid: generation.user_uuid,
              trans_type: CreditsTransType.SystemAdd,
              credits: generation.credits_cost,
              order_no: `timeout_refund_${uuid}`,
              expired_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1年有效期
            });
            console.log(`💰 Credits refunded for timeout task: ${uuid}, amount: ${generation.credits_cost}`);
          } catch (error) {
            console.error(`❌ Failed to refund credits for timeout task ${uuid}:`, error);
          }

          // 更新缓存
          await CacheService.updateIcon(uuid, timeoutUpdate);
          
          // 更新本地对象
          generation = { ...generation, ...timeoutUpdate };
          console.log(`✅ Task ${uuid} marked as failed due to timeout`);
        } else {
          console.error(`❌ Failed to update timeout status for task ${uuid}`);
        }
      }
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