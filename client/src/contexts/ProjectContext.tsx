/**
 * 项目数据管理 Context
 * 
 * 设计理念:
 * - 集中管理项目、网站和备忘录数据
 * - 提供 CRUD 操作接口
 * - 自动同步到 LocalStorage
 * - 支持撤销/重做功能
 */

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import {
  Project,
  Resource,
  Memo,
  DataSource,
  Widget,
  initStorage,
  getProjects,
  saveProjects,
  getResources,
  saveResources,
  getMemos,
  saveMemos,
  getProjectById,
  getResourcesByProjectId,
  getMemosByProjectId,
  addProject,
  updateProject,
  deleteProject,
  addResource,
  updateResource,
  deleteResource,
  bulkUpdateResources,
  bulkDeleteResources,
  addMemo,
  updateMemo,
  deleteMemo,
  bulkUpdateMemos,
  bulkDeleteMemos,
  getDataSources,
  getDataSourcesByProjectId,
  addDataSource,
  updateDataSource,
  deleteDataSource,
  getWidgets,
  getWidgetsByProjectId,
  addWidget,
  updateWidget,
  deleteWidget,
} from '@/lib/storage';

interface ProjectContextType {
  // 项目操作
  projects: Project[];
  createProject: (
    name: string,
    description?: string,
    color?: string,
    metadata?: Project['metadata']
  ) => void;
  updateProjectData: (id: string, updates: Partial<Project>) => void;
  deleteProjectData: (id: string) => void;

  // 网站操作
  resources: Resource[];
  getProjectResources: (projectId: string) => Resource[];
  createResource: (
    projectId: string,
    name: string,
    url?: string,
    description?: string,
    icon?: string,
    tags?: string[],
    type?: Resource['type'],
    additionalData?: Partial<Resource>
  ) => void;
  updateResourceData: (id: string, updates: Partial<Resource>) => void;
  deleteResourceData: (id: string) => void;
  bulkUpdateResourcesData: (ids: string[], updates: Partial<Resource>) => Promise<void>;
  bulkDeleteResourcesData: (ids: string[]) => Promise<void>;

  // 备忘录操作
  memos: Memo[];
  getProjectMemos: (projectId: string) => Memo[];
  createMemo: (
    projectId: string,
    title: string,
    content: string,
    category?: string,
    isEncrypted?: boolean
  ) => Memo;
  updateMemoData: (id: string, updates: Partial<Memo>) => void;
  deleteMemoData: (id: string) => void;
  bulkUpdateMemosData: (ids: string[], updates: Partial<Memo>) => Promise<void>;
  bulkDeleteMemosData: (ids: string[]) => Promise<void>;

  // 数据源操作
  dataSources: DataSource[];
  getProjectDataSources: (projectId: string) => DataSource[];
  createDataSource: (dataSource: DataSource) => void;
  updateDataSourceData: (id: string, updates: Partial<DataSource>) => void;
  deleteDataSourceData: (id: string) => void;

  // 组件操作
  widgets: Widget[];
  getProjectWidgets: (projectId: string) => Widget[];
  createWidget: (widget: Widget) => void;
  updateWidgetData: (id: string, updates: Partial<Widget>) => void;
  deleteWidgetData: (id: string) => void;

  // 数据管理
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化数据
  useEffect(() => {
    const load = async () => {
      await initStorage();
      setProjects(await getProjects());
      setResources(await getResources());
      setMemos(await getMemos());
      setDataSources(await getDataSources());
      setWidgets(await getWidgets());
      setIsLoading(false);
    };
    void load();
  }, []);

  // ============ 项目操作 ============

