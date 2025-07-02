"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { GenerationTask } from "./types";

interface IconDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: GenerationTask | null;
  allTasks?: GenerationTask[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export function IconDetailDialog({ 
  isOpen, 
  onClose, 
  task, 
  allTasks, 
  currentIndex,
  onNavigate 
}: IconDetailDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<'PNG' | 'SVG'>('PNG');

  // 重置格式选择当任务改变时
  useEffect(() => {
    console.log('🔍 任务数据:', task);
    console.log('📝 SVG URL:', task?.svg_url);
    console.log('📝 PNG URL:', task?.png_url);
    console.log('📝 Image URL:', task?.image_url);
    
    if (task?.png_url) {
      setSelectedFormat('PNG');
    } else if (task?.svg_url) {
      setSelectedFormat('SVG');
    }
  }, [task?.uuid]);

  // 获取当前选择格式的URL
  const getCurrentUrl = () => {
    if (selectedFormat === 'PNG') {
      return task?.png_url || task?.image_url;
    } else {
      return task?.svg_url || task?.image_url;
    }
  };

  // 下载功能
  const handleDownload = async () => {
    try {
      const downloadUrl = getCurrentUrl();
      if (!downloadUrl) {
        toast.error('图片未准备就绪');
        return;
      }

      const filename = `icon-${task?.uuid}.${selectedFormat.toLowerCase()}`;
      const proxyUrl = `/api/icon/download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`;
      
      const a = document.createElement('a');
      a.href = proxyUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("下载成功");
    } catch (error) {
      console.error('下载失败:', error);
      toast.error("下载失败");
    }
  };

  // 复制功能
  const handleCopy = async () => {
    try {
      const currentUrl = getCurrentUrl();
      if (!currentUrl) {
        toast.error('图片未准备就绪');
        return;
      }

      if (selectedFormat === 'SVG' && task?.svg_url) {
        // 复制SVG内容
        const response = await fetch(currentUrl);
        const svgContent = await response.text();
        await navigator.clipboard.writeText(svgContent);
        toast.success("SVG代码已复制到剪贴板");
      } else {
        // 复制图片链接
        await navigator.clipboard.writeText(currentUrl);
        toast.success("图片链接已复制到剪贴板");
      }
    } catch (error) {
      console.error('复制失败:', error);
      toast.error("复制失败");
    }
  };

  // 导航逻辑
  const showNavigation = allTasks && allTasks.length > 1 && typeof currentIndex === 'number';
  const canGoPrev = showNavigation && currentIndex > 0;
  const canGoNext = showNavigation && currentIndex < allTasks.length - 1;

  if (!task) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden [&>button]:h-12 [&>button]:w-12 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:text-xl">
        <DialogTitle className="sr-only">图标详情</DialogTitle>
        <DialogDescription className="sr-only">
          查看和下载生成的图标，支持PNG和SVG格式
        </DialogDescription>
        

        {/* 导航按钮 */}
        {canGoPrev && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 rounded-full bg-black/10 hover:bg-black/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        {canGoNext && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.('next')}
            className="absolute right-12 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 rounded-full bg-black/10 hover:bg-black/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* 图标展示 */}
        <div className="flex items-center justify-center p-12 bg-gray-50">
          <img
            src={getCurrentUrl()}
            alt="Generated icon"
            className="w-48 h-48 object-contain drop-shadow-lg"
          />
        </div>

        {/* 操作区域 */}
        <div className="p-6 bg-white">
          {/* 格式选择 */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedFormat === 'PNG' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFormat('PNG')}
              className="flex-1"
              disabled={!task?.png_url && !task?.image_url}
            >
              PNG
            </Button>
            <Button
              variant={selectedFormat === 'SVG' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFormat('SVG')}
              className="flex-1"
              disabled={!task?.svg_url && !task?.image_url}
            >
              ⚡ SVG
            </Button>
          </div>

          {/* 格式说明 */}
          <div className="mb-4 text-sm text-muted-foreground text-center">
            {selectedFormat === 'SVG' 
              ? task?.svg_url 
                ? "矢量格式，无限缩放不失真" 
                : "SVG格式"
              : task?.png_url || task?.image_url
                ? "高清位图格式" 
                : "PNG格式"
            }
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2"
              disabled={!getCurrentUrl()}
            >
              <Copy className="h-4 w-4" />
              {selectedFormat === 'SVG' ? '复制代码' : '复制链接'}
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={!getCurrentUrl()}
            >
              <Download className="h-4 w-4" />
              下载
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}