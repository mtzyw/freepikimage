# AI Icon 生成器开发计划

## 项目概述
基于现有的 ShipAny 模板构建一个 AI Icon 生成器，用户输入描述文字即可生成高质量的图标。

## 核心功能
- 用户输入描述文字生成图标
- 支持多种图标风格和尺寸
- 图标预览和下载
- 生成历史记录
- 积分消耗系统

## 开发步骤

### 阶段一：数据库设计 [优先级：高]
**目标**: 设计存储图标生成记录的数据库表

**任务清单**:
1. 创建 `icon_generations` 表
   - 存储用户生成的图标记录
   - 包含提示词、样式、尺寸等参数
   - 关联用户和积分消耗

**字段设计**:
```sql
- id: 主键
- user_uuid: 用户标识
- prompt: 提示词描述
- style: 图标风格 (flat, 3d, minimalist, etc.)
- size: 尺寸 (16x16, 32x32, 64x64, etc.)
- format: 格式 (png, svg, ico)
- status: 状态 (generating, completed, failed)
- image_url: 生成的图标URL
- credits_cost: 消耗积分数
- provider: AI服务商 (dalle, midjourney, etc.)
- created_at: 创建时间
- completed_at: 完成时间
```

### 阶段二：后端 API 开发 [优先级：高]
**目标**: 创建处理图标生成的 API 接口

**API 接口设计**:

#### 1. 生成图标 API
```
POST /api/icon/generate
Body: {
  prompt: string,
  style: string,
  size: string,
  format: string
}
Response: {
  taskId: string,
  status: 'generating',
  estimatedTime: number
}
```

#### 2. 查询生成状态 API
```
GET /api/icon/status/:taskId
Response: {
  status: 'generating' | 'completed' | 'failed',
  imageUrl?: string,
  error?: string
}
```

#### 3. 获取用户历史 API
```
GET /api/icon/history
Query: { page, limit }
Response: {
  icons: IconGeneration[],
  total: number
}
```

#### 4. 下载图标 API
```
GET /api/icon/download/:iconId
Response: File stream
```

**实现细节**:
- 使用现有的第三方 API 密钥轮询系统
- 集成积分消耗逻辑
- 支持异步生成（长时间任务）
- 文件上传到 S3 存储

### 阶段三：AI 服务集成 [优先级：高]
**目标**: 集成第三方 AI 图像生成服务

**支持的服务商**:
1. **OpenAI DALL-E 3** - 高质量，适合复杂描述
2. **Replicate** - 多模型选择，性价比高
3. **Midjourney** - 艺术风格强，需API接入

**集成策略**:
- 使用现有的 `ThirdPartyApiKeyService` 进行密钥轮询
- 根据用户需求选择最适合的模型
- 实现重试机制和失败处理

**提示词优化**:
- 针对图标生成优化提示词
- 添加图标特有的关键词 (icon, logo, symbol, simple, clean)
- 支持风格预设 (扁平化、3D、线条等)

### 阶段四：前端界面开发 [优先级：中]
**目标**: 创建用户友好的图标生成界面

**页面结构**:
```
/icon-generator
├── 生成器主页面
├── 历史记录页面
└── 下载管理页面
```

**主要组件**:

#### 1. 图标生成表单
- 描述输入框 (支持智能提示)
- 风格选择器 (预设样式卡片)
- 尺寸选择 (16x16 到 512x512)
- 格式选择 (PNG, SVG, ICO)
- 生成按钮 (显示所需积分)

#### 2. 预览区域
- 实时生成状态显示
- 进度条和预估时间
- 生成结果预览
- 快速操作按钮 (重新生成、下载、收藏)

#### 3. 历史记录
- 网格布局展示历史图标
- 筛选和搜索功能
- 批量下载功能

**UI/UX 考虑**:
- 响应式设计，支持移动端
- 拖拽上传参考图片
- 智能提示词建议
- 实时积分余额显示

### 阶段五：积分系统集成 [优先级：中]
**目标**: 将图标生成与现有积分系统结合

**积分消耗规则**:
```
- 16x16, 32x32: 1 积分
- 64x64, 128x128: 2 积分  
- 256x256, 512x512: 3 积分
- SVG 格式: +1 积分
- 高级风格: +1 积分
```

**实现要点**:
- 生成前检查用户积分余额
- 生成失败时退还积分
- 记录积分消耗历史
- 与现有订单系统集成

### 阶段六：优化和测试 [优先级：低]
**目标**: 性能优化和功能完善

**性能优化**:
- 图片压缩和 CDN 加速
- 缓存常用生成结果
- 批量生成优化
- 数据库查询优化

**功能增强**:
- 图标包打包下载
- 社区分享功能
- 高级编辑功能 (颜色调整、尺寸裁剪)
- API 接口给开发者使用

**测试**:
- 单元测试覆盖核心逻辑
- 集成测试验证完整流程
- 性能测试确保并发处理
- 用户体验测试

## 技术栈
- **前端**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Drizzle ORM
- **数据库**: PostgreSQL
- **存储**: AWS S3 兼容存储
- **AI服务**: OpenAI DALL-E / Replicate / Midjourney
- **支付**: 现有 Stripe 积分系统

## 开发时间估算
- 阶段一 (数据库): 1 天
- 阶段二 (后端 API): 3-4 天
- 阶段三 (AI 集成): 2-3 天
- 阶段四 (前端界面): 4-5 天
- 阶段五 (积分集成): 1-2 天
- 阶段六 (优化测试): 2-3 天

**总计**: 约 2-3 周

## 部署和运维
- 使用现有的 Vercel 部署流程
- 配置环境变量 (AI API 密钥等)
- 设置监控和日志
- 准备用户文档和使用教程

## 商业化考虑
- 免费用户每日限制 (如 3 次生成)
- 付费套餐提供更多积分和高级功能
- 企业版本支持 API 调用和批量生成
- 考虑白标解决方案

---

## 下一步行动
建议从 **阶段一：数据库设计** 开始，因为这是整个系统的基础。数据库表结构设计好后，可以并行开发后端 API 和 AI 服务集成。