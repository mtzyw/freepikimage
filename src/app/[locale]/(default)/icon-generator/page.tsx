"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

// 导入拆分的组件
import { Sidebar } from "@/components/icon-generator/sidebar";
import { GenerationForm } from "@/components/icon-generator/generation-form";
import { IconGrid } from "@/components/icon-generator/icon-grid";
import { EmptyState } from "@/components/icon-generator/empty-state";
import type { GenerationTask, GenerationBatch } from "@/components/icon-generator/types";

export default function IconGeneratorPage() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [activeStyle, setActiveStyle] = useState("solid");
  const [currentBatch, setCurrentBatch] = useState<GenerationBatch | null>(null);
  const [historyBatches, setHistoryBatches] = useState<GenerationBatch[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // 加载历史记录和恢复最近的生成批次
  useEffect(() => {
    if (!session?.user?.uuid || historyLoaded) return;

    const loadRecentHistory = async () => {
      try {
        const response = await fetch('/api/icon/history?limit=20');
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data.icons && data.data.icons.length > 0) {
            // 查找最近的一批图标（相同prompt和style的）
            const recentIcons = data.data.icons;
            const groupedByPrompt: { [key: string]: any[] } = {};
            
            // 按prompt+style分组
            recentIcons.forEach((icon: any) => {
              const key = `${icon.prompt}_${icon.style}`;
              if (!groupedByPrompt[key]) {
                groupedByPrompt[key] = [];
              }
              groupedByPrompt[key].push(icon);
            });
            
            // 找到所有批次并排序
            const allBatches = Object.values(groupedByPrompt)
              .filter(group => group.length >= 3) // 至少3个图标才算一个批次
              .sort((a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime());
            
            if (allBatches.length > 0) {
              const convertedBatches: GenerationBatch[] = [];
              let foundGeneratingBatch = false;
              
              allBatches.forEach(batchIcons => {
                const batch = batchIcons.slice(0, 4); // 只取4个
                const firstIcon = batch[0];
                
                // 转换为前端格式
                const tasks: GenerationTask[] = batch.map((icon: any) => ({
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
                
                // 检查是否还有进行中的任务
                const hasGenerating = tasks.some(task => 
                  task.status === 'pending' || task.status === 'generating'
                );
                
                const generationBatch: GenerationBatch = {
                  id: `history-${firstIcon.uuid}`,
                  prompt: firstIcon.prompt,
                  style: firstIcon.style,
                  format: firstIcon.format,
                  tasks,
                  isGenerating: hasGenerating
                };
                
                // 第一个有进行中任务的批次设为当前批次，其他的放入历史
                if (hasGenerating && !foundGeneratingBatch) {
                  setCurrentBatch(generationBatch);
                  foundGeneratingBatch = true;
                } else {
                  convertedBatches.push(generationBatch);
                }
              });
              
              // 如果没有进行中的批次，最新的一个设为当前批次
              if (!foundGeneratingBatch && allBatches.length > 0) {
                const latestBatch = allBatches[0].slice(0, 4);
                const firstIcon = latestBatch[0];
                
                const tasks: GenerationTask[] = latestBatch.map((icon: any) => ({
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
                
                setCurrentBatch({
                  id: `history-${firstIcon.uuid}`,
                  prompt: firstIcon.prompt,
                  style: firstIcon.style,
                  format: firstIcon.format,
                  tasks,
                  isGenerating: false
                });
                
                // 其余批次放入历史
                convertedBatches.splice(0, 1); // 移除第一个（已设为currentBatch）
              }
              
              setHistoryBatches(convertedBatches);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
      
      setHistoryLoaded(true);
    };

    loadRecentHistory();
  }, [session, historyLoaded]);

  // 轮询4个任务的状态
  useEffect(() => {
    if (!currentBatch || !currentBatch.isGenerating) {
      return;
    }

    const pollStatus = async () => {
      try {
        // 获取需要查询的有效UUID
        const validUuids = currentBatch.tasks
          .filter(task => 
            task.uuid && 
            !task.uuid.includes('failed-') && 
            task.status !== 'completed' && 
            task.status !== 'failed'
          )
          .map(task => task.uuid);

        // 使用批量查询API
        if (validUuids.length > 0) {
          console.log('🔄 批量轮询状态:', validUuids);
          
          const response = await fetch('/api/icon/batch-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uuids: validUuids }),
          });

          if (response.ok) {
            const batchData = await response.json();
            console.log('📡 批量状态响应:', batchData);

            // 更新任务状态
            const updatedTasks = currentBatch.tasks.map(task => {
              // 如果是已完成或失败的任务，保持不变
              if (task.status === 'completed' || task.status === 'failed') {
                return task;
              }

              // 如果是无效UUID，保持不变
              if (!task.uuid || task.uuid.includes('failed-')) {
                return task;
              }

              // 从批量响应中获取最新状态
              const latestData = batchData[task.uuid];
              if (latestData && latestData.status !== 'not_found') {
                console.log('✅ 更新任务状态:', task.uuid, latestData.status);
                return {
                  ...task,
                  ...latestData
                };
              }

              return task;
            });

            return updatedTasks;
          } else {
            console.error('批量状态查询失败:', response.status, response.statusText);
            return currentBatch.tasks;
          }
        } else {
          // 没有需要查询的UUID，直接返回当前任务
          return currentBatch.tasks;
        }
      } catch (error) {
        console.error('批量状态查询出错:', error);
        return currentBatch.tasks;
      }
    };

    const updateTasks = async () => {
      const updatedTasks = await pollStatus();

      const allCompleted = updatedTasks.every(task => 
        task.status === 'completed' || task.status === 'failed'
      );

      setCurrentBatch(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: updatedTasks,
          isGenerating: !allCompleted
        };
      });

      if (allCompleted) {
        const successCount = updatedTasks.filter(task => task.status === 'completed').length;
        const failCount = updatedTasks.filter(task => task.status === 'failed').length;
        
        if (successCount > 0) {
          toast.success(`生成完成！成功 ${successCount} 个，失败 ${failCount} 个`);
        } else {
          toast.error("所有图标生成失败");
        }
      }
    };

    const interval = setInterval(updateTasks, 3000);
    return () => clearInterval(interval);
  }, [currentBatch]);

  const handleGenerate = async () => {
    if (!session) {
      toast.error("请先登录");
      return;
    }

    if (!prompt.trim()) {
      toast.error("请输入图标描述");
      return;
    }

    const batchId = Date.now().toString();
    
    // 如果当前有已完成的批次，将其移动到历史记录
    if (currentBatch && !currentBatch.isGenerating) {
      setHistoryBatches(prev => [currentBatch, ...prev]);
    }
    
    // 创建4个初始任务
    const initialTasks: GenerationTask[] = Array.from({ length: 4 }, (_, index) => ({
      uuid: '',
      status: 'pending',
      prompt: prompt.trim(),
      style: activeStyle,
      format: 'svg' // 改为默认SVG格式
    }));

    setCurrentBatch({
      id: batchId,
      prompt: prompt.trim(),
      style: activeStyle,
      format: 'svg', // 改为默认SVG格式
      tasks: initialTasks,
      isGenerating: true
    });

    toast.success("开始生成4个图标...");

    try {
      // 并发调用4次API，但加入微小延迟避免完全同时请求
      const generatePromises = Array.from({ length: 4 }, async (_, index) => {
        try {
          // 为每个请求添加小的随机延迟 (0-200ms)
          await new Promise(resolve => setTimeout(resolve, index * 50 + Math.random() * 50));
          
          const response = await fetch('/api/icon/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: prompt.trim(),
              style: activeStyle,
              format: 'svg', // 改为SVG格式，与后端一致
              num_inference_steps: 20,
              guidance_scale: 7
            }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            return {
              uuid: data.uuid,
              status: data.status,
              prompt: prompt.trim(),
              style: activeStyle,
              format: 'svg' // 改为SVG格式
            } as GenerationTask;
          } else {
            return {
              uuid: `failed-${index}`,
              status: 'failed',
              prompt: prompt.trim(),
              style: activeStyle,
              format: 'svg', // 改为SVG格式
              error_message: data.error || "生成失败"
            } as GenerationTask;
          }
        } catch (error) {
          return {
            uuid: `failed-${index}`,
            status: 'failed',
            prompt: prompt.trim(),
            style: activeStyle,
            format: 'svg', // 改为SVG格式
            error_message: "网络错误"
          } as GenerationTask;
        }
      });

      const results = await Promise.all(generatePromises);
      
      // 更新任务状态
      setCurrentBatch(prev => {
        if (!prev || prev.id !== batchId) return prev;
        return {
          ...prev,
          tasks: results.map(task => ({
            ...task,
            status: task.status === 'failed' ? 'failed' : 'generating'
          }))
        };
      });

    } catch (error) {
      console.error('Generation failed:', error);
      toast.error("生成失败，请重试");
      setCurrentBatch(null);
    }
  };


  const clearResults = () => {
    if (currentBatch && !currentBatch.isGenerating) {
      setHistoryBatches(prev => [currentBatch, ...prev]);
    }
    setCurrentBatch(null);
  };

  // 真正删除当前批次（不移动到历史记录）
  const deleteCurrentBatch = () => {
    setCurrentBatch(null);
  };

  if (!session) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-blue-500" />
              AI图标生成器
              <Badge variant="secondary">测试版</Badge>
            </h1>
            <p className="text-muted-foreground mb-8">请先登录使用图标生成功能</p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧菜单栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部标题 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              AI图标生成器
              <Badge variant="secondary">测试版</Badge>
            </h1>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto p-6">
            {/* 生成表单 */}
            <GenerationForm
              prompt={prompt}
              onPromptChange={setPrompt}
              activeStyle={activeStyle}
              onStyleChange={setActiveStyle}
              isGenerating={currentBatch?.isGenerating || false}
              onGenerate={handleGenerate}
              userCredits={session?.user?.credits || 0}
            />

            {/* 生成结果和历史记录 */}
            <div className="mt-8 space-y-8">
              {/* 当前生成批次 */}
              {currentBatch && (
                <IconGrid
                  batch={currentBatch}
                  onClear={deleteCurrentBatch}
                />
              )}
              
              {/* 历史批次 */}
              {historyBatches.map((batch) => (
                <IconGrid
                  key={batch.id}
                  batch={batch}
                  onClear={() => {
                    setHistoryBatches(prev => prev.filter(b => b.id !== batch.id));
                  }}
                  isHistory={true}
                />
              ))}
              
              {/* 空状态（只在没有任何批次时显示） */}
              {!currentBatch && historyBatches.length === 0 && (
                <EmptyState showHistory={historyLoaded} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}