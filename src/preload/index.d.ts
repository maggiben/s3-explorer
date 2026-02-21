import { ElectronAPI } from '@electron-toolkit/preload';
import type { ISettings } from '../types/ISettings';
import type {
  IpcMainInvokeEvent,
  OpenDialogReturnValue,
  OpenDialogOptions,
  MessageBoxReturnValue,
} from 'electron';
import { IConnection } from 'src/types/IConnection';

export declare global {
  interface Window {
    electron: ElectronAPI;
    ipcRenderer: Electron.IpcRenderer;
    api: {
      getFilePath: (file: File) => string;
    };
    commands: {
      showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
      showMessageBox: (options: MessageBoxOptions) => Promise<MessageBoxReturnValue>;
      modal: (type: string, options?: Record<string, unknown>) => Promise<boolean>;
      contextMenu: (type: string, options?: Record<string, unknown>) => Promise<void | null>;
    };
    settings: {
      get: () => Promise<ISettings>;
      set: (settings: ISettings) => Promise<ISettings>;
    };
    connections: {
      add: (connection: IConnection) => Promise<IConnection>;
      get: (id: number) => Promise<IConnection>;
      getAll: () => Promise<IConnection[]>;
      getRecent: () => Promise<IConnection[]>;
      connect: (id: number) => Promise<void>;
      upsert: (connection: IConnection) => Promise<IConnection>;
    };
    objects: {
      getObjects: (opts: {
        connectionId: number;
        dirname?: string;
        keyword?: string;
        after?: number;
        limit?: number;
      }) => Promise<{ hasNextPage: boolean; items: unknown[] } | undefined>;
      createFile: (opts: {
        id: string;
        connectionId: number;
        localPath: string;
        dirname?: string;
        onProgress?: (
          event: IpcMainInvokeEvent,
          progress: { loaded: number; total: number; part: number },
        ) => void;
        onEnd?: () => void;
      }) => Promise<unknown>;
      copyObjects: (opts: {
        connectionId: number;
        sourceIds: string[];
        targetDirname: string;
        move?: boolean;
      }) => Promise<unknown[] | undefined>;
    };
  }
}
