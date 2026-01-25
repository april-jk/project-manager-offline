/**
 * 项目详情页面
 * 
 * 显示项目的网站黄页和备忘录
 * 支持添加、编辑、删除网站和备忘录
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';
import WebsiteCard from '@/components/WebsiteCard';
import MemoCard from '@/components/MemoCard';
import { nanoid } from 'nanoid';

export default function ProjectDetail() {
  const [, params] = useRoute('/project/:id');
  const [, navigate] = useLocation();
  const projectId = params?.id as string;

  const { projects, getProjectWebsites, getProjectMemos, createWebsite, updateWebsiteData, deleteWebsiteData, createMemo, updateMemoData, deleteMemoData } = useProjects();
  const { hasPassword, isPasswordUnlocked } = useEncryption();

  const project = projects.find((p) => p.id === projectId);
  const websites = getProjectWebsites(projectId);
  const memos = getProjectMemos(projectId);

  // 对话框状态
  const [showWebsiteDialog, setShowWebsiteDialog] = useState(false);
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<any>(null);
  const [editingMemo, setEditingMemo] = useState<any>(null);

  // 表单状态
  const [websiteName, setWebsiteName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteDesc, setWebsiteDesc] = useState('');
  const [websiteTags, setWebsiteTags] = useState('');

  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoCategory, setMemoCategory] = useState('');
  const [memoEncrypted, setMemoEncrypted] = useState(false);

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

  // ============ 网站操作 ============

  const handleAddWebsite = () => {
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
      createWebsite(projectId, websiteName, websiteUrl, websiteDesc, undefined, tags);
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
      createMemo(projectId, memoTitle, memoContent, memoCategory, memoEncrypted);
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
        <Tabs defaultValue="websites" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="websites">
              📌 网站黄页 ({websites.length})
            </TabsTrigger>
            <TabsTrigger value="memos">
              📝 备忘录 ({memos.length})
            </TabsTrigger>
          </TabsList>

          {/* 网站黄页标签页 */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* 备忘录标签页 */}
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
    </div>
  );
}
