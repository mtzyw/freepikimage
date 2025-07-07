# Stripe 支付配置指南

本指南将帮助你完成 Stripe 支付系统的完整配置。

## 🚀 快速开始

### 1. 准备工作

- 注册 [Stripe 账户](https://dashboard.stripe.com/register)
- 获取 API 密钥（测试环境和生产环境）
- 安装必要的依赖：
  ```bash
  npm install stripe dotenv
  ```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.development` 并填写 Stripe 相关配置：

```bash
# Stripe 配置
STRIPE_PUBLIC_KEY="pk_test_..."  # 你的 Stripe 公钥
STRIPE_PRIVATE_KEY="sk_test_..." # 你的 Stripe 私钥
STRIPE_WEBHOOK_SECRET="whsec_..." # Webhook 签名密钥

# 支付回调 URL
NEXT_PUBLIC_PAY_SUCCESS_URL="http://localhost:3000/my-orders"
NEXT_PUBLIC_PAY_FAIL_URL="http://localhost:3000/#pricing"
NEXT_PUBLIC_PAY_CANCEL_URL="http://localhost:3000/#pricing"
```

### 3. 创建 Stripe 产品

运行自动化脚本创建所有产品和价格：

```bash
# 确保已配置 STRIPE_PRIVATE_KEY 环境变量
node scripts/setup-stripe-products.js
```

脚本会创建以下产品：

#### ShipAny 产品套餐
- **Starter**: $99 USD / ¥699 CNY
- **Standard**: $199 USD / ¥1399 CNY  
- **Premium**: $299 USD / ¥1999 CNY

#### AI 图标生成套餐
- **Basic**: ¥14.90/月 或 ¥149.88/年
- **Standard**: ¥29.90/月 或 ¥299.88/年
- **Pro**: ¥49.90/月 或 ¥499.92/年

### 4. 配置 Webhook

1. 在 [Stripe Dashboard](https://dashboard.stripe.com/webhooks) 创建 webhook
2. 设置端点 URL：`https://your-domain.com/api/stripe-notify`
3. 选择监听事件：`checkout.session.completed`
4. 复制 Webhook 签名密钥到环境变量

### 5. 更新环境变量

脚本运行后会输出类似以下的环境变量，添加到你的 `.env` 文件：

```bash
# ShipAny 产品价格 ID
STRIPE_PRICE_SHIPANY_STARTER_USD=price_1234567890abcdef
STRIPE_PRICE_SHIPANY_STARTER_CNY=price_1234567890abcdef
STRIPE_PRICE_SHIPANY_STANDARD_USD=price_1234567890abcdef
STRIPE_PRICE_SHIPANY_STANDARD_CNY=price_1234567890abcdef
STRIPE_PRICE_SHIPANY_PREMIUM_USD=price_1234567890abcdef
STRIPE_PRICE_SHIPANY_PREMIUM_CNY=price_1234567890abcdef

# 图标生成产品价格 ID
STRIPE_PRICE_ICON_BASIC_MONTHLY=price_1234567890abcdef
STRIPE_PRICE_ICON_BASIC_YEARLY=price_1234567890abcdef
STRIPE_PRICE_ICON_STANDARD_MONTHLY=price_1234567890abcdef
STRIPE_PRICE_ICON_STANDARD_YEARLY=price_1234567890abcdef
STRIPE_PRICE_ICON_PRO_MONTHLY=price_1234567890abcdef
STRIPE_PRICE_ICON_PRO_YEARLY=price_1234567890abcdef
```

## 🛠️ 手动配置（可选）

如果你不想使用自动化脚本，可以手动在 Stripe Dashboard 中创建产品：

### 创建产品步骤

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入"产品"页面
3. 点击"添加产品"
4. 填写产品信息
5. 创建对应的价格
6. 复制产品和价格 ID

### 产品配置参考

参考 `scripts/setup-stripe-products.js` 文件中的产品配置。

## 🔧 集成说明

### 支付流程

1. 用户选择套餐
2. 前端调用 `/api/checkout` 创建 Stripe Checkout Session
3. 用户在 Stripe 托管页面完成支付
4. Stripe 通过 webhook 通知支付结果
5. 系统更新用户积分和订单状态

### 核心文件

- `src/app/api/checkout/route.ts` - 创建支付会话
- `src/app/api/stripe-notify/route.ts` - 处理 webhook 通知
- `src/config/stripe-products.ts` - 产品配置
- `src/data/pricing-plans.ts` - 定价页面配置

### 测试

使用 Stripe 测试卡号进行测试：
- 成功支付：`4242 4242 4242 4242`
- 失败支付：`4000 0000 0000 0002`
- 需要验证：`4000 0025 0000 3155`

## 📋 检查清单

在部署到生产环境前，请确保：

- [ ] 已在 Stripe Dashboard 中创建所有产品和价格
- [ ] 环境变量已正确配置
- [ ] Webhook 端点已设置并可访问
- [ ] 支付流程已测试通过
- [ ] 生产环境使用 `pk_live_*` 和 `sk_live_*` 密钥

## 🚨 常见问题

### Q: 产品创建失败，提示 "Product already exists"
A: 产品 ID 已存在，删除现有产品或修改脚本中的产品 ID。

### Q: Webhook 验证失败
A: 检查 STRIPE_WEBHOOK_SECRET 是否正确设置。

### Q: 支付成功但积分未到账
A: 检查 webhook 是否正确配置，查看服务器日志。

### Q: 测试环境下无法接收 webhook
A: 使用 [Stripe CLI](https://stripe.com/docs/stripe-cli) 进行本地测试：
```bash
stripe listen --forward-to localhost:3000/api/stripe-notify
```

## 🔗 相关资源

- [Stripe 文档](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [测试卡号](https://stripe.com/docs/testing#cards)

## 🆘 获取帮助

如果遇到问题，请：
1. 查看控制台日志
2. 检查 Stripe Dashboard 中的日志
3. 查阅 Stripe 官方文档
4. 在项目仓库中提交 issue