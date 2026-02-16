import * as path from 'node:path';
import { app, powerMonitor, ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';

const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

export interface IModalOptions {}

export default async function modal(
  type: string,
  options?: Record<string, unknown>,
  mainWindow?: BrowserWindow | null,
): Promise<boolean> {
  console.log('new modal', type, options, mainWindow);
  const focusedWindow = BrowserWindow.getFocusedWindow();
  const parentWindow = mainWindow === focusedWindow ? mainWindow : focusedWindow;
  const modal = new BrowserWindow({
    parent: parentWindow ?? undefined,
    modal: true,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    ...options,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });
  const setEventHandlers = (modal: BrowserWindow): void => {
    modal.once('ready-to-show', () => {
      const resumeEventHander = (): void => {
        console.log('Computer resume');
        modal?.webContents.send('show-modal', type, options);
      };
      const resizeEventHander = (
        _event: Electron.IpcMainEvent,
        size: { height: number; width: number },
      ): void => {
        modal.setContentSize(size.width, size.height, true);
      };
      powerMonitor.on('resume', resumeEventHander);
      console.log('show-modal', type, options);
      modal?.webContents.send('show-modal', type, options);
      modal.show();
      ipcMain.on('resize-modal', resizeEventHander);
      ipcMain.once('close-modal', async (_event: IpcMainInvokeEvent, options) => {
        console.log('close-modal', type, options);
        mainWindow?.webContents.send('close-modal', type, options);
        powerMonitor.off('resume', resumeEventHander);
        ipcMain.off('resize-modal', resizeEventHander);
        modal.hide();
        modal.destroy();
        modal = undefined as unknown as BrowserWindow;
      });
    });
  };

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    modal.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/modal.html`);
    setEventHandlers(modal);
  } else {
    modal.loadFile(path.join(__dirname, '../renderer/modal.html'));
    setEventHandlers(modal);
  }
  return !!modal;
}
