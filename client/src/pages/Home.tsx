/**
 * 首页 - 项目列表
 * 
 * 显示所有项目，支持创建、编辑、删除项目
 * 支持密码设置和应用设置
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useProjects } from '@/contexts/ProjectContext';
import { useEncryption } from '@/contexts/EncryptionContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Plus, Settings, Lock, Download, Upload, Trash2, MoreVertical } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';
import { generateRandomColor, downloadFile, readFile } from '@/lib/utils';
import { exportAllData, importData, clearAllData } from '@/lib/storage';
import { nanoid } from 'nanoid';

export default function Home() {
  const [, navigate] = useLocation();
  const { projects, createProject, updateProjectData, deleteProjectData, getProjectWebsites, getProjectMemos } = useProjects();
  const { hasPassword, isPasswordUnlocked, setPassword, unlockWithPassword } = useEncryption();

  // 对话框状态
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(hasPassword && !isPasswordUnlocked);
  const [editingProject, setEditingProject] = useState<any>(null);

  // 表单状态
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [password, setPasswordInput] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');

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
      toast.success('项目已删除');
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

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Project Hub</h1>
              <p className="text-sm text-muted-foreground mt-1">
                离线项目管理工具 · 完全本地存储
              </p>
            </div>

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
                新建项目
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container py-8">
        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mb-4">
              <div className="text-5xl mb-4">📦</div>
              <h2 className="text-2xl font-semibold mb-2">还没有项目</h2>
              <p className="text-muted-foreground mb-6">
                创建您的第一个项目，开始管理网站和备忘录
              </p>
            </div>
            <Button onClick={handleAddProject} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              创建第一个项目
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const projectWebsites = getProjectWebsites(project.id);
              const projectMemos = getProjectMemos(project.id);
              const websiteCount = projectWebsites.length;
              const memoCount = projectMemos.length;

              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  websiteCount={websiteCount}
                  memoCount={memoCount}
                  onSelect={() => navigate(`/project/${project.id}`)}
                  onEdit={() => handleEditProject(project)}
                  onDelete={() => handleDeleteProject(project.id)}
                />
              );
            })}
          </div>
        )}
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
