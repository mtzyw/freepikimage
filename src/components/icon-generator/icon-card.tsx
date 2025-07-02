"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import type { GenerationTask } from "./types";

interface IconCardProps {
  task: GenerationTask;
  index: number;
  onDownload: (task: GenerationTask) => void;
}

export function IconCard({ task, index, onDownload }: IconCardProps) {
  const handleDownload = () => {
    onDownload(task);
  };

  return (
    <Card className="aspect-square h-32 w-32 group relative overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200">
      <CardContent className="p-3 h-full flex flex-col items-center justify-center">
        {task.status === 'pending' || task.status === 'generating' ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground text-center">
              {task.status === 'pending' ? '等待中...' : '生成中...'}
            </span>
          </div>
        ) : task.status === 'completed' && task.image_url ? (
          <div className="h-full w-full flex items-center justify-center relative">
            <img
              src={task.image_url}
              alt="Generated icon"
              className="object-contain rounded w-20 h-20 transition-transform duration-200 group-hover:scale-110"
            />
            
            {/* 悬停时显示的操作按钮 */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-gray-600 hover:bg-gray-700 text-white border-0"
                onClick={() => {
                  // 复制到剪贴板功能（可选）
                  if (task.image_url) {
                    navigator.clipboard.writeText(task.image_url);
                  }
                }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-destructive text-xs mb-2">
              生成失败
            </div>
            <div className="text-xs text-muted-foreground px-2">
              {task.error_message || '未知错误'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}