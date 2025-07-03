import { NextResponse } from "next/server";
import { redisService } from "@/lib/redis";
import { CacheService } from "@/services/cache";

export async function GET() {
  try {
    // 测试Redis连接
    const isConnected = await redisService.ping();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: "Redis connection failed",
        cache_stats: { isConnected: false, totalKeys: 0, iconKeys: 0 }
      });
    }

    // 获取缓存统计
    const stats = await CacheService.getStats();
    
    // 测试缓存操作
    const testKey = 'test-icon-123';
    const testData = {
      id: 1,
      uuid: testKey,
      user_uuid: 'test-user',
      prompt: 'test prompt',
      status: 'completed',
      style: 'solid',
      format: 'svg',
      credits_cost: 1,
      created_at: new Date()
    };

    // 设置测试缓存
    const setResult = await CacheService.setIcon(testKey, testData as any);
    
    // 获取测试缓存
    const getResult = await CacheService.getIcon(testKey);
    
    // 删除测试缓存
    await CacheService.deleteIcon(testKey);

    return NextResponse.json({
      success: true,
      redis_connected: isConnected,
      cache_stats: stats,
      test_results: {
        set_success: setResult,
        get_success: !!getResult,
        data_matches: getResult?.uuid === testKey
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      redis_connected: false
    });
  }
}