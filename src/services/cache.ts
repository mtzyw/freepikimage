import { redisService } from '@/lib/redis';
import type { IconGeneration } from '@/types/icon-generation';

export class CacheService {
  // 缓存键前缀
  private static readonly ICON_PREFIX = 'icon:';
  
  // 不同状态的缓存TTL（秒）
  private static readonly TTL_CONFIG = {
    'pending': 30,      // 30秒，很快会变化
    'generating': 60,   // 60秒，等待完成
    'completed': 3600,  // 1小时，结果稳定
    'failed': 300       // 5分钟，可能重试
  } as const;

  // 默认TTL
  private static readonly DEFAULT_TTL = 300;

  // 超时时间：100秒
  private static readonly GENERATION_TIMEOUT_MS = 100 * 1000;

  /**
   * 生成缓存键
   */
  private static getCacheKey(uuid: string): string {
    return `${this.ICON_PREFIX}${uuid}`;
  }

  /**
   * 根据状态获取TTL
   */
  private static getTTL(status: string): number {
    return this.TTL_CONFIG[status as keyof typeof this.TTL_CONFIG] || this.DEFAULT_TTL;
  }

  /**
   * 设置图标缓存
   */
  static async setIcon(uuid: string, data: IconGeneration): Promise<boolean> {
    try {
      const client = await redisService.getClient();
      if (!client) return false;

      const key = this.getCacheKey(uuid);
      const ttl = this.getTTL(data.status);
      const value = JSON.stringify(data);

      await client.setEx(key, ttl, value);
      return true;
    } catch (error) {
      console.warn('Failed to set cache for icon:', uuid, error);
      return false;
    }
  }

  /**
   * 获取图标缓存
   */
  static async getIcon(uuid: string): Promise<IconGeneration | null> {
    try {
      const client = await redisService.getClient();
      if (!client) return null;

      const key = this.getCacheKey(uuid);
      const value = await client.get(key);
      
      if (!value) return null;

      return JSON.parse(value) as IconGeneration;
    } catch (error) {
      console.warn('Failed to get cache for icon:', uuid, error);
      return null;
    }
  }

  /**
   * 批量获取图标缓存
   */
  static async batchGetIcons(uuids: string[]): Promise<Map<string, IconGeneration>> {
    const result = new Map<string, IconGeneration>();
    
    if (uuids.length === 0) return result;

    try {
      const client = await redisService.getClient();
      if (!client) return result;

      const keys = uuids.map(uuid => this.getCacheKey(uuid));
      const values = await client.mGet(keys);

      values.forEach((value, index) => {
        if (value) {
          try {
            const data = JSON.parse(value) as IconGeneration;
            result.set(uuids[index], data);
          } catch (parseError) {
            console.warn('Failed to parse cached data for uuid:', uuids[index]);
          }
        }
      });

      return result;
    } catch (error) {
      console.warn('Failed to batch get cache for icons:', error);
      return result;
    }
  }

