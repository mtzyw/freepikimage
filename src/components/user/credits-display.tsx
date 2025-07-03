"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface UserCredits {
  left_credits: number;
  is_pro?: boolean;
  is_recharged?: boolean;
}

export function CreditsDisplay() {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (status === "loading") return;
      
      if (!session?.user?.uuid) {
        setLoading(false);
        return;
      }

      try {
        // 尝试方法1：使用简单的GET请求
        let response = await fetch("/api/get-user-credits");
        
        if (response.ok) {
          const result = await response.json();
          
          // 处理不同格式的响应
          if (result.code === 0 && result.data?.left_credits !== undefined) {
            // 格式：{code: 0, data: {left_credits: 6}}
            setCredits(result.data);
            return;
          } else if (result.left_credits !== undefined) {
            // 格式：{left_credits: 6}
            setCredits(result);
            return;
          }
        }

        // 如果GET失败，尝试方法2：使用POST请求到get-user-info
        response = await fetch("/api/get-user-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_uuid: session.user.uuid
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && result.data?.credits) {
            setCredits(result.data.credits);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user credits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [session, status]);

  // 如果用户未登录，显示登录按钮
  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        载入中...
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button variant="default" size="sm" asChild>
        <Link href="/api/auth/signin">
          登录
        </Link>
      </Button>
    );
  }

  // 如果正在加载积分信息
  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        载入中...
      </Button>
    );
  }

  // 显示积分信息
  return (
    <Button variant="outline" size="sm" asChild className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100">
      <Link href="/my-orders" className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="font-medium text-slate-700">
          {credits?.left_credits || 0} 积分
        </span>
      </Link>
    </Button>
  );
}