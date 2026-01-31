/**
 * Storage v2 - IndexedDB
 *
 * Features:
 * - IndexedDB persistence with versioned schema
 * - Migration from legacy LocalStorage v1
 * - Export/Import with checksum
 * - Backup retention
 */

import { EncryptedData } from './encryption';
import {
  clearStore,
  countAll,
  deleteItem,
  deleteItems,
  exportStore,
  getAll,
  getAllFromIndex,
  getItem,
  putItem,
  putItems,
} from './db';

export type Confidentiality = 'public' | 'internal' | 'confidential' | 'secret';

export interface Metadata {
  owner?: string;
  businessUnit?: string;
  confidentiality?: Confidentiality;
  source?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  metadata?: Metadata;
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
}

export type ResourceType =
  | 'website'
  | 'api'
  | 'monitor'
  | 'credential'
  | 'document'
  | 'note';

export interface Resource {
  id: string;
  projectId: string;
  name: string;
  type: ResourceType;
  description?: string;
  icon?: string;
  iconType?: 'auto' | 'builtin' | 'custom';
  iconName?: 'globe' | 'link' | 'key' | 'code' | 'activity' | 'file';
  url?: string;
  tags?: string[];
  metadata?: Metadata;
  createdAt: number;
  updatedAt: number;
  // Credential fields
  username?: string;
  password?: string;
  passwordEncrypted?: EncryptedData;
  // API fields
  apiKey?: string;
  apiSecret?: string;
  apiKeyEncrypted?: EncryptedData;
  apiSecretEncrypted?: EncryptedData;
  apiEndpoint?: string;
  apiHeaders?: Record<string, string>;
  // Monitor fields
  monitorUrl?: string;
  monitorIntervalSec?: number;
  monitorHistory?: { timestamp: number; ok: boolean; latencyMs?: number }[];
  monitorLastOk?: boolean;
  // Note / document content
  content?: string;
  contentEncrypted?: EncryptedData;
  isEncrypted?: boolean;
}

export interface Memo {
  id: string;
  projectId: string;
  title: string;
  content: string;
  isEncrypted: boolean;
  encryptedData?: EncryptedData;
  category?: string;
  metadata?: Metadata;
  createdAt: number;
  updatedAt: number;
}

export interface DataSource {
  id: string;
  projectId: string;
  name: string;
  url: string;
  method: 'GET';
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  authType?: 'none' | 'bearer';
  tokenEncrypted?: EncryptedData;
  createdAt: number;
  updatedAt: number;
  ttlSec?: number;
  lastSuccessAt?: number;
}

export type WidgetType = 'line' | 'area' | 'bar' | 'kpi' | 'table' | 'webview' | 'monitor';

export interface WidgetCache {
  data?: unknown;
  status?: 'ok' | 'stale' | 'error' | 'locked';
  updatedAt?: number;
  error?: string;
}

export interface WidgetLayout {
  lg?: { x: number; y: number; w: number; h: number };
  md?: { x: number; y: number; w: number; h: number };
  sm?: { x: number; y: number; w: number; h: number };
}

export interface Widget {
  id: string;
  projectId: string;
  name: string;
  type: WidgetType;
  dataSourceId?: string;
  resourceId?: string;
  config?: Record<string, any>;
  layout?: WidgetLayout;
  cache?: WidgetCache;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme?: 'light' | 'dark';
  hasPassword?: boolean;
  passwordVerificationData?: EncryptedData;
  lastBackupTime?: number;
  autoLockMinutes?: number;
  backupRetention?: number;
  schemaVersion?: number;
}

interface SettingsRecord<T> {
  key: string;
  value: T;
}

export interface ExportedData {
  version: string;
  schemaVersion: number;
  exportedAt: number;
  projects: Project[];
  resources: Resource[];
  memos: Memo[];
  dataSources: DataSource[];
  widgets: Widget[];
  settings: AppSettings;
  checksum?: string;
}

export interface BackupRecord {
  id: string;
  createdAt: number;
  label?: string;
  data: ExportedData;
  checksum: string;
}

const CURRENT_SCHEMA_VERSION = 3;
const CURRENT_EXPORT_VERSION = '2.1.0';
const SETTINGS_KEY = 'app';

function readLegacyJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function initStorage(): Promise<void> {
  const settings = await getSettings();
  if ((settings.schemaVersion || 0) >= CURRENT_SCHEMA_VERSION) {
    return;
  }

  const legacyProjects = readLegacyJSON<Project[]>('pm-projects', []);
  const legacyWebsites = readLegacyJSON<Resource[]>('pm-websites', []);
  const legacyMemos = readLegacyJSON<Memo[]>('pm-memos', []);
  const legacySettings = readLegacyJSON<AppSettings>('pm-app-settings', {});

  if (legacyProjects.length || legacyWebsites.length || legacyMemos.length) {
    const normalizedProjects = legacyProjects.map((project) => ({
      ...project,
      updatedAt: project.updatedAt || project.createdAt || Date.now(),
    }));

    const normalizedResources = legacyWebsites.map((resource) => ({
      ...resource,
      type: resource.type || 'website',
      updatedAt: resource.updatedAt || resource.createdAt || Date.now(),
      createdAt: resource.createdAt || Date.now(),
    }));

    const normalizedMemos = legacyMemos.map((memo) => ({
      ...memo,
      updatedAt: memo.updatedAt || memo.createdAt || Date.now(),
      createdAt: memo.createdAt || Date.now(),
    }));

    await putItems('projects', normalizedProjects);
    await putItems('resources', normalizedResources);
    await putItems('memos', normalizedMemos);

    const mergedSettings: AppSettings = {
      ...legacySettings,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      autoLockMinutes: legacySettings.autoLockMinutes ?? 15,
      backupRetention: legacySettings.backupRetention ?? 20,
    };
    await saveSettings(mergedSettings);
  } else {
    await saveSettings({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      autoLockMinutes: 15,
      backupRetention: 20,
    });
  }
}

// ============ 项目操作 ============

export async function getProjects(): Promise<Project[]> {
  return getAll<Project>('projects');
}

export async function saveProjects(projects: Project[]): Promise<void> {
  await clearStore('projects');
  await putItems('projects', projects);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  return getItem<Project>('projects', id);
}

export async function addProject(project: Project): Promise<void> {
  await putItem('projects', project);
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const existing = await getProjectById(id);
  if (!existing) return;
  await putItem('projects', { ...existing, ...updates, updatedAt: Date.now() });
}

export async function deleteProject(id: string): Promise<void> {
  await deleteItem('projects', id);
  await deleteResourcesByProjectId(id);
  await deleteMemosByProjectId(id);
}

// ============ 资源操作 ============

export async function getResources(): Promise<Resource[]> {
  return getAll<Resource>('resources');
}

export async function saveResources(resources: Resource[]): Promise<void> {
  await clearStore('resources');
  await putItems('resources', resources);
}

export async function getResourcesByProjectId(projectId: string): Promise<Resource[]> {
  return getAllFromIndex<Resource>('resources', 'projectId', projectId);
}

export async function getResourceById(id: string): Promise<Resource | undefined> {
  return getItem<Resource>('resources', id);
}

export async function addResource(resource: Resource): Promise<void> {
  await putItem('resources', resource);
}

export async function updateResource(id: string, updates: Partial<Resource>): Promise<void> {
  const existing = await getResourceById(id);
  if (!existing) return;
  await putItem('resources', { ...existing, ...updates, updatedAt: Date.now() });
}

export async function deleteResource(id: string): Promise<void> {
  await deleteItem('resources', id);
}

export async function deleteResourcesByProjectId(projectId: string): Promise<void> {
  const resources = await getResourcesByProjectId(projectId);
  const ids = resources.map((resource) => resource.id);
  if (ids.length) {
    await deleteItems('resources', ids);
  }
}

export async function bulkUpdateResources(
  ids: string[],
  updates: Partial<Resource>
): Promise<void> {
  const resources = await Promise.all(ids.map((id) => getResourceById(id)));
  const updated = resources
    .filter((resource): resource is Resource => !!resource)
    .map((resource) => ({
      ...resource,
      ...updates,
      updatedAt: Date.now(),
    }));
  if (updated.length) {
    await putItems('resources', updated);
  }
}

export async function bulkDeleteResources(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await deleteItems('resources', ids);
}

// ============ 备忘录操作 ============

export async function getMemos(): Promise<Memo[]> {
  return getAll<Memo>('memos');
}

export async function saveMemos(memos: Memo[]): Promise<void> {
  await clearStore('memos');
  await putItems('memos', memos);
}

export async function getMemosByProjectId(projectId: string): Promise<Memo[]> {
  return getAllFromIndex<Memo>('memos', 'projectId', projectId);
}

export async function getMemoById(id: string): Promise<Memo | undefined> {
  return getItem<Memo>('memos', id);
}

export async function addMemo(memo: Memo): Promise<void> {
  await putItem('memos', memo);
}

export async function updateMemo(id: string, updates: Partial<Memo>): Promise<void> {
  const existing = await getMemoById(id);
  if (!existing) return;
  await putItem('memos', { ...existing, ...updates, updatedAt: Date.now() });
}

