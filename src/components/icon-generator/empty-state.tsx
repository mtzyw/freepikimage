"use client";

import { Sparkles } from "lucide-react";
import { HistoryGrid } from "./history-grid";

interface EmptyStateProps {
  showHistory?: boolean;
}

export function EmptyState({ showHistory = true }: EmptyStateProps) {
  return (
    <div className="space-y-8">
      <div className="text-center py-8 text-muted-foreground">
        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">尚无图标</p>
        <p className="text-sm">开始输入以创建你的第一个图标！</p>
      </div>
      
      {showHistory && <HistoryGrid />}
    </div>
  );
}