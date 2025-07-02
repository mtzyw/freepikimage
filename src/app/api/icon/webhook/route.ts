import { NextRequest, NextResponse } from "next/server";
import { IconGenerationModel } from "@/models/icon-generation";
import { newStorage } from "@/lib/storage";
import { increaseCredits, CreditsTransType } from "@/services/credit";
import type { FreepikWebhookPayload } from "@/types/icon-generation";

export async function POST(request: NextRequest) {
  try {
    // 1. 获取 UUID 参数
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');
    
    if (!uuid) {
      return NextResponse.json(
        { error: "Missing uuid parameter" },
        { status: 400 }
      );
    }

    // 2. 解析 Freepik webhook 数据
    const webhookData: FreepikWebhookPayload = await request.json();
    
    console.log('Freepik webhook received (FULL DATA):', {
      uuid,
      fullWebhookData: JSON.stringify(webhookData, null, 2)
    });

    // 3. 查找对应的生成记录 - 优先使用task_id，其次使用uuid
    let record: any = null;
    
    if (webhookData.task_id) {
      // 首先尝试通过 task_id 查找
      record = await IconGenerationModel.findByTaskId(webhookData.task_id);
    }
    
    if (!record && uuid) {
      // 如果没找到，尝试通过 UUID 查找
      record = await IconGenerationModel.findByUuid(uuid);
    }

    if (!record) {
      console.error('Generation record not found. UUID:', uuid, 'TaskID:', webhookData.task_id);
      return NextResponse.json(
        { error: "Generation record not found" },
        { status: 404 }
      );
    }

    console.log('Found record:', {
      uuid: record.uuid,
      taskId: record.freepik_task_id,
      status: record.status
    });

    // 4. 处理生成完成
    if (webhookData.status === 'COMPLETED' && webhookData.generated && webhookData.generated.length > 0) {
      try {
        // 下载图片并上传到 R2
        const imageUrl = webhookData.generated[0]; // 取第一张图片
        
        // 生成 R2 存储路径
        const r2Key = `icons/${record.uuid}.${record.format}`;
        
        // 使用现有的存储服务上传到 R2
        const storage = newStorage();
        const uploadResult = await storage.downloadAndUpload({
          url: imageUrl,
          key: r2Key,
          contentType: record.format === 'svg' ? 'image/svg+xml' : 'image/png',
          disposition: 'inline'
        });
        
        console.log('R2 upload result:', JSON.stringify(uploadResult, null, 2));
        
        const fileSize = await getFileSizeFromUrl(imageUrl);
        
        // 计算生成时间
        const generationTime = record.started_at 
          ? Math.floor((Date.now() - new Date(record.started_at).getTime()) / 1000)
          : null;

        // 更新数据库记录
        await IconGenerationModel.updateByUuid(record.uuid, {
          status: 'completed',
          original_url: imageUrl,
          r2_key: r2Key,
          r2_url: uploadResult.url,
          file_size: fileSize,
          generation_time: generationTime,
          completed_at: new Date()
        });

        console.log('Icon generation completed:', record.uuid);

      } catch (error) {
        console.error('Failed to process completed generation:', error);
        
        // 标记为失败
        await IconGenerationModel.updateByUuid(record.uuid, {
          status: 'failed',
          error_message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          completed_at: new Date()
        });
      }

    } else if (webhookData.status === 'FAILED') {
      // 5. 处理生成失败
      await IconGenerationModel.updateByUuid(record.uuid, {
        status: 'failed',
        error_message: webhookData.error || 'Generation failed',
        completed_at: new Date()
      });

      // 退还积分给用户
      try {
        await increaseCredits({
          user_uuid: record.user_uuid,
          trans_type: CreditsTransType.SystemAdd,
          credits: record.credits_cost,
          order_no: `refund_${record.uuid}`
        });
        console.log('Credits refunded for failed generation:', record.uuid);
      } catch (error) {
        console.error('Failed to refund credits:', error);
      }

      console.log('Icon generation failed:', record.uuid, webhookData.error);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 获取文件大小的辅助函数
async function getFileSizeFromUrl(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength) : 0;
  } catch (error) {
    console.error('Failed to get file size:', error);
    return 0;
  }
}