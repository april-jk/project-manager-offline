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
  Website,
  Memo,
  getProjects,
  saveProjects,
  getWebsites,
  saveWebsites,
  getMemos,
  saveMemos,
  getProjectById,
  getWebsitesByProjectId,
  getMemosByProjectId,
  addProject,
  updateProject,
  deleteProject,
  addWebsite,
  updateWebsite,
  deleteWebsite,
  addMemo,
  updateMemo,
  deleteMemo,
} from '@/lib/storage';

interface ProjectContextType {
  // 项目操作
  projects: Project[];
  createProject: (name: string, description?: string, color?: string) => void;
  updateProjectData: (id: string, updates: Partial<Project>) => void;
  deleteProjectData: (id: string) => void;

  // 网站操作
  websites: Website[];
  getProjectWebsites: (projectId: string) => Website[];
  createWebsite: (
    projectId: string,
    name: string,
    url?: string,
    description?: string,
    icon?: string,
    tags?: string[],
    type?: 'website' | 'credential' | 'api',
    additionalData?: Partial<Website>
  ) => void;
  updateWebsiteData: (id: string, updates: Partial<Website>) => void;
  deleteWebsiteData: (id: string) => void;

  // 备忘录操作
  memos: Memo[];
  getProjectMemos: (projectId: string) => Memo[];
  createMemo: (
    projectId: string,
    title: string,
    content: string,
    category?: string,
    isEncrypted?: boolean
  ) => void;
  updateMemoData: (id: string, updates: Partial<Memo>) => void;
  deleteMemoData: (id: string) => void;

  // 数据管理
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化数据
  useEffect(() => {
    setProjects(getProjects());
    setWebsites(getWebsites());
    setMemos(getMemos());
    setIsLoading(false);
  }, []);

  // ============ 项目操作 ============

  const createProject = useCallback(
    (name: string, description?: string, color?: string) => {
      const newProject: Project = {
        id: nanoid(),
        name,
        description,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addProject(newProject);
      setProjects((prev) => [...prev, newProject]);
    },
    []
  );

  const updateProjectData = useCallback((id: string, updates: Partial<Project>) => {
    updateProject(id, updates);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p))
    );
  }, []);

  const deleteProjectData = useCallback((id: string) => {
    deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setWebsites((prev) => prev.filter((w) => w.projectId !== id));
    setMemos((prev) => prev.filter((m) => m.projectId !== id));
  }, []);

  // ============ 网站操作 ============

  const getProjectWebsites = useCallback(
    (projectId: string) => websites.filter((w) => w.projectId === projectId),
    [websites]
  );

  const createWebsite = useCallback(
    (
      projectId: string,
      name: string,
      url?: string,
      description?: string,
      icon?: string,
      tags?: string[],
      type?: 'website' | 'credential' | 'api',
      additionalData?: Partial<Website>
    ) => {
      const newWebsite: Website = {
        id: nanoid(),
        projectId,
        name,
        url,
        description,
        icon,
        tags,
        createdAt: Date.now(),
        type: type || 'website',
        ...additionalData,
      };
      addWebsite(newWebsite);
      setWebsites((prev) => [...prev, newWebsite]);
    },
    []
  );

  const updateWebsiteData = useCallback((id: string, updates: Partial<Website>) => {
    updateWebsite(id, updates);
    setWebsites((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  const deleteWebsiteData = useCallback((id: string) => {
    deleteWebsite(id);
    setWebsites((prev) => prev.filter((w) => w.id !== id));
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
    },
    []
  );

  const updateMemoData = useCallback((id: string, updates: Partial<Memo>) => {
    updateMemo(id, updates);
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m))
    );
  }, []);

  const deleteMemoData = useCallback((id: string) => {
    deleteMemo(id);
    setMemos((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const value: ProjectContextType = {
    projects,
    createProject,
    updateProjectData,
    deleteProjectData,
    websites,
    getProjectWebsites,
    createWebsite,
    updateWebsiteData,
    deleteWebsiteData,
    memos,
    getProjectMemos,
    createMemo,
    updateMemoData,
    deleteMemoData,
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
