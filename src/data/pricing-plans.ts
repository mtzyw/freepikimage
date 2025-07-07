export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscountedMonthly: number;
  currency: string;
  // Stripe 集成
  stripeProductId?: string;
  stripePriceIds?: {
    monthly?: string;
    yearly?: string;
  };
  features: {
    iconsPerMonth: number;
    generationsPerMonth: number;
    resolution: string;
    formats: string[];
    commercialUse: boolean;
    backgroundTransparent: boolean;
    onlineEditor: boolean;
    privateProjects: boolean;
    priorityQueue: boolean;
    aiEditor: boolean;
    teamCollaboration: boolean;
    apiAccess: boolean;
  };
  popular?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "适合个人用户的基础套餐",
    monthlyPrice: 14.90,
    yearlyPrice: 149.88,
    yearlyDiscountedMonthly: 12.49,
    currency: "CNY",
    stripeProductId: "icon-basic",
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ICON_BASIC_MONTHLY || "",
      yearly: process.env.STRIPE_PRICE_ICON_BASIC_YEARLY || "",
    },
    features: {
      iconsPerMonth: 300,
      generationsPerMonth: 100,
      resolution: "512×512",
      formats: ["PNG"],
      commercialUse: false,
      backgroundTransparent: false,
      onlineEditor: false,
      privateProjects: false,
      priorityQueue: false,
      aiEditor: false,
      teamCollaboration: false,
      apiAccess: false,
    },
  },
  {
    id: "standard",
    name: "Standard",
    description: "适合小团队和专业用户",
    monthlyPrice: 29.90,
    yearlyPrice: 299.88,
    yearlyDiscountedMonthly: 24.99,
    currency: "CNY",
    stripeProductId: "icon-standard",
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ICON_STANDARD_MONTHLY || "",
      yearly: process.env.STRIPE_PRICE_ICON_STANDARD_YEARLY || "",
    },
    features: {
      iconsPerMonth: 1000,
      generationsPerMonth: 300,
      resolution: "1024×1024",
      formats: ["PNG", "SVG"],
      commercialUse: true,
      backgroundTransparent: true,
      onlineEditor: true,
      privateProjects: true,
      priorityQueue: true,
      aiEditor: false,
      teamCollaboration: false,
      apiAccess: false,
    },
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "适合企业和高级用户",
    monthlyPrice: 49.90,
    yearlyPrice: 499.92,
    yearlyDiscountedMonthly: 41.66,
    currency: "CNY",
    stripeProductId: "icon-pro",
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ICON_PRO_MONTHLY || "",
      yearly: process.env.STRIPE_PRICE_ICON_PRO_YEARLY || "",
    },
    features: {
      iconsPerMonth: 3000,
      generationsPerMonth: 1000,
      resolution: "2048×2048",
      formats: ["PNG", "SVG", "PDF"],
      commercialUse: true,
      backgroundTransparent: true,
      onlineEditor: true,
      privateProjects: true,
      priorityQueue: true,
      aiEditor: true,
      teamCollaboration: true,
      apiAccess: true,
    },
  },
];

export const featureLabels = {
  iconsPerMonth: "每月图标数",
  generationsPerMonth: "每月生成次数",
  resolution: "分辨率",
  formats: "导出格式",
  commercialUse: "商用授权",
  backgroundTransparent: "背景透明",
  onlineEditor: "在线编辑",
  privateProjects: "私密项目",
  priorityQueue: "优先队列",
  aiEditor: "AI编辑器",
  teamCollaboration: "团队协作",
  apiAccess: "API支持",
};

export const featureIcons = {
  iconsPerMonth: "🎨",
  generationsPerMonth: "⚡",
  resolution: "📐",
  formats: "💾",
  commercialUse: "💼",
  backgroundTransparent: "🌟",
  onlineEditor: "✏️",
  privateProjects: "🔒",
  priorityQueue: "🚀",
  aiEditor: "🤖",
  teamCollaboration: "👥",
  apiAccess: "🔧",
};