  /**
   * 批量设置图标缓存
   */
  static async batchSetIcons(icons: IconGeneration[]): Promise<boolean> {
    if (icons.length === 0) return true;

    try {
      const client = await redisService.getClient();
      if (!client) return false;

      // 使用 pipeline 批量操作
      const pipeline = client.multi();
      
      icons.forEach(icon => {
        const key = this.getCacheKey(icon.uuid);
        const ttl = this.getTTL(icon.status);
        const value = JSON.stringify(icon);
        pipeline.setEx(key, ttl, value);
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      console.warn('Failed to batch set cache for icons:', error);
      return false;
    }
  }

  /**
   * 更新图标缓存（用于webhook更新）
   */
  static async updateIcon(uuid: string, data: Partial<IconGeneration>): Promise<boolean> {
    try {
      const client = await redisService.getClient();
      if (!client) return false;

      const key = this.getCacheKey(uuid);
      
      // 先获取现有数据
      const existingValue = await client.get(key);
      let updatedData: IconGeneration;
      
      if (existingValue) {
        // 如果缓存中有数据，合并更新
        const existingData = JSON.parse(existingValue) as IconGeneration;
        updatedData = { ...existingData, ...data };
      } else {
        // 如果缓存中没有数据，使用传入的数据（需要有完整的基础数据）
        if (!data.uuid || !data.user_uuid) {
          console.warn('Cannot update cache without uuid and user_uuid:', uuid);
          return false;
        }
        updatedData = data as IconGeneration;
      }
      
      const ttl = this.getTTL(updatedData.status);
      const value = JSON.stringify(updatedData);

      await client.setEx(key, ttl, value);
      console.log(`✅ Cache updated for icon ${uuid}, status: ${updatedData.status}, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      console.warn('Failed to update cache for icon:', uuid, error);
      return false;
    }
  }

  /**
   * 删除图标缓存
   */
  static async deleteIcon(uuid: string): Promise<boolean> {
    try {
      const client = await redisService.getClient();
      if (!client) return false;

      const key = this.getCacheKey(uuid);
      await client.del(key);
      return true;
    } catch (error) {
      console.warn('Failed to delete cache for icon:', uuid, error);
      return false;
    }
  }

  /**
   * 批量删除图标缓存
   */
  static async batchDeleteIcons(uuids: string[]): Promise<boolean> {
    if (uuids.length === 0) return true;

    try {
      const client = await redisService.getClient();
      if (!client) return false;

      const keys = uuids.map(uuid => this.getCacheKey(uuid));
      await client.del(keys);
      return true;
    } catch (error) {
      console.warn('Failed to batch delete cache for icons:', error);
      return false;
    }
  }

  /**
   * 清除所有图标缓存
   */
  static async clearAllIcons(): Promise<boolean> {
    try {
      const client = await redisService.getClient();
      if (!client) return false;

      const pattern = `${this.ICON_PREFIX}*`;
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(keys);
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to clear all icon cache:', error);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   */
  static async getStats(): Promise<{
    isConnected: boolean;
    totalKeys: number;
    iconKeys: number;
  }> {
    try {
      const client = await redisService.getClient();
      if (!client) {
        return { isConnected: false, totalKeys: 0, iconKeys: 0 };
      }

      const isConnected = await redisService.ping();
      const iconKeys = await client.keys(`${this.ICON_PREFIX}*`);
      
      return {
        isConnected,
        totalKeys: 0, // 获取总键数需要额外权限，暂时设为0
        iconKeys: iconKeys.length
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { isConnected: false, totalKeys: 0, iconKeys: 0 };
    }
  }

  /**
   * 检查图标是否超时，如果超时则更新为失败状态
   * @param icon 图标生成记录
   * @returns 更新后的图标记录，如果没有超时则返回原记录
   */
  static checkAndHandleTimeout(icon: IconGeneration): IconGeneration {
    // 只处理 generating 状态的任务
    if (icon.status !== 'generating' || !icon.started_at) {
      return icon;
    }

    const startTime = new Date(icon.started_at).getTime();
    const now = Date.now();
    const elapsedTime = now - startTime;

    if (elapsedTime > this.GENERATION_TIMEOUT_MS) {
      console.log(`⚠️ Task ${icon.uuid} timed out after ${elapsedTime/1000}s in cache check`);
      
      // 返回更新后的对象，但不直接更新数据库
      // 数据库更新应该在调用方处理
      return {
        ...icon,
        status: 'failed',
        error_message: '生成失败，积分已退还。请重试生成。',
        completed_at: new Date()
      };
    }

    return icon;
  }

  /**
   * 批量检查和处理超时任务
   * @param icons 图标生成记录数组
   * @returns 处理后的图标记录数组和需要更新数据库的记录
   */
  static batchCheckAndHandleTimeouts(icons: IconGeneration[]): {
    processedIcons: IconGeneration[];
    timeoutUpdates: { uuid: string; updateData: Partial<IconGeneration> }[];
  } {
    const processedIcons: IconGeneration[] = [];
    const timeoutUpdates: { uuid: string; updateData: Partial<IconGeneration> }[] = [];

    icons.forEach(icon => {
      const processedIcon = this.checkAndHandleTimeout(icon);
      processedIcons.push(processedIcon);

      // 如果状态发生了变化，记录需要更新的数据
      if (processedIcon.status !== icon.status) {
        timeoutUpdates.push({
          uuid: icon.uuid,
          updateData: {
            status: processedIcon.status,
            error_message: processedIcon.error_message,
            completed_at: processedIcon.completed_at
          }
        });
      }
    });

    return { processedIcons, timeoutUpdates };
  }
}