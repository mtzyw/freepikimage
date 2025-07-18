import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { icon_generations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ThirdPartyApiKeyService } from "@/services/third-party-api-key";
import { CacheService } from "@/services/cache";
import { getUserCredits, decreaseCredits, CreditsTransType } from "@/services/credit";
import { v4 as uuidv4 } from "uuid";
import type { IconGenerationRequest } from "@/types/icon-generation";

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

    // 2. 解析请求参数
    const body: IconGenerationRequest = await request.json();
    const {
      prompt,
      style = "solid",
      format = "svg", // 默认生成SVG格式，获得最佳质量
      num_inference_steps = 20,
      guidance_scale = 7
    } = body;

    // 3. 验证参数
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // 验证格式参数
    const validFormats = ['svg', 'png'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: "Format must be 'svg' or 'png'" },
        { status: 400 }
      );
    }

    if (num_inference_steps < 10 || num_inference_steps > 50) {
      return NextResponse.json(
        { error: "num_inference_steps must be between 10 and 50" },
        { status: 400 }
      );
    }

    if (guidance_scale < 0 || guidance_scale > 10) {
      return NextResponse.json(
        { error: "guidance_scale must be between 0 and 10" },
        { status: 400 }
      );
    }

    // 4. 检查用户积分
    const creditsRequired = 1; // 每个图标消耗1积分
    const minCreditsRequired = 4; // 最少需要4积分才能生成
    const userCredits = await getUserCredits(session.user.uuid);
    
    if (userCredits.left_credits < minCreditsRequired) {
      return NextResponse.json(
        { error: "积分不足，请充值", credits_required: minCreditsRequired, current_credits: userCredits.left_credits },
        { status: 402 }
      );
    }

    // 5. 获取 Freepik API 密钥
    const keyResult = await ThirdPartyApiKeyService.getRotatedApiKey('freepik');
    if (!keyResult.success) {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    // 6. 生成唯一标识符和 webhook URL
    const generationUuid = uuidv4();
    const webhookUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/api/icon/webhook`;

    // 7. 创建数据库记录
    const newRecord = {
      uuid: generationUuid,
      user_uuid: session.user.uuid,
      prompt: prompt.trim(),
      style,
      format,
      status: 'pending',
      provider: 'freepik',
      num_inference_steps,
      guidance_scale,
      webhook_url: webhookUrl,
      credits_cost: creditsRequired,
      created_at: new Date()
    };

    const iconGeneration = await db()
      .insert(icon_generations)
      .values(newRecord)
      .returning();

    // 预设缓存
    CacheService.setIcon(generationUuid, { ...newRecord, id: iconGeneration[0].id } as any).catch(error => {
      console.warn('Failed to cache new generation record:', error);
    });

    // 8. 调用 Freepik API
    try {
      const freepikResponse = await fetch('https://api.freepik.com/v1/ai/text-to-icon', {
        method: 'POST',
        headers: {
          'x-freepik-api-key': keyResult.apiKey!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          webhook_url: `${webhookUrl}?uuid=${generationUuid}`,
          format,
          style,
          num_inference_steps,
          guidance_scale
        })
      });

      if (!freepikResponse.ok) {
        throw new Error(`Freepik API error: ${freepikResponse.status}`);
      }

      const freepikData = await freepikResponse.json();
      
      console.log('Freepik API response:', JSON.stringify(freepikData, null, 2));

      // 9. 更新数据库记录，添加 Freepik 任务 ID
      const updateData = {
        freepik_task_id: freepikData.data.task_id, // 修正：Freepik返回的task_id在data对象中
        status: 'generating',
        started_at: new Date()
      };

      await db()
        .update(icon_generations)
        .set(updateData)
        .where(eq(icon_generations.uuid, generationUuid));

      // 同步更新缓存
      const fullRecord = { ...newRecord, id: iconGeneration[0].id, ...updateData };
      CacheService.updateIcon(generationUuid, fullRecord).catch(error => {
        console.warn('Failed to update cache after generation start:', error);
      });

      // 10. 扣除积分
      await decreaseCredits({
        user_uuid: session.user.uuid,
        trans_type: CreditsTransType.IconGeneration,
        credits: creditsRequired
      });

      return NextResponse.json({
        success: true,
        uuid: generationUuid,
        taskId: freepikData.data.task_id, // 修正：返回正确的task_id
        status: 'generating',
        estimatedTime: 30 // 估计30秒完成
      });

    } catch (error) {
      console.error('Freepik API call failed:', error);
      
      // 删除失败的记录
      await db()
        .delete(icon_generations)
        .where(eq(icon_generations.uuid, generationUuid));

      // 如果是API密钥问题，标记密钥失败
      if (error instanceof Error && error.message.includes('401')) {
        await ThirdPartyApiKeyService.markKeyAsFailed(keyResult.keyId!);
      }

      return NextResponse.json(
        { error: "图标生成失败，请重试" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Icon generation error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}