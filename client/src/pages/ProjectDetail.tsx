/**
 * 项目详情页面
 * 
 * 显示项目的资源列表和备忘录
 * 支持添加、编辑、删除资源和备忘录
 */

import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit3, Trash2 } from 'lucide-react';
import WebsiteCard from '@/components/WebsiteCard';
import MemoCard from '@/components/MemoCard';
import { parseUrlInput, buildUrlWithProtocol } from '@/lib/utils';

export default function ProjectDetail() {
  const [, params] = useRoute('/project/:id');
  const [, navigate] = useLocation();
  const projectId = params?.id as string;

  const {
    projects,
    getProjectResources,
    getProjectMemos,
    createResource,
    updateResourceData,
    deleteResourceData,
    bulkUpdateResourcesData,
    bulkDeleteResourcesData,
    createMemo,
    updateMemoData,
    deleteMemoData,
    bulkUpdateMemosData,
    bulkDeleteMemosData,
  } = useProjects();
  const { hasPassword, isPasswordUnlocked, encrypt, decrypt } = useEncryption();

  const project = projects.find((p) => p.id === projectId);
  const resources = getProjectResources(projectId);
  const memos = getProjectMemos(projectId);

  // 对话框状态
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [editingMemo, setEditingMemo] = useState<any>(null);

  // 表单状态
  const [resourceName, setResourceName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [resourceTags, setResourceTags] = useState('');
  const [resourceProtocol, setResourceProtocol] = useState<'http' | 'https'>('https');
  const [resourceUsername, setResourceUsername] = useState('');
  const [resourcePassword, setResourcePassword] = useState('');
  const [resourceBulkMode, setResourceBulkMode] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [showBulkResourceDialog, setShowBulkResourceDialog] = useState(false);
  const [bulkResourceTags, setBulkResourceTags] = useState('');
  const [bulkResourceOwner, setBulkResourceOwner] = useState('');
  const [bulkResourceBusinessUnit, setBulkResourceBusinessUnit] = useState('');
  const [bulkResourceConfidentiality, setBulkResourceConfidentiality] = useState<'public' | 'internal' | 'confidential' | 'secret'>('internal');
  const [bulkResourceSource, setBulkResourceSource] = useState('');

  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoCategory, setMemoCategory] = useState('');
  const [memoEncrypted, setMemoEncrypted] = useState(false);
  const [memoBulkMode, setMemoBulkMode] = useState(false);
  const [selectedMemoIds, setSelectedMemoIds] = useState<string[]>([]);
  const [showBulkMemoDialog, setShowBulkMemoDialog] = useState(false);
  const [bulkMemoOwner, setBulkMemoOwner] = useState('');
  const [bulkMemoBusinessUnit, setBulkMemoBusinessUnit] = useState('');
  const [bulkMemoConfidentiality, setBulkMemoConfidentiality] = useState<'public' | 'internal' | 'confidential' | 'secret'>('internal');
  const [bulkMemoSource, setBulkMemoSource] = useState('');

  const ensurePasswordReady = (message: string) => {
    if (!hasPassword) {
      toast.error('请先设置密码');
      return false;
    }
    if (!isPasswordUnlocked) {
      toast.error(message);
      return false;
    }
    return true;
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">项目不存在</h2>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  // ============ 资源操作 ============

  const handleAddResource = () => {
    setEditingResource(null);
    setResourceName('');
    setResourceUrl('');
    setResourceProtocol('https');
    setResourceDesc('');
    setResourceTags('');
    setResourceUsername('');
    setResourcePassword('');
    setShowResourceDialog(true);
  };

  const handleEditResource = async (resource: any) => {
    setEditingResource(resource);
    setResourceName(resource.name);
    const parsedUrl = parseUrlInput(resource.url || '', 'https');
    setResourceProtocol(parsedUrl.protocol);
    setResourceUrl(parsedUrl.url);
    setResourceDesc(resource.description || '');
    setResourceTags(resource.tags?.join(', ') || '');
    setResourceUsername(resource.username || '');
    const requiresUnlock = !!resource.passwordEncrypted && (!hasPassword || !isPasswordUnlocked);
    if (requiresUnlock) {
      toast.error('请先解锁密码');
    }
    if (resource.passwordEncrypted && !requiresUnlock) {
      try {
        const decryptedPassword = await decrypt(resource.passwordEncrypted);
        setResourcePassword(decryptedPassword);
      } catch {
        toast.error('密码解密失败');
        setResourcePassword('');
      }
    } else {
      setResourcePassword(resource.password || '');
    }
    setShowResourceDialog(true);
  };

  const handleSaveResource = async () => {
    if (!resourceName.trim() || !resourceUrl.trim()) {
      toast.error('请填写资源名称和 URL');
      return;
    }

    if (editingResource?.passwordEncrypted && !isPasswordUnlocked) {
      toast.error('请先解锁密码再编辑');
      return;
    }

    const tags = resourceTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    const normalizedResourceUrl = buildUrlWithProtocol(resourceProtocol, resourceUrl);

    const additional: any = {
      username: resourceUsername || undefined,
      isEncrypted: false,
    };
    if (resourcePassword.trim()) {
      if (!ensurePasswordReady('请先解锁密码')) {
        return;
      }
      additional.passwordEncrypted = await encrypt(resourcePassword);
      additional.password = undefined;
      additional.isEncrypted = true;
    } else {
      additional.passwordEncrypted = undefined;
      additional.password = undefined;
    }

    if (editingResource) {
      updateResourceData(editingResource.id, {
        name: resourceName,
        url: normalizedResourceUrl,
        description: resourceDesc,
        tags,
        ...additional,
      });
      toast.success('资源已更新');
    } else {
      createResource(projectId, resourceName, normalizedResourceUrl, resourceDesc, undefined, tags, 'website', additional);
      toast.success('资源已添加');
    }

    setShowResourceDialog(false);
  };

  const handleDeleteResource = (resourceId: string) => {
    if (confirm('确定要删除这个资源吗？')) {
      deleteResourceData(resourceId);
      toast.success('资源已删除');
    }
  };

  const toggleResourceSelection = (resourceId: string, checked: boolean) => {
    setSelectedResourceIds((prev) =>
      checked ? [...prev, resourceId] : prev.filter((id) => id !== resourceId)
    );
  };

  const handleBulkUpdateResources = async () => {
    if (!selectedResourceIds.length) {
      toast.error('请先选择资源');
      return;
    }
    const updates: any = {};
    const tags = bulkResourceTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length) {
      updates.tags = tags;
    }
    updates.metadata = {
      owner: bulkResourceOwner || undefined,
      businessUnit: bulkResourceBusinessUnit || undefined,
      confidentiality: bulkResourceConfidentiality || 'internal',
      source: bulkResourceSource || undefined,
    };

    await bulkUpdateResourcesData(selectedResourceIds, updates);
    toast.success('资源已批量更新');
    setShowBulkResourceDialog(false);
    setSelectedResourceIds([]);
    setResourceBulkMode(false);
  };

  const handleBulkDeleteResources = async () => {
    if (!selectedResourceIds.length) {
      toast.error('请先选择资源');
      return;
    }
    if (!confirm('确定要删除选中的资源吗？')) {
      return;
    }
    await bulkDeleteResourcesData(selectedResourceIds);
    toast.success('资源已批量删除');
    setSelectedResourceIds([]);
    setResourceBulkMode(false);
  };

  // ============ 备忘录操作 ============

  const handleAddMemo = () => {
    setEditingMemo(null);
    setMemoTitle('');
    setMemoContent('');
    setMemoCategory('');
    setMemoEncrypted(false);
    setShowMemoDialog(true);
  };

  const handleEditMemo = async (memo: any) => {
    setEditingMemo(memo);
    setMemoTitle(memo.title);
    if (memo.isEncrypted && memo.encryptedData) {
      if (!hasPassword || !isPasswordUnlocked) {
        toast.error('请先解锁密码');
        setMemoContent('');
      } else {
        try {
          const decryptedContent = await decrypt(memo.encryptedData);
          setMemoContent(decryptedContent);
        } catch {
          toast.error('备忘录解密失败');
          setMemoContent('');
        }
      }
    } else {
      setMemoContent(memo.content);
    }
    setMemoCategory(memo.category || '');
    setMemoEncrypted(memo.isEncrypted);
    setShowMemoDialog(true);
  };

  const handleSaveMemo = async () => {
    if (!memoTitle.trim()) {
      toast.error('请填写备忘录标题');
      return;
    }

    if (memoEncrypted && !isPasswordUnlocked) {
      toast.error('请先设置或解锁密码');
      return;
    }

    if (editingMemo) {
      const updates: any = {
        title: memoTitle,
        category: memoCategory,
        isEncrypted: memoEncrypted,
      };
      if (memoEncrypted) {
        if (!ensurePasswordReady('请先解锁密码')) {
          return;
        }
        updates.encryptedData = await encrypt(memoContent);
        updates.content = '';
      } else {
        updates.encryptedData = undefined;
        updates.content = memoContent;
      }
      updateMemoData(editingMemo.id, updates);
      toast.success('备忘录已更新');
    } else {
      if (memoEncrypted) {
        if (!ensurePasswordReady('请先解锁密码')) {
          return;
        }
        const created = createMemo(projectId, memoTitle, '', memoCategory, true);
        updateMemoData(created.id, {
          encryptedData: await encrypt(memoContent),
          content: '',
          isEncrypted: true,
        });
      } else {
        createMemo(projectId, memoTitle, memoContent, memoCategory, false);
      }
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

  const toggleMemoSelection = (memoId: string, checked: boolean) => {
    setSelectedMemoIds((prev) =>
      checked ? [...prev, memoId] : prev.filter((id) => id !== memoId)
    );
  };

  const handleBulkUpdateMemos = async () => {
    if (!selectedMemoIds.length) {
      toast.error('请先选择备忘录');
      return;
    }
    await bulkUpdateMemosData(selectedMemoIds, {
      metadata: {
        owner: bulkMemoOwner || undefined,
        businessUnit: bulkMemoBusinessUnit || undefined,
        confidentiality: bulkMemoConfidentiality || 'internal',
        source: bulkMemoSource || undefined,
      },
    });
    toast.success('备忘录已批量更新');
    setShowBulkMemoDialog(false);
    setSelectedMemoIds([]);
    setMemoBulkMode(false);
  };

  const handleBulkDeleteMemos = async () => {
    if (!selectedMemoIds.length) {
      toast.error('请先选择备忘录');
      return;
    }
    if (!confirm('确定要删除选中的备忘录吗？')) {
      return;
    }
    await bulkDeleteMemosData(selectedMemoIds);
    toast.success('备忘录已批量删除');
    setSelectedMemoIds([]);
    setMemoBulkMode(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                {project.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container py-8">
        <Tabs defaultValue="resources" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="resources">
              资源列表 ({resources.length})
            </TabsTrigger>
            <TabsTrigger value="memos">
              备忘录 ({memos.length})
            </TabsTrigger>
          </TabsList>

          {/* 资源列表标签页 */}
          <TabsContent value="resources" className="space-y-4">
            <div className="flex justify-end gap-2 mb-4">
              {resourceBulkMode && (
                <>
                  <Button variant="outline" onClick={() => setShowBulkResourceDialog(true)} className="gap-2">
                    <Edit3 className="w-4 h-4" />
                    批量编辑
                  </Button>
                  <Button variant="destructive" onClick={handleBulkDeleteResources} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    批量删除
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setResourceBulkMode((prev) => {
                    const next = !prev;
                    if (!next) setSelectedResourceIds([]);
                    return next;
                  });
                }}
                className="gap-2"
              >
                {resourceBulkMode ? '完成' : '批量操作'}
              </Button>
              <Button onClick={handleAddResource} className="gap-2">
                <Plus className="w-4 h-4" />
                添加资源
              </Button>
            </div>

            {resources.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">还没有添加任何资源</p>
                <Button onClick={handleAddResource}>添加第一个资源</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resources.map((resource) => (
                  <WebsiteCard
                    key={resource.id}
                    website={resource}
                    onEdit={() => handleEditResource(resource)}
                    onDelete={() => handleDeleteResource(resource.id)}
                    selected={resourceBulkMode ? selectedResourceIds.includes(resource.id) : undefined}
                    onSelect={resourceBulkMode ? (checked) => toggleResourceSelection(resource.id, checked) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* 备忘录标签页 */}
          <TabsContent value="memos" className="space-y-4">
            <div className="flex justify-end gap-2 mb-4">
              {memoBulkMode && (
                <>
                  <Button variant="outline" onClick={() => setShowBulkMemoDialog(true)} className="gap-2">
                    <Edit3 className="w-4 h-4" />
                    批量编辑
                  </Button>
                  <Button variant="destructive" onClick={handleBulkDeleteMemos} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    批量删除
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setMemoBulkMode((prev) => {
                    const next = !prev;
                    if (!next) setSelectedMemoIds([]);
                    return next;
                  });
                }}
                className="gap-2"
              >
                {memoBulkMode ? '完成' : '批量操作'}
              </Button>
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
                    selected={memoBulkMode ? selectedMemoIds.includes(memo.id) : undefined}
                    onSelect={memoBulkMode ? (checked) => toggleMemoSelection(memo.id, checked) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 资源对话框 */}
      <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource ? '编辑资源' : '添加资源'}</DialogTitle>
            <DialogDescription>
              {editingResource ? '修改资源信息' : '添加一个新资源'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">资源名称</label>
              <Input
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="例如：GitHub"
              />
            </div>

            <div>
              <label className="text-sm font-medium">资源 URL</label>
              <div className="border rounded-md overflow-hidden">
                <div className="flex">
                  <Select value={resourceProtocol} onValueChange={(val) => setResourceProtocol(val as 'http' | 'https')}>
                    <SelectTrigger className="rounded-none border-0 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">http://</SelectItem>
                      <SelectItem value="https">https://</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={resourceUrl}
                    onChange={(e) => {
                      const { protocol, url } = parseUrlInput(e.target.value, resourceProtocol);
                      setResourceProtocol(protocol);
                      setResourceUrl(url);
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      const { protocol, url } = parseUrlInput(pasted, resourceProtocol);
                      setResourceProtocol(protocol);
                      setResourceUrl(url);
                      e.preventDefault();
                    }}
                    placeholder="github.com"
                    className="rounded-none border-0 flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">账号（可选）</label>
              <Input
                value={resourceUsername}
                onChange={(e) => setResourceUsername(e.target.value)}
                placeholder="输入账号/用户名"
              />
            </div>

            <div>
              <label className="text-sm font-medium">密码（可选）</label>
              <Input
                type="password"
                value={resourcePassword}
                onChange={(e) => setResourcePassword(e.target.value)}
                placeholder="输入密码"
              />
            </div>

            <div>
              <label className="text-sm font-medium">描述</label>
              <Input
                value={resourceDesc}
                onChange={(e) => setResourceDesc(e.target.value)}
                placeholder="资源描述"
              />
            </div>

            <div>
              <label className="text-sm font-medium">标签 (逗号分隔)</label>
              <Input
                value={resourceTags}
                onChange={(e) => setResourceTags(e.target.value)}
                placeholder="开发, 工具, 社区"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowResourceDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSaveResource}>保存</Button>
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
                  加密存储
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

      <Dialog open={showBulkResourceDialog} onOpenChange={setShowBulkResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量编辑资源</DialogTitle>
            <DialogDescription>对选中资源统一更新元数据与标签</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">标签 (逗号分隔)</label>
              <Input
                value={bulkResourceTags}
                onChange={(e) => setBulkResourceTags(e.target.value)}
                placeholder="开发, 工具, 社区"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">负责人</label>
                <Input
                  value={bulkResourceOwner}
                  onChange={(e) => setBulkResourceOwner(e.target.value)}
                  placeholder="负责人/Owner"
                />
              </div>
              <div>
                <label className="text-sm font-medium">业务线</label>
                <Input
                  value={bulkResourceBusinessUnit}
                  onChange={(e) => setBulkResourceBusinessUnit(e.target.value)}
                  placeholder="业务线/部门"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">密级</label>
                <Select value={bulkResourceConfidentiality} onValueChange={(val) => setBulkResourceConfidentiality(val as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="secret">Secret</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">来源</label>
                <Input
                  value={bulkResourceSource}
                  onChange={(e) => setBulkResourceSource(e.target.value)}
                  placeholder="来源系统/负责人"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBulkResourceDialog(false)}>
                取消
              </Button>
              <Button onClick={handleBulkUpdateResources}>应用</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkMemoDialog} onOpenChange={setShowBulkMemoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量编辑备忘录</DialogTitle>
            <DialogDescription>对选中备忘录统一更新元数据</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">负责人</label>
                <Input
                  value={bulkMemoOwner}
                  onChange={(e) => setBulkMemoOwner(e.target.value)}
                  placeholder="负责人/Owner"
                />
              </div>
              <div>
                <label className="text-sm font-medium">业务线</label>
                <Input
                  value={bulkMemoBusinessUnit}
                  onChange={(e) => setBulkMemoBusinessUnit(e.target.value)}
                  placeholder="业务线/部门"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">密级</label>
                <Select value={bulkMemoConfidentiality} onValueChange={(val) => setBulkMemoConfidentiality(val as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="secret">Secret</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">来源</label>
                <Input
                  value={bulkMemoSource}
                  onChange={(e) => setBulkMemoSource(e.target.value)}
                  placeholder="来源系统/负责人"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowBulkMemoDialog(false)}>
                取消
              </Button>
              <Button onClick={handleBulkUpdateMemos}>应用</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
