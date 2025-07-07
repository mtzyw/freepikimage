"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

// 导入组件
import { Sidebar } from "@/components/icon-generator/sidebar";
import { pricingPlans, featureLabels, type PricingPlan } from "@/data/pricing-plans";

export default function IconPricingPage() {
  const { data: session } = useSession();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!session) {
      toast.error("请先登录");
      return;
    }

    try {
      setLoading(plan.id);

      const params = {
        product_id: plan.id,
        product_name: `${plan.name} ${isYearly ? '年付' : '月付'}套餐`,
        credits: plan.features.iconsPerMonth * (isYearly ? 12 : 1), // 年付给12个月的积分
        interval: isYearly ? "year" : "month",
        amount: Math.round((isYearly ? plan.yearlyPrice : plan.monthlyPrice) * 100), // 转换为分
        currency: "cny",
        valid_months: isYearly ? 12 : 1,
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (response.status === 401) {
        toast.error("请先登录");
        setLoading(null);
        return;
      }

      const { code, message, data } = await response.json();
      if (code !== 0) {
        toast.error(message || "支付创建失败");
        setLoading(null);
        return;
      }

      const { public_key, session_id } = data;
      const stripe = await loadStripe(public_key);
      
      if (!stripe) {
        toast.error("支付系统初始化失败");
        setLoading(null);
        return;
      }

      const result = await stripe.redirectToCheckout({
        sessionId: session_id,
      });

      if (result.error) {
        toast.error(result.error.message || "支付跳转失败");
        setLoading(null);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("支付过程中出现错误");
      setLoading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic':
        return <Sparkles className="h-6 w-6 text-blue-500" />;
      case 'standard':
        return <Crown className="h-6 w-6 text-purple-500" />;
      case 'pro':
        return <Zap className="h-6 w-6 text-amber-500" />;
      default:
        return <Sparkles className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  const getSavingsPercentage = () => {
    return Math.round((1 - (pricingPlans[0].yearlyDiscountedMonthly / pricingPlans[0].monthlyPrice)) * 100);
  };

  if (!session) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <Crown className="h-8 w-8 text-purple-500" />
              定价方案
            </h1>
            <p className="text-muted-foreground mb-8">请先登录查看定价方案</p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* 左侧菜单栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部标题 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Crown className="h-6 w-6 text-purple-500" />
              AI图标生成器订阅价格表
            </h1>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 bg-white overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* 计费周期切换 */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4 p-1 bg-gray-100 rounded-lg">
                <span className={`px-4 py-2 rounded-md transition-all ${!isYearly ? 'bg-white shadow-sm font-medium' : 'text-gray-600'}`}>
                  月付方案
                </span>
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  className="mx-2"
                />
                <span className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${isYearly ? 'bg-white shadow-sm font-medium' : 'text-gray-600'}`}>
                  年付方案
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    省{getSavingsPercentage()}%
                  </Badge>
                </span>
              </div>
            </div>

            {/* 定价卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {pricingPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative transition-all duration-300 hover:shadow-lg ${
                    plan.popular
                      ? 'border-purple-500 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <Badge
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 hover:bg-purple-600"
                    >
                      最受欢迎
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center mb-3">
                      {getPlanIcon(plan.id)}
                    </div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                    
                    <div className="mt-4">
                      {isYearly ? (
                        <div>
                          <div className="text-3xl font-bold text-gray-900">
                            {formatPrice(plan.yearlyDiscountedMonthly)}
                            <span className="text-lg font-normal text-gray-600">/月</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            年费总价 {formatPrice(plan.yearlyPrice)}
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            相比月付节省 {formatPrice((plan.monthlyPrice * 12) - plan.yearlyPrice)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-3xl font-bold text-gray-900">
                          {formatPrice(plan.monthlyPrice)}
                          <span className="text-lg font-normal text-gray-600">/月</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* 核心功能 */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">每月图标数</span>
                        <span className="font-semibold">{plan.features.iconsPerMonth}个</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">每月生成次数</span>
                        <span className="font-semibold">{plan.features.generationsPerMonth}次</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">分辨率</span>
                        <span className="font-semibold">{plan.features.resolution}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">导出格式</span>
                        <span className="font-semibold">{plan.features.formats.join(' + ')}</span>
                      </div>
                    </div>

                    {/* 功能列表 */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2">
                        {plan.features.commercialUse ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">商用授权</span>
                      </div>
                      
                      {plan.features.backgroundTransparent && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">背景透明</span>
                        </div>
                      )}
                      
                      {plan.features.onlineEditor && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">在线编辑</span>
                        </div>
                      )}
                      
                      {plan.features.privateProjects && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">私密项目</span>
                        </div>
                      )}
                      
                      {plan.features.priorityQueue && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">优先队列</span>
                        </div>
                      )}
                      
                      {plan.features.aiEditor && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">AI编辑器</span>
                        </div>
                      )}
                      
                      {plan.features.teamCollaboration && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">团队协作</span>
                        </div>
                      )}
                      
                      {plan.features.apiAccess && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">API支持</span>
                        </div>
                      )}
                    </div>

                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      onClick={() => handleSubscribe(plan)}
                      disabled={loading === plan.id}
                    >
                      {loading === plan.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          处理中...
                        </div>
                      ) : (
                        `选择 ${plan.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 常见问题或说明 */}
            <div className="text-center text-gray-600 space-y-2">
              <p className="text-sm">• 所有套餐均支持微信支付、支付宝和信用卡支付</p>
              <p className="text-sm">• 年付套餐相当于10个月的价格，赠送2个月</p>
              <p className="text-sm">• 可随时取消订阅，剩余时间继续有效</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}