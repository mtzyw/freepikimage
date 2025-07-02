import { db } from "@/db";
import { third_party_api_keys } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { ThirdPartyApiKey } from "@/types/third-party-api-key";

export class ThirdPartyApiKeyModel {
  // 获取指定服务商的可用密钥（按 id 顺序轮询）
  static async getAvailableKeys(provider: string): Promise<ThirdPartyApiKey[]> {
    const result = await db()
      .select()
      .from(third_party_api_keys)
      .where(
        and(
          eq(third_party_api_keys.provider, provider),
          eq(third_party_api_keys.status, 'active')
        )
      )
      .orderBy(asc(third_party_api_keys.id));
    
    return result as ThirdPartyApiKey[];
  }

  // 标记密钥为禁用状态
  static async disableKey(keyId: number): Promise<boolean> {
    try {
      const result = await db()
        .update(third_party_api_keys)
        .set({
          status: 'disabled'
        })
        .where(eq(third_party_api_keys.id, keyId));
      
      return result.length > 0;
    } catch (error) {
      console.error('Failed to disable key:', error);
      return false;
    }
  }

  // 启用密钥
  static async enableKey(keyId: number): Promise<boolean> {
    try {
      const result = await db()
        .update(third_party_api_keys)
        .set({
          status: 'active'
        })
        .where(eq(third_party_api_keys.id, keyId));
      
      return result.length > 0;
    } catch (error) {
      console.error('Failed to enable key:', error);
      return false;
    }
  }

  // 添加新密钥
  static async addKey(provider: string, apiKey: string): Promise<ThirdPartyApiKey | null> {
    try {
      const result = await db()
        .insert(third_party_api_keys)
        .values({
          provider,
          api_key: apiKey,
          status: 'active',
          created_at: new Date()
        })
        .returning();
      
      return result[0] as ThirdPartyApiKey || null;
    } catch (error) {
      console.error('Failed to add API key:', error);
      return null;
    }
  }
}