#!/usr/bin/env node

/**
 * Stripe 配置验证脚本
 * 
 * 使用方法：
 * node scripts/validate-stripe-config.js
 */

require('dotenv').config();

function validateEnvironmentVariables() {
  const requiredVars = [
    'STRIPE_PUBLIC_KEY',
    'STRIPE_PRIVATE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];
  
  const optionalVars = [
    'STRIPE_PRICE_SHIPANY_STARTER_USD',
    'STRIPE_PRICE_SHIPANY_STARTER_CNY',
    'STRIPE_PRICE_SHIPANY_STANDARD_USD',
    'STRIPE_PRICE_SHIPANY_STANDARD_CNY',
    'STRIPE_PRICE_SHIPANY_PREMIUM_USD',
    'STRIPE_PRICE_SHIPANY_PREMIUM_CNY',
    'STRIPE_PRICE_ICON_BASIC_MONTHLY',
    'STRIPE_PRICE_ICON_BASIC_YEARLY',
    'STRIPE_PRICE_ICON_STANDARD_MONTHLY',
    'STRIPE_PRICE_ICON_STANDARD_YEARLY',
    'STRIPE_PRICE_ICON_PRO_MONTHLY',
    'STRIPE_PRICE_ICON_PRO_YEARLY'
  ];
  
  console.log('🔍 Validating Stripe Configuration...\n');
  
  // 检查必需的环境变量
  console.log('📋 Required Environment Variables:');
  let hasAllRequired = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`  ❌ ${varName}: Missing`);
      hasAllRequired = false;
    }
  });
  
  // 检查可选的价格 ID
  console.log('\n💰 Price IDs (运行 setup-stripe-products.js 后配置):');
  let priceCount = 0;
  
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value}`);
      priceCount++;
    } else {
      console.log(`  ⚠️  ${varName}: Not configured`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  Required variables: ${hasAllRequired ? '✅ All configured' : '❌ Missing required variables'}`);
  console.log(`  Price IDs configured: ${priceCount}/${optionalVars.length}`);
  
  if (!hasAllRequired) {
    console.log('\n🚨 Action Required:');
    console.log('  1. Copy .env.example to .env.development');
    console.log('  2. Fill in your Stripe API keys');
    console.log('  3. Configure webhook secret');
  }
  
  if (priceCount === 0) {
    console.log('\n🚨 Action Required:');
    console.log('  1. Run: node scripts/setup-stripe-products.js');
    console.log('  2. Copy the generated price IDs to your .env file');
  }
  
  return hasAllRequired && priceCount > 0;
}

async function validateStripeConnection() {
  if (!process.env.STRIPE_PRIVATE_KEY) {
    console.log('\n❌ Cannot validate Stripe connection: STRIPE_PRIVATE_KEY not set');
    return false;
  }
  
  console.log('\n🔗 Testing Stripe Connection...');
  
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);
    
    // 测试 API 连接
    const balance = await stripe.balance.retrieve();
    console.log('  ✅ Stripe API connection successful');
    console.log(`  💰 Account balance: ${balance.available[0]?.amount || 0} ${balance.available[0]?.currency || 'USD'}`);
    
    // 列出产品
    const products = await stripe.products.list({ limit: 10 });
    console.log(`  📦 Found ${products.data.length} products in Stripe`);
    
    // 检查我们的产品是否存在
    const ourProductIds = [
      'shipany-starter', 'shipany-standard', 'shipany-premium',
      'icon-basic', 'icon-standard', 'icon-pro'
    ];
    
    const foundProducts = products.data.filter(product => 
      ourProductIds.includes(product.id)
    );
    
    console.log(`  🎯 Found ${foundProducts.length}/${ourProductIds.length} of our products:`);
    foundProducts.forEach(product => {
      console.log(`    ✅ ${product.id}: ${product.name}`);
    });
    
    const missingProducts = ourProductIds.filter(id => 
      !foundProducts.find(p => p.id === id)
    );
    
    if (missingProducts.length > 0) {
      console.log(`  ⚠️  Missing products: ${missingProducts.join(', ')}`);
      console.log('  💡 Run: node scripts/setup-stripe-products.js');
    }
    
    return true;
    
  } catch (error) {
    console.log(`  ❌ Stripe connection failed: ${error.message}`);
    return false;
  }
}

function validateWebhookConfig() {
  console.log('\n🔔 Webhook Configuration:');
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret) {
    console.log(`  ✅ Webhook secret configured: ${webhookSecret.substring(0, 10)}...`);
  } else {
    console.log('  ❌ Webhook secret not configured');
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
  console.log(`  📍 Webhook endpoint: ${baseUrl}/api/stripe-notify`);
  
  console.log('\n📋 Webhook Setup Checklist:');
  console.log('  1. Create webhook in Stripe Dashboard');
  console.log(`  2. Set endpoint URL: ${baseUrl}/api/stripe-notify`);
  console.log('  3. Listen for: checkout.session.completed');
  console.log('  4. Copy webhook secret to STRIPE_WEBHOOK_SECRET');
  
  return !!webhookSecret;
}

async function main() {
  console.log('🎯 Stripe Configuration Validator\n');
  console.log('=' .repeat(50));
  
  const envValid = validateEnvironmentVariables();
  const webhookValid = validateWebhookConfig();
  const connectionValid = await validateStripeConnection();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Validation Results:');
  console.log(`  Environment Variables: ${envValid ? '✅' : '❌'}`);
  console.log(`  Webhook Configuration: ${webhookValid ? '✅' : '❌'}`);
  console.log(`  Stripe Connection: ${connectionValid ? '✅' : '❌'}`);
  
  const allValid = envValid && webhookValid && connectionValid;
  
  if (allValid) {
    console.log('\n🎉 All checks passed! Your Stripe configuration is ready.');
  } else {
    console.log('\n🚨 Some checks failed. Please review the issues above.');
    console.log('\n📚 For help, see: STRIPE_SETUP.md');
  }
  
  process.exit(allValid ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}