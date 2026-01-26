import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

export function setupAutoUpdater(mainWindow: BrowserWindow | null) {
  // 配置自动更新
  autoUpdater.checkForUpdatesAndNotify();

  // 检查更新
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  // 有可用更新
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    if (mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Available',
          message: `A new version (${info.version}) is available!`,
          buttons: ['Download', 'Later'],
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.downloadUpdate();
          }
        });
    }
  });

  // 没有可用更新
  autoUpdater.on('update-not-available', () => {
    console.log('Update not available.');
  });

  // 下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download progress: ${progressObj.percent}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', progressObj.percent);
    }
  });

  // 更新下载完成
  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded');
    if (mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Ready',
          message: 'Update downloaded. The application will be restarted to apply the update.',
          buttons: ['Restart', 'Later'],
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
    }
  });

  // 错误处理
  autoUpdater.on('error', (error) => {
    console.error('Error in auto-updater:', error);
    if (mainWindow) {
      dialog.showErrorBox('Update Error', error.message);
    }
  });
}
