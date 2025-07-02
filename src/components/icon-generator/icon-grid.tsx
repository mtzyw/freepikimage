"use client";

import { Button } from "@/components/ui/button";
import { IconCard } from "./icon-card";
import { toast } from "sonner";
import type { GenerationTask, GenerationBatch } from "./types";
import { ICON_STYLES } from "./types";

interface IconGridProps {
  batch: GenerationBatch;
  onDownload: (task: GenerationTask) => void;
  onClear: () => void;
  isHistory?: boolean;
}

export function IconGrid({ batch, onDownload, onClear, isHistory = false }: IconGridProps) {
  const styleLabel = ICON_STYLES.find(s => s.id === batch.style)?.label || batch.style;

  const getTimeLabel = () => {
    if (batch.isGenerating) return "正在生成";
    if (isHistory) return "历史记录";
    return "今天";
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

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("删除成功");
          onClear();
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
            onDownload={onDownload}
          />
        ))}
      </div>

      {/* 加载提示 */}
      {batch.isGenerating && (
        <div className="text-center text-sm text-muted-foreground">
          请稍等，我们正在生成您的图标，这只需要几分钟...
        </div>
      )}
    </div>
  );
}