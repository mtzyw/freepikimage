"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconCard } from "./icon-card";
import { IconDetailDialog } from "./icon-detail-dialog";
import { toast } from "sonner";
import type { GenerationTask, GenerationBatch } from "./types";
import { ICON_STYLES } from "./types";

interface IconGridProps {
  batch: GenerationBatch;
  onClear: () => void;
  isHistory?: boolean;
}

export function IconGrid({ batch, onClear, isHistory = false }: IconGridProps) {
  const [selectedTask, setSelectedTask] = useState<GenerationTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 获取所有已完成的任务用于导航
  const completedTasks = batch.tasks.filter(task => 
    task.status === 'completed' && (task.image_url || task.svg_url || task.png_url)
  );
  const styleLabel = ICON_STYLES.find(s => s.id === batch.style)?.label || batch.style;

  const getTimeLabel = () => {
    if (batch.isGenerating) return "正在生成";
    if (isHistory) return "历史记录";
    return "今天";
  };

  // 处理图标点击事件
  const handleIconClick = (task: GenerationTask) => {
    const index = completedTasks.findIndex(t => t.uuid === task.uuid);
    if (index !== -1) {
      setSelectedTask(task);
      setCurrentIndex(index);
      setDialogOpen(true);
    }
  };

  // 处理对话框导航
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedTask(completedTasks[newIndex]);
    } else if (direction === 'next' && currentIndex < completedTasks.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedTask(completedTasks[newIndex]);
    }
  };

  // 关闭对话框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const handleDelete = async () => {
    try {
      const uuids = batch.tasks
        .filter(task => task.uuid && !task.uuid.startsWith('failed-'))
        .map(task => task.uuid);
      
      if (uuids.length === 0) {
        onClear();
        return;
      }

      const response = await fetch('/api/icon/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uuids })
      });

      // 立即清除UI显示，提供即时反馈
      onClear();
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("删除成功");
        } else {
          toast.error("删除失败");
        }
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error('Delete batch failed:', error);
      toast.error("删除失败");
    }
  };

  return (
    <div className="space-y-4">
      {/* 批次标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{getTimeLabel()}</span>
          </div>
          <h3 className="text-lg font-semibold">
            {batch.prompt} {styleLabel}
          </h3>
        </div>
        {!batch.isGenerating && (
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            移除
          </Button>
        )}
      </div>

      {/* 4个图标格子 */}
      <div className="grid grid-cols-4 gap-3">
        {batch.tasks.map((task, index) => (
          <IconCard
            key={task.uuid || index}
            task={task}
            index={index}
            onClick={handleIconClick}
          />
        ))}
      </div>

      {/* 加载提示 */}
      {batch.isGenerating && (
        <div className="text-center text-sm text-muted-foreground">
          请稍等，我们正在生成您的图标，这只需要几分钟...
        </div>
      )}

      {/* 图标详情对话框 */}
      <IconDetailDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        task={selectedTask}
        allTasks={completedTasks}
        currentIndex={currentIndex}
        onNavigate={handleNavigate}
      />
    </div>
  );
}