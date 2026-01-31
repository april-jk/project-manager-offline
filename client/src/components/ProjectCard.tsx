/**
 * 项目卡片组件
 * 
 * 设计理念: 现代极简主义
 * - 清晰的项目信息展示
 * - 彩色标签区分项目
 * - 悬停效果提示可交互
 */

import { Project } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, ChevronRight, Link2, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  resourceCount: number;
  memoCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProjectCard({
  project,
  resourceCount,
  memoCount,
  onSelect,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1',
        'border-l-4',
        project.color ? `border-l-[${project.color}]` : 'border-l-blue-500'
      )}
      style={{
        borderLeftColor: project.color || '#3b82f6',
      }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-lg truncate">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-muted-foreground truncate mt-1">{project.description}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground mb-4">
        <span className="inline-flex items-center gap-1">
          <Link2 className="w-4 h-4" />
          {resourceCount} 个资源
        </span>
        <span className="inline-flex items-center gap-1">
          <StickyNote className="w-4 h-4" />
          {memoCount} 条备忘
        </span>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
