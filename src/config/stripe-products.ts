/**
 * Stripe 产品配置
 * 
 * 运行 scripts/setup-stripe-products.js 后，
 * 将生成的 Price ID 填入此配置文件
 */

export interface StripeProductConfig {
  productId: string;
  priceIds: {
    usd?: string;
    cny?: string;
    monthly?: string;
    yearly?: string;
  };
  metadata: {
    credits?: number;
    validMonths?: number;
    iconsPerMonth?: number;
    generationsPerMonth?: number;
  };
}

// ShipAny 产品配置
export const shipanyProducts: Record<string, StripeProductConfig> = {
  starter: {
    productId: 'shipany-starter',
    priceIds: {
      usd: process.env.STRIPE_PRICE_SHIPANY_STARTER_USD || '', // 运行脚本后填入
      cny: process.env.STRIPE_PRICE_SHIPANY_STARTER_CNY || '',
    },
    metadata: {
      credits: 100,
      validMonths: 1,
    },
  },
  standard: {
    productId: 'shipany-standard',
    priceIds: {
      usd: process.env.STRIPE_PRICE_SHIPANY_STANDARD_USD || '',
      cny: process.env.STRIPE_PRICE_SHIPANY_STANDARD_CNY || '',
    },
    metadata: {
      credits: 200,
      validMonths: 3,
    },
  },
  premium: {
    productId: 'shipany-premium',
    priceIds: {
      usd: process.env.STRIPE_PRICE_SHIPANY_PREMIUM_USD || '',
      cny: process.env.STRIPE_PRICE_SHIPANY_PREMIUM_CNY || '',
    },
    metadata: {
      credits: 300,
      validMonths: 12,
    },
  },
};

// 图标生成产品配置
export const iconProducts: Record<string, StripeProductConfig> = {
  basic: {
    productId: 'icon-basic',
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ICON_BASIC_MONTHLY || '',
      yearly: process.env.STRIPE_PRICE_ICON_BASIC_YEARLY || '',
    },
    metadata: {
      iconsPerMonth: 300,
      generationsPerMonth: 100,
    },
  },
  standard: {
    productId: 'icon-standard',
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ICON_STANDARD_MONTHLY || '',
      yearly: process.env.STRIPE_PRICE_ICON_STANDARD_YEARLY || '',
    },
    metadata: {
      iconsPerMonth: 1000,
      generationsPerMonth: 300,
    },
  },
  pro: {
    productId: 'icon-pro',
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ICON_PRO_MONTHLY || '',
      yearly: process.env.STRIPE_PRICE_ICON_PRO_YEARLY || '',
    },
    metadata: {
      iconsPerMonth: 3000,
      generationsPerMonth: 1000,
    },
  },
};

// 获取产品配置
export function getStripeProductConfig(productType: 'shipany' | 'icon', productId: string): StripeProductConfig | null {
  const products = productType === 'shipany' ? shipanyProducts : iconProducts;
  return products[productId] || null;
}

// 获取价格 ID
export function getStripePriceId(
  productType: 'shipany' | 'icon',
  productId: string,
  currency: 'usd' | 'cny' | 'monthly' | 'yearly'
): string | null {
  const config = getStripeProductConfig(productType, productId);
  return config?.priceIds[currency] || null;
}

// 验证产品配置
export function validateStripeConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  // 检查 ShipAny 产品
  Object.entries(shipanyProducts).forEach(([key, config]) => {
    if (!config.priceIds.usd) missing.push(`shipanyProducts.${key}.priceIds.usd`);
    if (!config.priceIds.cny) missing.push(`shipanyProducts.${key}.priceIds.cny`);
  });
  
  // 检查图标产品
  Object.entries(iconProducts).forEach(([key, config]) => {
    if (!config.priceIds.monthly) missing.push(`iconProducts.${key}.priceIds.monthly`);
    if (!config.priceIds.yearly) missing.push(`iconProducts.${key}.priceIds.yearly`);
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}