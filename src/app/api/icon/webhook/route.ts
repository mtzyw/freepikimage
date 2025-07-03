import { NextRequest, NextResponse } from "next/server";
import { IconGenerationModel } from "@/models/icon-generation";
import { newStorage } from "@/lib/storage";
import { increaseCredits, CreditsTransType } from "@/services/credit";
import { downloadSvgAndConvertToPng } from "@/lib/image-converter";
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
      // 首先尝试通过 task_id 查找（修正方法名）
      record = await IconGenerationModel.findByFreepikTaskId(webhookData.task_id);
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

    // 4. 处理不同状态
    if (webhookData.status === 'IN_PROGRESS') {
      // 更新状态为正在生成
      await IconGenerationModel.updateByUuid(record.uuid, {
        status: 'generating'
      });
      console.log('Icon generation in progress:', record.uuid);
      
    } else if (webhookData.status === 'COMPLETED' && webhookData.generated && webhookData.generated.length > 0) {
      try {
        // 下载图片并上传到 R2 (现在支持双格式)
        const imageUrl = webhookData.generated[0]; // 取第一张图片
        
        const storage = newStorage();
        let svgUploadResult, pngUploadResult;
        let svgFileSize = 0, pngFileSize = 0;
        
        // 生成SVG和PNG的R2存储路径
        const svgR2Key = `icons/${record.uuid}.svg`;
        const pngR2Key = `icons/${record.uuid}.png`;
        
        // 1. 处理SVG格式
        if (record.format === 'svg') {
          console.log('📥 处理SVG格式图标...');
          
          // 上传原始SVG到R2
          svgUploadResult = await storage.downloadAndUpload({
            url: imageUrl,
            key: svgR2Key,
            contentType: 'image/svg+xml',
            disposition: 'inline'
          });
          
          svgFileSize = await getFileSizeFromUrl(imageUrl);
          console.log('✅ SVG上传成功:', svgUploadResult.url);
          
          // 2. 转换并上传PNG格式
          console.log('🎨 开始SVG→PNG转换...');
          
          const pngBuffer = await downloadSvgAndConvertToPng(imageUrl, 512, 512);
          
          // 上传PNG到R2
          pngUploadResult = await storage.uploadFile({
            body: pngBuffer,
            key: pngR2Key,
            contentType: 'image/png',
            disposition: 'inline'
          });
          
          pngFileSize = pngBuffer.length;
          console.log('✅ PNG转换并上传成功:', pngUploadResult.url);
          
        } else {
          // 如果原始格式是PNG，暂时只上传PNG（未来可能加入PNG→SVG转换）
          console.log('📥 处理PNG格式图标...');
          
          pngUploadResult = await storage.downloadAndUpload({
            url: imageUrl,
            key: pngR2Key,
            contentType: 'image/png',
            disposition: 'inline'
          });
          
          pngFileSize = await getFileSizeFromUrl(imageUrl);
          console.log('✅ PNG上传成功:', pngUploadResult.url);
        }
        
        // 计算生成时间
        const generationTime = record.started_at 
          ? Math.floor((Date.now() - new Date(record.started_at).getTime()) / 1000)
          : null;

        // 更新数据库记录（使用新的双格式字段）
        const updateData: any = {
          status: 'completed',
          original_url: imageUrl,
          generation_time: generationTime,
          completed_at: new Date(),
          // 兼容旧字段
          r2_key: record.format === 'svg' ? svgR2Key : pngR2Key,
          r2_url: record.format === 'svg' ? svgUploadResult?.url : pngUploadResult?.url,
          file_size: record.format === 'svg' ? svgFileSize : pngFileSize
        };
        
        // 新的双格式字段
        if (svgUploadResult) {
          updateData.svg_r2_key = svgR2Key;
          updateData.svg_r2_url = svgUploadResult.url;
          updateData.svg_file_size = svgFileSize;
        }
        
        if (pngUploadResult) {
          updateData.png_r2_key = pngR2Key;
          updateData.png_r2_url = pngUploadResult.url;
          updateData.png_file_size = pngFileSize;
        }
        
        await IconGenerationModel.updateByUuid(record.uuid, updateData);

        console.log('🎉 图标生成完成（双格式）:', record.uuid, {
          svg: svgUploadResult?.url,
          png: pngUploadResult?.url
        });

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