export async function deleteMemo(id: string): Promise<void> {
  await deleteItem('memos', id);
}

export async function deleteMemosByProjectId(projectId: string): Promise<void> {
  const memos = await getMemosByProjectId(projectId);
  const ids = memos.map((memo) => memo.id);
  if (ids.length) {
    await deleteItems('memos', ids);
  }
}

export async function bulkUpdateMemos(
  ids: string[],
  updates: Partial<Memo>
): Promise<void> {
  const memos = await Promise.all(ids.map((id) => getMemoById(id)));
  const updated = memos
    .filter((memo): memo is Memo => !!memo)
    .map((memo) => ({
      ...memo,
      ...updates,
      updatedAt: Date.now(),
    }));
  if (updated.length) {
    await putItems('memos', updated);
  }
}

export async function bulkDeleteMemos(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await deleteItems('memos', ids);
}

// ============ 数据源操作 ============

export async function getDataSources(): Promise<DataSource[]> {
  return getAll<DataSource>('dataSources');
}

export async function getDataSourcesByProjectId(projectId: string): Promise<DataSource[]> {
  return getAllFromIndex<DataSource>('dataSources', 'projectId', projectId);
}

export async function addDataSource(dataSource: DataSource): Promise<void> {
  await putItem('dataSources', dataSource);
}

export async function updateDataSource(id: string, updates: Partial<DataSource>): Promise<void> {
  const existing = await getItem<DataSource>('dataSources', id);
  if (!existing) return;
  await putItem('dataSources', { ...existing, ...updates, updatedAt: Date.now() });
}

export async function deleteDataSource(id: string): Promise<void> {
  await deleteItem('dataSources', id);
}

// ============ 组件操作 ============

export async function getWidgets(): Promise<Widget[]> {
  return getAll<Widget>('widgets');
}

export async function getWidgetsByProjectId(projectId: string): Promise<Widget[]> {
  return getAllFromIndex<Widget>('widgets', 'projectId', projectId);
}

export async function addWidget(widget: Widget): Promise<void> {
  await putItem('widgets', widget);
}

export async function updateWidget(id: string, updates: Partial<Widget>): Promise<void> {
  const existing = await getItem<Widget>('widgets', id);
  if (!existing) return;
  await putItem('widgets', { ...existing, ...updates, updatedAt: Date.now() });
}

export async function deleteWidget(id: string): Promise<void> {
  await deleteItem('widgets', id);
}

// ============ 应用设置 ============

export async function getSettings(): Promise<AppSettings> {
  const record = await getItem<SettingsRecord<AppSettings>>('settings', SETTINGS_KEY);
  return record?.value || {};
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await putItem('settings', { key: SETTINGS_KEY, value: settings });
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  const settings = await getSettings();
  await saveSettings({ ...settings, ...updates });
}

// ============ 数据导出和导入 ============

export async function exportAllData(): Promise<ExportedData> {
  const projects = await exportStore<Project>('projects');
  const resources = await exportStore<Resource>('resources');
  const memos = await exportStore<Memo>('memos');
  const dataSources = await exportStore<DataSource>('dataSources');
  const widgets = await exportStore<Widget>('widgets');
  const settings = await getSettings();
  const payload: ExportedData = {
    version: CURRENT_EXPORT_VERSION,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: Date.now(),
    projects,
    resources,
    memos,
    dataSources,
    widgets,
    settings,
  };
  payload.checksum = await sha256(JSON.stringify(payload));
  return payload;
}

