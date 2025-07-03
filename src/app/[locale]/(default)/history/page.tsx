"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { History, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

// 导入组件
import { Sidebar } from "@/components/icon-generator/sidebar";
import { IconGrid } from "@/components/icon-generator/icon-grid";
import { EmptyState } from "@/components/icon-generator/empty-state";
import type { GenerationBatch } from "@/components/icon-generator/types";

export default function HistoryPage() {
  const { data: session } = useSession();
  const [historyBatches, setHistoryBatches] = useState<GenerationBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12;

  // 加载历史记录
  useEffect(() => {
    if (!session?.user?.uuid) {
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/icon/history?limit=100`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data.icons && data.data.icons.length > 0) {
            // 按prompt+style分组
            const groupedByPrompt: { [key: string]: any[] } = {};
            
            data.data.icons.forEach((icon: any) => {
              const key = `${icon.prompt}_${icon.style}`;
              if (!groupedByPrompt[key]) {
                groupedByPrompt[key] = [];
              }
              groupedByPrompt[key].push(icon);
            });
            
            // 转换为批次格式
            const allBatches = Object.values(groupedByPrompt)
              .filter(group => group.length > 0)
              .sort((a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime())
              .map(batchIcons => {
                const firstIcon = batchIcons[0];
                const tasks = batchIcons.map((icon: any) => ({
                  uuid: icon.uuid,
                  status: icon.status,
                  prompt: icon.prompt,
                  style: icon.style,
                  format: icon.format,
                  image_url: icon.r2_url || icon.image_url,
                  svg_url: icon.svg_url,
                  png_url: icon.png_url,
                  error_message: icon.error_message,
                }));
                
                return {
                  id: `history-${firstIcon.uuid}`,
                  prompt: firstIcon.prompt,
                  style: firstIcon.style,
                  format: firstIcon.format,
                  tasks,
                  isGenerating: false,
                  createdAt: new Date(firstIcon.created_at)
                };
              });
            
            setHistoryBatches(allBatches);
            setTotalCount(allBatches.length);
            setTotalPages(Math.ceil(allBatches.length / itemsPerPage));
          }
        }
      } catch (error) {
        console.error('Failed to load history:', error);
        toast.error('加载历史记录失败');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [session?.user?.uuid]);

  // 搜索过滤
  const filteredBatches = historyBatches.filter(batch =>
    batch.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分页数据
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBatches = filteredBatches.slice(startIndex, endIndex);
  const filteredTotalPages = Math.ceil(filteredBatches.length / itemsPerPage);

  // 删除批次
  const handleDeleteBatch = (batchId: string) => {
    setHistoryBatches(prev => prev.filter(batch => batch.id !== batchId));
    setTotalCount(prev => prev - 1);
    setTotalPages(Math.ceil((totalCount - 1) / itemsPerPage));
  };

  if (!session) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <History className="h-8 w-8 text-blue-500" />
              历史记录
            </h1>
            <p className="text-muted-foreground mb-8">请先登录查看历史记录</p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* 左侧菜单栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部标题和搜索 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <History className="h-6 w-6 text-blue-500" />
                历史记录
              </h1>
              <Badge variant="secondary">
                共 {filteredBatches.length} 个批次
              </Badge>
            </div>
            
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 bg-white overflow-auto">
          <div className="max-w-6xl mx-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              </div>
            ) : currentBatches.length > 0 ? (
              <>
                {/* 历史记录网格 */}
                <div className="space-y-8">
                  {currentBatches.map((batch) => (
                    <IconGrid
                      key={batch.id}
                      batch={batch}
                      onClear={() => handleDeleteBatch(batch.id)}
                      isHistory={true}
                    />
                  ))}
                </div>

                {/* 分页控件 */}
                {filteredTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        第 {currentPage} 页，共 {filteredTotalPages} 页
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(filteredTotalPages, prev + 1))}
                      disabled={currentPage === filteredTotalPages}
                      className="flex items-center gap-2"
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无历史记录</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? '没有找到匹配的记录' : '你还没有生成过任何图标'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => window.location.href = '/icon-generator'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    开始生成图标
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}