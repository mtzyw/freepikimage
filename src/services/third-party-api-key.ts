import { ThirdPartyApiKeyModel } from "@/models/third-party-api-key";
import type { ApiKeyRotationResult } from "@/types/third-party-api-key";

// 记录每个服务商的当前轮询位置
const rotationCounters: Record<string, number> = {};

export class ThirdPartyApiKeyService {
  /**
   * 获取下一个轮询密钥并处理失败重试
   * @param provider 服务商名称
   * @param excludeKeyIds 排除的密钥ID（已失败的）
   * @returns API 密钥结果
   */
  static async getRotatedApiKey(
    provider: string, 
    excludeKeyIds: number[] = []
  ): Promise<ApiKeyRotationResult> {
    try {
      // 获取所有可用密钥
      const availableKeys = await ThirdPartyApiKeyModel.getAvailableKeys(provider);
      
      if (availableKeys.length === 0) {
        return {
          success: false,
          error: `No available API keys for provider: ${provider}`
        };
      }

      // 过滤掉已失败的密钥
      const validKeys = availableKeys.filter(key => !excludeKeyIds.includes(key.id));
      
      if (validKeys.length === 0) {
        return {
          success: false,
          error: `All keys have failed for provider: ${provider}`
        };
      }

      // 获取当前轮询位置
      if (!rotationCounters[provider]) {
        rotationCounters[provider] = 0;
      }

      // 计算下一个密钥的索引
      const currentIndex = rotationCounters[provider] % validKeys.length;
      const selectedKey = validKeys[currentIndex];

      // 更新轮询计数器
      rotationCounters[provider] = (rotationCounters[provider] + 1) % validKeys.length;

      return {
        success: true,
        apiKey: selectedKey.api_key,
        keyId: selectedKey.id
      };
    } catch (error) {
      console.error('Error in getRotatedApiKey:', error);
      return {
        success: false,
        error: 'Internal error occurred'
      };
    }
  }

  /**
   * 标记密钥失败（今日不再使用）
   * @param keyId 密钥ID
   * @returns 操作结果
   */
  static async markKeyAsFailed(keyId: number): Promise<boolean> {
    return await ThirdPartyApiKeyModel.disableKey(keyId);
  }

  /**
   * 执行 API 调用并自动处理失败重试
   * @param provider 服务商
   * @param apiCall API 调用函数
   * @param maxRetries 最大重试次数
   * @returns 调用结果
   */
  static async executeWithRetry<T>(
    provider: string,
    apiCall: (apiKey: string) => Promise<T>,
    maxRetries: number = 3
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const failedKeyIds: number[] = [];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // 获取下一个可用密钥
      const keyResult = await this.getRotatedApiKey(provider, failedKeyIds);
      
      if (!keyResult.success) {
        return {
          success: false,
          error: keyResult.error
        };
      }

      try {
        // 尝试执行 API 调用
        const result = await apiCall(keyResult.apiKey!);
        return {
          success: true,
          data: result
        };
      } catch (error: any) {
        console.error(`API call failed with key ${keyResult.keyId}:`, error);
        
        // 检查错误类型，如果是配额相关错误，标记密钥为失败
        if (this.isQuotaError(error)) {
          failedKeyIds.push(keyResult.keyId!);
          await this.markKeyAsFailed(keyResult.keyId!);
        }
        
        // 如果是最后一次尝试，返回错误
        if (attempt === maxRetries - 1) {
          return {
            success: false,
            error: `All retries failed. Last error: ${error.message}`
          };
        }
      }
    }

    return {
      success: false,
      error: 'Unexpected error in retry logic'
    };
  }

  /**
   * 判断是否为配额相关错误
   * @param error 错误对象
   * @returns 是否为配额错误
   */
  private static isQuotaError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.status || error.code;
    
    // 常见的配额错误标识
    return (
      errorCode === 429 || // Too Many Requests
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('exceeded') ||
      errorMessage.includes('daily limit')
    );
  }
}