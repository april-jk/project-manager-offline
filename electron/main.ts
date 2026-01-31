import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import isDev from 'electron-is-dev';
import { setupAutoUpdater } from './updater';

let mainWindow: BrowserWindow | null = null;
let storageDir: string = '';

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用准备就绪
app.on('ready', () => {
  createWindow();
  createMenu();
  
  // 设置自动更新
  if (!isDev) {
    setupAutoUpdater(mainWindow);
  }
  storageDir = path.join(app.getPath('userData'), 'ProjectHub');
  try {
    fs.mkdirSync(storageDir, { recursive: true });
  } catch {}
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 重新激活应用时创建窗口
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 创建菜单
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Toggle DevTools', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            // 可以显示关于对话框
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC 事件处理
ipcMain.on('app-version', (event) => {
  event.reply('app-version', { version: app.getVersion() });
});

ipcMain.on('storage:dirPath', (event) => {
  event.returnValue = storageDir;
});

ipcMain.on('storage:getSync', (event, key: string) => {
  try {
    const file = path.join(storageDir, `${key}.json`);
    if (!fs.existsSync(file)) {
      event.returnValue = null;
      return;
    }
    const content = fs.readFileSync(file, 'utf-8');
    event.returnValue = JSON.parse(content);
  } catch {
    event.returnValue = null;
  }
});

ipcMain.on('storage:setSync', (event, payload: { key: string; data: unknown }) => {
  try {
    const file = path.join(storageDir, `${payload.key}.json`);
    fs.writeFileSync(file, JSON.stringify(payload.data));
    event.returnValue = true;
  } catch {
    event.returnValue = false;
  }
});

ipcMain.on('storage:removeSync', (event, key: string) => {
  try {
    const file = path.join(storageDir, `${key}.json`);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    event.returnValue = true;
  } catch {
    event.returnValue = false;
  }
});

// 自动更新事件
autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
  }
});

ipcMain.on('restart-app', () => {
  autoUpdater.quitAndInstall();
});
