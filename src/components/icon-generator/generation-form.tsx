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
            <span className="ml-2 text-xs text-muted-foreground">
              💎 {userCredits}/4剩余图标
            </span>
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

        {/* 生成按钮 */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-4 text-base"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ✨ 生成图标
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