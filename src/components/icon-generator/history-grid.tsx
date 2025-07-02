"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface HistoryIcon {
  uuid: string;
  prompt: string;
  style: string;
  status: string;
  r2_url?: string;
  created_at: string;
  error_message?: string;
}

interface HistoryGridProps {
  onLoadBatch?: (icons: HistoryIcon[]) => void;
}

export function HistoryGrid({ onLoadBatch }: HistoryGridProps) {
  const [historyIcons, setHistoryIcons] = useState<HistoryIcon[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadHistory = async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/icon/history?page=${pageNum}&limit=12`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newIcons = data.data.icons || [];
          setHistoryIcons(prev => append ? [...prev, ...newIcons] : newIcons);
          setHasMore(data.data.pagination.hasMore);
        }
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error("加载历史记录失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory(1, false);
  }, []);

  const handleDownload = async (icon: HistoryIcon) => {
    if (!icon.r2_url) return;

    try {
      const response = await fetch(`/api/icon/download/${icon.uuid}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `icon-${icon.uuid}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("下载完成！");
      } else {
        toast.error("下载失败");
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("下载失败");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "等待中", variant: "secondary" as const },
      generating: { label: "生成中", variant: "default" as const },
      completed: { label: "已完成", variant: "default" as const },
      failed: { label: "失败", variant: "destructive" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (historyIcons.length === 0 && !loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无历史记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">历史记录</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadHistory(1, false)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {historyIcons.map((icon) => (
          <Card key={icon.uuid} className="aspect-square h-20 w-20 group relative overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200">
            <CardContent className="p-1 h-full flex flex-col">
              {icon.status === 'completed' && icon.r2_url ? (
                <div className="flex-1 relative">
                  <img
                    src={icon.r2_url}
                    alt={icon.prompt}
                    className="w-full h-full object-contain rounded"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(icon)}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0 p-1 h-6 w-6"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-100 rounded">
                  {getStatusBadge(icon.status)}
                </div>
              )}
              
              <div className="text-xs text-center text-muted-foreground truncate mt-1">
                {formatDate(icon.created_at)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              loadHistory(nextPage, true);
            }}
            disabled={loading}
          >
            {loading ? "加载中..." : "加载更多"}
          </Button>
        </div>
      )}
    </div>
  );
}