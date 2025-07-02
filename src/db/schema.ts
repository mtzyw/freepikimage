import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }),
    nickname: varchar({ length: 255 }),
    avatar_url: varchar({ length: 255 }),
    locale: varchar({ length: 50 }),
    signin_type: varchar({ length: 50 }),
    signin_ip: varchar({ length: 255 }),
    signin_provider: varchar({ length: 50 }),
    signin_openid: varchar({ length: 255 }),
    invite_code: varchar({ length: 255 }).notNull().default(""),
    updated_at: timestamp({ withTimezone: true }),
    invited_by: varchar({ length: 255 }).notNull().default(""),
    is_affiliate: boolean().notNull().default(false),
  },
  (table) => [
    uniqueIndex("email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

// Orders table
export const orders = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  order_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull().default(""),
  user_email: varchar({ length: 255 }).notNull().default(""),
  amount: integer().notNull(),
  interval: varchar({ length: 50 }),
  expired_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull(),
  stripe_session_id: varchar({ length: 255 }),
  credits: integer().notNull(),
  currency: varchar({ length: 50 }),
  sub_id: varchar({ length: 255 }),
  sub_interval_count: integer(),
  sub_cycle_anchor: integer(),
  sub_period_end: integer(),
  sub_period_start: integer(),
  sub_times: integer(),
  product_id: varchar({ length: 255 }),
  product_name: varchar({ length: 255 }),
  valid_months: integer(),
  order_detail: text(),
  paid_at: timestamp({ withTimezone: true }),
  paid_email: varchar({ length: 255 }),
  paid_detail: text(),
});

// API Keys table
export const apikeys = pgTable("apikeys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  api_key: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 100 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
});

// Credits table
export const credits = pgTable("credits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull(),
  trans_type: varchar({ length: 50 }).notNull(),
  credits: integer().notNull(),
  order_no: varchar({ length: 255 }),
  expired_at: timestamp({ withTimezone: true }),
});

// Posts table
export const posts = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  slug: varchar({ length: 255 }),
  title: varchar({ length: 255 }),
  description: text(),
  content: text(),
  created_at: timestamp({ withTimezone: true }),
  updated_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  cover_url: varchar({ length: 255 }),
  author_name: varchar({ length: 255 }),
  author_avatar_url: varchar({ length: 255 }),
  locale: varchar({ length: 50 }),
});

// Affiliates table
export const affiliates = pgTable("affiliates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull().default(""),
  invited_by: varchar({ length: 255 }).notNull(),
  paid_order_no: varchar({ length: 255 }).notNull().default(""),
  paid_amount: integer().notNull().default(0),
  reward_percent: integer().notNull().default(0),
  reward_amount: integer().notNull().default(0),
});

// Feedbacks table
export const feedbacks = pgTable("feedbacks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  user_uuid: varchar({ length: 255 }),
  content: text(),
  rating: integer(),
});

// Third-party API Keys Pool table
export const third_party_api_keys = pgTable("third_party_api_keys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  provider: varchar({ length: 100 }).notNull(), // e.g., 'openai', 'kling', 'replicate', 'freepik'
  api_key: varchar({ length: 500 }).notNull(),
  status: varchar({ length: 50 }).notNull().default("active"), // active, disabled
  created_at: timestamp({ withTimezone: true }),
});

// Icon Generations table
export const icon_generations = pgTable("icon_generations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  user_uuid: varchar({ length: 255 }).notNull(),
  prompt: text().notNull(), // 用户输入的描述
  style: varchar({ length: 50 }).notNull(), // solid, outline, color, flat, sticker
  format: varchar({ length: 10 }).notNull(), // png, svg
  status: varchar({ length: 50 }).notNull().default("pending"), // pending, generating, completed, failed
  provider: varchar({ length: 100 }).notNull().default("freepik"), // freepik, openai, etc.
  
  // Freepik API 特有参数
  freepik_task_id: varchar({ length: 255 }), // Freepik 返回的任务 ID
  num_inference_steps: integer().default(20), // 10-50
  guidance_scale: integer().default(7), // 0-10
  webhook_url: varchar({ length: 500 }), // webhook URL
  
  // 存储相关（支持双格式）
  svg_r2_key: varchar({ length: 500 }), // SVG格式的R2存储路径
  svg_r2_url: varchar({ length: 500 }), // SVG格式的R2公开访问URL
  png_r2_key: varchar({ length: 500 }), // PNG格式的R2存储路径
  png_r2_url: varchar({ length: 500 }), // PNG格式的R2公开访问URL
  original_url: varchar({ length: 500 }), // Freepik 原始图片 URL
  svg_file_size: integer(), // SVG文件大小（字节）
  png_file_size: integer(), // PNG文件大小（字节）
  
  // 兼容旧字段（保留以避免破坏性更改）
  r2_key: varchar({ length: 500 }), // 已废弃，保持兼容性
  r2_url: varchar({ length: 500 }), // 已废弃，保持兼容性
  file_size: integer(), // 已废弃，保持兼容性
  
  // 业务逻辑
  credits_cost: integer().notNull().default(1), // 消耗的积分数
  generation_time: integer(), // 生成耗时（秒）
  error_message: text(), // 失败时的错误信息
  
  // 时间字段
  created_at: timestamp({ withTimezone: true }),
  started_at: timestamp({ withTimezone: true }), // 开始生成时间
  completed_at: timestamp({ withTimezone: true }), // 完成时间
});
