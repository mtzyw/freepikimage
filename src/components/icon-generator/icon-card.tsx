"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { GenerationTask } from "./types";

interface IconCardProps {
  task: GenerationTask;
  index: number;
  onClick?: (task: GenerationTask) => void;
}

export function IconCard({ task, index, onClick }: IconCardProps) {
  const handleClick = () => {
    if (task.status === 'completed' && (task.image_url || task.svg_url || task.png_url) && onClick) {
      onClick(task);
    }
  };

  return (
    <Card className={`aspect-square h-32 w-32 relative overflow-hidden transition-all duration-200 bg-white border-none shadow-none ${
      task.status === 'completed' && (task.image_url || task.svg_url || task.png_url)
        ? 'cursor-pointer hover:shadow-lg hover:scale-105' 
        : ''
    }`}>
      <CardContent className="p-3 h-full flex flex-col items-center justify-center bg-white">
        {task.status === 'pending' || task.status === 'generating' ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground text-center">
              {task.status === 'pending' ? '等待中...' : '生成中...'}
            </span>
          </div>
        ) : task.status === 'completed' && (task.image_url || task.svg_url || task.png_url) ? (
          <div 
            className="h-full w-full flex items-center justify-center cursor-pointer"
            onClick={handleClick}
          >
            <img
              src={task.image_url}
              alt="Generated icon"
              className="object-contain rounded w-20 h-20 transition-transform duration-200 hover:scale-110"
            />
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