export async function importData(
  data: ExportedData,
  mode: 'replace' | 'merge' = 'merge'
): Promise<void> {
  if (!data || !data.version) {
    throw new Error('无效的导入文件');
  }

  if (data.checksum) {
    const checksum = await sha256(
      JSON.stringify({
        ...data,
        checksum: undefined,
      })
    );
    if (checksum !== data.checksum) {
      throw new Error('导入文件校验失败');
    }
  }

  if (mode === 'replace') {
    await clearAllData();
  }

  const existingProjects = mode === 'merge' ? await getProjects() : [];
  const existingResources = mode === 'merge' ? await getResources() : [];
  const existingMemos = mode === 'merge' ? await getMemos() : [];
  const existingDataSources = mode === 'merge' ? await getDataSources() : [];
  const existingWidgets = mode === 'merge' ? await getWidgets() : [];

  const projectIdMap = new Map<string, string>();
  const projectIds = new Set(existingProjects.map((p) => p.id));
  const resourceIds = new Set(existingResources.map((r) => r.id));
  const memoIds = new Set(existingMemos.map((m) => m.id));
  const dataSourceIds = new Set(existingDataSources.map((d) => d.id));
  const widgetIds = new Set(existingWidgets.map((w) => w.id));

  const remapId = (id: string, used: Set<string>) => {
    if (!used.has(id)) {
      used.add(id);
      return id;
    }
    let next = `${id}-${Math.random().toString(36).slice(2, 8)}`;
    while (used.has(next)) {
      next = `${id}-${Math.random().toString(36).slice(2, 8)}`;
    }
    used.add(next);
    return next;
  };

  const normalizedProjects = (data.projects || []).map((project) => {
    const newId = mode === 'merge' ? remapId(project.id, projectIds) : project.id;
    if (newId !== project.id) {
      projectIdMap.set(project.id, newId);
    }
    return { ...project, id: newId, updatedAt: Date.now() };
  });

  const normalizedResources = (data.resources || []).map((resource) => {
    const projectId = projectIdMap.get(resource.projectId) || resource.projectId;
    const newId = mode === 'merge' ? remapId(resource.id, resourceIds) : resource.id;
    return { ...resource, id: newId, projectId, updatedAt: Date.now() };
  });

  const normalizedMemos = (data.memos || []).map((memo) => {
    const projectId = projectIdMap.get(memo.projectId) || memo.projectId;
    const newId = mode === 'merge' ? remapId(memo.id, memoIds) : memo.id;
    return { ...memo, id: newId, projectId, updatedAt: Date.now() };
  });

  const normalizedDataSources = (data.dataSources || []).map((dataSource) => {
    const projectId = projectIdMap.get(dataSource.projectId) || dataSource.projectId;
    const newId = mode === 'merge' ? remapId(dataSource.id, dataSourceIds) : dataSource.id;
    return { ...dataSource, id: newId, projectId, updatedAt: Date.now() };
  });

  const normalizedWidgets = (data.widgets || []).map((widget) => {
    const projectId = projectIdMap.get(widget.projectId) || widget.projectId;
    const newId = mode === 'merge' ? remapId(widget.id, widgetIds) : widget.id;
    return { ...widget, id: newId, projectId, updatedAt: Date.now() };
  });

  if (normalizedProjects.length) await putItems('projects', normalizedProjects);
  if (normalizedResources.length) await putItems('resources', normalizedResources);
  if (normalizedMemos.length) await putItems('memos', normalizedMemos);
  if (normalizedDataSources.length) await putItems('dataSources', normalizedDataSources);
  if (normalizedWidgets.length) await putItems('widgets', normalizedWidgets);

  if (data.settings) {
    await saveSettings({
      ...data.settings,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  }
}

export async function createBackup(label?: string): Promise<BackupRecord> {
  const data = await exportAllData();
  const checksum = data.checksum || (await sha256(JSON.stringify(data)));
  const record: BackupRecord = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    label,
    data,
    checksum,
  };
  await putItem('backups', record);
  return record;
}

export async function getBackups(): Promise<BackupRecord[]> {
  return getAll<BackupRecord>('backups');
}

export async function pruneBackups(retention: number): Promise<void> {
  const backups = await getBackups();
  if (backups.length <= retention) return;
  const sorted = [...backups].sort((a, b) => b.createdAt - a.createdAt);
  const toDelete = sorted.slice(retention).map((backup) => backup.id);
  if (toDelete.length) {
    await deleteItems('backups', toDelete);
  }
}

export async function clearAllData(): Promise<void> {
  await clearStore('projects');
  await clearStore('resources');
  await clearStore('memos');
  await clearStore('dataSources');
  await clearStore('widgets');
  await clearStore('settings');
  await clearStore('backups');
}

export async function getStorageStats(): Promise<{
  projectsCount: number;
  resourcesCount: number;
  memosCount: number;
  dataSourcesCount: number;
  widgetsCount: number;
  estimatedSize: string;
}> {
  const [projectsCount, resourcesCount, memosCount, dataSourcesCount, widgetsCount] = await Promise.all([
    countAll('projects'),
    countAll('resources'),
    countAll('memos'),
    countAll('dataSources'),
    countAll('widgets'),
  ]);

  const data = {
    projects: await getProjects(),
    resources: await getResources(),
    memos: await getMemos(),
    dataSources: await getDataSources(),
    widgets: await getWidgets(),
  };

  const estimatedBytes = JSON.stringify(data).length;
  let estimatedSize = '';
  if (estimatedBytes < 1024) {
    estimatedSize = `${estimatedBytes} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    estimatedSize = `${(estimatedBytes / 1024).toFixed(2)} KB`;
  } else {
    estimatedSize = `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return {
    projectsCount,
    resourcesCount,
    memosCount,
    dataSourcesCount,
    widgetsCount,
    estimatedSize,
  };
}
