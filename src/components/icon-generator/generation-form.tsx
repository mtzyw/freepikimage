"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Sparkles } from "lucide-react";
import { ICON_STYLES } from "./types";

interface GenerationFormProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  activeStyle: string;
  onStyleChange: (style: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  userCredits?: number;
}

export function GenerationForm({
  prompt,
  onPromptChange,
  activeStyle,
  onStyleChange,
  isGenerating,
  onGenerate,
  userCredits = 0
}: GenerationFormProps) {
  return (
    <div className="space-y-6">
      {/* 输入区域 */}
      <div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            您想生成什么图标？ 
          </label>
          <div className="relative">
            <Input
              placeholder="描述您想要的图标"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              disabled={isGenerating}
              className="text-base py-4 pr-12"
            />
            {prompt && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => onPromptChange("")}
                disabled={isGenerating}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 样式选择 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ICON_STYLES.map((style) => (
            <Button
              key={style.id}
              variant={activeStyle === style.id ? "default" : "outline"}
              size="sm"
              onClick={() => onStyleChange(style.id)}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <span>{style.icon}</span>
              {style.label}
            </Button>
          ))}
        </div>

        {/* 积分不足警告 */}
        {userCredits < 4 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <span className="text-sm">
                  ⚠️ 积分不足，生成图标需要至少4积分。当前积分：{userCredits}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/icon-pricing'}
                className="bg-amber-600 text-white border-amber-600 hover:bg-amber-700 hover:border-amber-700"
              >
                立即充值
              </Button>
            </div>
          </div>
        )}

        {/* 生成按钮 */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim() || userCredits < 4}
          className="w-full py-4 text-base"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ✨ 生成图标
            </>
          ) : userCredits < 4 ? (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              积分不足，请充值
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              ✨ 生成图标
            </>
          )}
        </Button>
      </div>
    </div>
  );
}