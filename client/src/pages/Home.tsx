/**
 * 首页 - 高密度网格展示
 * 
 * 设计理念: 极简紧凑
 * - 项目卡片布局
 * - 高密度网格展示网站、账号密码、API
 * - 简洁的交互和操作
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  DropdownMenuSeparator,
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
import {
  Plus,
  Download,
  Upload,
  Trash2,
  MoreVertical,
  ExternalLink,
  Settings,
  Key,
  Eye,
  EyeOff,
  Copy,
  Command,
  Search,
  ShieldCheck,
  Lock,
  Unlock,
  DatabaseBackup,
  Globe,
  Link2,
  Code2,
  Activity,
  FileText,
} from 'lucide-react';
import { generateRandomColor, downloadFile, readFile, parseUrlInput, buildUrlWithProtocol, copyToClipboard, getFaviconUrl, fetchImageAsDataUrl } from '@/lib/utils';
import {
  exportAllData,
  importData,
  clearAllData,
  createBackup,
  pruneBackups,
  getStorageStats,
  getSettings,
  updateSettings,
} from '@/lib/storage';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import WidgetGrid from '@/components/WidgetGrid';
import WebviewWidget from '@/components/WebviewWidget';
import { Layouts } from 'react-grid-layout';
import axios from 'axios';

export default function Home() {
  const {
    projects,
    resources,
    memos,
    dataSources,
    widgets,
    createProject,
    updateProjectData,
    deleteProjectData,
    getProjectResources,
    getProjectMemos,
    getProjectDataSources,
    getProjectWidgets,
    createResource,
    updateResourceData,
    deleteResourceData,
    createMemo,
    updateMemoData,
    deleteMemoData,
    createDataSource,
    updateDataSourceData,
    deleteDataSourceData,
    createWidget,
    updateWidgetData,
    deleteWidgetData,
  } = useProjects();
  const {
    hasPassword,
    isPasswordUnlocked,
    autoLockMinutes,
    setPassword,
    unlockWithPassword,
    encrypt,
    decrypt,
    updateAutoLockMinutes,
    lockPassword,
  } = useEncryption();

  // 对话框状态
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(hasPassword && !isPasswordUnlocked);
  const [showResourceTypeDialog, setShowResourceTypeDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showResourcePreview, setShowResourcePreview] = useState(false);
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const [previewingResource, setPreviewingResource] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [editingMemo, setEditingMemo] = useState<any>(null);
  const [editingDataSource, setEditingDataSource] = useState<any>(null);
  const [editingWidget, setEditingWidget] = useState<any>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<'website' | 'api' | 'monitor' | 'credential' | 'document'>('website');
  const [searchQuery, setSearchQuery] = useState('');
  const [storageStats, setStorageStats] = useState<{ projectsCount: number; resourcesCount: number; memosCount: number; dataSourcesCount: number; widgetsCount: number; estimatedSize: string } | null>(null);

  // 表单状态
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [projectOwner, setProjectOwner] = useState('');
  const [projectBusinessUnit, setProjectBusinessUnit] = useState('');
  const [projectConfidentiality, setProjectConfidentiality] = useState<'public' | 'internal' | 'confidential' | 'secret'>('internal');
  const [projectSource, setProjectSource] = useState('');
  const [password, setPasswordInput] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');

  // 资源表单状态
  const [resourceName, setResourceName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [urlProtocol, setUrlProtocol] = useState<'http' | 'https'>('https');
  const [resourceDesc, setResourceDesc] = useState('');
  const [resourceTags, setResourceTags] = useState('');
  const [resourceOwner, setResourceOwner] = useState('');
  const [resourceBusinessUnit, setResourceBusinessUnit] = useState('');
  const [resourceConfidentiality, setResourceConfidentiality] = useState<'public' | 'internal' | 'confidential' | 'secret'>('internal');
  const [resourceSource, setResourceSource] = useState('');
  const [resourceIconUrl, setResourceIconUrl] = useState('');
  const [resourceIconMode, setResourceIconMode] = useState<'auto' | 'builtin' | 'custom'>('auto');
  const [resourceIconName, setResourceIconName] = useState<'globe' | 'link' | 'key' | 'code' | 'activity' | 'file'>('globe');
  const [username, setUsername] = useState('');
  const [passwordField, setPasswordField] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [monitorUrl, setMonitorUrl] = useState('');
  const [monitorProtocol, setMonitorProtocol] = useState<'http' | 'https'>('https');
  const [monitorIntervalMinutes, setMonitorIntervalMinutes] = useState('5');

  // 备忘录表单状态
  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoCategory, setMemoCategory] = useState('');
  const [memoEncrypted, setMemoEncrypted] = useState(false);
  const [memoOwner, setMemoOwner] = useState('');
  const [memoBusinessUnit, setMemoBusinessUnit] = useState('');
  const [memoConfidentiality, setMemoConfidentiality] = useState<'public' | 'internal' | 'confidential' | 'secret'>('internal');
  const [memoSource, setMemoSource] = useState('');
  const encryptionMigrationDoneRef = useRef(false);

  // 数据源表单状态
  const [dataSourceName, setDataSourceName] = useState('');
  const [dataSourceUrl, setDataSourceUrl] = useState('');
  const [dataSourceHeaders, setDataSourceHeaders] = useState('');
  const [dataSourceQuery, setDataSourceQuery] = useState('');
  const [dataSourceAuthType, setDataSourceAuthType] = useState<'none' | 'bearer'>('none');
  const [dataSourceToken, setDataSourceToken] = useState('');
  const [dataSourceTtl, setDataSourceTtl] = useState('300');

  // 组件表单状态
  const [widgetName, setWidgetName] = useState('');
  const [widgetType, setWidgetType] = useState<'line' | 'area' | 'bar' | 'kpi' | 'table' | 'webview' | 'monitor'>('line');
  const [widgetDataSourceId, setWidgetDataSourceId] = useState<string>('');
  const [widgetResourceId, setWidgetResourceId] = useState<string>('');
  const [widgetDataPath, setWidgetDataPath] = useState('');
  const [widgetXKey, setWidgetXKey] = useState('x');
  const [widgetYKey, setWidgetYKey] = useState('y');
  const [widgetValueKey, setWidgetValueKey] = useState('');
  const [widgetColumns, setWidgetColumns] = useState('');
  const [widgetUrl, setWidgetUrl] = useState('');
  const [widgetWebviewScript, setWidgetWebviewScript] = useState('');
  const [widgetWebviewSelector, setWidgetWebviewSelector] = useState('');
  const [widgetWebviewAttr, setWidgetWebviewAttr] = useState('');
  const [widgetRefreshSec, setWidgetRefreshSec] = useState('300');
  const [widgetPreviewData, setWidgetPreviewData] = useState<any>(null);
  const [widgetPreviewError, setWidgetPreviewError] = useState<string>('');
  const [widgetAutoPath, setWidgetAutoPath] = useState('');
  const [widgetAutoXKey, setWidgetAutoXKey] = useState('');
  const [widgetAutoYKey, setWidgetAutoYKey] = useState('');
  const [widgetAutoValueKey, setWidgetAutoValueKey] = useState('');
  const [widgetAutoColumns, setWidgetAutoColumns] = useState<string[]>([]);
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [collapsedMonitorCharts, setCollapsedMonitorCharts] = useState<Record<string, boolean>>({});

  // 获取所有网站和备忘录
  const allResources = useMemo(() => {
    const result = new Map<string, any[]>();
    projects.forEach((project) => {
      result.set(project.id, getProjectResources(project.id));
    });
    return result;
  }, [projects, getProjectResources]);

  const allMemos = useMemo(() => {
    const result = new Map<string, any[]>();
    projects.forEach((project) => {
      result.set(project.id, getProjectMemos(project.id));
    });
    return result;
  }, [projects, getProjectMemos]);

  const allWidgets = useMemo(() => {
    const result = new Map<string, any[]>();
    projects.forEach((project) => {
      result.set(project.id, getProjectWidgets(project.id));
    });
    return result;
  }, [projects, getProjectWidgets]);

  const allDataSources = useMemo(() => {
    const result = new Map<string, any[]>();
    projects.forEach((project) => {
      result.set(project.id, getProjectDataSources(project.id));
    });
    return result;
  }, [projects, getProjectDataSources]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return null;

    const projectMatches = projects.filter((project) => {
      const haystack = [
        project.name,
        project.description,
        project.metadata?.owner,
        project.metadata?.businessUnit,
        project.metadata?.source,
        project.metadata?.confidentiality,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    const resourceMatches = resources.filter((resource) => {
      const haystack = [
        resource.name,
        resource.description,
        resource.url,
        resource.tags?.join(' '),
        resource.metadata?.owner,
        resource.metadata?.businessUnit,
        resource.metadata?.source,
        resource.metadata?.confidentiality,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    const memoMatches = memos.filter((memo) => {
      const haystack = [
        memo.title,
        memo.content,
        memo.category,
        memo.metadata?.owner,
        memo.metadata?.businessUnit,
        memo.metadata?.source,
        memo.metadata?.confidentiality,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    const widgetMatches = widgets.filter((widget) => {
      const haystack = [
        widget.name,
        widget.type,
        widget.config?.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    return { projectMatches, resourceMatches, memoMatches, widgetMatches };
  }, [searchQuery, projects, resources, memos, widgets]);

  const projectNameById = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project.name]));
  }, [projects]);

  useEffect(() => {
    if (!hasPassword && isPasswordUnlocked) {
      setShowPasswordDialog(true);
    }
  }, [hasPassword, isPasswordUnlocked]);

  useEffect(() => {
    if (hasPassword && !isPasswordUnlocked) {
      setShowUnlockDialog(true);
    }
  }, [hasPassword, isPasswordUnlocked]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowCommand(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const refreshStats = async () => {
      const stats = await getStorageStats();
      setStorageStats(stats);
    };
    void refreshStats();
  }, [projects, resources, memos]);

  useEffect(() => {
    const runAutoBackup = async () => {
      if (!projects.length && !resources.length && !memos.length) {
        return;
      }
      const settings = await getSettings();
      const lastBackup = settings.lastBackupTime || 0;
      const now = Date.now();
      if (now - lastBackup > 6 * 60 * 60 * 1000) {
        await createBackup('auto');
        await updateSettings({ lastBackupTime: now });
        await pruneBackups(settings.backupRetention ?? 20);
      }
    };
    void runAutoBackup();
  }, [projects, resources, memos]);

  const ensurePasswordReady = useCallback(
    (message: string) => {
      if (!hasPassword) {
        setShowPasswordDialog(true);
        toast.error('请先设置密码');
        return false;
      }
      if (!isPasswordUnlocked) {
        setShowUnlockDialog(true);
        toast.error(message);
        return false;
      }
      return true;
    },
    [hasPassword, isPasswordUnlocked]
  );

  const migrateEncryptedFields = useCallback(async () => {
    const resourcesToProcess = projects.flatMap((project) => getProjectResources(project.id));
    for (const website of resourcesToProcess) {
      const updates: any = {};
      let needsUpdate = false;

      if (website.password && !website.passwordEncrypted) {
        updates.passwordEncrypted = await encrypt(website.password);
        updates.password = undefined;
        needsUpdate = true;
      }

      if (website.apiKey && !website.apiKeyEncrypted) {
        updates.apiKeyEncrypted = await encrypt(website.apiKey);
        updates.apiKey = undefined;
        needsUpdate = true;
      }

      if (website.apiSecret && !website.apiSecretEncrypted) {
        updates.apiSecretEncrypted = await encrypt(website.apiSecret);
        updates.apiSecret = undefined;
        needsUpdate = true;
      }

      if (needsUpdate) {
        updates.isEncrypted = true;
        updateResourceData(website.id, updates);
      }
    }

    const memosToProcess = projects.flatMap((project) => getProjectMemos(project.id));
    for (const memo of memosToProcess) {
      if (memo.isEncrypted && memo.content && !memo.encryptedData) {
        const encryptedData = await encrypt(memo.content);
        updateMemoData(memo.id, {
          encryptedData,
          content: '',
          isEncrypted: true,
        });
      }
    }
  }, [projects, getProjectResources, getProjectMemos, encrypt, updateResourceData, updateMemoData]);

  useEffect(() => {
    if (!hasPassword || !isPasswordUnlocked) {
      return;
    }
    if (encryptionMigrationDoneRef.current) {
      return;
    }
    encryptionMigrationDoneRef.current = true;
    void migrateEncryptedFields();
  }, [hasPassword, isPasswordUnlocked, migrateEncryptedFields]);

  // ============ 项目操作 ============

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDesc('');
    setProjectColor(generateRandomColor());
    setProjectOwner('');
    setProjectBusinessUnit('');
    setProjectConfidentiality('internal');
    setProjectSource('');
    setShowProjectDialog(true);
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDesc(project.description || '');
    setProjectColor(project.color || generateRandomColor());
    setProjectOwner(project.metadata?.owner || '');
    setProjectBusinessUnit(project.metadata?.businessUnit || '');
    setProjectConfidentiality(project.metadata?.confidentiality || 'internal');
    setProjectSource(project.metadata?.source || '');
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
        metadata: {
          owner: projectOwner || undefined,
          businessUnit: projectBusinessUnit || undefined,
          confidentiality: projectConfidentiality || 'internal',
          source: projectSource || undefined,
        },
      });
      toast.success('项目已更新');
    } else {
      createProject(projectName, projectDesc, projectColor, {
        owner: projectOwner || undefined,
        businessUnit: projectBusinessUnit || undefined,
        confidentiality: projectConfidentiality || 'internal',
        source: projectSource || undefined,
      });
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

  const handleSelectResourceType = (type: 'website' | 'api' | 'monitor' | 'credential' | 'document') => {
    setSelectedResourceType(type);
    setEditingResource(null);
    setResourceName('');
    setResourceUrl('');
    setUrlProtocol('https');
    setResourceDesc('');
    setResourceTags('');
    setResourceOwner('');
    setResourceBusinessUnit('');
    setResourceConfidentiality('internal');
    setResourceSource('');
    setResourceIconUrl('');
    setResourceIconMode('auto');
    setResourceIconName('globe');
    setUsername('');
    setPasswordField('');
    setApiKey('');
    setApiSecret('');
    setApiEndpoint('');
    setMonitorUrl('');
    setMonitorProtocol('https');
    setMonitorIntervalMinutes('5');
    setShowResourceTypeDialog(false);
    setShowResourceDialog(true);
  };

  const handleEditResource = async (resource: any, projectId: string) => {
    setActiveProjectId(projectId);
    setEditingResource(resource);
    setSelectedResourceType(resource.type || 'website');
    setResourceName(resource.name);
    const parsedUrl = parseUrlInput(resource.url || '', 'https');
    setUrlProtocol(parsedUrl.protocol);
    setResourceUrl(parsedUrl.url);
    setResourceDesc(resource.description || '');
    setResourceTags(resource.tags?.join(', ') || '');
    setResourceOwner(resource.metadata?.owner || '');
    setResourceBusinessUnit(resource.metadata?.businessUnit || '');
    setResourceConfidentiality(resource.metadata?.confidentiality || 'internal');
    setResourceSource(resource.metadata?.source || '');
    setResourceIconUrl(resource.icon || '');
    setResourceIconMode(resource.iconType || 'auto');
    setResourceIconName(resource.iconName || 'globe');
    setUsername(resource.username || '');
    const requiresUnlock =
      !!(resource.passwordEncrypted || resource.apiKeyEncrypted || resource.apiSecretEncrypted) &&
      (!hasPassword || !isPasswordUnlocked);
    if (requiresUnlock) {
      setShowUnlockDialog(true);
      toast.error('请先解锁密码');
    }

    let decryptedPassword = resource.password || '';
    if (resource.passwordEncrypted && !requiresUnlock) {
      try {
        decryptedPassword = await decrypt(resource.passwordEncrypted);
      } catch {
        toast.error('密码解密失败');
      }
    }
    setPasswordField(requiresUnlock ? '' : decryptedPassword);

    let decryptedApiKey = resource.apiKey || '';
    if (resource.apiKeyEncrypted && !requiresUnlock) {
      try {
        decryptedApiKey = await decrypt(resource.apiKeyEncrypted);
      } catch {
        toast.error('API Key 解密失败');
      }
    }
    setApiKey(requiresUnlock ? '' : decryptedApiKey);

    let decryptedApiSecret = resource.apiSecret || '';
    if (resource.apiSecretEncrypted && !requiresUnlock) {
      try {
        decryptedApiSecret = await decrypt(resource.apiSecretEncrypted);
      } catch {
        toast.error('API Secret 解密失败');
      }
    }
    setApiSecret(requiresUnlock ? '' : decryptedApiSecret);
    setApiEndpoint(resource.apiEndpoint || '');
    const parsedMonitorUrl = parseUrlInput(resource.monitorUrl || resource.url || '', 'https');
    setMonitorProtocol(parsedMonitorUrl.protocol);
    setMonitorUrl(parsedMonitorUrl.url);
    setMonitorIntervalMinutes(
      resource.monitorIntervalSec ? String(Math.max(1, Math.round(resource.monitorIntervalSec / 60))) : '5'
    );
    setShowResourceDialog(true);
  };

  const handleSaveResource = async () => {
    if (!activeProjectId) return;
    if (!resourceName.trim()) {
      toast.error('请填写资源名称');
      return;
    }

    if (selectedResourceType === 'website' && !resourceUrl.trim()) {
      toast.error('请填写网站 URL');
      return;
    }

    if (selectedResourceType === 'api' && !apiKey.trim()) {
      toast.error('请填写 API Key');
      return;
    }

    if (selectedResourceType === 'monitor' && !monitorUrl.trim()) {
      toast.error('请填写存活检查 URL');
      return;
    }

    if (
      editingResource &&
      (editingResource.passwordEncrypted || editingResource.apiKeyEncrypted || editingResource.apiSecretEncrypted) &&
      !isPasswordUnlocked
    ) {
      toast.error('请先解锁密码再编辑');
      setShowUnlockDialog(true);
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
      icon: resourceIconUrl || undefined,
      iconType: resourceIconMode,
      iconName: resourceIconName,
      metadata: {
        owner: resourceOwner || undefined,
        businessUnit: resourceBusinessUnit || undefined,
        confidentiality: resourceConfidentiality || 'internal',
        source: resourceSource || undefined,
      },
      isEncrypted: false,
    };

    if (selectedResourceType === 'website') {
      resourceData.url = buildUrlWithProtocol(urlProtocol, resourceUrl);
      resourceData.username = username || undefined;
      if (resourceIconMode === 'auto' && !resourceIconUrl && resourceUrl) {
        resourceData.icon = getFaviconUrl(buildUrlWithProtocol(urlProtocol, resourceUrl));
      }
      if (passwordField.trim()) {
        if (!ensurePasswordReady('请先解锁密码')) {
          return;
        }
        resourceData.passwordEncrypted = await encrypt(passwordField);
        resourceData.isEncrypted = true;
      } else {
        resourceData.passwordEncrypted = undefined;
      }
    } else if (selectedResourceType === 'credential') {
      resourceData.username = username || undefined;
      if (passwordField.trim()) {
        if (!ensurePasswordReady('请先解锁密码')) {
          return;
        }
        resourceData.passwordEncrypted = await encrypt(passwordField);
        resourceData.isEncrypted = true;
      } else {
        resourceData.passwordEncrypted = undefined;
      }
    } else if (selectedResourceType === 'api') {
      if (!ensurePasswordReady('请先解锁密码')) {
        return;
      }
      resourceData.apiKeyEncrypted = await encrypt(apiKey);
      if (apiSecret.trim()) {
        resourceData.apiSecretEncrypted = await encrypt(apiSecret);
      } else {
        resourceData.apiSecretEncrypted = undefined;
      }
      resourceData.apiKey = undefined;
      resourceData.apiSecret = undefined;
      resourceData.apiEndpoint = apiEndpoint;
      resourceData.isEncrypted = true;
    } else if (selectedResourceType === 'monitor') {
      const monitorInterval = Math.max(1, Number(monitorIntervalMinutes) || 5);
      resourceData.monitorUrl = buildUrlWithProtocol(monitorProtocol, monitorUrl);
      resourceData.monitorIntervalSec = monitorInterval * 60;
      resourceData.monitorHistory = editingResource?.monitorHistory || [];
      resourceData.monitorLastOk = editingResource?.monitorLastOk ?? undefined;
    } else if (selectedResourceType === 'document') {
      resourceData.url = resourceUrl ? buildUrlWithProtocol(urlProtocol, resourceUrl) : undefined;
      if (resourceIconMode === 'auto' && !resourceIconUrl && resourceUrl) {
        resourceData.icon = getFaviconUrl(buildUrlWithProtocol(urlProtocol, resourceUrl));
      }
    }

    if (
      resourceIconMode === 'custom' &&
      resourceData.icon &&
      typeof resourceData.icon === 'string' &&
      !resourceData.icon.startsWith('data:')
    ) {
      const cachedIcon = await fetchImageAsDataUrl(resourceData.icon);
      if (cachedIcon) {
        resourceData.icon = cachedIcon;
      }
    }

    if (editingResource) {
      updateResourceData(editingResource.id, resourceData);
      toast.success('资源已更新');
    } else {
      const resourceUrlValue =
        selectedResourceType === 'monitor'
          ? buildUrlWithProtocol(monitorProtocol, monitorUrl)
          : selectedResourceType === 'website'
          ? buildUrlWithProtocol(urlProtocol, resourceUrl)
          : selectedResourceType === 'document' && resourceUrl
          ? buildUrlWithProtocol(urlProtocol, resourceUrl)
          : undefined;
      createResource(
        activeProjectId,
        resourceName,
        resourceUrlValue,
        resourceDesc,
        undefined,
        tags,
        selectedResourceType,
        resourceData
      );
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

  const handlePreviewResource = useCallback(
    async (resource: any, projectId: string) => {
      setActiveProjectId(projectId);
      const preview = { ...resource };
      const requiresUnlock =
        !!(resource.passwordEncrypted || resource.apiKeyEncrypted || resource.apiSecretEncrypted) &&
        (!hasPassword || !isPasswordUnlocked);

      if (requiresUnlock) {
        setShowUnlockDialog(true);
        toast.error('请先解锁密码');
      }

      if (resource.passwordEncrypted && !requiresUnlock) {
        try {
          preview.password = await decrypt(resource.passwordEncrypted);
        } catch {
          toast.error('密码解密失败');
        }
      }

      if (resource.apiKeyEncrypted && !requiresUnlock) {
        try {
          preview.apiKey = await decrypt(resource.apiKeyEncrypted);
        } catch {
          toast.error('API Key 解密失败');
        }
      }

      if (resource.apiSecretEncrypted && !requiresUnlock) {
        try {
          preview.apiSecret = await decrypt(resource.apiSecretEncrypted);
        } catch {
          toast.error('API Secret 解密失败');
        }
      }

      setPreviewingResource(preview);
      setShowResourcePreview(true);
    },
    [decrypt, isPasswordUnlocked]
  );

  // ============ 备忘录操作 ============

  const handleAddMemo = (projectId: string) => {
    setActiveProjectId(projectId);
    setEditingMemo(null);
    setMemoTitle('');
    setMemoContent('');
    setMemoCategory('');
    setMemoEncrypted(false);
    setMemoOwner('');
    setMemoBusinessUnit('');
    setMemoConfidentiality('internal');
    setMemoSource('');
    setShowMemoDialog(true);
  };

  const handleEditMemo = async (memo: any, projectId: string) => {
    setActiveProjectId(projectId);
    setEditingMemo(memo);
    setMemoTitle(memo.title);
    if (memo.isEncrypted && memo.encryptedData) {
      if (!hasPassword || !isPasswordUnlocked) {
        toast.error('请先解锁密码');
        setShowUnlockDialog(true);
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
    setMemoOwner(memo.metadata?.owner || '');
    setMemoBusinessUnit(memo.metadata?.businessUnit || '');
    setMemoConfidentiality(memo.metadata?.confidentiality || 'internal');
    setMemoSource(memo.metadata?.source || '');
    setShowMemoDialog(true);
  };

  const handleSaveMemo = async () => {
    if (!activeProjectId) return;
    if (!memoTitle.trim()) {
      toast.error('请填写备忘录标题');
      return;
    }

    if (memoEncrypted && !isPasswordUnlocked) {
      toast.error('请先设置或解锁密码');
      setShowUnlockDialog(true);
      return;
    }

    if (editingMemo) {
      const updates: any = {
        title: memoTitle,
        category: memoCategory,
        isEncrypted: memoEncrypted,
        metadata: {
          owner: memoOwner || undefined,
          businessUnit: memoBusinessUnit || undefined,
          confidentiality: memoConfidentiality || 'internal',
          source: memoSource || undefined,
        },
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
        const created = createMemo(activeProjectId, memoTitle, '', memoCategory, true);
        updateMemoData(created.id, {
          encryptedData: await encrypt(memoContent),
          content: '',
          isEncrypted: true,
          metadata: {
            owner: memoOwner || undefined,
            businessUnit: memoBusinessUnit || undefined,
            confidentiality: memoConfidentiality || 'internal',
            source: memoSource || undefined,
          },
        });
      } else {
        const created = createMemo(activeProjectId, memoTitle, memoContent, memoCategory, false);
        updateMemoData(created.id, {
          metadata: {
            owner: memoOwner || undefined,
            businessUnit: memoBusinessUnit || undefined,
            confidentiality: memoConfidentiality || 'internal',
            source: memoSource || undefined,
          },
        });
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

  const parseKeyValueInput = (input: string) => {
    if (!input.trim()) return {};
    return input
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce((acc: Record<string, string>, line) => {
        const [key, ...rest] = line.split(':');
        if (!key) return acc;
        acc[key.trim()] = rest.join(':').trim();
        return acc;
      }, {});
  };

  const handleAddDataSource = (projectId: string) => {
    setActiveProjectId(projectId);
    setEditingDataSource(null);
    setDataSourceName('');
    setDataSourceUrl('');
    setDataSourceHeaders('');
    setDataSourceQuery('');
    setDataSourceAuthType('none');
    setDataSourceToken('');
    setDataSourceTtl('300');
    setShowDataSourceDialog(true);
  };

  const handleEditDataSource = async (dataSource: any) => {
    setActiveProjectId(dataSource.projectId);
    setEditingDataSource(dataSource);
    setDataSourceName(dataSource.name || '');
    setDataSourceUrl(dataSource.url || '');
    setDataSourceHeaders(
      dataSource.headers ? Object.entries(dataSource.headers).map(([k, v]) => `${k}: ${v}`).join('\n') : ''
    );
    setDataSourceQuery(
      dataSource.queryParams ? Object.entries(dataSource.queryParams).map(([k, v]) => `${k}: ${v}`).join('\n') : ''
    );
    setDataSourceAuthType(dataSource.authType || 'none');
    if (dataSource.tokenEncrypted && isPasswordUnlocked) {
      try {
        setDataSourceToken(await decrypt(dataSource.tokenEncrypted));
      } catch {
        setDataSourceToken('');
      }
    } else {
      setDataSourceToken('');
    }
    setDataSourceTtl(String(dataSource.ttlSec || 300));
    setShowDataSourceDialog(true);
  };

  const handleSaveDataSource = async () => {
    if (!activeProjectId) return;
    if (!dataSourceName.trim() || !dataSourceUrl.trim()) {
      toast.error('请填写数据源名称和 URL');
      return;
    }
    if (dataSourceAuthType === 'bearer' && !ensurePasswordReady('请先解锁密码')) {
      return;
    }
    const headers = parseKeyValueInput(dataSourceHeaders);
    const queryParams = parseKeyValueInput(dataSourceQuery);
    const ttlSec = Math.max(60, Number(dataSourceTtl) || 300);
    const payload: any = {
      name: dataSourceName,
      url: dataSourceUrl,
      method: 'GET',
      headers,
      queryParams,
      authType: dataSourceAuthType,
      ttlSec,
    };
    if (dataSourceAuthType === 'bearer' && dataSourceToken.trim()) {
      payload.tokenEncrypted = await encrypt(dataSourceToken.trim());
    }
    if (editingDataSource) {
      updateDataSourceData(editingDataSource.id, payload);
      toast.success('数据源已更新');
    } else {
      createDataSource({
        id: crypto.randomUUID(),
        projectId: activeProjectId,
        name: dataSourceName,
        url: dataSourceUrl,
        method: 'GET',
        headers,
        queryParams,
        authType: dataSourceAuthType,
        tokenEncrypted: payload.tokenEncrypted,
        ttlSec,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      toast.success('数据源已创建');
    }
    setShowDataSourceDialog(false);
  };

  const handleDeleteDataSource = (id: string) => {
    if (!confirm('确定要删除这个数据源吗？')) return;
    deleteDataSourceData(id);
    toast.success('数据源已删除');
  };

  const handleAddWidget = (projectId: string) => {
    setActiveProjectId(projectId);
    setEditingWidget(null);
    setWidgetName('');
    setWidgetType('line');
    setWidgetDataSourceId('');
    setWidgetResourceId('');
    setWidgetDataPath('');
    setWidgetXKey('x');
    setWidgetYKey('y');
    setWidgetValueKey('');
    setWidgetColumns('');
    setWidgetUrl('');
    setWidgetWebviewScript('');
    setWidgetWebviewSelector('');
    setWidgetWebviewAttr('');
    setWidgetRefreshSec('300');
    setWidgetPreviewData(null);
    setWidgetPreviewError('');
    setWidgetAutoPath('');
    setWidgetAutoXKey('');
    setWidgetAutoYKey('');
    setWidgetAutoValueKey('');
    setWidgetAutoColumns([]);
    setShowWidgetDialog(true);
  };

  const handleEditWidget = (widget: any) => {
    setActiveProjectId(widget.projectId);
    setEditingWidget(widget);
    setWidgetName(widget.name || '');
    setWidgetType(widget.type || 'line');
    setWidgetDataSourceId(widget.dataSourceId || '');
    setWidgetResourceId(widget.resourceId || '');
    setWidgetDataPath(widget.config?.dataPath || '');
    setWidgetXKey(widget.config?.xKey || 'x');
    setWidgetYKey(widget.config?.yKey || 'y');
    setWidgetValueKey(widget.config?.valueKey || '');
    setWidgetColumns(widget.config?.columns?.join(', ') || '');
    setWidgetUrl(widget.config?.url || '');
    setWidgetWebviewScript(widget.config?.webviewScript || '');
    setWidgetWebviewSelector(widget.config?.webviewSelector || '');
    setWidgetWebviewAttr(widget.config?.webviewAttr || '');
    setWidgetRefreshSec(String(widget.config?.refreshSec || 300));
    setWidgetPreviewData(widget.cache?.data || null);
    setWidgetPreviewError(widget.cache?.error || '');
    setWidgetAutoPath('');
    setWidgetAutoXKey('');
    setWidgetAutoYKey('');
    setWidgetAutoValueKey('');
    setWidgetAutoColumns([]);
    setShowWidgetDialog(true);
  };

  const handleSaveWidget = () => {
    if (!activeProjectId) return;
    if (!widgetName.trim()) {
      toast.error('请填写组件名称');
      return;
    }
    if (widgetType === 'monitor' && !widgetResourceId) {
      toast.error('请选择监控资源');
      return;
    }
    if (widgetType !== 'monitor' && widgetType !== 'webview' && !widgetDataSourceId) {
      toast.error('请选择数据源');
      return;
    }
    if (widgetType === 'webview' && !widgetUrl.trim()) {
      toast.error('请输入 Webview URL');
      return;
    }
    const refreshSec = Math.max(30, Number(widgetRefreshSec) || 300);
    const config: any = {
      dataPath: widgetDataPath || undefined,
      xKey: widgetXKey || undefined,
      yKey: widgetYKey || undefined,
      valueKey: widgetValueKey || undefined,
      columns: widgetColumns
        .split(',')
        .map((col) => col.trim())
        .filter(Boolean),
      url: widgetUrl || undefined,
      webviewScript: widgetWebviewScript || undefined,
      webviewSelector: widgetWebviewSelector || undefined,
      webviewAttr: widgetWebviewAttr || undefined,
      refreshSec,
    };
    const base = {
      name: widgetName,
      type: widgetType,
      dataSourceId: widgetType === 'monitor' || widgetType === 'webview' ? undefined : widgetDataSourceId,
      resourceId: widgetType === 'monitor' ? widgetResourceId : undefined,
      config,
    };
    if (editingWidget) {
      updateWidgetData(editingWidget.id, base);
      toast.success('组件已更新');
    } else {
      createWidget({
        id: crypto.randomUUID(),
        projectId: activeProjectId,
        name: widgetName,
        type: widgetType,
        dataSourceId: widgetType === 'monitor' || widgetType === 'webview' ? undefined : widgetDataSourceId,
        resourceId: widgetType === 'monitor' ? widgetResourceId : undefined,
        config,
        layout: {
          lg: { x: 0, y: Infinity, w: 6, h: 4 },
          md: { x: 0, y: Infinity, w: 6, h: 4 },
          sm: { x: 0, y: Infinity, w: 6, h: 4 },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      toast.success('组件已创建');
    }
    setShowWidgetDialog(false);
  };

  const handleDeleteWidget = (id: string) => {
    if (!confirm('确定要删除这个组件吗？')) return;
    deleteWidgetData(id);
    toast.success('组件已删除');
  };

  const applyTemplate = (projectId: string, template: 'ops' | 'kpi-trend' | 'monitor' | 'web') => {
    const projectDataSources = allDataSources.get(projectId) || [];
    const projectResources = allResources.get(projectId) || [];
    const firstDataSource = projectDataSources[0];
    const firstMonitor = projectResources.find((resource: any) => resource.type === 'monitor');

    if ((template === 'ops' || template === 'kpi-trend') && !firstDataSource) {
      toast.error('请先创建数据源');
      return;
    }
    if ((template === 'ops' || template === 'monitor') && !firstMonitor) {
      toast.error('请先创建监控资源');
      return;
    }

    if (template === 'kpi-trend' || template === 'ops') {
      createWidget({
        id: crypto.randomUUID(),
        projectId,
        name: '核心指标',
        type: 'kpi',
        dataSourceId: firstDataSource.id,
        config: { valueKey: 'value', refreshSec: 300 },
        layout: {
          lg: { x: 0, y: Infinity, w: 3, h: 3 },
          md: { x: 0, y: Infinity, w: 4, h: 3 },
          sm: { x: 0, y: Infinity, w: 6, h: 3 },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      createWidget({
        id: crypto.randomUUID(),
        projectId,
        name: '趋势图',
        type: 'area',
        dataSourceId: firstDataSource.id,
        config: { xKey: 'x', yKey: 'y', refreshSec: 300 },
        layout: {
          lg: { x: 3, y: Infinity, w: 9, h: 4 },
          md: { x: 0, y: Infinity, w: 10, h: 4 },
          sm: { x: 0, y: Infinity, w: 6, h: 4 },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (template === 'monitor' || template === 'ops') {
      if (firstMonitor) {
        createWidget({
          id: crypto.randomUUID(),
          projectId,
          name: '监控状态',
          type: 'monitor',
          resourceId: firstMonitor.id,
          config: { refreshSec: 60 },
          layout: {
            lg: { x: 0, y: Infinity, w: 6, h: 4 },
            md: { x: 0, y: Infinity, w: 10, h: 4 },
            sm: { x: 0, y: Infinity, w: 6, h: 4 },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (template === 'web') {
      createWidget({
        id: crypto.randomUUID(),
        projectId,
        name: '网站统计',
        type: 'webview',
        config: {
          url: 'https://example.com',
          webviewSelector: '.metric-value',
          refreshSec: 300,
        },
        layout: {
          lg: { x: 0, y: Infinity, w: 6, h: 5 },
          md: { x: 0, y: Infinity, w: 10, h: 5 },
          sm: { x: 0, y: Infinity, w: 6, h: 5 },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    toast.success('已应用模板');
  };

  const getWidgetLayouts = (projectId: string): Layouts => {
    const projectWidgets = allWidgets.get(projectId) || [];
    const layouts: Layouts = { lg: [], md: [], sm: [] };
    projectWidgets.forEach((widget: any) => {
      const baseLayout = widget.layout || {};
      const lg = baseLayout.lg || { x: 0, y: Infinity, w: 6, h: 4 };
      const md = baseLayout.md || lg;
      const sm = baseLayout.sm || { x: 0, y: Infinity, w: 6, h: 4 };
      layouts.lg.push({ i: widget.id, ...lg });
      layouts.md.push({ i: widget.id, ...md });
      layouts.sm.push({ i: widget.id, ...sm });
    });
    return layouts;
  };

  const handleWidgetLayoutChange = (projectId: string, layouts: Layouts) => {
    const projectWidgets = allWidgets.get(projectId) || [];
    projectWidgets.forEach((widget: any) => {
      updateWidgetData(widget.id, {
        layout: {
          lg: layouts.lg?.find((item: any) => item.i === widget.id),
          md: layouts.md?.find((item: any) => item.i === widget.id),
          sm: layouts.sm?.find((item: any) => item.i === widget.id),
        },
      });
    });
  };

  const getValueByPath = (value: any, path?: string) => {
    if (!path) return value;
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), value);
  };
  // ============ 密码操作 ============

  const handleSetPassword = async () => {
    if (!password.trim()) {
      toast.error('请输入密码');
      return;
    }

    const strong =
      password.length >= 10 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password);

    if (!strong) {
      toast.error('密码至少 10 位，需包含大小写字母和数字');
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

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      const hasSensitivePlaintext = data.resources.some(
        (resource) => resource.password || resource.apiKey || resource.apiSecret
      );
      const hasEncryptedContent =
        data.resources.some(
          (resource) =>
            resource.passwordEncrypted || resource.apiKeyEncrypted || resource.apiSecretEncrypted
        ) || data.memos.some((memo) => memo.isEncrypted);

      if ((hasSensitivePlaintext || hasEncryptedContent) && !ensurePasswordReady('请先解锁密码再导出')) {
        return;
      }

      const resources = await Promise.all(
        data.resources.map(async (resource) => {
          const next: any = { ...resource };
          if (next.password && !next.passwordEncrypted) {
            next.passwordEncrypted = await encrypt(next.password);
            delete next.password;
          }
          if (next.apiKey && !next.apiKeyEncrypted) {
            next.apiKeyEncrypted = await encrypt(next.apiKey);
            delete next.apiKey;
          }
          if (next.apiSecret && !next.apiSecretEncrypted) {
            next.apiSecretEncrypted = await encrypt(next.apiSecret);
            delete next.apiSecret;
          }
          return next;
        })
      );

      const memos = await Promise.all(
        data.memos.map(async (memo) => {
          const next: any = { ...memo };
          if (next.isEncrypted && next.content && !next.encryptedData) {
            next.encryptedData = await encrypt(next.content);
            next.content = '';
          }
          return next;
        })
      );

      const payload = { ...data, resources, memos };
      const jsonString = JSON.stringify(payload, null, 2);
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
        const resources = Array.isArray(data.resources) ? data.resources : [];
        const memos = Array.isArray(data.memos) ? data.memos : [];
        const hasSensitivePlaintext = resources.some(
          (resource: any) => resource.password || resource.apiKey || resource.apiSecret
        ) || memos.some((memo: any) => memo.isEncrypted && memo.content && !memo.encryptedData);

        if (hasSensitivePlaintext && !ensurePasswordReady('请先解锁密码再导入')) {
          return;
        }

        if (hasSensitivePlaintext) {
          data.resources = await Promise.all(
            resources.map(async (resource: any) => {
              const next = { ...resource };
              if (next.password && !next.passwordEncrypted) {
                next.passwordEncrypted = await encrypt(next.password);
                delete next.password;
              }
              if (next.apiKey && !next.apiKeyEncrypted) {
                next.apiKeyEncrypted = await encrypt(next.apiKey);
                delete next.apiKey;
              }
              if (next.apiSecret && !next.apiSecretEncrypted) {
                next.apiSecretEncrypted = await encrypt(next.apiSecret);
                delete next.apiSecret;
              }
              return next;
            })
          );

          data.memos = await Promise.all(
            memos.map(async (memo: any) => {
              const next = { ...memo };
              if (next.isEncrypted && next.content && !next.encryptedData) {
                next.encryptedData = await encrypt(next.content);
                next.content = '';
              }
              return next;
            })
          );
        }

        const shouldMerge = confirm('是否以合并模式导入？选择“取消”将覆盖现有数据。');
        await importData(data, shouldMerge ? 'merge' : 'replace');
        toast.success(shouldMerge ? '数据已合并导入' : '数据已覆盖导入');
        window.location.reload();
      } catch (error) {
        toast.error('导入失败，请检查文件格式');
      }
    };
    input.click();
  };

  const handleClearData = async () => {
    if (confirm('确定要清空所有数据吗？此操作无法撤销！')) {
      await clearAllData();
      toast.success('所有数据已清空');
      window.location.reload();
    }
  };

  // ============ 辅助函数 ============

  const getResourceIcon = (resource: any) => {
    if (resource.iconType === 'builtin' && resource.iconName) {
      switch (resource.iconName) {
        case 'link':
          return <Link2 className="w-5 h-5 text-slate-600" />;
        case 'key':
          return <Key className="w-5 h-5 text-slate-600" />;
        case 'code':
          return <Code2 className="w-5 h-5 text-slate-600" />;
        case 'activity':
          return <Activity className="w-5 h-5 text-slate-600" />;
        case 'file':
          return <FileText className="w-5 h-5 text-slate-600" />;
        default:
          return <Globe className="w-5 h-5 text-slate-600" />;
      }
    }
    if (resource.icon && (resource.type === 'website' || resource.type === 'document')) {
      return (
        <img
          src={resource.icon}
          alt={resource.name}
          className="w-5 h-5"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      );
    }
    switch (resource.type) {
      case 'credential':
        return <Key className="w-5 h-5 text-slate-600" />;
      case 'api':
        return <Code2 className="w-5 h-5 text-slate-600" />;
      case 'monitor':
        return <Activity className="w-5 h-5 text-slate-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-slate-600" />;
      default:
        return <Globe className="w-5 h-5 text-slate-600" />;
    }
  };

  const getResourceColor = (resource: any) => {
    if (resource.type === 'credential') {
      return 'group-hover/item:border-amber-200 group-hover/item:bg-amber-50 group-hover/item:text-amber-600';
    } else if (resource.type === 'api') {
      return 'group-hover/item:border-purple-200 group-hover/item:bg-purple-50 group-hover/item:text-purple-600';
    } else if (resource.type === 'monitor') {
      return 'group-hover/item:border-green-200 group-hover/item:bg-green-50 group-hover/item:text-green-600';
    } else if (resource.type === 'document') {
      return 'group-hover/item:border-slate-200 group-hover/item:bg-slate-100 group-hover/item:text-slate-600';
    }
    return 'group-hover/item:border-blue-200 group-hover/item:bg-blue-50 group-hover/item:text-blue-600';
  };

  const renderWidgetContent = (widget: any) => {
    const projectDataSources = allDataSources.get(widget.projectId) || [];
    const dataSource = projectDataSources.find((item: any) => item.id === widget.dataSourceId);
    const projectResources = allResources.get(widget.projectId) || [];
    const monitorResource = projectResources.find((item: any) => item.id === widget.resourceId);
    const cache = widget.cache;

    if (widget.type === 'webview') {
      const url = widget.config?.url;
      if (!url) return <div className="text-xs text-slate-400">未配置 URL</div>;
      return (
        <div className="h-full flex flex-col gap-2">
          {widget.cache?.data && (
            <div className="text-xs text-slate-500">
              抓取结果: {String(widget.cache.data).slice(0, 64)}
            </div>
          )}
          <div className="flex-1">
            <WebviewWidget
              url={url}
              script={widget.config?.webviewScript}
              selector={widget.config?.webviewSelector}
              attr={widget.config?.webviewAttr}
              refreshSec={widget.config?.refreshSec}
              onData={(data) => {
                updateWidgetData(widget.id, {
                  cache: { data, status: 'ok', updatedAt: Date.now() },
                });
              }}
              onError={(message) => {
                updateWidgetData(widget.id, {
                  cache: { status: 'error', error: message, updatedAt: Date.now() },
                });
              }}
            />
          </div>
        </div>
      );
    }

    if (widget.type === 'monitor') {
      if (!monitorResource?.monitorHistory?.length) {
        return <div className="text-xs text-slate-400">暂无监控数据</div>;
      }
      return (
        <ChartContainer
          config={{
            status: { label: '状态', color: '#22c55e' },
          }}
          className="h-full"
        >
          <AreaChart
            data={(monitorResource.monitorHistory || []).map((d: any) => ({
              timestamp: d.timestamp,
              status: d.ok ? 1 : 0,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(v) =>
                new Date(v).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
              }
            />
            <YAxis domain={[0, 1]} tickFormatter={(v) => (v === 1 ? 'UP' : 'DOWN')} />
            <Area type="monotone" dataKey="status" stroke="#22c55e" fill="#22c55e33" />
            <ChartTooltip content={<ChartTooltipContent />} />
          </AreaChart>
        </ChartContainer>
      );
    }

    if (!dataSource) {
      return <div className="text-xs text-slate-400">未绑定数据源</div>;
    }

    if (!cache?.data) {
      return <div className="text-xs text-slate-400">暂无数据</div>;
    }

    const data = getValueByPath(cache.data, widget.config?.dataPath) || cache.data;

    if (widget.type === 'kpi') {
      const value = getValueByPath(cache.data, widget.config?.valueKey);
      return (
        <div className="h-full flex flex-col justify-center">
          <div className="text-xs uppercase text-slate-400">当前值</div>
          <div className="text-3xl font-semibold text-slate-800 mt-2">{value ?? '--'}</div>
          <div className="text-xs text-slate-400 mt-2">最后更新 {cache.updatedAt ? new Date(cache.updatedAt).toLocaleString() : '-'}</div>
        </div>
      );
    }

    if (widget.type === 'table') {
      const rows = Array.isArray(data) ? data : [];
      const columns = widget.config?.columns || [];
      return (
        <div className="overflow-auto h-full">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500">
                {columns.map((col: string) => (
                  <th key={col} className="text-left py-1">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 6).map((row: any, idx: number) => (
                <tr key={idx} className="border-t border-slate-100">
                  {columns.map((col: string) => (
                    <td key={col} className="py-1 text-slate-700">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const series = Array.isArray(data) ? data : [];
    const xKey = widget.config?.xKey || 'x';
    const yKey = widget.config?.yKey || 'y';
    const chartColor = widget.type === 'bar' ? '#3b82f6' : '#2563eb';

    return (
      <ChartContainer
        config={{
          value: { label: '值', color: chartColor },
        }}
        className="h-full"
      >
        <AreaChart data={series}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Area type="monotone" dataKey={yKey} stroke={chartColor} fill={`${chartColor}33`} />
          <ChartTooltip content={<ChartTooltipContent />} />
        </AreaChart>
      </ChartContainer>
    );
  };

  const fetchWidgetData = useCallback(
    async (widget: any) => {
      if (!widget.dataSourceId) return;
      const dataSource = dataSources.find((item) => item.id === widget.dataSourceId);
      if (!dataSource) return;

      if (dataSource.authType === 'bearer' && dataSource.tokenEncrypted && !isPasswordUnlocked) {
        updateWidgetData(widget.id, { cache: { status: 'locked', updatedAt: Date.now() } });
        return;
      }

      let token: string | undefined;
      if (dataSource.authType === 'bearer' && dataSource.tokenEncrypted) {
        try {
          token = await decrypt(dataSource.tokenEncrypted);
        } catch {
          updateWidgetData(widget.id, { cache: { status: 'error', error: 'Token 解密失败' } });
          return;
        }
      }

      const headers = { ...(dataSource.headers || {}) } as Record<string, string>;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const url = new URL(dataSource.url);
      Object.entries(dataSource.queryParams || {}).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });

      try {
        const response = await axios.get(url.toString(), { headers });
        updateWidgetData(widget.id, {
          cache: {
            data: response.data,
            status: 'ok',
            updatedAt: Date.now(),
          },
        });
        updateDataSourceData(dataSource.id, { lastSuccessAt: Date.now() });
      } catch (error: any) {
        updateWidgetData(widget.id, {
          cache: {
            status: 'error',
            error: error?.message || '请求失败',
            updatedAt: Date.now(),
          },
        });
      }
    },
    [dataSources, decrypt, isPasswordUnlocked, updateWidgetData, updateDataSourceData]
  );

  const fetchDataSourcePreview = useCallback(
    async (dataSourceId: string) => {
      const dataSource = dataSources.find((item) => item.id === dataSourceId);
      if (!dataSource) {
        setWidgetPreviewError('未找到数据源');
        return;
      }
      if (dataSource.authType === 'bearer' && dataSource.tokenEncrypted && !isPasswordUnlocked) {
        setWidgetPreviewError('请先解锁密码');
        return;
      }
      let token: string | undefined;
      if (dataSource.authType === 'bearer' && dataSource.tokenEncrypted) {
        try {
          token = await decrypt(dataSource.tokenEncrypted);
        } catch {
          setWidgetPreviewError('Token 解密失败');
          return;
        }
      }
      const headers = { ...(dataSource.headers || {}) } as Record<string, string>;
      if (token) headers.Authorization = `Bearer ${token}`;
      const url = new URL(dataSource.url);
      Object.entries(dataSource.queryParams || {}).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      try {
        const response = await axios.get(url.toString(), { headers });
        setWidgetPreviewData(response.data);
        setWidgetPreviewError('');
      } catch (error: any) {
        setWidgetPreviewError(error?.message || '请求失败');
      }
    },
    [dataSources, decrypt, isPasswordUnlocked]
  );

  const detectArrayPaths = (data: any, prefix = ''): string[] => {
    if (!data || typeof data !== 'object') return [];
    const paths: string[] = [];
    Object.entries(data).forEach(([key, value]) => {
      const nextPath = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(value)) {
        paths.push(nextPath);
      } else if (value && typeof value === 'object') {
        paths.push(...detectArrayPaths(value, nextPath));
      }
    });
    return paths;
  };

  const getObjectKeys = (item: any): string[] => {
    if (!item || typeof item !== 'object') return [];
    return Object.keys(item);
  };

  const inferPreviewKeys = useCallback(
    (data: any) => {
      const result = {
        dataPaths: [] as string[],
        keys: [] as string[],
        numericKeys: [] as string[],
        textKeys: [] as string[],
      };
      if (!data) return result;
      if (Array.isArray(data)) {
        const sample = data[0];
        result.keys = getObjectKeys(sample);
        result.numericKeys = result.keys.filter((key) => typeof sample?.[key] === 'number');
        result.textKeys = result.keys.filter((key) => typeof sample?.[key] === 'string');
        return result;
      }
      if (typeof data === 'object') {
        const arrayPaths = detectArrayPaths(data);
        result.dataPaths = arrayPaths;
        if (arrayPaths.length > 0) {
          const firstPath = arrayPaths[0];
          const sampleArray = getValueByPath(data, firstPath) || [];
          const sample = Array.isArray(sampleArray) ? sampleArray[0] : undefined;
          result.keys = getObjectKeys(sample);
          result.numericKeys = result.keys.filter((key) => typeof sample?.[key] === 'number');
          result.textKeys = result.keys.filter((key) => typeof sample?.[key] === 'string');
          return result;
        }
        const keys = getObjectKeys(data);
        result.keys = keys;
        result.numericKeys = keys.filter((key) => typeof (data as any)[key] === 'number');
        result.textKeys = keys.filter((key) => typeof (data as any)[key] === 'string');
        return result;
      }
      return result;
    },
    []
  );

  const previewSuggestions = useMemo(() => {
    return inferPreviewKeys(widgetPreviewData);
  }, [inferPreviewKeys, widgetPreviewData]);

  const inferBestMapping = useCallback(() => {
    if (!widgetPreviewData) return;
    const dataPaths = previewSuggestions.dataPaths;
    const keys = previewSuggestions.keys;
    const numericKeys = previewSuggestions.numericKeys;
    const textKeys = previewSuggestions.textKeys;

    const timeCandidates = keys.filter((key) =>
      ['time', 'date', 'day', 'hour', 'timestamp', 'ts'].some((token) => key.toLowerCase().includes(token))
    );

    const bestPath = dataPaths[0] || '';
    const bestX = timeCandidates[0] || textKeys[0] || keys[0] || '';
    const bestY = numericKeys[0] || keys.find((key) => key !== bestX) || '';
    const bestValue = numericKeys[0] || '';

    if (bestPath) setWidgetAutoPath(bestPath);
    if (bestX) setWidgetAutoXKey(bestX);
    if (bestY) setWidgetAutoYKey(bestY);
    if (bestValue) setWidgetAutoValueKey(bestValue);
    if (widgetType === 'table') {
      setWidgetAutoColumns(keys.slice(0, 4));
    }
  }, [
    previewSuggestions.dataPaths,
    previewSuggestions.keys,
    previewSuggestions.numericKeys,
    previewSuggestions.textKeys,
    widgetPreviewData,
    widgetType,
  ]);

  const previewDataSeries = useMemo(() => {
    if (!widgetPreviewData) return [];
    const path = widgetAutoPath || widgetDataPath;
    const data = getValueByPath(widgetPreviewData, path) || widgetPreviewData;
    if (!Array.isArray(data)) return [];
    return data.slice(0, 20);
  }, [widgetAutoPath, widgetDataPath, widgetPreviewData]);

  useEffect(() => {
    const widgetList = widgets.filter((widget) => widget.type !== 'monitor' && widget.type !== 'webview');
    widgetList.forEach((widget) => {
      void fetchWidgetData(widget);
    });
    const interval = window.setInterval(() => {
      widgetList.forEach((widget) => {
        void fetchWidgetData(widget);
      });
    }, 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [widgets, fetchWidgetData]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1 rounded-lg">
              <Settings size={16} className="text-white" />
            </div>
            <h1 className="text-base font-bold tracking-tight">Project Hub</h1>
          </div>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索项目、资源、备忘录"
                className="pl-9 h-8 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommand(true)}
              className="gap-1 text-xs h-7"
            >
              <Command className="w-3 h-3" />
              命令面板
              <CommandShortcut>Ctrl+K</CommandShortcut>
            </Button>

            {hasPassword && (
              <Button
                variant={isPasswordUnlocked ? 'outline' : 'default'}
                size="sm"
                onClick={() => (isPasswordUnlocked ? lockPassword() : setShowUnlockDialog(true))}
                className="gap-1 text-xs h-7"
              >
                {isPasswordUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isPasswordUnlocked ? '已解锁' : '解锁'}
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
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {hasPassword ? '安全设置' : '设置密码'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  await createBackup('manual');
                  const settings = await getSettings();
                  await updateSettings({ lastBackupTime: Date.now() });
                  await pruneBackups(settings.backupRetention ?? 20);
                  toast.success('已创建备份');
                }}>
                  <DatabaseBackup className="w-4 h-4 mr-2" />
                  立即备份
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  导出数据
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportData}>
                  <Upload className="w-4 h-4 mr-2" />
                  导入数据
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
        {storageStats && (
          <div className="text-xs text-slate-500 flex flex-wrap gap-4">
            <span>项目 {storageStats.projectsCount}</span>
            <span>资源 {storageStats.resourcesCount}</span>
            <span>备忘录 {storageStats.memosCount}</span>
            <span>数据源 {storageStats.dataSourcesCount}</span>
            <span>组件 {storageStats.widgetsCount}</span>
            <span>预计占用 {storageStats.estimatedSize}</span>
          </div>
        )}

        {searchResults && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700">
                搜索结果
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-xs"
              >
                清除
              </Button>
            </div>

            <div className="grid gap-3">
              {searchResults.projectMatches.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">项目</div>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.projectMatches.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => setActiveProjectId(project.id)}
                        className="px-2 py-1 text-xs rounded border border-slate-200 bg-slate-50 hover:bg-slate-100"
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.resourceMatches.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">资源</div>
                  <div className="space-y-2">
                    {searchResults.resourceMatches.slice(0, 8).map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between text-sm border border-slate-100 rounded-md px-3 py-2"
                      >
                        <div>
                          <div className="font-medium text-slate-700">{resource.name}</div>
                          <div className="text-xs text-slate-500">
                            {projectNameById.get(resource.projectId) || '未分类'}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewResource(resource, resource.projectId)}
                        >
                          查看
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.widgetMatches.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">组件</div>
                  <div className="space-y-2">
                    {searchResults.widgetMatches.slice(0, 8).map((widget) => (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between text-sm border border-slate-100 rounded-md px-3 py-2"
                      >
                        <div>
                          <div className="font-medium text-slate-700">{widget.name}</div>
                          <div className="text-xs text-slate-500">
                            {projectNameById.get(widget.projectId) || '未分类'}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveProjectId(widget.projectId)}
                        >
                          查看
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.memoMatches.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">备忘录</div>
                  <div className="space-y-2">
                    {searchResults.memoMatches.slice(0, 8).map((memo) => (
                      <div
                        key={memo.id}
                        className="flex items-center justify-between text-sm border border-slate-100 rounded-md px-3 py-2"
                      >
                        <div>
                          <div className="font-medium text-slate-700">{memo.title}</div>
                          <div className="text-xs text-slate-500">
                            {projectNameById.get(memo.projectId) || '未分类'}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMemo(memo, memo.projectId)}
                        >
                          查看
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.projectMatches.length === 0 &&
                searchResults.resourceMatches.length === 0 &&
                searchResults.memoMatches.length === 0 &&
                searchResults.widgetMatches.length === 0 && (
                  <div className="text-xs text-slate-400">没有匹配的结果</div>
                )}
            </div>
          </div>
        )}
        {projects.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-slate-500 mb-4">还没有项目</p>
              <Button onClick={handleAddProject}>创建第一个项目</Button>
            </div>
          </div>
        ) : (
          projects.map((project) => {
            const resources = allResources.get(project.id) || [];
            const memos = allMemos.get(project.id) || [];
            const itemCount = resources.length + memos.length;

            return (
              <div key={project.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                {/* 项目头部 */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1 h-3.5 rounded-full"
                      style={{ backgroundColor: project.color || '#2563eb' }}
                    />
                    <h2 className="text-sm font-bold text-slate-700">{project.name}</h2>
                    <span className="text-xs text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded uppercase">
                      {itemCount} 项
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddWidget(project.id)}
                      className="h-5 w-5 p-0 text-slate-400 hover:text-emerald-600"
                      title="添加组件"
                    >
                      <DatabaseBackup size={14} />
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
                        <DropdownMenuItem onClick={() => handleAddWidget(project.id)}>
                          添加组件
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddDataSource(project.id)}>
                          添加数据源
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

                <Collapsible
                  open={!collapsedProjects[project.id]}
                  onOpenChange={(open) =>
                    setCollapsedProjects((prev) => ({ ...prev, [project.id]: !open }))
                  }
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Dashboard Widgets</div>
                      <span className="text-xs text-slate-400">{collapsedProjects[project.id] ? '展开' : '折叠'}</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-3 border-b border-slate-100 bg-slate-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Dashboard Widgets</div>
                    <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          模板
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => applyTemplate(project.id, 'ops')}>
                          运营概览（KPI + 趋势 + 监控）
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => applyTemplate(project.id, 'kpi-trend')}>
                          KPI + 趋势
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => applyTemplate(project.id, 'monitor')}>
                          监控面板
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => applyTemplate(project.id, 'web')}>
                          Web 统计
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddDataSource(project.id)}
                      className="h-7 text-xs"
                    >
                        添加数据源
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAddWidget(project.id)}
                        className="h-7 text-xs"
                      >
                        添加组件
                      </Button>
                    </div>
                  </div>
                  {(() => {
                    const projectWidgets = allWidgets.get(project.id) || [];
                    if (projectWidgets.length === 0) {
                      return <div className="text-xs text-slate-400">暂无组件</div>;
                    }
                    const layouts = getWidgetLayouts(project.id);
                    return (
                      <WidgetGrid
                        widgets={projectWidgets}
                        layouts={layouts}
                        onLayoutChange={(nextLayouts) => handleWidgetLayoutChange(project.id, nextLayouts)}
                        onEdit={handleEditWidget}
                        onDelete={handleDeleteWidget}
                        renderContent={renderWidgetContent}
                      />
                    );
                  })()}
                  </CollapsibleContent>
                </Collapsible>

                {/* 高密度网格 */}
                <Collapsible
                  open={!collapsedProjects[`${project.id}-resources`]}
                  onOpenChange={(open) =>
                    setCollapsedProjects((prev) => ({ ...prev, [`${project.id}-resources`]: !open }))
                  }
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>资源与备忘录</span>
                      <span>{collapsedProjects[`${project.id}-resources`] ? '展开' : '折叠'}</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-x-2 gap-y-4">
                  {/* 资源卡片 */}
                  {resources.map((resource) => (
                    <div key={resource.id} className="group relative flex flex-col items-center">
                      {resource.type === 'website' ? (
                        <button
                          onClick={() => handlePreviewResource(resource, project.id)}
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
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePreviewResource(resource, project.id)}
                          className="flex flex-col items-center w-full group/item"
                        >
                          <div className={`w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-transparent ${getResourceColor(resource)} transition-all mb-1.5 relative`}>
                            <span className="text-lg">{getResourceIcon(resource)}</span>
                            {resource.type === 'monitor' && (
                              <div className={`absolute -top-1 -right-1 p-0.5 rounded-full shadow-sm ${
                                resource.monitorLastOk === true
                                  ? 'bg-green-600'
                                  : resource.monitorLastOk === false
                                  ? 'bg-red-600'
                                  : 'bg-slate-300'
                              }`}></div>
                            )}
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
                        <Trash2 size={10} />
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
                          {memo.isEncrypted && <Lock className="w-4 h-4 text-amber-600" />}
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
                        <Trash2 size={10} />
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
                    <span className="text-xs text-slate-300 group-hover/add:text-blue-400">添加</span>
                  </button>
                </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })
        )}
      </main>

      <CommandDialog open={showCommand} onOpenChange={setShowCommand}>
        <CommandInput placeholder="搜索命令或资源..." />
        <CommandList>
          <CommandEmpty>没有找到匹配的结果</CommandEmpty>
          <CommandGroup heading="快捷操作">
            <CommandItem
              onSelect={() => {
                setShowCommand(false);
                handleAddProject();
              }}
            >
              新建项目
              <CommandShortcut>Ctrl+N</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setShowCommand(false);
                if (projects[0]) {
                  handleAddResource(projects[0].id);
                }
              }}
            >
              添加资源
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setShowCommand(false);
                if (projects[0]) {
                  handleAddMemo(projects[0].id);
                }
              }}
            >
              添加备忘录
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="数据管理">
            <CommandItem
              onSelect={async () => {
                setShowCommand(false);
                await createBackup('manual');
                const settings = await getSettings();
                await updateSettings({ lastBackupTime: Date.now() });
                await pruneBackups(settings.backupRetention ?? 20);
                toast.success('已创建备份');
              }}
            >
              创建备份
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setShowCommand(false);
                void handleExportData();
              }}
            >
              导出数据
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setShowCommand(false);
                void handleImportData();
              }}
            >
              导入数据
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="安全">
            <CommandItem
              onSelect={() => {
                setShowCommand(false);
                setShowPasswordDialog(true);
              }}
            >
              安全设置
            </CommandItem>
            {hasPassword && (
              <CommandItem
                onSelect={() => {
                  setShowCommand(false);
                  if (isPasswordUnlocked) {
                    lockPassword();
                  } else {
                    setShowUnlockDialog(true);
                  }
                }}
              >
                {isPasswordUnlocked ? '锁定' : '解锁'}
              </CommandItem>
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="项目">
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                onSelect={() => {
                  setShowCommand(false);
                  setActiveProjectId(project.id);
                }}
              >
                {project.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* 数据源对话框 */}
      <Dialog open={showDataSourceDialog} onOpenChange={setShowDataSourceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDataSource ? '编辑数据源' : '添加数据源'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">名称</label>
              <Input value={dataSourceName} onChange={(e) => setDataSourceName(e.target.value)} placeholder="数据源名称" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">URL</label>
              <Input value={dataSourceUrl} onChange={(e) => setDataSourceUrl(e.target.value)} placeholder="https://api.example.com/data" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">Headers (每行 key: value)</label>
              <Textarea value={dataSourceHeaders} onChange={(e) => setDataSourceHeaders(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">Query Params (每行 key: value)</label>
              <Textarea value={dataSourceQuery} onChange={(e) => setDataSourceQuery(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">认证方式</label>
                <Select value={dataSourceAuthType} onValueChange={(val) => setDataSourceAuthType(val as any)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">TTL (秒)</label>
                <Input value={dataSourceTtl} onChange={(e) => setDataSourceTtl(e.target.value)} placeholder="300" />
              </div>
            </div>
            {dataSourceAuthType === 'bearer' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">Token</label>
                <Input value={dataSourceToken} onChange={(e) => setDataSourceToken(e.target.value)} placeholder="输入 Token" />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              {editingDataSource && (
                <Button variant="destructive" onClick={() => handleDeleteDataSource(editingDataSource.id)}>
                  删除
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowDataSourceDialog(false)}>取消</Button>
              <Button onClick={handleSaveDataSource}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 组件对话框 */}
      <Dialog open={showWidgetDialog} onOpenChange={setShowWidgetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWidget ? '编辑组件' : '添加组件'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">名称</label>
              <Input value={widgetName} onChange={(e) => setWidgetName(e.target.value)} placeholder="组件名称" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">类型</label>
              <Select value={widgetType} onValueChange={(val) => setWidgetType(val as any)}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">折线图</SelectItem>
                  <SelectItem value="area">面积图</SelectItem>
                  <SelectItem value="bar">柱状图</SelectItem>
                  <SelectItem value="kpi">KPI</SelectItem>
                  <SelectItem value="table">表格</SelectItem>
                  <SelectItem value="webview">Webview</SelectItem>
                  <SelectItem value="monitor">监控</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {widgetType !== 'monitor' && widgetType !== 'webview' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">数据源</label>
                <Select value={widgetDataSourceId} onValueChange={(val) => setWidgetDataSourceId(val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="选择数据源" />
                  </SelectTrigger>
                  <SelectContent>
                    {(activeProjectId ? allDataSources.get(activeProjectId) || [] : []).map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {widgetType === 'monitor' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">监控资源</label>
                <Select value={widgetResourceId} onValueChange={(val) => setWidgetResourceId(val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="选择监控资源" />
                  </SelectTrigger>
                  <SelectContent>
                    {(activeProjectId ? allResources.get(activeProjectId) || [] : [])
                      .filter((resource: any) => resource.type === 'monitor')
                      .map((resource: any) => (
                        <SelectItem key={resource.id} value={resource.id}>{resource.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {widgetType === 'webview' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">URL</label>
                <Input value={widgetUrl} onChange={(e) => setWidgetUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            )}

            {widgetType === 'webview' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">选择器 (可选)</label>
                  <Input
                    value={widgetWebviewSelector}
                    onChange={(e) => setWidgetWebviewSelector(e.target.value)}
                    placeholder=".metric-value"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">属性 (可选)</label>
                  <Input
                    value={widgetWebviewAttr}
                    onChange={(e) => setWidgetWebviewAttr(e.target.value)}
                    placeholder="data-value"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">脚本 (可选，优先)</label>
                  <Textarea
                    value={widgetWebviewScript}
                    onChange={(e) => setWidgetWebviewScript(e.target.value)}
                    rows={4}
                    placeholder="return document.querySelector('.metric').textContent;"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">刷新间隔 (秒)</label>
                  <Input
                    value={widgetRefreshSec}
                    onChange={(e) => setWidgetRefreshSec(e.target.value)}
                    placeholder="300"
                  />
                </div>
              </>
            )}

            {(widgetType === 'line' || widgetType === 'area' || widgetType === 'bar' || widgetType === 'table') && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">数据路径 (可选)</label>
                  <Input value={widgetDataPath} onChange={(e) => setWidgetDataPath(e.target.value)} placeholder="data.items" />
                </div>
              </>
            )}

            {(widgetType === 'line' || widgetType === 'area' || widgetType === 'bar') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">X 字段</label>
                  <Input value={widgetXKey} onChange={(e) => setWidgetXKey(e.target.value)} placeholder="x" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">Y 字段</label>
                  <Input value={widgetYKey} onChange={(e) => setWidgetYKey(e.target.value)} placeholder="y" />
                </div>
              </div>
            )}

            {widgetType === 'kpi' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">Value 字段</label>
                <Input value={widgetValueKey} onChange={(e) => setWidgetValueKey(e.target.value)} placeholder="metrics.total" />
              </div>
            )}

            {widgetType === 'table' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">列 (逗号分隔)</label>
                <Input value={widgetColumns} onChange={(e) => setWidgetColumns(e.target.value)} placeholder="name, value, status" />
              </div>
            )}

            {widgetType !== 'monitor' && widgetType !== 'webview' && widgetDataSourceId && (
              <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase">数据预览</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchDataSourcePreview(widgetDataSourceId)}
                      className="h-7 text-xs"
                    >
                      测试加载
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={inferBestMapping}
                      className="h-7 text-xs"
                      disabled={!widgetPreviewData}
                    >
                      智能识别
                    </Button>
                  </div>
                </div>
                {widgetPreviewError && (
                  <div className="text-xs text-red-500">{widgetPreviewError}</div>
                )}
                {widgetPreviewData && (
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap max-h-40 overflow-auto">
                    {JSON.stringify(widgetPreviewData, null, 2)}
                  </pre>
                )}
                {widgetPreviewData && (
                  <div className="mt-3 border-t border-slate-200 pt-3 space-y-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase">智能映射</div>
                    {previewSuggestions.dataPaths.length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">数据路径建议</label>
                        <Select value={widgetAutoPath} onValueChange={(val) => setWidgetAutoPath(val)}>
                          <SelectTrigger className="bg-white border-slate-200">
                            <SelectValue placeholder="选择数据路径" />
                          </SelectTrigger>
                          <SelectContent>
                            {previewSuggestions.dataPaths.map((path) => (
                              <SelectItem key={path} value={path}>{path}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(widgetType === 'line' || widgetType === 'area' || widgetType === 'bar') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">X 字段建议</label>
                          <Select value={widgetAutoXKey} onValueChange={(val) => setWidgetAutoXKey(val)}>
                            <SelectTrigger className="bg-white border-slate-200">
                              <SelectValue placeholder="选择 X 字段" />
                            </SelectTrigger>
                            <SelectContent>
                              {previewSuggestions.keys.map((key) => (
                                <SelectItem key={key} value={key}>{key}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">Y 字段建议</label>
                          <Select value={widgetAutoYKey} onValueChange={(val) => setWidgetAutoYKey(val)}>
                            <SelectTrigger className="bg-white border-slate-200">
                              <SelectValue placeholder="选择 Y 字段" />
                            </SelectTrigger>
                            <SelectContent>
                              {previewSuggestions.numericKeys.map((key) => (
                                <SelectItem key={key} value={key}>{key}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {widgetType === 'kpi' && (
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">Value 字段建议</label>
                        <Select value={widgetAutoValueKey} onValueChange={(val) => setWidgetAutoValueKey(val)}>
                          <SelectTrigger className="bg-white border-slate-200">
                            <SelectValue placeholder="选择 Value 字段" />
                          </SelectTrigger>
                          <SelectContent>
                            {previewSuggestions.numericKeys.map((key) => (
                              <SelectItem key={key} value={key}>{key}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {widgetType === 'table' && (
                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">列字段建议</label>
                        <div className="flex flex-wrap gap-2">
                          {previewSuggestions.keys.map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setWidgetAutoColumns((prev) =>
                                  prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
                                );
                              }}
                              className={`px-2 py-1 text-xs rounded border ${
                                widgetAutoColumns.includes(key)
                                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                                  : 'border-slate-200 text-slate-600'
                              }`}
                            >
                              {key}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 justify-between">
                      {(widgetType === 'line' || widgetType === 'area' || widgetType === 'bar') && previewDataSeries.length > 0 && (
                        <div className="flex-1">
                          <div className="text-xs text-slate-500 mb-1">图表预览</div>
                          <div className="h-36">
                            <ChartContainer
                              config={{ preview: { label: 'Preview', color: '#1d4ed8' } }}
                              className="h-full"
                            >
                              <AreaChart data={previewDataSeries}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={widgetAutoXKey || widgetXKey} />
                                <YAxis />
                                <Area type="monotone" dataKey={widgetAutoYKey || widgetYKey} stroke="#1d4ed8" fill="#1d4ed833" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                              </AreaChart>
                            </ChartContainer>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (widgetAutoPath) setWidgetDataPath(widgetAutoPath);
                            if (widgetAutoXKey) setWidgetXKey(widgetAutoXKey);
                            if (widgetAutoYKey) setWidgetYKey(widgetAutoYKey);
                            if (widgetAutoValueKey) setWidgetValueKey(widgetAutoValueKey);
                            if (widgetAutoColumns.length > 0) setWidgetColumns(widgetAutoColumns.join(', '));
                          }}
                        >
                          应用映射
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              {editingWidget && (
                <Button variant="destructive" onClick={() => handleDeleteWidget(editingWidget.id)}>
                  删除
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowWidgetDialog(false)}>取消</Button>
              <Button onClick={handleSaveWidget}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">负责人</label>
                <Input
                  value={projectOwner}
                  onChange={(e) => setProjectOwner(e.target.value)}
                  placeholder="负责人/Owner"
                />
              </div>
              <div>
                <label className="text-sm font-medium">业务线</label>
                <Input
                  value={projectBusinessUnit}
                  onChange={(e) => setProjectBusinessUnit(e.target.value)}
                  placeholder="业务线/部门"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">密级</label>
                <Select value={projectConfidentiality} onValueChange={(val) => setProjectConfidentiality(val as any)}>
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
                  value={projectSource}
                  onChange={(e) => setProjectSource(e.target.value)}
                  placeholder="来源系统/负责人"
                />
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

      {/* 资源类型选择对话框 */}
      <Dialog open={showResourceTypeDialog} onOpenChange={setShowResourceTypeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择资源类型</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleSelectResourceType('website')}
              className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <Globe className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">网站</span>
            </button>
            <button
              onClick={() => handleSelectResourceType('api')}
              className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <Code2 className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">API</span>
            </button>
            <button
              onClick={() => handleSelectResourceType('credential')}
              className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <Key className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">凭证</span>
            </button>
            <button
              onClick={() => handleSelectResourceType('monitor')}
              className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <Activity className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">监控</span>
            </button>
            <button
              onClick={() => handleSelectResourceType('document')}
              className="flex flex-col items-center gap-2 p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <FileText className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">文档</span>
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
                  <div className="bg-slate-50 border border-slate-200 rounded-md overflow-hidden">
                    <div className="flex">
                      <Select value={urlProtocol} onValueChange={(val) => setUrlProtocol((val as 'http' | 'https'))}>
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
                          const { protocol, url } = parseUrlInput(e.target.value, urlProtocol);
                          setUrlProtocol(protocol);
                          setResourceUrl(url);
                        }}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text');
                          const { protocol, url } = parseUrlInput(pasted, urlProtocol);
                          setUrlProtocol(protocol);
                          setResourceUrl(url);
                          e.preventDefault();
                        }}
                        placeholder="github.com"
                        className="bg-transparent border-0 flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    账号（可选）
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入账号/用户名"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    密码（可选）
                  </label>
                  <Input
                    type="password"
                    value={passwordField}
                    onChange={(e) => setPasswordField(e.target.value)}
                    placeholder="输入密码"
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

              </>
            )}

            {selectedResourceType === 'credential' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    账号（可选）
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入账号/用户名"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    密码（可选）
                  </label>
                  <Input
                    type="password"
                    value={passwordField}
                    onChange={(e) => setPasswordField(e.target.value)}
                    placeholder="输入密码"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </>
            )}

            {selectedResourceType === 'document' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    文档 URL（可选）
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-md overflow-hidden">
                    <div className="flex">
                      <Select value={urlProtocol} onValueChange={(val) => setUrlProtocol((val as 'http' | 'https'))}>
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
                          const { protocol, url } = parseUrlInput(e.target.value, urlProtocol);
                          setUrlProtocol(protocol);
                          setResourceUrl(url);
                        }}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text');
                          const { protocol, url } = parseUrlInput(pasted, urlProtocol);
                          setUrlProtocol(protocol);
                          setResourceUrl(url);
                          e.preventDefault();
                        }}
                        placeholder="docs.example.com"
                        className="bg-transparent border-0 flex-1"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedResourceType === 'monitor' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    存活检查 URL
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-md overflow-hidden">
                    <div className="flex">
                      <Select value={monitorProtocol} onValueChange={(val) => setMonitorProtocol((val as 'http' | 'https'))}>
                        <SelectTrigger className="rounded-none border-0 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="http">http://</SelectItem>
                          <SelectItem value="https">https://</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={monitorUrl}
                        onChange={(e) => {
                          const { protocol, url } = parseUrlInput(e.target.value, monitorProtocol);
                          setMonitorProtocol(protocol);
                          setMonitorUrl(url);
                        }}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text');
                          const { protocol, url } = parseUrlInput(pasted, monitorProtocol);
                          setMonitorProtocol(protocol);
                          setMonitorUrl(url);
                          e.preventDefault();
                        }}
                        placeholder="status.example.com/health"
                        className="bg-transparent border-0 flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    检测时间间隔（分钟）
                  </label>
                  <Input
                    value={monitorIntervalMinutes}
                    onChange={(e) => setMonitorIntervalMinutes(e.target.value)}
                    placeholder="例如：5"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                描述
              </label>
              <Input
                value={resourceDesc}
                onChange={(e) => setResourceDesc(e.target.value)}
                placeholder="资源描述（可选）"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  图标模式
                </label>
                <Select value={resourceIconMode} onValueChange={(val) => setResourceIconMode(val as any)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动抓取</SelectItem>
                    <SelectItem value="builtin">内置图标</SelectItem>
                    <SelectItem value="custom">自定义图标</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  内置图标
                </label>
                <Select value={resourceIconName} onValueChange={(val) => setResourceIconName(val as any)} disabled={resourceIconMode !== 'builtin'}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="选择图标" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="globe">Globe</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="key">Key</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {resourceIconMode === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    图标 URL
                  </label>
                  <Input
                    value={resourceIconUrl}
                    onChange={(e) => setResourceIconUrl(e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                    上传图片
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result as string;
                        setResourceIconUrl(result);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  负责人
                </label>
                <Input
                  value={resourceOwner}
                  onChange={(e) => setResourceOwner(e.target.value)}
                  placeholder="负责人/Owner"
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  业务线
                </label>
                <Input
                  value={resourceBusinessUnit}
                  onChange={(e) => setResourceBusinessUnit(e.target.value)}
                  placeholder="业务线/部门"
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  密级
                </label>
                <Select value={resourceConfidentiality} onValueChange={(val) => setResourceConfidentiality(val as any)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
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
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  来源
                </label>
                <Input
                  value={resourceSource}
                  onChange={(e) => setResourceSource(e.target.value)}
                  placeholder="来源系统/负责人"
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowResourceDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSaveResource}>确认</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 资源预览对话框 */}
      <Dialog open={showResourcePreview} onOpenChange={setShowResourcePreview}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-between">
            <DialogHeader className="flex-1">
              <DialogTitle>{previewingResource?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              {previewingResource?.type === 'website' && previewingResource?.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.open(previewingResource.url, '_blank');
                  }}
                  className="h-8 w-8 p-0"
                  title="访问网站"
                >
                  <ExternalLink size={16} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResourcePreview(false);
                  setTimeout(() => {
                    if (activeProjectId) {
                      handleEditResource(previewingResource, activeProjectId);
                    }
                  }, 200);
                }}
                className="h-8 w-8 p-0"
                title="编辑"
              >
                <Settings size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {previewingResource?.type === 'website' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">URL</label>
                  <div className="text-sm text-slate-600 break-all mt-1 flex items-center justify-between gap-2">
                    <a href={previewingResource?.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1">
                      {previewingResource?.url}
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(previewingResource?.url, '_blank')}
                      className="h-7 w-7 p-0"
                      title="打开网站"
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
                {previewingResource?.username && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">用户名</label>
                    <div className="text-sm text-slate-600 mt-1 break-all flex items-center justify-between gap-2">
                      <span className="flex-1 break-all">{previewingResource?.username}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await copyToClipboard(previewingResource?.username);
                            toast.success('用户名已复制');
                          } catch (error) {
                            toast.error('复制失败');
                          }
                        }}
                        className="h-7 w-7 p-0"
                        title="复制用户名"
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                )}
                {previewingResource?.password && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">密码</label>
                    <div className="text-sm text-slate-600 mt-1 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const newState = { ...previewingResource };
                          newState.showPassword = !newState.showPassword;
                          setPreviewingResource(newState);
                        }}
                        className="hover:text-blue-600 cursor-pointer"
                        title="显示/隐藏密码"
                      >
                        {previewingResource?.showPassword ? previewingResource?.password : '••••••••'}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await copyToClipboard(previewingResource?.password);
                            toast.success('密码已复制');
                          } catch (error) {
                            toast.error('复制失败');
                          }
                        }}
                        className="h-7 w-7 p-0"
                        title="复制密码"
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                )}
                {previewingResource?.description && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">描述</label>
                    <div className="text-sm text-slate-600 mt-1">{previewingResource?.description}</div>
                  </div>
                )}
                {previewingResource?.tags && previewingResource?.tags.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">标签</label>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {previewingResource?.tags.map((tag: string) => (
                        <span key={tag} className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}


            {previewingResource?.type === 'api' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">API Key</label>
                  <div className="text-sm text-slate-600 mt-1 flex items-center justify-between gap-2">
                    <span className="break-all flex-1">{previewingResource?.apiKey}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await copyToClipboard(previewingResource?.apiKey || '');
                          toast.success('API Key 已复制');
                        } catch {
                          toast.error('复制失败');
                        }
                      }}
                      className="h-7 w-7 p-0"
                      title="复制 API Key"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
                {previewingResource?.apiSecret && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">API Secret</label>
                    <div className="text-sm text-slate-600 mt-1 flex items-center justify-between gap-2">
                      <span className="break-all flex-1">
                        {previewingResource?.showApiSecret ? previewingResource?.apiSecret : '••••••••'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await copyToClipboard(previewingResource?.apiSecret || '');
                              toast.success('API Secret 已复制');
                            } catch {
                              toast.error('复制失败');
                            }
                          }}
                          className="h-7 w-7 p-0"
                          title="复制 API Secret"
                        >
                          <Copy size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newState = { ...previewingResource };
                            newState.showApiSecret = !newState.showApiSecret;
                            setPreviewingResource(newState);
                          }}
                          className="h-7 w-7 p-0"
                          title={previewingResource?.showApiSecret ? '隐藏' : '显示'}
                        >
                          {previewingResource?.showApiSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {previewingResource?.apiEndpoint && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">API 端点</label>
                    <div className="text-sm text-slate-600 mt-1 break-all flex items-center justify-between gap-2">
                      <span className="break-all flex-1">{previewingResource?.apiEndpoint}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await copyToClipboard(previewingResource?.apiEndpoint || '');
                            toast.success('API 端点已复制');
                          } catch {
                            toast.error('复制失败');
                          }
                        }}
                      className="h-7 w-7 p-0"
                        title="复制 API 端点"
                      >
                      <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                )}
                {previewingResource?.description && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">描述</label>
                    <div className="text-sm text-slate-600 mt-1">{previewingResource?.description}</div>
                  </div>
                )}
              </>
            )}

            {previewingResource?.type === 'monitor' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">检查 URL</label>
                  <div className="text-sm text-slate-600 break-all mt-1">
                    {previewingResource?.monitorUrl || previewingResource?.url}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">检测间隔</label>
                    <div className="text-sm text-slate-600 mt-1">
                      {Math.max(1, Math.round((previewingResource?.monitorIntervalSec || 300) / 60))} 分钟
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">当前状态</label>
                    <div className={`text-xs inline-flex items-center mt-1 px-2 py-0.5 rounded ${
                      previewingResource?.monitorLastOk === true
                        ? 'bg-green-100 text-green-700'
                        : previewingResource?.monitorLastOk === false
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {previewingResource?.monitorLastOk === true
                        ? 'UP'
                        : previewingResource?.monitorLastOk === false
                        ? 'DOWN'
                        : '未知'}
                    </div>
                  </div>
                </div>

                <Collapsible
                  open={!collapsedMonitorCharts[previewingResource?.id || 'monitor']}
                  onOpenChange={(open) =>
                    setCollapsedMonitorCharts((prev) => ({
                      ...prev,
                      [previewingResource?.id || 'monitor']: !open,
                    }))
                  }
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>健康历史</span>
                      <span>{collapsedMonitorCharts[previewingResource?.id || 'monitor'] ? '展开' : '折叠'}</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ChartContainer
                      config={{
                        status: { label: '状态', color: '#22c55e' },
                      }}
                      className="h-40 mt-2"
                    >
                      <AreaChart
                        data={(previewingResource?.monitorHistory || []).map((d: any) => ({
                          timestamp: d.timestamp,
                          status: d.ok ? 1 : 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(v) =>
                            new Date(v).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })
                          }
                        />
                        <YAxis domain={[0, 1]} tickFormatter={(v) => (v === 1 ? 'UP' : 'DOWN')} />
                        <Area type="monotone" dataKey="status" stroke="#22c55e" fill="#22c55e33" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </AreaChart>
                    </ChartContainer>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            {previewingResource?.type === 'credential' && (
              <>
                {previewingResource?.username && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">账号</label>
                    <div className="text-sm text-slate-600 mt-1 break-all flex items-center justify-between gap-2">
                      <span className="flex-1 break-all">{previewingResource?.username}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await copyToClipboard(previewingResource?.username);
                            toast.success('账号已复制');
                          } catch {
                            toast.error('复制失败');
                          }
                        }}
                        className="h-7 w-7 p-0"
                        title="复制账号"
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                )}
                {previewingResource?.password && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">密码</label>
                    <div className="text-sm text-slate-600 mt-1 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const newState = { ...previewingResource };
                          newState.showPassword = !newState.showPassword;
                          setPreviewingResource(newState);
                        }}
                        className="hover:text-blue-600 cursor-pointer"
                        title="显示/隐藏密码"
                      >
                        {previewingResource?.showPassword ? previewingResource?.password : '••••••••'}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await copyToClipboard(previewingResource?.password);
                            toast.success('密码已复制');
                          } catch {
                            toast.error('复制失败');
                          }
                        }}
                        className="h-7 w-7 p-0"
                        title="复制密码"
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {previewingResource?.type === 'document' && previewingResource?.url && (
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">文档 URL</label>
                <div className="text-sm text-slate-600 break-all mt-1 flex items-center justify-between gap-2">
                  <a href={previewingResource?.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1">
                    {previewingResource?.url}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(previewingResource?.url, '_blank')}
                    className="h-7 w-7 p-0"
                    title="打开文档"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>
            )}

            {previewingResource?.metadata && (
              <div className="grid grid-cols-2 gap-3">
                {previewingResource?.metadata?.owner && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">负责人</label>
                    <div className="text-sm text-slate-600 mt-1">{previewingResource?.metadata?.owner}</div>
                  </div>
                )}
                {previewingResource?.metadata?.businessUnit && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">业务线</label>
                    <div className="text-sm text-slate-600 mt-1">{previewingResource?.metadata?.businessUnit}</div>
                  </div>
                )}
                {previewingResource?.metadata?.confidentiality && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">密级</label>
                    <div className="text-sm text-slate-600 mt-1">{previewingResource?.metadata?.confidentiality}</div>
                  </div>
                )}
                {previewingResource?.metadata?.source && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">来源</label>
                    <div className="text-sm text-slate-600 mt-1">{previewingResource?.metadata?.source}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowResourcePreview(false)}>
                关闭
              </Button>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  负责人
                </label>
                <Input
                  value={memoOwner}
                  onChange={(e) => setMemoOwner(e.target.value)}
                  placeholder="负责人/Owner"
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  业务线
                </label>
                <Input
                  value={memoBusinessUnit}
                  onChange={(e) => setMemoBusinessUnit(e.target.value)}
                  placeholder="业务线/部门"
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  密级
                </label>
                <Select value={memoConfidentiality} onValueChange={(val) => setMemoConfidentiality(val as any)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
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
                <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                  来源
                </label>
                <Input
                  value={memoSource}
                  onChange={(e) => setMemoSource(e.target.value)}
                  placeholder="来源系统/负责人"
                  className="bg-slate-50 border-slate-200"
                />
              </div>
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
              <Button onClick={handleSaveMemo}>确认</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 密码设置对话框 */}
      <Dialog
        open={showPasswordDialog}
        onOpenChange={(open) => {
          if (!hasPassword && !open) {
            return;
          }
          setShowPasswordDialog(open);
        }}
      >
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
                placeholder="至少 10 个字符"
                className="bg-slate-50 border-slate-200"
              />
              <p className="text-xs text-slate-400 mt-2">
                密码用于加密敏感信息，请妥善保管
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase ml-1 mb-1 block">
                自动锁定时间（分钟）
              </label>
              <Input
                type="number"
                min={5}
                max={240}
                value={autoLockMinutes}
                onChange={(e) => updateAutoLockMinutes(Number(e.target.value))}
                className="bg-slate-50 border-slate-200"
              />
              <p className="text-xs text-slate-400 mt-2">
                空闲超过该时间将自动锁定
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                disabled={!hasPassword}
              >
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
