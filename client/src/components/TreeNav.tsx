/**
 * 树状导航组件
 * 显示项目及其下的网站和备忘录的树状结构
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Globe, FileText, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TreeNode {
  id: string;
  type: 'project' | 'website' | 'memo';
  name: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TreeNavProps {
  projects: any[];
  websites: Map<string, any[]>;
  memos: Map<string, any[]>;
  selectedId: string | null;
  onSelect: (id: string, type: 'project' | 'website' | 'memo') => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onEditWebsite?: (websiteId: string) => void;
  onDeleteWebsite?: (websiteId: string) => void;
  onEditMemo?: (memoId: string) => void;
  onDeleteMemo?: (memoId: string) => void;
}

export default function TreeNav({
  projects,
  websites,
  memos,
  selectedId,
  onSelect,
  onEditProject,
  onDeleteProject,
  onEditWebsite,
  onDeleteWebsite,
  onEditMemo,
  onDeleteMemo,
}: TreeNavProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(projects.map((p) => p.id))
  );

  const toggleProjectExpand = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const isProjectExpanded = (projectId: string) => expandedProjects.has(projectId);

  return (
    <div className="w-72 border-r border-border bg-background overflow-y-auto flex flex-col">
      {/* 导航标题 */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">项目导航</h2>
      </div>

      {/* 树状内容 */}
      <div className="flex-1 overflow-y-auto p-2">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>还没有项目</p>
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => {
              const projectWebsites = websites.get(project.id) || [];
              const projectMemos = memos.get(project.id) || [];
              const isExpanded = isProjectExpanded(project.id);
              const isSelected = selectedId === project.id;

              return (
                <div key={project.id}>
                  {/* 项目节点 */}
                  <div
                    className={`flex items-center gap-1 px-2 py-2 rounded-md cursor-pointer transition-all duration-200 group ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-secondary/50 text-foreground'
                    }`}
                    onClick={() => onSelect(project.id, 'project')}
                  >
                    {/* 展开/折叠按钮 */}
                    <button
                      className="flex-shrink-0 p-0.5 hover:bg-secondary rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectExpand(project.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {/* 项目图标 */}
                    <FolderOpen className="w-4 h-4 flex-shrink-0" />

                    {/* 项目名称 */}
                    <span className="flex-1 text-sm font-medium truncate">
                      {project.name}
                    </span>

                    {/* 项目计数 */}
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {projectWebsites.length + projectMemos.length}
                    </span>

                    {/* 操作菜单 */}
                    {isSelected && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => onEditProject?.(project.id)}
                            className="text-xs"
                          >
                            编辑项目
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteProject?.(project.id)}
                            className="text-xs text-destructive"
                          >
                            删除项目
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* 展开的子节点 */}
                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      {/* 网站节点 */}
                      {projectWebsites.map((website) => {
                        const isWebsiteSelected = selectedId === website.id;
                        return (
                          <div
                            key={website.id}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 group ${
                              isWebsiteSelected
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-secondary/50 text-foreground'
                            }`}
                            onClick={() => onSelect(website.id, 'website')}
                          >
                            <div className="w-4 flex-shrink-0" />
                            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="flex-1 text-xs truncate">
                              {website.name}
                            </span>
                            {isWebsiteSelected && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    onClick={() => onEditWebsite?.(website.id)}
                                    className="text-xs"
                                  >
                                    编辑
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onDeleteWebsite?.(website.id)}
                                    className="text-xs text-destructive"
                                  >
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        );
                      })}

                      {/* 备忘录节点 */}
                      {projectMemos.map((memo) => {
                        const isMemoSelected = selectedId === memo.id;
                        return (
                          <div
                            key={memo.id}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 group ${
                              isMemoSelected
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-secondary/50 text-foreground'
                            }`}
                            onClick={() => onSelect(memo.id, 'memo')}
                          >
                            <div className="w-4 flex-shrink-0" />
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="flex-1 text-xs truncate">
                              {memo.title}
                            </span>
                            {memo.isEncrypted && (
                              <span className="text-xs flex-shrink-0">🔒</span>
                            )}
                            {isMemoSelected && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    onClick={() => onEditMemo?.(memo.id)}
                                    className="text-xs"
                                  >
                                    编辑
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onDeleteMemo?.(memo.id)}
                                    className="text-xs text-destructive"
                                  >
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
