#!/usr/bin/env node

/**
 * Stripe 产品配置脚本
 * 
 * 使用方法：
 * 1. 安装依赖：npm install stripe dotenv
 * 2. 配置环境变量：STRIPE_PRIVATE_KEY
 * 3. 运行脚本：node scripts/setup-stripe-products.js
 */

const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

// 产品配置
const products = [
  {
    id: 'shipany-starter',
    name: 'ShipAny Boilerplate Starter',
    description: 'Get started with your first SaaS startup.',
    metadata: {
      product_id: 'starter',
      credits: '100',
      valid_months: '1'
    },
    prices: [
      {
        amount: 9900, // $99.00
        currency: 'usd',
        nickname: 'Starter USD'
      },
      {
        amount: 69900, // ¥699.00
        currency: 'cny',
        nickname: 'Starter CNY'
      }
    ]
  },
  {
    id: 'shipany-standard',
    name: 'ShipAny Boilerplate Standard',
    description: 'Ship Fast with your SaaS Startups.',
    metadata: {
      product_id: 'standard',
      credits: '200',
      valid_months: '3'
    },
    prices: [
      {
        amount: 19900, // $199.00
        currency: 'usd',
        nickname: 'Standard USD'
      },
      {
        amount: 139900, // ¥1399.00
        currency: 'cny',
        nickname: 'Standard CNY'
      }
    ]
  },
  {
    id: 'shipany-premium',
    name: 'ShipAny Boilerplate Premium',
    description: 'Ship Any AI SaaS Startups.',
    metadata: {
      product_id: 'premium',
      credits: '300',
      valid_months: '12'
    },
    prices: [
      {
        amount: 29900, // $299.00
        currency: 'usd',
        nickname: 'Premium USD'
      },
      {
        amount: 199900, // ¥1999.00
        currency: 'cny',
        nickname: 'Premium CNY'
      }
    ]
  }
];

// 图标生成产品配置
const iconProducts = [
  {
    id: 'icon-basic',
    name: 'AI Icon Generator Basic',
    description: '适合个人用户的基础套餐',
    metadata: {
      product_id: 'icon-basic',
      icons_per_month: '300',
      generations_per_month: '100'
    },
    prices: [
      {
        amount: 1490, // ¥14.90
        currency: 'cny',
        nickname: 'Basic Monthly',
        recurring: { interval: 'month' }
      },
      {
        amount: 14988, // ¥149.88
        currency: 'cny',
        nickname: 'Basic Yearly',
        recurring: { interval: 'year' }
      }
    ]
  },
  {
    id: 'icon-standard',
    name: 'AI Icon Generator Standard',
    description: '适合小团队和专业用户',
    metadata: {
      product_id: 'icon-standard',
      icons_per_month: '1000',
      generations_per_month: '300'
    },
    prices: [
      {
        amount: 2990, // ¥29.90
        currency: 'cny',
        nickname: 'Standard Monthly',
        recurring: { interval: 'month' }
      },
      {
        amount: 29988, // ¥299.88
        currency: 'cny',
        nickname: 'Standard Yearly',
        recurring: { interval: 'year' }
      }
    ]
  },
  {
    id: 'icon-pro',
    name: 'AI Icon Generator Pro',
    description: '适合企业和高级用户',
    metadata: {
      product_id: 'icon-pro',
      icons_per_month: '3000',
      generations_per_month: '1000'
    },
    prices: [
      {
        amount: 4990, // ¥49.90
        currency: 'cny',
        nickname: 'Pro Monthly',
        recurring: { interval: 'month' }
      },
      {
        amount: 49992, // ¥499.92
        currency: 'cny',
        nickname: 'Pro Yearly',
        recurring: { interval: 'year' }
      }
    ]
  }
];

async function createProduct(productConfig) {
  try {
    console.log(`Creating product: ${productConfig.name}`);
    
    const product = await stripe.products.create({
      id: productConfig.id,
      name: productConfig.name,
      description: productConfig.description,
      metadata: productConfig.metadata
    });
    
    console.log(`✓ Product created: ${product.id}`);
    
    // 创建价格
    const priceIds = [];
    for (const priceConfig of productConfig.prices) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceConfig.amount,
        currency: priceConfig.currency,
        nickname: priceConfig.nickname,
        ...(priceConfig.recurring && { recurring: priceConfig.recurring })
      });
      
      priceIds.push({
        currency: priceConfig.currency,
        price_id: price.id,
        nickname: priceConfig.nickname
      });
      
      console.log(`  ✓ Price created: ${price.id} (${priceConfig.nickname})`);
    }
    
    return {
      product_id: product.id,
      prices: priceIds
    };
    
  } catch (error) {
    console.error(`Error creating product ${productConfig.name}:`, error.message);
    return null;
  }
}

async function setupStripeProducts() {
  console.log('🚀 Setting up Stripe products...\n');
  
  if (!process.env.STRIPE_PRIVATE_KEY) {
    console.error('❌ STRIPE_PRIVATE_KEY is not set in environment variables');
    process.exit(1);
  }
  
  const results = [];
  
  // 创建 ShipAny 产品
  console.log('📦 Creating ShipAny products...');
  for (const product of products) {
    const result = await createProduct(product);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n🎨 Creating Icon Generator products...');
  for (const product of iconProducts) {
    const result = await createProduct(product);
    if (result) {
      results.push(result);
    }
  }
  
  // 输出配置结果
  console.log('\n📋 Configuration Summary:');
  console.log('=' .repeat(50));
  results.forEach(result => {
    console.log(`Product: ${result.product_id}`);
    result.prices.forEach(price => {
      console.log(`  ${price.nickname}: ${price.price_id}`);
    });
    console.log('');
  });
  
  // 生成环境变量建议
  console.log('🔧 Environment Variables to Update:');
  console.log('=' .repeat(50));
  console.log('# Add these to your .env file:');
  results.forEach(result => {
    result.prices.forEach(price => {
      const envVar = `STRIPE_PRICE_${result.product_id.toUpperCase().replace(/-/g, '_')}_${price.currency.toUpperCase()}`;
      console.log(`${envVar}=${price.price_id}`);
    });
  });
  
  console.log('\n✅ Stripe products setup complete!');
}

// 运行脚本
if (require.main === module) {
  setupStripeProducts().catch(console.error);
}

module.exports = { setupStripeProducts };