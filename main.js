const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let settingsWindow;

function createWindow() {
  // الحصول على مقاسات الشاشة
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 400,           // عرض الويدجت
    height: 600,          // ارتفاع الويدجت
    x: width - 420,       // وضعه في أقصى اليمين مثلاً (قابل للتغيير)
    y: 20,                 // من الأعلى
    transparent: true,     // خلفية شفافة
    frame: false,          // بدون إطار
    alwaysOnTop: true,     // دائماً في المقدمة
    skipTaskbar: true,     // لا يظهر في شريط المهام
    resizable: false,      // غير قابل لتغيير الحجم (حسب التصميم)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // نافذة الإعدادات (تظهر عند الحاجة)
  ipcMain.on('open-settings', () => {
    if (settingsWindow) {
      settingsWindow.focus();
      return;
    }
    settingsWindow = new BrowserWindow({
      width: 500,
      height: 700,
      parent: mainWindow,
      modal: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });
    settingsWindow.loadFile('settings.html');
    settingsWindow.once('ready-to-show', () => settingsWindow.show());
    settingsWindow.on('closed', () => { settingsWindow = null; });
  });

  // استقبال تغيير الإعدادات
  ipcMain.on('update-settings', (event, settings) => {
    mainWindow.webContents.send('apply-settings', settings);
  });

  // استقبال تغيير موقع النافذة
  ipcMain.on('move-window', (event, position) => {
    const { width: screenWidth, height: screenHeight } = require('electron').screen.getPrimaryDisplay().workAreaSize;
    const winBounds = mainWindow.getBounds();
    let newX = winBounds.x;
    let newY = winBounds.y;

    switch (position) {
      case 'top-left':
        newX = 20;
        newY = 20;
        break;
      case 'top-center':
        newX = (screenWidth - winBounds.width) / 2;
        newY = 20;
        break;
      case 'top-right':
        newX = screenWidth - winBounds.width - 20;
        newY = 20;
        break;
      case 'middle-left':
        newX = 20;
        newY = (screenHeight - winBounds.height) / 2;
        break;
      case 'center':
        newX = (screenWidth - winBounds.width) / 2;
        newY = (screenHeight - winBounds.height) / 2;
        break;
      case 'middle-right':
        newX = screenWidth - winBounds.width - 20;
        newY = (screenHeight - winBounds.height) / 2;
        break;
      case 'bottom-left':
        newX = 20;
        newY = screenHeight - winBounds.height - 20;
        break;
      case 'bottom-center':
        newX = (screenWidth - winBounds.width) / 2;
        newY = screenHeight - winBounds.height - 20;
        break;
      case 'bottom-right':
        newX = screenWidth - winBounds.width - 20;
        newY = screenHeight - winBounds.height - 20;
        break;
    }
    mainWindow.setPosition(Math.round(newX), Math.round(newY));
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
