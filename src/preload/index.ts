import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import ipc from '../shared/constants/ipc';
import { ISettings } from '../types/ISettings';
import { IConnection } from '../types/IConnection';
import type { IpcRendererEvent } from 'electron';
// Custom APIs for renderer
const api = {
  getFilePath: (file: File): string => webUtils.getPathForFile(file),
  startDrag: (fileName: string) => ipcRenderer.send('ondragstart', fileName),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('settings', {
      get: (id?: number): Promise<ISettings> =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'settings:get', id })
          .then(({ results, ack }) => ack && results?.shift()),
      set: (settings: ISettings) =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'settings:set', settings })
          .then(({ results, ack }) => ack && results?.shift()),
    });
    contextBridge.exposeInMainWorld('connections', {
      add: (connection: IConnection): Promise<IConnection> =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'connections:add', connection })
          .then(({ results, ack }) => ack && results.shift())
          .then(({ result, ack }) => ack && result),
      get: (id: number): Promise<IConnection> =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'connections:get', id })
          .then(({ results, ack }) => ack && results.shift())
          .then(({ result, ack }) => ack && result),
      getAll: (): Promise<IConnection[]> =>
        ipcRenderer.invoke(ipc.MAIN_API, { command: 'connections:getAll' }),
      getRecent: (): Promise<IConnection[]> =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'connections:getRecent' })
          .then(({ results, ack }) => ack && results.shift())
          .then(({ result, ack }) => ack && result),
      connect: (id: number) =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'connections:connect', id })
          .then(({ results, ack }) => ack && results.shift()),
      upsert: (connection: IConnection): Promise<IConnection> =>
        ipcRenderer
          .invoke(ipc.MAIN_API, { command: 'connections:upsert', connection })
          .then(({ results, ack }) => ack && results.shift())
          .then(({ result, ack }) => ack && result),
    });
    contextBridge.exposeInMainWorld('objects', {
      getObjects: (opts: {
        connectionId: number;
        dirname?: string;
        keyword?: string;
        after?: number;
        limit?: number;
      }) =>
        ipcRenderer
          .invoke(ipc.MAIN_API, {
            command: 'objects:getObjects',
            connectionId: opts.connectionId,
            dirname: opts.dirname ?? '',
            keyword: opts.keyword,
            after: opts.after,
            limit: opts.limit ?? 50,
          })
          .then(({ results, ack }) => ack && results?.shift())
          .then((r) => r?.result),
      createFile: async (opts: {
        id: string;
        connectionId: number;
        localPath: string;
        dirname?: string;
        onProgress?: (event: IpcRendererEvent, progress: unknown) => void;
        onEnd?: () => void;
      }) => {
        const progressChannel = `createFile.onProgress:${opts.id}`;
        const endChannel = `createFile.onEnd:${opts.id}`;
        if (typeof opts?.onProgress === 'function') {
          const close = () => {
            const { onProgress } = opts;
            ipcRenderer.off(progressChannel, onProgress!);
            if (typeof opts?.onEnd === 'function') {
              const { onEnd } = opts;
              ipcRenderer.off(endChannel, close);
              onEnd();
            }
          };
          const { onProgress } = opts;
          ipcRenderer.on(progressChannel, onProgress);
          ipcRenderer.on(endChannel, close);
        }
        return ipcRenderer
          .invoke(ipc.MAIN_API, {
            command: 'objects:createFile',
            connectionId: opts.connectionId,
            localPath: opts.localPath,
            dirname: opts.dirname,
            onProgressChannel: progressChannel,
            onEndChannel: endChannel,
          })
          .then(({ results, ack }) => ack && results?.shift())
          .then((r) => ({
            ...r?.result,
            progressChannel,
            endChannel,
          }));
        // .finally(() => {
        //   if (typeof opts.onProgress === 'function') {
        //     ipcRenderer.off(channel, opts.onProgress);
        //   }
        // });
      },
      copyObjects: (opts: {
        connectionId: number;
        sourceIds: string[];
        targetDirname: string;
        move?: boolean;
      }) =>
        ipcRenderer
          .invoke(ipc.MAIN_API, {
            command: 'objects:copyObjects',
            connectionId: opts.connectionId,
            sourceIds: opts.sourceIds,
            targetDirname: opts.targetDirname,
            move: opts.move,
          })
          .then(({ results, ack }) => ack && results?.shift())
          .then((r) => r?.result),
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
