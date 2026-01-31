/**
 * 网站卡片组件 (黄页形式)
 * 
 * 设计理念: 现代极简主义
 * - 网站图标 + 名称 + 描述
 * - 点击打开网站或编辑
 * - 标签展示
 */

import { Resource } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Edit2, Trash2, Globe, Link2, Key, Code2, Activity, FileText } from 'lucide-react';
import { extractDomain, getFaviconUrl } from '@/lib/utils';
import { useState } from 'react';

interface WebsiteCardProps {
  website: Resource;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

export default function WebsiteCard({
  website,
  onEdit,
  onDelete,
  selected,
  onSelect,
}: WebsiteCardProps) {
  const [faviconError, setFaviconError] = useState(false);
  const faviconUrl = website.icon || (website.url ? getFaviconUrl(website.url) : undefined);
  const domain = website.url ? extractDomain(website.url) : 'N/A';

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200 group relative">
      {onSelect && (
        <input
          type="checkbox"
          className="absolute top-3 right-3 w-4 h-4"
          checked={!!selected}
          onChange={(e) => onSelect(e.target.checked)}
        />
      )}
      <div className="flex gap-3 mb-3">
        {/* 网站图标 */}
        <div className="flex-shrink-0 w-12 h-12 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
          {website.iconType === 'builtin' && website.iconName ? (
            <>
              {website.iconName === 'globe' && <Globe className="w-6 h-6 text-muted-foreground" />}
              {website.iconName === 'link' && <Link2 className="w-6 h-6 text-muted-foreground" />}
              {website.iconName === 'key' && <Key className="w-6 h-6 text-muted-foreground" />}
              {website.iconName === 'code' && <Code2 className="w-6 h-6 text-muted-foreground" />}
              {website.iconName === 'activity' && <Activity className="w-6 h-6 text-muted-foreground" />}
              {website.iconName === 'file' && <FileText className="w-6 h-6 text-muted-foreground" />}
            </>
          ) : !faviconError && faviconUrl ? (
            <img
              src={faviconUrl}
              alt={website.name}
              className="w-8 h-8"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <Globe className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* 网站信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{website.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{domain}</p>
          {website.description && (
            <p className="text-sm text-muted-foreground truncate mt-1">{website.description}</p>
          )}
        </div>
      </div>

      {/* 标签 */}
      {website.tags && website.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {website.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
            >
              {tag}
            </span>
          ))}
          {website.tags.length > 3 && (
            <span className="inline-block px-2 py-1 text-xs text-muted-foreground">
              +{website.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        {website.url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(website.url, '_blank')}
            className="h-8 px-2"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            打开
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
