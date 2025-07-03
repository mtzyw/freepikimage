import { createClient, RedisClientType } from 'redis';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnecting = false;

  async getClient(): Promise<RedisClientType | null> {
    // 如果Redis不可用，返回null（降级策略）
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      return null;
    }

    if (this.client?.isReady) {
      return this.client;
    }

    if (this.isConnecting) {
      // 等待连接完成
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.client;
    }

    try {
      this.isConnecting = true;
      
      // 创建Redis客户端
      const redisUrl = process.env.REDIS_URL || 
        `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
      
      this.client = createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD,
        socket: {
          connectTimeout: 5000,
        },
        // Redis客户端配置
      });

      // 错误处理
      this.client.on('error', (error) => {
        console.warn('Redis connection error:', error.message);
        // 不抛出错误，允许降级到数据库查询
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
      });

      this.client.on('disconnect', () => {
        console.log('Redis disconnected');
      });

      await this.client.connect();
      return this.client;

    } catch (error) {
      console.warn('Failed to connect to Redis:', error);
      this.client = null;
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect() {
    if (this.client?.isReady) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  // 健康检查
  async ping(): Promise<boolean> {
    try {
      const client = await this.getClient();
      if (!client) return false;
      
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}

// 单例模式
const redisService = new RedisService();

export { redisService };
export type { RedisClientType };