"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  FolderOpen, 
  Sparkles, 
  Image, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      title: "主页",
      icon: Home,
      href: "/",
      isActive: pathname === "/"
    },
    {
      title: "项目",
      icon: FolderOpen,
      href: "/projects",
      isActive: pathname.startsWith("/projects")
    },
    {
      title: "AI套装",
      icon: Sparkles,
      href: "/icon-generator",
      isActive: pathname.startsWith("/icon-generator")
    },
    {
      title: "图库",
      icon: Image,
      href: "/gallery",
      isActive: pathname.startsWith("/gallery")
    },
    {
      title: "更多",
      icon: MoreHorizontal,
      href: "/more",
      isActive: pathname.startsWith("/more")
    }
  ];

  return (
    <div className={cn(
      "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Logo区域 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">FREEPIK</div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 菜单项 */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    item.isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 底部区域 */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            ShipAny Template
          </div>
        </div>
      )}
    </div>
  );
}