import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { IconGenerationModel } from "@/models/icon-generation";
import { CacheService } from "@/services/cache";
import { increaseCredits, CreditsTransType } from "@/services/credit";
import type { IconGeneration } from "@/types/icon-generation";

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
    const body = await request.json();
    const { uuids } = body;

    // 3. 验证参数
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return NextResponse.json(
        { error: "uuids array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (uuids.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 UUIDs allowed per request" },
        { status: 400 }
      );
    }

    // 4. 混合查询策略：缓存 + 数据库
    const results = await batchQueryWithCache(session.user.uuid, uuids);

    // 5. 构建响应格式
    const response: Record<string, any> = {};
    
    results.forEach(generation => {
      const baseInfo = {
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

      // 根据状态添加相应信息
      if (generation.status === 'completed') {
        response[generation.uuid] = {
          ...baseInfo,
          // 优先使用新的双格式字段，fallback到旧字段保持兼容性
          image_url: generation.r2_url, // 兼容旧字段
          svg_url: generation.svg_r2_url,
          png_url: generation.png_r2_url,
          file_size: generation.file_size, // 兼容旧字段
          svg_file_size: generation.svg_file_size,
          png_file_size: generation.png_file_size,
          generation_time: generation.generation_time
        };
      } else if (generation.status === 'failed') {
        response[generation.uuid] = {
          ...baseInfo,
          error_message: generation.error_message
        };
      } else if (generation.status === 'generating') {
        // 计算预估剩余时间
        const elapsedTime = generation.started_at 
          ? Math.floor((Date.now() - new Date(generation.started_at).getTime()) / 1000)
          : 0;
        const estimatedTotal = 30; // 估计总时间30秒
        response[generation.uuid] = {
          ...baseInfo,
          estimated_remaining: Math.max(0, estimatedTotal - elapsedTime)
        };
      } else {
        response[generation.uuid] = baseInfo;
      }
    });

    // 6. 对于没有找到的UUID，标记为not_found
    uuids.forEach((uuid: string) => {
      if (!response[uuid]) {
        response[uuid] = {
          uuid,
          status: 'not_found',
          error: 'Generation not found'
        };
      }
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Batch status query error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 混合查询策略：优先缓存，未命中则查数据库
 * 包含降级策略：缓存服务不可用时自动降级到数据库查询
 */
async function batchQueryWithCache(userUuid: string, uuids: string[]): Promise<IconGeneration[]> {
  try {
    // 1. 尝试从缓存批量获取
    const cachedData = await CacheService.batchGetIcons(uuids);
    console.log(`Cache hit for ${cachedData.size}/${uuids.length} icons`);

    // 2. 找出缓存未命中的UUID，需要验证用户权限
    const uncachedUuids = uuids.filter(uuid => !cachedData.has(uuid));
    
    let dbResults: IconGeneration[] = [];
    if (uncachedUuids.length > 0) {
      // 3. 从数据库查询未缓存的数据（包含用户权限验证）
      dbResults = await IconGenerationModel.batchGetByUserAndUuids(userUuid, uncachedUuids);
      console.log(`DB query returned ${dbResults.length}/${uncachedUuids.length} icons`);

      // 4. 异步更新缓存（不阻塞响应）
      if (dbResults.length > 0) {
        CacheService.batchSetIcons(dbResults).catch(error => {
          console.warn('Failed to update cache after DB query:', error);
        });
      }
    }

    // 5. 合并缓存数据和数据库数据
    const allResults: IconGeneration[] = [];
    
    // 添加缓存命中的数据（需要验证用户权限）
    for (const [uuid, data] of cachedData) {
      if (data.user_uuid === userUuid) {
        allResults.push(data);
      }
    }
    
    // 添加数据库查询的数据
    allResults.push(...dbResults);

    // 6. 检查和处理超时任务
    const { processedIcons, timeoutUpdates } = CacheService.batchCheckAndHandleTimeouts(allResults);

    // 7. 异步更新超时任务的数据库状态（不阻塞响应）
    if (timeoutUpdates.length > 0) {
      console.log(`Processing ${timeoutUpdates.length} timeout updates`);
      
      // 批量更新数据库
      Promise.all(
        timeoutUpdates.map(async ({ uuid, updateData }) => {
          try {
            // 查找原始记录以获取用户和积分信息
            const originalIcon = allResults.find(icon => icon.uuid === uuid);
            if (!originalIcon) {
              console.error(`❌ Original icon record not found for timeout task ${uuid}`);
              return;
            }

            await IconGenerationModel.updateByUuid(uuid, updateData);
            
            // 退还积分给用户
            try {
              await increaseCredits({
                user_uuid: originalIcon.user_uuid,
                trans_type: CreditsTransType.SystemAdd,
                credits: originalIcon.credits_cost,
                order_no: `timeout_refund_${uuid}`,
                expired_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1年有效期
              });
              console.log(`💰 Credits refunded for timeout task: ${uuid}, amount: ${originalIcon.credits_cost}`);
            } catch (error) {
              console.error(`❌ Failed to refund credits for timeout task ${uuid}:`, error);
            }
            
            // 同时更新缓存
            await CacheService.updateIcon(uuid, updateData);
            console.log(`✅ Updated timeout task ${uuid}`);
          } catch (error) {
            console.error(`❌ Failed to update timeout task ${uuid}:`, error);
          }
        })
      ).catch(error => {
        console.error('❌ Error in batch timeout updates:', error);
      });
    }

    return processedIcons;

  } catch (error) {
    console.warn('Cache query failed, falling back to database:', error);
    
    // 降级策略：缓存失败时直接查数据库
    const dbResults = await IconGenerationModel.batchGetByUserAndUuids(userUuid, uuids);
    
    // 即使在降级模式下也要处理超时任务
    const { processedIcons, timeoutUpdates } = CacheService.batchCheckAndHandleTimeouts(dbResults);
    
    // 异步更新超时任务（不阻塞响应）
    if (timeoutUpdates.length > 0) {
      console.log(`Processing ${timeoutUpdates.length} timeout updates in fallback mode`);
      
      Promise.all(
        timeoutUpdates.map(async ({ uuid, updateData }) => {
          try {
            // 查找原始记录以获取用户和积分信息
            const originalIcon = dbResults.find(icon => icon.uuid === uuid);
            if (!originalIcon) {
              console.error(`❌ Original icon record not found for timeout task ${uuid} in fallback mode`);
              return;
            }

            await IconGenerationModel.updateByUuid(uuid, updateData);
            
            // 退还积分给用户
            try {
              await increaseCredits({
                user_uuid: originalIcon.user_uuid,
                trans_type: CreditsTransType.SystemAdd,
                credits: originalIcon.credits_cost,
                order_no: `timeout_refund_${uuid}`,
                expired_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1年有效期
              });
              console.log(`💰 Credits refunded for timeout task: ${uuid}, amount: ${originalIcon.credits_cost} (fallback mode)`);
            } catch (error) {
              console.error(`❌ Failed to refund credits for timeout task ${uuid} in fallback mode:`, error);
            }

            console.log(`✅ Updated timeout task ${uuid} in fallback mode`);
          } catch (error) {
            console.error(`❌ Failed to update timeout task ${uuid} in fallback mode:`, error);
          }
        })
      ).catch(error => {
        console.error('❌ Error in batch timeout updates (fallback mode):', error);
      });
    }
    
    return processedIcons;
  }
}