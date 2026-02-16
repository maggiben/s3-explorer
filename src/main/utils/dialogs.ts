import {
  dialog,
  BrowserWindow,
  OpenDialogReturnValue,
  OpenDialogOptions,
  MessageBoxOptions,
  MessageBoxReturnValue,
} from 'electron';

export const showOpenDialog = (
  options: OpenDialogOptions,
  mainWindow?: BrowserWindow,
): Promise<OpenDialogReturnValue> | null => {
  const activeWindow = mainWindow ?? BrowserWindow.getFocusedWindow();
  return activeWindow && dialog.showOpenDialog(activeWindow, options);
};

export const showMessageBox = (
  options: MessageBoxOptions,
  mainWindow?: BrowserWindow,
): Promise<MessageBoxReturnValue> | null => {
  const activeWindow = mainWindow ?? BrowserWindow.getFocusedWindow();
  return activeWindow && dialog.showMessageBox(activeWindow, options);
};
