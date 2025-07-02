export interface IconGeneration {
  id: number;
  uuid: string;
  user_uuid: string;
  prompt: string;
  style: string; // 'solid' | 'outline' | 'color' | 'flat' | 'sticker';
  format: string; // 'png' | 'svg';
  status: string; // 'pending' | 'generating' | 'completed' | 'failed';
  provider: string;
  
  // Freepik API 特有参数
  freepik_task_id?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  webhook_url?: string;
  
  // 存储相关（支持双格式）
  svg_r2_key?: string; // SVG格式的R2存储路径
  svg_r2_url?: string; // SVG格式的R2公开访问URL
  png_r2_key?: string; // PNG格式的R2存储路径
  png_r2_url?: string; // PNG格式的R2公开访问URL
  original_url?: string; // Freepik 原始图片 URL
  svg_file_size?: number; // SVG文件大小（字节）
  png_file_size?: number; // PNG文件大小（字节）
  
  // 兼容旧字段（保留以避免破坏性更改）
  r2_key?: string; // 已废弃，保持兼容性
  r2_url?: string; // 已废弃，保持兼容性
  file_size?: number; // 已废弃，保持兼容性
  
  // 业务逻辑
  credits_cost: number;
  generation_time?: number;
  error_message?: string;
  
  // 时间字段
  created_at?: Date;
  started_at?: Date;
  completed_at?: Date;
}

export interface IconGenerationRequest {
  prompt: string;
  style?: 'solid' | 'outline' | 'color' | 'flat' | 'sticker';
  format?: 'png' | 'svg';
  num_inference_steps?: number;
  guidance_scale?: number;
}

export interface IconGenerationResponse {
  success: boolean;
  uuid?: string;
  taskId?: string;
  status?: string;
  estimatedTime?: number;
  error?: string;
}

export interface FreepikWebhookPayload {
  task_id: string;
  request_id: string;
  status: 'COMPLETED' | 'FAILED';
  generated?: string[]; // 生成的图片 URL 数组
  error?: string;
}