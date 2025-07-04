import { db } from "@/db";
import { icon_generations } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { IconGeneration } from "@/types/icon-generation";

export class IconGenerationModel {
  // 根据 UUID 查找生成记录
  static async findByUuid(uuid: string): Promise<IconGeneration | null> {
    const result = await db()
      .select()
      .from(icon_generations)
      .where(eq(icon_generations.uuid, uuid))
      .limit(1);
    
    return result[0] as IconGeneration || null;
  }


  // 根据用户和 UUID 查找生成记录
  static async findByUserAndUuid(userUuid: string, uuid: string): Promise<IconGeneration | null> {
    const result = await db()
      .select()
      .from(icon_generations)
      .where(
        and(
          eq(icon_generations.uuid, uuid),
          eq(icon_generations.user_uuid, userUuid)
        )
      )
      .limit(1);
    
    return result[0] as IconGeneration || null;
  }

  // 获取用户的生成历史（分页）
  static async getUserHistory(
    userUuid: string, 
    page: number = 1, 
    limit: number = 20,
    status?: string
  ): Promise<{
    records: IconGeneration[];
    total: number;
  }> {
    const offset = (page - 1) * limit;
    
    const baseCondition = eq(icon_generations.user_uuid, userUuid);
    
    // 如果有状态过滤
    let whereCondition = baseCondition;
    if (status && ['pending', 'generating', 'completed', 'failed'].includes(status)) {
      whereCondition = and(
        baseCondition,
        eq(icon_generations.status, status as any)
      )!;
    }

    // 查询记录
    const records = await db()
      .select()
      .from(icon_generations)
      .where(whereCondition)
      .orderBy(desc(icon_generations.created_at))
      .limit(limit)
      .offset(offset);

    // 查询总数
    const totalResult = await db()
      .select({ count: icon_generations.id })
      .from(icon_generations)
      .where(whereCondition);

    return {
      records: records as IconGeneration[],
      total: totalResult.length
    };
  }

  // 创建新的生成记录
  static async create(data: Omit<IconGeneration, 'id'>): Promise<IconGeneration> {
    const result = await db()
      .insert(icon_generations)
      .values({
        ...data,
        created_at: data.created_at || new Date()
      })
      .returning();
    
    return result[0] as IconGeneration;
  }

  // 更新生成记录
  static async updateByUuid(uuid: string, data: Partial<IconGeneration>): Promise<boolean> {
    try {
      const result = await db()
        .update(icon_generations)
        .set(data)
        .where(eq(icon_generations.uuid, uuid));
      
      // Drizzle ORM 更新操作成功时返回空数组 []
      // 只要没有抛出异常，就认为更新成功
      console.log(`✅ Database update successful for ${uuid}`);
      return true;
    } catch (error) {
      console.error('Failed to update icon generation:', error);
      return false;
    }
  }

  // 删除生成记录
  static async deleteByUuid(uuid: string): Promise<boolean> {
    try {
      const result = await db()
        .delete(icon_generations)
        .where(eq(icon_generations.uuid, uuid));
      
      return result.length > 0;
    } catch (error) {
      console.error('Failed to delete icon generation:', error);
      return false;
    }
  }

  // 获取用户的生成统计
  static async getUserStats(userUuid: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    generating: number;
    pending: number;
  }> {
    const records = await db()
      .select({
        status: icon_generations.status
      })
      .from(icon_generations)
      .where(eq(icon_generations.user_uuid, userUuid));

    const stats = {
      total: records.length,
      completed: 0,
      failed: 0,
      generating: 0,
      pending: 0
    };

    records.forEach(record => {
      switch (record.status) {
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'generating':
          stats.generating++;
          break;
        case 'pending':
          stats.pending++;
          break;
      }
    });

    return stats;
  }

  // 根据 Freepik 任务 ID 查找记录
  static async findByFreepikTaskId(taskId: string): Promise<IconGeneration | null> {
    const result = await db()
      .select()
      .from(icon_generations)
      .where(eq(icon_generations.freepik_task_id, taskId))
      .limit(1);
    
    return result[0] as IconGeneration || null;
  }

  // 获取所有正在生成中的记录（用于检查超时等）
  static async getGeneratingRecords(): Promise<IconGeneration[]> {
    const records = await db()
      .select()
      .from(icon_generations)
      .where(eq(icon_generations.status, 'generating'))
      .orderBy(desc(icon_generations.started_at));
    
    return records as IconGeneration[];
  }

  // 批量根据用户和UUID查找生成记录
  static async batchGetByUserAndUuids(userUuid: string, uuids: string[]): Promise<IconGeneration[]> {
    if (uuids.length === 0) return [];
    
    const records = await db()
      .select()
      .from(icon_generations)
      .where(
        and(
          eq(icon_generations.user_uuid, userUuid),
          // 使用 inArray 进行批量查询
          inArray(icon_generations.uuid, uuids)
        )
      )
      .orderBy(desc(icon_generations.created_at));
    
    return records as IconGeneration[];
  }
}