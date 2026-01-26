import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // 应用版本
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  
  // 自动更新
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update-available', callback);
  },
  
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update-downloaded', callback);
  },
  
  restartApp: () => {
    ipcRenderer.send('restart-app');
  },
});