  const createProject = useCallback(
    (name: string, description?: string, color?: string, metadata?: Project['metadata']) => {
      const newProject: Project = {
        id: nanoid(),
        name,
        description,
        color,
        metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      void addProject(newProject);
      setProjects((prev) => [...prev, newProject]);
    },
    []
  );

  const updateProjectData = useCallback((id: string, updates: Partial<Project>) => {
    void updateProject(id, updates);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p))
    );
  }, []);

  const deleteProjectData = useCallback((id: string) => {
    void deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setResources((prev) => prev.filter((w) => w.projectId !== id));
    setMemos((prev) => prev.filter((m) => m.projectId !== id));
  }, []);

  // ============ 网站操作 ============

  const getProjectResources = useCallback(
    (projectId: string) => resources.filter((w) => w.projectId === projectId),
    [resources]
  );

  const createResource = useCallback(
    (
      projectId: string,
      name: string,
      url?: string,
      description?: string,
      icon?: string,
      tags?: string[],
      type?: Resource['type'],
      additionalData?: Partial<Resource>
    ) => {
      const newWebsite: Resource = {
        id: nanoid(),
        projectId,
        name,
        url,
        description,
        icon,
        tags,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: type || 'website',
        ...additionalData,
      };
      void addResource(newWebsite);
      setResources((prev) => [...prev, newWebsite]);
    },
    []
  );

  const updateResourceData = useCallback((id: string, updates: Partial<Resource>) => {
    void updateResource(id, updates);
    setResources((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w))
    );
  }, []);

  const deleteResourceData = useCallback((id: string) => {
    void deleteResource(id);
    setResources((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const bulkUpdateResourcesData = useCallback(async (ids: string[], updates: Partial<Resource>) => {
    await bulkUpdateResources(ids, updates);
    setResources((prev) =>
      prev.map((resource) =>
        ids.includes(resource.id) ? { ...resource, ...updates, updatedAt: Date.now() } : resource
      )
    );
  }, []);

  const bulkDeleteResourcesData = useCallback(async (ids: string[]) => {
    await bulkDeleteResources(ids);
    setResources((prev) => prev.filter((resource) => !ids.includes(resource.id)));
  }, []);

  // ============ 备忘录操作 ============

  const getProjectMemos = useCallback(
    (projectId: string) => memos.filter((m) => m.projectId === projectId),
    [memos]
  );

  const createMemo = useCallback(
    (
      projectId: string,
      title: string,
      content: string,
      category?: string,
      isEncrypted?: boolean
    ) => {
      const newMemo: Memo = {
        id: nanoid(),
        projectId,
        title,
        content,
        isEncrypted: isEncrypted || false,
        category,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addMemo(newMemo);
      setMemos((prev) => [...prev, newMemo]);
      return newMemo;
    },
    []
  );

  const updateMemoData = useCallback((id: string, updates: Partial<Memo>) => {
    void updateMemo(id, updates);
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m))
    );
  }, []);

  const deleteMemoData = useCallback((id: string) => {
    void deleteMemo(id);
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const bulkUpdateMemosData = useCallback(async (ids: string[], updates: Partial<Memo>) => {
    await bulkUpdateMemos(ids, updates);
    setMemos((prev) =>
      prev.map((memo) =>
        ids.includes(memo.id) ? { ...memo, ...updates, updatedAt: Date.now() } : memo
      )
    );
  }, []);

  const bulkDeleteMemosData = useCallback(async (ids: string[]) => {
    await bulkDeleteMemos(ids);
    setMemos((prev) => prev.filter((memo) => !ids.includes(memo.id)));
  }, []);

  const value: ProjectContextType = {
    projects,
    createProject,
    updateProjectData,
    deleteProjectData,
    resources,
    getProjectResources,
    createResource,
    updateResourceData,
    deleteResourceData,
    bulkUpdateResourcesData,
    bulkDeleteResourcesData,
    memos,
    getProjectMemos,
    createMemo,
    updateMemoData,
    deleteMemoData,
    bulkUpdateMemosData,
    bulkDeleteMemosData,
    dataSources,
    getProjectDataSources: (projectId) => dataSources.filter((d) => d.projectId === projectId),
    createDataSource: (dataSource) => {
      void addDataSource(dataSource);
      setDataSources((prev) => [...prev, dataSource]);
    },
    updateDataSourceData: (id, updates) => {
      void updateDataSource(id, updates);
      setDataSources((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item))
      );
    },
    deleteDataSourceData: (id) => {
      void deleteDataSource(id);
      setDataSources((prev) => prev.filter((item) => item.id !== id));
    },
    widgets,
    getProjectWidgets: (projectId) => widgets.filter((w) => w.projectId === projectId),
    createWidget: (widget) => {
      void addWidget(widget);
      setWidgets((prev) => [...prev, widget]);
    },
    updateWidgetData: (id, updates) => {
      void updateWidget(id, updates);
      setWidgets((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item))
      );
    },
    deleteWidgetData: (id) => {
      void deleteWidget(id);
      setWidgets((prev) => prev.filter((item) => item.id !== id));
    },
    isLoading,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within ProjectProvider');
  }
  return context;
}
