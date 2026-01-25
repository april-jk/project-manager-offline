/**
 * 首页 - 树状导航 + 详情内容
 * 
 * 设计理念: 现代极简主义
 * - 左侧：树状项目导航（可展开/折叠）
 * - 右侧：选中项目/网站/备忘录的详情
 */

import { useState, useEffect, useMemo } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useEncryption } from '@/contexts/EncryptionContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Lock, Download, Upload, Trash2, MoreVertical, Edit2, ExternalLink } from 'lucide-react';
import TreeNav from '@/components/TreeNav';
import { generateRandomColor, downloadFile, readFile } from '@/lib/utils';
import { exportAllData, importData, clearAllData } from '@/lib/storage';

export default function Home() {
  const { projects, createProject, updateProjectData, deleteProjectData, getProjectWebsites, getProjectMemos, createWebsite, updateWebsiteData, deleteWebsiteData, createMemo, updateMemoData, deleteMemoData } = useProjects();
  const { hasPassword, isPasswordUnlocked, setPassword, unlockWithPassword } = useEncryption();

  // 选中的节点
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'project' | 'website' | 'memo' | null>(null);

  // 对话框状态
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(hasPassword && !isPasswordUnlocked);
  const [showWebsiteDialog, setShowWebsiteDialog] = useState(false);
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingWebsite, setEditingWebsite] = useState<any>(null);
  const [editingMemo, setEditingMemo] = useState<any>(null);

  // 表单状态
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [password, setPasswordInput] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');

  const [websiteName, setWebsiteName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteDesc, setWebsiteDesc] = useState('');
  const [websiteTags, setWebsiteTags] = useState('');

  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoCategory, setMemoCategory] = useState('');
  const [memoEncrypted, setMemoEncrypted] = useState(false);

  // 获取选中的对象
  const selectedProject = projects.find((p) => p.id === selectedId && selectedType === 'project');
  const allWebsites = useMemo(() => {
    const result = new Map<string, any[]>();
    projects.forEach((project) => {
      result.set(project.id, getProjectWebsites(project.id));
    });
    return result;
  }, [projects, getProjectWebsites]);

  const allMemos = useMemo(() => {
    const result = new Map<string, any[]>();
    projects.forEach((project) => {
      result.set(project.id, getProjectMemos(project.id));
    });
    return result;
  }, [projects, getProjectMemos]);

  const selectedWebsite = useMemo(() => {
    if (selectedType !== 'website') return null;
    for (const websites of Array.from(allWebsites.values())) {
      const website = websites.find((w: any) => w.id === selectedId);
      if (website) return website;
    }
    return null;
  }, [selectedId, selectedType, allWebsites]);

  const selectedMemo = useMemo(() => {
    if (selectedType !== 'memo') return null;
    for (const memos of Array.from(allMemos.values())) {
      const memo = memos.find((m: any) => m.id === selectedId);
      if (memo) return memo;
    }
    return null;
  }, [selectedId, selectedType, allMemos]);

  // ============ 项目操作 ============

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDesc('');
    setProjectColor(generateRandomColor());
    setShowProjectDialog(true);
  };

  const handleEditProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDesc(project.description || '');
    setProjectColor(project.color || generateRandomColor());
    setShowProjectDialog(true);
  };

  const handleSaveProject = () => {
    if (!projectName.trim()) {
      toast.error('请填写项目名称');
      return;
    }

    if (editingProject) {
      updateProjectData(editingProject.id, {
        name: projectName,
        description: projectDesc,
        color: projectColor,
      });
      toast.success('项目已更新');
    } else {
      createProject(projectName, projectDesc, projectColor);
      toast.success('项目已创建');
    }

    setShowProjectDialog(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('确定要删除这个项目吗？这将删除该项目下的所有网站和备忘录。')) {
      deleteProjectData(projectId);
      if (selectedId === projectId) {
        setSelectedId(null);
        setSelectedType(null);
      }
      toast.success('项目已删除');
    }
  };

  // ============ 网站操作 ============

  const handleAddWebsite = () => {
    if (!selectedProject) return;
    setEditingWebsite(null);
    setWebsiteName('');
    setWebsiteUrl('');
    setWebsiteDesc('');
    setWebsiteTags('');
    setShowWebsiteDialog(true);
  };

  const handleEditWebsite = (websiteId: string) => {
    const website = Array.from(allWebsites.values())
      .flat()
      .find((w) => w.id === websiteId);
    if (!website) return;
    setEditingWebsite(website);
    setWebsiteName(website.name);
    setWebsiteUrl(website.url);
    setWebsiteDesc(website.description || '');
    setWebsiteTags(website.tags?.join(', ') || '');
    setShowWebsiteDialog(true);
  };

  const handleSaveWebsite = () => {
    if (!selectedProject) return;
    if (!websiteName.trim() || !websiteUrl.trim()) {
      toast.error('请填写网站名称和 URL');
      return;
    }

    const tags = websiteTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    if (editingWebsite) {
      updateWebsiteData(editingWebsite.id, {
        name: websiteName,
        url: websiteUrl,
        description: websiteDesc,
        tags,
      });
      toast.success('网站已更新');
    } else {
      createWebsite(selectedProject.id, websiteName, websiteUrl, websiteDesc, undefined, tags);
      toast.success('网站已添加');
    }

    setShowWebsiteDialog(false);
  };

  const handleDeleteWebsite = (websiteId: string) => {
    if (confirm('确定要删除这个网站吗？')) {
      deleteWebsiteData(websiteId);
      if (selectedId === websiteId) {
        setSelectedId(null);
        setSelectedType(null);
      }
      toast.success('网站已删除');
    }
  };

  // ============ 备忘录操作 ============

  const handleAddMemo = () => {
    if (!selectedProject) return;
    setEditingMemo(null);
    setMemoTitle('');
    setMemoContent('');
    setMemoCategory('');
    setMemoEncrypted(false);
    setShowMemoDialog(true);
  };

  const handleEditMemo = (memoId: string) => {
    const memo = Array.from(allMemos.values())
      .flat()
      .find((m) => m.id === memoId);
    if (!memo) return;
    setEditingMemo(memo);
    setMemoTitle(memo.title);
    setMemoContent(memo.content);
    setMemoCategory(memo.category || '');
    setMemoEncrypted(memo.isEncrypted);
    setShowMemoDialog(true);
  };

  const handleSaveMemo = () => {
    if (!selectedProject) return;
    if (!memoTitle.trim()) {
      toast.error('请填写备忘录标题');
      return;
    }

    if (memoEncrypted && !isPasswordUnlocked) {
      toast.error('请先设置或解锁密码');
      return;
    }

    if (editingMemo) {
      updateMemoData(editingMemo.id, {
        title: memoTitle,
        content: memoContent,
        category: memoCategory,
        isEncrypted: memoEncrypted,
      });
      toast.success('备忘录已更新');
    } else {
      createMemo(selectedProject.id, memoTitle, memoContent, memoCategory, memoEncrypted);
      toast.success('备忘录已添加');
    }

    setShowMemoDialog(false);
  };

  const handleDeleteMemo = (memoId: string) => {
    if (confirm('确定要删除这条备忘录吗？')) {
      deleteMemoData(memoId);
      if (selectedId === memoId) {
        setSelectedId(null);
        setSelectedType(null);
      }
      toast.success('备忘录已删除');
    }
  };

  // ============ 密码操作 ============

  const handleSetPassword = async () => {
    if (!password.trim()) {
      toast.error('请输入密码');
      return;
    }

    if (password.length < 8) {
      toast.error('密码至少需要 8 个字符');
      return;
    }

    try {
      await setPassword(password);
      toast.success('密码已设置');
      setShowPasswordDialog(false);
      setPasswordInput('');
    } catch (error) {
      toast.error('设置密码失败');
    }
  };

  const handleUnlock = async () => {
    if (!unlockPassword.trim()) {
      toast.error('请输入密码');
      return;
    }

    try {
      const isValid = await unlockWithPassword(unlockPassword);
      if (isValid) {
        toast.success('密码验证成功');
        setShowUnlockDialog(false);
        setUnlockPassword('');
      } else {
        toast.error('密码不正确');
      }
    } catch (error) {
      toast.error('密码验证失败');
    }
  };

  // ============ 数据导出/导入 ============

  const handleExportData = () => {
    try {
      const data = exportAllData();
      const jsonString = JSON.stringify(data, null, 2);
      downloadFile(jsonString, `project-hub-backup-${Date.now()}.json`, 'application/json');
      toast.success('数据已导出');
    } catch (error) {
      toast.error('导出失败');
    }
  };

  const handleImportData = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const content = await readFile(file);
        const data = JSON.parse(content);
        importData(data);
        toast.success('数据已导入，请刷新页面');
        window.location.reload();
      } catch (error) {
        toast.error('导入失败，请检查文件格式');
      }
    };
    input.click();
  };

  const handleClearData = () => {
    if (confirm('确定要清空所有数据吗？此操作无法撤销！')) {
      clearAllData();
      toast.success('所有数据已清空');
      window.location.reload();
    }
  };

  const handleSelectNode = (id: string, type: 'project' | 'website' | 'memo') => {
    setSelectedId(id);
    setSelectedType(type);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部导航栏 */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Project Hub</h1>

          <div className="flex items-center gap-2">
            {hasPassword && !isPasswordUnlocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnlockDialog(true)}
                className="gap-2"
              >
                <Lock className="w-4 h-4" />
                解锁
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                  <Lock className="w-4 h-4 mr-2" />
                  {hasPassword ? '更改密码' : '设置密码'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  导出数据
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportData}>
                  <Upload className="w-4 h-4 mr-2" />
                  导入数据
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearData} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空所有数据
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleAddProject} className="gap-2">
              <Plus className="w-4 h-4" />
              添加项目
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧树状导航 */}
        <TreeNav
          projects={projects}
          websites={allWebsites}
          memos={allMemos}
          selectedId={selectedId}
          onSelect={handleSelectNode}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onEditWebsite={handleEditWebsite}
          onDeleteWebsite={handleDeleteWebsite}
          onEditMemo={handleEditMemo}
          onDeleteMemo={handleDeleteMemo}
        />

        {/* 右侧详情区 */}
        <div className="flex-1 overflow-y-auto">
          {!selectedId ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">请选择项目、网站或备忘录</p>
                <Button onClick={handleAddProject}>创建项目</Button>
              </div>
            </div>
          ) : selectedType === 'project' && selectedProject ? (
            // 项目详情
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">{selectedProject.name}</h1>
                {selectedProject.description && (
                  <p className="text-muted-foreground mt-2">{selectedProject.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="p-4">
                  <div className="text-3xl font-bold text-primary">
                    {allWebsites.get(selectedProject.id)?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">网站</div>
                </Card>
                <Card className="p-4">
                  <div className="text-3xl font-bold text-primary">
                    {allMemos.get(selectedProject.id)?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">备忘录</div>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddWebsite} className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加网站
                </Button>
                <Button onClick={handleAddMemo} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加备忘录
                </Button>
              </div>
            </div>
          ) : selectedType === 'website' && selectedWebsite ? (
            // 网站详情
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{selectedWebsite.name}</h1>
                    {selectedWebsite.description && (
                      <p className="text-muted-foreground mt-2">{selectedWebsite.description}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => window.open(selectedWebsite.url, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    打开网站
                  </Button>
                </div>
              </div>

              <Card className="p-4 mb-6">
                <div className="text-sm font-medium text-foreground mb-2">URL</div>
                <div className="text-sm text-muted-foreground break-all font-mono">
                  {selectedWebsite.url}
                </div>
              </Card>

              {selectedWebsite.tags && selectedWebsite.tags.length > 0 && (
                <Card className="p-4">
                  <div className="text-sm font-medium text-foreground mb-2">标签</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedWebsite.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex gap-2 mt-6">
                <Button onClick={() => handleEditWebsite(selectedWebsite.id)} variant="outline">
                  编辑
                </Button>
                <Button
                  onClick={() => handleDeleteWebsite(selectedWebsite.id)}
                  variant="outline"
                  className="text-destructive"
                >
                  删除
                </Button>
              </div>
            </div>
          ) : selectedType === 'memo' && selectedMemo ? (
            // 备忘录详情
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{selectedMemo.title}</h1>
                  {selectedMemo.isEncrypted && (
                    <span className="text-lg">🔒</span>
                  )}
                </div>
                {selectedMemo.category && (
                  <div className="text-sm text-muted-foreground">
                    分类: {selectedMemo.category}
                  </div>
                )}
              </div>

              <Card className="p-4 mb-6 whitespace-pre-wrap">
                <div className="text-sm text-foreground">{selectedMemo.content}</div>
              </Card>

              <div className="flex gap-2">
                <Button onClick={() => handleEditMemo(selectedMemo.id)} variant="outline">
                  编辑
                </Button>
                <Button
                  onClick={() => handleDeleteMemo(selectedMemo.id)}
                  variant="outline"
                  className="text-destructive"
                >
                  删除
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 项目对话框 */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? '编辑项目' : '新建项目'}</DialogTitle>
            <DialogDescription>
              {editingProject ? '修改项目信息' : '创建一个新项目来组织您的网站和备忘录'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">项目名称</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例如：我的开发工具"
              />
            </div>

            <div>
              <label className="text-sm font-medium">项目描述</label>
              <Input
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="项目描述（可选）"
              />
            </div>

            <div>
              <label className="text-sm font-medium">颜色标签</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  '#ef4444',
                  '#f97316',
                  '#eab308',
                  '#22c55e',
                  '#06b6d4',
                  '#3b82f6',
                  '#8b5cf6',
                  '#ec4899',
                ].map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: projectColor === color ? '#000' : 'transparent',
                    }}
                    onClick={() => setProjectColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowProjectDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSaveProject}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 网站对话框 */}
      <Dialog open={showWebsiteDialog} onOpenChange={setShowWebsiteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWebsite ? '编辑网站' : '添加网站'}</DialogTitle>
            <DialogDescription>
              {editingWebsite ? '修改网站信息' : '添加一个新的网站到项目'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">网站名称</label>
              <Input
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                placeholder="例如：GitHub"
              />
            </div>

            <div>
              <label className="text-sm font-medium">网站 URL</label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://github.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium">描述</label>
              <Input
                value={websiteDesc}
                onChange={(e) => setWebsiteDesc(e.target.value)}
                placeholder="网站描述"
              />
            </div>

            <div>
              <label className="text-sm font-medium">标签 (逗号分隔)</label>
              <Input
                value={websiteTags}
                onChange={(e) => setWebsiteTags(e.target.value)}
                placeholder="开发, 工具, 社区"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowWebsiteDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSaveWebsite}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 备忘录对话框 */}
      <Dialog open={showMemoDialog} onOpenChange={setShowMemoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMemo ? '编辑备忘录' : '添加备忘录'}</DialogTitle>
            <DialogDescription>
              {editingMemo ? '修改备忘录内容' : '添加一条新的备忘录'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">标题</label>
              <Input
                value={memoTitle}
                onChange={(e) => setMemoTitle(e.target.value)}
                placeholder="备忘录标题"
              />
            </div>

            <div>
              <label className="text-sm font-medium">内容</label>
              <Textarea
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                placeholder="备忘录内容"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium">分类</label>
              <Input
                value={memoCategory}
                onChange={(e) => setMemoCategory(e.target.value)}
                placeholder="例如：API Key, 密码, 笔记"
              />
            </div>

            {hasPassword && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="encrypt"
                  checked={memoEncrypted}
                  onChange={(e) => setMemoEncrypted(e.target.checked)}
                  disabled={!isPasswordUnlocked}
                  className="w-4 h-4"
                />
                <label htmlFor="encrypt" className="text-sm font-medium cursor-pointer">
                  🔒 加密存储
                </label>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMemoDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSaveMemo}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 密码设置对话框 */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hasPassword ? '更改密码' : '设置密码'}</DialogTitle>
            <DialogDescription>
              设置密码来加密敏感的备忘录和 API Key
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">新密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="至少 8 个字符"
              />
              <p className="text-xs text-muted-foreground mt-2">
                密码用于加密敏感信息，请妥善保管
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSetPassword}>设置密码</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 密码解锁对话框 */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>解锁密码保护的内容</DialogTitle>
            <DialogDescription>
              请输入密码来访问加密的备忘录
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">密码</label>
              <Input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="输入密码"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUnlockDialog(false)}>
                取消
              </Button>
              <Button onClick={handleUnlock}>解锁</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
