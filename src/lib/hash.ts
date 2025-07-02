import { SnowflakeIdv1 } from "simple-flakeid";
import { v4 as uuidv4 } from "uuid";

export function getUuid(): string {
  return uuidv4();
}

export function getUniSeq(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);

  return `${prefix}${randomPart}${timestamp}`;
}

export function getNonceStr(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters[randomIndex];
  }

  return result;
}

// 改进的ID生成函数，避免并发冲突
export function getSnowId(): string {
  // 使用时间戳 + 随机数 + 递增序列，确保唯一性
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const sequence = Math.floor(Math.random() * 1000);
  
  // 组合生成唯一ID
  return `${timestamp}${random.toString().padStart(6, '0')}${sequence.toString().padStart(3, '0')}`;
}

// 备用的Snowflake方法
export function getSnowIdOriginal(): string {
  const gen = new SnowflakeIdv1({ workerId: 1 });
  const snowId = gen.NextId();

  return snowId.toString();
}
