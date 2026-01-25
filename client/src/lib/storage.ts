/**
 * 本地存储管理模块
 * 
 * 设计理念:
 * - 使用 LocalStorage 作为持久化存储
 * - 提供类型安全的 CRUD 操作
 * - 支持数据导出和导入
 * - 自动处理 JSON 序列化和反序列化
 */

import { EncryptedData } from './encryption';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Website {
  id: string;
  projectId: string;
  name: string;
  url?: string;
  description?: string;
  icon?: string;
  tags?: string[];
  createdAt: number;
  // 资源类型: 'website' | 'credential' | 'api'
  type?: 'website' | 'credential' | 'api';
  // 账号密码类型的字段
  username?: string;
  password?: string; // 加密存储
  // API 类型的字段
  apiKey?: string; // 加密存储
  apiSecret?: string; // 加密存储
  apiEndpoint?: string;
  apiHeaders?: Record<string, string>;
  // 加密标记
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
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme?: 'light' | 'dark';
  hasPassword?: boolean;
  passwordVerificationData?: EncryptedData;
  lastBackupTime?: number;
}

// Storage keys
const STORAGE_KEYS = {
  PROJECTS: 'pm-projects',
  WEBSITES: 'pm-websites',
  MEMOS: 'pm-memos',
  SETTINGS: 'pm-app-settings',
  BACKUP_HISTORY: 'pm-backup-history',
};

/**
 * 从 LocalStorage 获取数据
 */
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to get ${key} from storage:`, error);
    return defaultValue;
  }
}

/**
 * 保存数据到 LocalStorage
 */
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
    throw new Error('存储空间不足或存储失败');
  }
}

/**
 * 从 LocalStorage 删除数据
 */
function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key} from storage:`, error);
  }
}

// ============ 项目操作 ============

export function getProjects(): Project[] {
  return getFromStorage(STORAGE_KEYS.PROJECTS, []);
}

export function saveProjects(projects: Project[]): void {
  saveToStorage(STORAGE_KEYS.PROJECTS, projects);
}

export function getProjectById(id: string): Project | undefined {
  const projects = getProjects();
  return projects.find((p) => p.id === id);
}

export function addProject(project: Project): void {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates, updatedAt: Date.now() };
    saveProjects(projects);
  }
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  // 同时删除相关的网站和备忘录
  deleteWebsitesByProjectId(id);
  deleteMemosByProjectId(id);
}

// ============ 网站操作 ============

export function getWebsites(): Website[] {
  return getFromStorage(STORAGE_KEYS.WEBSITES, []);
}

export function saveWebsites(websites: Website[]): void {
  saveToStorage(STORAGE_KEYS.WEBSITES, websites);
}

export function getWebsitesByProjectId(projectId: string): Website[] {
  const websites = getWebsites();
  return websites.filter((w) => w.projectId === projectId);
}

export function getWebsiteById(id: string): Website | undefined {
  const websites = getWebsites();
  return websites.find((w) => w.id === id);
}

export function addWebsite(website: Website): void {
  const websites = getWebsites();
  websites.push(website);
  saveWebsites(websites);
}

export function updateWebsite(id: string, updates: Partial<Website>): void {
  const websites = getWebsites();
  const index = websites.findIndex((w) => w.id === id);
  if (index !== -1) {
    websites[index] = { ...websites[index], ...updates };
    saveWebsites(websites);
  }
}

export function deleteWebsite(id: string): void {
  const websites = getWebsites().filter((w) => w.id !== id);
  saveWebsites(websites);
}

export function deleteWebsitesByProjectId(projectId: string): void {
  const websites = getWebsites().filter((w) => w.projectId !== projectId);
  saveWebsites(websites);
}

// ============ 备忘录操作 ============

export function getMemos(): Memo[] {
  return getFromStorage(STORAGE_KEYS.MEMOS, []);
}

export function saveMemos(memos: Memo[]): void {
  saveToStorage(STORAGE_KEYS.MEMOS, memos);
}

export function getMemosByProjectId(projectId: string): Memo[] {
  const memos = getMemos();
  return memos.filter((m) => m.projectId === projectId);
}

export function getMemoById(id: string): Memo | undefined {
  const memos = getMemos();
  return memos.find((m) => m.id === id);
}

export function addMemo(memo: Memo): void {
  const memos = getMemos();
  memos.push(memo);
  saveMemos(memos);
}

export function updateMemo(id: string, updates: Partial<Memo>): void {
  const memos = getMemos();
  const index = memos.findIndex((m) => m.id === id);
  if (index !== -1) {
    memos[index] = { ...memos[index], ...updates, updatedAt: Date.now() };
    saveMemos(memos);
  }
}

export function deleteMemo(id: string): void {
  const memos = getMemos().filter((m) => m.id !== id);
  saveMemos(memos);
}

export function deleteMemosByProjectId(projectId: string): void {
  const memos = getMemos().filter((m) => m.projectId !== projectId);
  saveMemos(memos);
}

// ============ 应用设置 ============

export function getSettings(): AppSettings {
  return getFromStorage(STORAGE_KEYS.SETTINGS, {});
}

export function saveSettings(settings: AppSettings): void {
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}

export function updateSettings(updates: Partial<AppSettings>): void {
  const settings = getSettings();
  saveSettings({ ...settings, ...updates });
}

// ============ 数据导出和导入 ============

export interface ExportedData {
  version: string;
  exportedAt: number;
  projects: Project[];
  websites: Website[];
  memos: Memo[];
  settings: AppSettings;
}

/**
 * 导出所有数据为 JSON
 */
export function exportAllData(): ExportedData {
  return {
    version: '1.0.0',
    exportedAt: Date.now(),
    projects: getProjects(),
    websites: getWebsites(),
    memos: getMemos(),
    settings: getSettings(),
  };
}

/**
 * 导入数据
 */
export function importData(data: ExportedData): void {
  try {
    if (data.version !== '1.0.0') {
      throw new Error('不支持的数据版本');
    }

    saveProjects(data.projects || []);
    saveWebsites(data.websites || []);
    saveMemos(data.memos || []);
    if (data.settings) {
      saveSettings(data.settings);
    }
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error('导入数据失败');
  }
}

/**
 * 清空所有数据
 */
export function clearAllData(): void {
  removeFromStorage(STORAGE_KEYS.PROJECTS);
  removeFromStorage(STORAGE_KEYS.WEBSITES);
  removeFromStorage(STORAGE_KEYS.MEMOS);
  removeFromStorage(STORAGE_KEYS.SETTINGS);
  removeFromStorage(STORAGE_KEYS.BACKUP_HISTORY);
}

/**
 * 获取存储空间使用情况
 */
export function getStorageStats(): {
  projectsCount: number;
  websitesCount: number;
  memosCount: number;
  estimatedSize: string;
} {
  const projects = getProjects();
  const websites = getWebsites();
  const memos = getMemos();

  // 粗略估计大小
  const estimatedBytes =
    JSON.stringify(projects).length +
    JSON.stringify(websites).length +
    JSON.stringify(memos).length;

  let estimatedSize = '';
  if (estimatedBytes < 1024) {
    estimatedSize = `${estimatedBytes} B`;
  } else if (estimatedBytes < 1024 * 1024) {
    estimatedSize = `${(estimatedBytes / 1024).toFixed(2)} KB`;
  } else {
    estimatedSize = `${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return {
    projectsCount: projects.length,
    websitesCount: websites.length,
    memosCount: memos.length,
    estimatedSize,
  };
}
