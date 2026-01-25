/**
 * 首页 - 左侧项目列表 + 右侧内容区
 * 
 * 设计理念: 现代极简主义
 * - 左侧：项目列表导航
 * - 右侧：选中项目的网站黄页和备忘录
 */

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Settings, Lock, Download, Upload, Trash2, MoreVertical, Edit2, X } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';
import WebsiteCard from '@/components/WebsiteCard';
import MemoCard from '@/components/MemoCard';
import { generateRandomColor, downloadFile, readFile } from '@/lib/utils';
import { exportAllData, importData, clearAllData } from '@/lib/storage';

export default function Home() {
  const { projects, createProject, updateProjectData, deleteProjectData, getProjectWebsites, getProjectMemos, createWebsite, updateWebsiteData, deleteWebsiteData, createMemo, updateMemoData, deleteMemoData } = useProjects();
  const { hasPassword, isPasswordUnlocked, setPassword, unlockWithPassword } = useEncryption();

  // 选中的项目
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

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

  // 初始化：选中第一个项目
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // ============ 项目操作 ============

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDesc('');
    setProjectColor(generateRandomColor());
    setShowProjectDialog(true);
  };

  const handleEditProject = (project: any) => {
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
      if (selectedProjectId === projectId) {
        setSelectedProjectId(projects.length > 1 ? projects[0].id : null);
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

  const handleEditWebsite = (website: any) => {
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

  const handleEditMemo = (memo: any) => {
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

  const websites = selectedProject ? getProjectWebsites(selectedProject.id) : [];
  const memos = selectedProject ? getProjectMemos(selectedProject.id) : [];

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
        {/* 左侧项目列表 */}
        <div className="w-64 border-r border-border bg-background overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">我的项目</h2>
          </div>

          {projects.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">还没有项目</p>
                <Button size="sm" onClick={handleAddProject}>
                  创建项目
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-md cursor-pointer transition-all duration-200 group ${
                      selectedProjectId === project.id
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : 'hover:bg-secondary/50'
                    }`}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-sm truncate ${
                          selectedProjectId === project.id
                            ? 'text-foreground'
                            : 'text-foreground/80'
                        }`}>
                          {project.name}
                        </h3>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                          <span>📌 {getProjectWebsites(project.id).length}</span>
                          <span>📝 {getProjectMemos(project.id).length}</span>
                        </div>
                      </div>

                      {selectedProjectId === project.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProject(project)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 overflow-y-auto">
          {!selectedProject ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">请选择或创建一个项目</p>
                <Button onClick={handleAddProject}>创建项目</Button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* 项目标题 */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">{selectedProject.name}</h1>
                {selectedProject.description && (
                  <p className="text-muted-foreground mt-2">{selectedProject.description}</p>
                )}
              </div>

              {/* 标签页 */}
              <Tabs defaultValue="websites" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="websites">
                    📌 网站黄页 ({websites.length})
                  </TabsTrigger>
                  <TabsTrigger value="memos">
                    📝 备忘录 ({memos.length})
                  </TabsTrigger>
                </TabsList>

                {/* 网站黄页 */}
                <TabsContent value="websites" className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <Button onClick={handleAddWebsite} className="gap-2">
                      <Plus className="w-4 h-4" />
                      添加网站
                    </Button>
                  </div>

                  {websites.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">还没有添加任何网站</p>
                      <Button onClick={handleAddWebsite}>添加第一个网站</Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {websites.map((website) => (
                        <WebsiteCard
                          key={website.id}
                          website={website}
                          onEdit={() => handleEditWebsite(website)}
                          onDelete={() => handleDeleteWebsite(website.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* 备忘录 */}
                <TabsContent value="memos" className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <Button onClick={handleAddMemo} className="gap-2">
                      <Plus className="w-4 h-4" />
                      添加备忘录
                    </Button>
                  </div>

                  {memos.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">还没有添加任何备忘录</p>
                      <Button onClick={handleAddMemo}>添加第一条备忘录</Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {memos.map((memo) => (
                        <MemoCard
                          key={memo.id}
                          memo={memo}
                          onEdit={() => handleEditMemo(memo)}
                          onDelete={() => handleDeleteMemo(memo.id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
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
              {editingWebsite ? '修改网站信息' : '添加一个新的网站到黄页'}
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
