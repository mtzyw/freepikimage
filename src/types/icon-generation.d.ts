export interface IconGeneration {
  id: number;
  uuid: string;
  user_uuid: string;
  prompt: string;
  style: 'solid' | 'outline' | 'color' | 'flat' | 'sticker';
  format: 'png' | 'svg';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  provider: string;
  
  // Freepik API 特有参数
  freepik_task_id?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  webhook_url?: string;
  
  // 存储相关
  r2_key?: string;
  r2_url?: string;
  original_url?: string;
  file_size?: number;
  
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