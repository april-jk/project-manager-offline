/**
 * 备忘录卡片组件
 * 
 * 设计理念: 现代极简主义
 * - 标题 + 内容预览
 * - 分类标签
 * - 加密状态指示
 */

import { Memo } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Lock } from 'lucide-react';
import { truncateText, formatDate } from '@/lib/utils';

interface MemoCardProps {
  memo: Memo;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MemoCard({ memo, onEdit, onDelete }: MemoCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200 group cursor-pointer" onClick={onEdit}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground truncate">{memo.title}</h3>
          {memo.category && (
            <span className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded mt-2">
              {memo.category}
            </span>
          )}
        </div>
        {memo.isEncrypted && (
          <Lock className="w-4 h-4 text-accent flex-shrink-0 ml-2" />
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {memo.isEncrypted ? '🔒 加密内容' : truncateText(memo.content, 100)}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(memo.updatedAt, 'short')}</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>
    </Card>
  );
}
