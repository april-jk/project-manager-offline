/**
 * 首页 - 高密度网格展示
 * 
 * 设计理念: 极简紧凑
 * - 项目卡片布局
 * - 高密度网格展示网站、账号密码、API
 * - 简洁的交互和操作
 */

import { useState, useMemo } from 'react';
import { useProjects } from '@/contexts/ProjectContext';
import { useEncryption } from '@/contexts/EncryptionContext';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Lock, Download, Upload, Trash2, MoreVertical, ExternalLink, X, Settings, Key, Lock as LockIcon } from 'lucide-react';
import { generateRandomColor, downloadFile, readFile } from '@/lib/utils';
import { exportAllData, importData, clearAllData } from '@/lib/storage';

export default function Home() {
  const { projects, createProject, updateProjectData, deleteProjectData, getProjectWebsites, getProjectMemos, createWebsite, updateWebsiteData, deleteWebsiteData, createMemo, updateMemoData, deleteMemoData } = useProjects();
  const { hasPassword, isPasswordUnlocked, setPassword, unlockWithPassword } = useEncryption();

  // 对话框状态
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(hasPassword && !isPasswordUnlocked);
  const [showResourceTypeDialog, setShowResourceTypeDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [editingMemo, setEditingMemo] = useState<any>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<'website' | 'credential' | 'api'>('website');

  // 表单状态
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [password, setPasswordInput] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');

  // 资源表单状态
  const [resourceName, setResourceName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [resourceTags, setResourceTags] = useState('');
  const [username, setUsername] = useState('');
  const [passwordField, setPasswordField] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');

  // 备忘录表单状态
  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoCategory, setMemoCategory] = useState('');
  const [memoEncrypted, setMemoEncrypted] = useState(false);

  // 获取所有网站和备忘录
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
    if (confirm('确定要删除这个项目吗？这将删除该项目下的所有资源和备忘录。')) {
      deleteProjectData(projectId);
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }
      toast.success('项目已删除');
    }
  };

  // ============ 资源操作 ============

  const handleAddResource = (projectId: string) => {
    setActiveProjectId(projectId);
    setShowResourceTypeDialog(true);
  };

  const handleSelectResourceType = (type: 'website' | 'credential' | 'api') => {
    setSelectedResourceType(type);
    setEditingResource(null);
    setResourceName('');
    setResourceUrl('');
    setResourceDesc('');
    setResourceTags('');
    setUsername('');
    setPasswordField('');
    setApiKey('');
    setApiSecret('');
    setApiEndpoint('');
    setShowResourceTypeDialog(false);
    setShowResourceDialog(true);
  };

  const handleEditResource = (resource: any, projectId: string) => {
    setActiveProjectId(projectId);
    setEditingResource(resource);
    setSelectedResourceType(resource.type || 'website');
    setResourceName(resource.name);
    setResourceUrl(resource.url || '');
    setResourceDesc(resource.description || '');
    setResourceTags(resource.tags?.join(', ') || '');
    setUsername(resource.username || '');
    setPasswordField(resource.password || '');
    setApiKey(resource.apiKey || '');
    setApiSecret(resource.apiSecret || '');
    setApiEndpoint(resource.apiEndpoint || '');
    setShowResourceDialog(true);
  };

  const handleSaveResource = () => {
    if (!activeProjectId) return;
    if (!resourceName.trim()) {
      toast.error('请填写资源名称');
      return;
    }

    if (selectedResourceType === 'website' && !resourceUrl.trim()) {
      toast.error('请填写网站 URL');
      return;
    }

    if (selectedResourceType === 'credential' && !username.trim()) {
      toast.error('请填写用户名');
      return;
    }

    if (selectedResourceType === 'api' && !apiKey.trim()) {
      toast.error('请填写 API Key');
      return;
    }

    const tags = resourceTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    const resourceData: any = {
      name: resourceName,
      description: resourceDesc,
      tags,
      type: selectedResourceType,
      isEncrypted: false,
    };

    if (selectedResourceType === 'website') {
      resourceData.url = resourceUrl;
    } else if (selectedResourceType === 'credential') {
      resourceData.username = username;
      resourceData.password = passwordField;
      resourceData.isEncrypted = true;
    } else if (selectedResourceType === 'api') {
      resourceData.apiKey = apiKey;
      resourceData.apiSecret = apiSecret;
      resourceData.apiEndpoint = apiEndpoint;
      resourceData.isEncrypted = true;
    }

    if (editingResource) {
      updateWebsiteData(editingResource.id, resourceData);
      toast.success('资源已更新');
    } else {
      createWebsite(activeProjectId, resourceName, resourceUrl, resourceDesc, undefined, tags, selectedResourceType as 'website' | 'credential' | 'api', resourceData);
      toast.success('资源已添加');
    }

    setShowResourceDialog(false);
  };

  const handleDeleteResource = (resourceId: string) => {
    if (confirm('确定要删除这个资源吗？')) {
      deleteWebsiteData(resourceId);
      toast.success('资源已删除');
    }
  };

  // ============ 备忘录操作 ============

  const handleAddMemo = (projectId: string) => {
    setActiveProjectId(projectId);
    setEditingMemo(null);
    setMemoTitle('');
    setMemoContent('');
    setMemoCategory('');
    setMemoEncrypted(false);
    setShowMemoDialog(true);
  };

  const handleEditMemo = (memo: any, projectId: string) => {
    setActiveProjectId(projectId);
    setEditingMemo(memo);
    setMemoTitle(memo.title);
    setMemoContent(memo.content);
    setMemoCategory(memo.category || '');
    setMemoEncrypted(memo.isEncrypted);
    setShowMemoDialog(true);
  };

  const handleSaveMemo = () => {
    if (!activeProjectId) return;
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
      createMemo(activeProjectId, memoTitle, memoContent, memoCategory, memoEncrypted);
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

  // ============ 辅助函数 ============

  const getResourceIcon = (resource: any) => {
    if (resource.type === 'credential') {
      return '🔐';
    } else if (resource.type === 'api') {
      return '🔑';
    }
    return '🌐';
  };

  const getResourceColor = (resource: any) => {
    if (resource.type === 'credential') {
      return 'group-hover/item:border-amber-200 group-hover/item:bg-amber-50 group-hover/item:text-amber-600';
    } else if (resource.type === 'api') {
      return 'group-hover/item:border-purple-200 group-hover/item:bg-purple-50 group-hover/item:text-purple-600';
    }
    return 'group-hover/item:border-blue-200 group-hover/item:bg-blue-50 group-hover/item:text-blue-600';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1 rounded-lg">
              <Settings size={16} className="text-white" />
            </div>
            <h1 className="text-base font-bold tracking-tight">Project Hub</h1>
          </div>

          <div className="flex items-center gap-1">
            {hasPassword && !isPasswordUnlocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnlockDialog(true)}
                className="gap-1 text-xs h-7"
              >
                <Lock className="w-3 h-3" />
                解锁
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
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

            <Button onClick={handleAddProject} size="sm" className="gap-1 text-xs h-7">
              <Plus size={14} />
              新项目
            </Button>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        {projects.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-slate-500 mb-4">还没有项目</p>
              <Button onClick={handleAddProject}>创建第一个项目</Button>
            </div>
          </div>
        ) : (
          projects.map((project) => {
            const websites = allWebsites.get(project.id) || [];
            const memos = allMemos.get(project.id) || [];
            const itemCount = websites.length + memos.length;

            return (
              <div key={project.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                {/* 项目头部 */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3.5 bg-blue-500 rounded-full"></div>
                    <h2 className="text-sm font-bold text-slate-700">{project.name}</h2>
                    <span className="text-xs text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded uppercase">
                      {itemCount} Items
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddResource(project.id)}
                      className="h-5 w-5 p-0 text-slate-400 hover:text-blue-600"
                      title="添加资源"
                    >
                      <Plus size={14} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-slate-300 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProject(project)}>
                          编辑项目
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddMemo(project.id)}>
                          添加备忘录
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-destructive"
                        >
                          删除项目
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* 高密度网格 */}
                <div className="p-3 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-x-2 gap-y-4">
                  {/* 资源卡片 */}
                  {websites.map((resource) => (
                    <div key={resource.id} className="group relative flex flex-col items-center">
                      {resource.type === 'website' ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center w-full group/item"
                        >
                          <div className={`w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-transparent ${getResourceColor(resource)} transition-all mb-1.5 relative`}>
                            <span className="text-lg">{getResourceIcon(resource)}</span>
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover/item:opacity-100 bg-blue-600 text-white p-0.5 rounded-full shadow-sm transition-opacity">
                              <ExternalLink size={8} />
                            </div>
                          </div>
                          <span className="text-xs font-medium text-slate-600 text-center truncate w-full px-1 group-hover/item:text-blue-600">
                            {resource.name}
                          </span>
                        </a>
                      ) : (
                        <button
                          onClick={() => handleEditResource(resource, project.id)}
                          className="flex flex-col items-center w-full group/item"
                        >
                          <div className={`w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-transparent ${getResourceColor(resource)} transition-all mb-1.5 relative`}>
                            <span className="text-lg">{getResourceIcon(resource)}</span>
                          </div>
                          <span className="text-xs font-medium text-slate-600 text-center truncate w-full px-1 group-hover/item:text-slate-800">
                            {resource.name}
                          </span>
                        </button>
                      )}

                      {/* 删除按钮 */}
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="absolute -top-1 -left-1 hidden group-hover:flex bg-white shadow-md border border-slate-100 rounded-full text-red-400 hover:text-red-600 p-0.5 z-10"
                      >
                        <X size={10} />
                      </button>

                      {/* 编辑按钮 */}
                      <button
                        onClick={() => handleEditResource(resource, project.id)}
                        className="absolute -top-1 -right-1 hidden group-hover:flex bg-white shadow-md border border-slate-100 rounded-full text-slate-400 hover:text-slate-600 p-0.5 z-10"
                      >
                        <Settings size={10} />
                      </button>
                    </div>
                  ))}

                  {/* 备忘录卡片 */}
                  {memos.map((memo) => (
                    <div key={memo.id} className="group relative flex flex-col items-center">
                      <button
                        onClick={() => handleEditMemo(memo, project.id)}
                        className="flex flex-col items-center w-full group/item"
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-transparent group-hover/item:border-amber-200 group-hover/item:bg-amber-50 group-hover/item:text-amber-600 transition-all mb-1.5 relative">
                          <span className="text-lg">{memo.isEncrypted ? '🔒' : '📝'}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 text-center truncate w-full px-1 group-hover/item:text-amber-600">
                          {memo.title}
                        </span>
                      </button>

                      {/* 删除按钮 */}
                      <button
                        onClick={() => handleDeleteMemo(memo.id)}
                        className="absolute -top-1 -left-1 hidden group-hover:flex bg-white shadow-md border border-slate-100 rounded-full text-red-400 hover:text-red-600 p-0.5 z-10"
                      >
                        <X size={10} />
                      </button>

                      {/* 编辑按钮 */}
                      <button
                        onClick={() => handleEditMemo(memo, project.id)}
                        className="absolute -top-1 -right-1 hidden group-hover:flex bg-white shadow-md border border-slate-100 rounded-full text-slate-400 hover:text-amber-600 p-0.5 z-10"
                      >
                        <Settings size={10} />
                      </button>
                    </div>
                  ))}

                  {/* 添加按钮占位符 */}
                  <button
                    onClick={() => handleAddResource(project.id)}
                    className="flex flex-col items-center group/add"
                  >
                    <div className="w-10 h-10 flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-300 group-hover/add:border-blue-300 group-hover/add:bg-blue-50 group-hover/add:text-blue-400 transition-all mb-1.5">
                      <Plus size={18} />
                    </div>
                    <span className="text-xs text-slate-300 group-hover/add:text-blue-400">Add</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* 项目对话框 */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? '编辑项目' : '新建项目'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">项目名称</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例如：出海业务 A"
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

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowProjectDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSaveProject}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 资源类型选择对话框 */}
      <Dialog open={showResourceTypeDialog} onOpenChange={setShowResourceTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择资源类型</DialogTitle>
            <DialogDescription>选择您要添加的资源类型</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <button
              onClick={() => handleSelectResourceType('website')}
              className="w-full p-4 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
            >
              <div className="text-2xl mb-2">🌐</div>
              <div className="font-medium text-sm">网站</div>
              <div className="text-xs text-slate-500">添加网站链接</div>
            </button>

            <button
              onClick={() => handleSelectResourceType('credential')}
              className="w-full p-4 border border-slate-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-all text-left"
            >
              <div className="text-2xl mb-2">🔐</div>
              <div className="font-medium text-sm">账号密码</div>
              <div className="text-xs text-slate-500">保存账户凭证（加密）</div>
            </button>

            <button
              onClick={() => handleSelectResourceType('api')}
              className="w-full p-4 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all text-left"
            >
              <div className="text-2xl mb-2">🔑</div>
              <div className="font-medium text-sm">API</div>
              <div className="text-xs text-slate-500">保存 API 密钥（加密）</div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 资源对话框 */}
      <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? '编辑资源' : '添加资源'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                资源名称
              </label>
              <Input
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="例如：GitHub"
                className="bg-slate-50 border-slate-200"
              />
            </div>

            {selectedResourceType === 'website' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    网站 URL
                  </label>
                  <Input
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://github.com"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    描述
                  </label>
                  <Input
                    value={resourceDesc}
                    onChange={(e) => setResourceDesc(e.target.value)}
                    placeholder="网站描述"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    标签
                  </label>
                  <Input
                    value={resourceTags}
                    onChange={(e) => setResourceTags(e.target.value)}
                    placeholder="开发, 工具, 社区"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </>
            )}

            {selectedResourceType === 'credential' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    用户名
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="用户名或邮箱"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    密码
                  </label>
                  <Input
                    type="password"
                    value={passwordField}
                    onChange={(e) => setPasswordField(e.target.value)}
                    placeholder="输入密码"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    描述
                  </label>
                  <Input
                    value={resourceDesc}
                    onChange={(e) => setResourceDesc(e.target.value)}
                    placeholder="账户描述（可选）"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </>
            )}

            {selectedResourceType === 'api' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    API Key
                  </label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="输入 API Key"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    API Secret（可选）
                  </label>
                  <Input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="输入 API Secret"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    API 端点（可选）
                  </label>
                  <Input
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder="https://api.example.com"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    描述
                  </label>
                  <Input
                    value={resourceDesc}
                    onChange={(e) => setResourceDesc(e.target.value)}
                    placeholder="API 描述（可选）"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowResourceDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSaveResource}>确认</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 备忘录对话框 */}
      <Dialog open={showMemoDialog} onOpenChange={setShowMemoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMemo ? '编辑备忘录' : '添加备忘录'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                标题
              </label>
              <Input
                value={memoTitle}
                onChange={(e) => setMemoTitle(e.target.value)}
                placeholder="备忘录标题"
                className="bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                内容
              </label>
              <Textarea
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
                placeholder="备忘录内容"
                rows={4}
                className="bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                分类
              </label>
              <Input
                value={memoCategory}
                onChange={(e) => setMemoCategory(e.target.value)}
                placeholder="例如：API Key, 密码, 笔记"
                className="bg-slate-50 border-slate-200"
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
              <Button onClick={handleSaveMemo}>确认</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 密码设置对话框 */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hasPassword ? '更改密码' : '设置密码'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                新密码
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="至少 8 个字符"
                className="bg-slate-50 border-slate-200"
              />
              <p className="text-xs text-slate-400 mt-2">
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
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                密码
              </label>
              <Input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="输入密码"
                className="bg-slate-50 border-slate-200"
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
