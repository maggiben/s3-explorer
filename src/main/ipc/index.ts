import os from 'os';
import path from 'path';
import { app, ipcMain, IpcMainInvokeEvent, nativeTheme } from 'electron';
import ipc from '../../shared/constants/ipc';
import * as Settings from '../ipc/settings';
import SettingsModel from '../models/data/settings-model';
import * as Buckets from '../ipc/buckets';
import * as Connections from '../ipc/connections';
import * as Objects from '../ipc/objects';
import { syncObjectsFromS3 } from '../../main/common/s3';
import { IConnection } from 'types/IConnection';

type TBucketCommands = 'buckets:add' | 'buckets:getAll';
type TConnectionCommands = 'connections:add' | 'connections:getAll';
type TSettingsCommands = 'settings:add' | 'settings:getAll';
type TObjectCommands = 'objects:getObjects' | 'objects:createFile' | 'objects:copyObjects';
interface IMessage {
  command: TBucketCommands | TSettingsCommands | TConnectionCommands | TObjectCommands;
  connection?: IConnection;
  settings?: ReturnType<SettingsModel['toJSON']>;
  id?: number;
  connectionId?: number;
  dirname?: string;
  localPath?: string;
  onProgressChannel?: string;
  onEndChannel?: string;
  sourceIds?: string[];
  targetDirname?: string;
  move?: boolean;
  keyword?: string;
  after?: number;
  limit?: number;
}
(async (ts: number) => {
  try {
    await Connections.init();
    await Buckets.init();
    await Settings.init();
    await Objects.init();
    ipcMain.handle(ipc.MAIN_API, async (event: IpcMainInvokeEvent, ...args: IMessage[]) => {
      const results = await Promise.all(
        args
          .filter(({ command }) => command)
          .map(async (arg) => {
            const [command, action] = arg.command.split(':');
            console.log('command', command, 'action', action);
            switch (command) {
              case 'connections': {
                switch (action) {
                  case 'add': {
                    if (!arg.connection) break;
                    const result = await Connections.create(arg.connection);
                    if (!result) break;
                    return {
                      result,
                      ack: new Date().getTime(),
                    };
                  }
                  case 'upsert': {
                    try {
                      if (!arg.connection) break;
                      const result = await Connections.upsert(arg.connection);
                      if (!result) break;
                      return {
                        result,
                        ack: new Date().getTime(),
                      };
                    } catch (error) {
                      console.error(error);
                      break;
                    }
                  }
                  case 'get': {
                    try {
                      if (!arg.id) break;
                      const result = await Connections.get(arg.id);
                      if (!result) break;
                      return {
                        result,
                        ack: new Date().getTime(),
                      };
                    } catch (error) {
                      console.error(error);
                      break;
                    }
                  }
                  case 'getAll': {
                    try {
                      const result = await Connections.getAll();
                      if (!result) break;
                      return {
                        result,
                        ack: new Date().getTime(),
                      };
                    } catch (error) {
                      console.error(error);
                      break;
                    }
                  }
                  case 'getRecent': {
                    const result = await Connections.getRecent(new Date(), 10);
                    if (!result) break;
                    return {
                      result,
                      ack: new Date().getTime(),
                    };
                  }
                  case 'connect': {
                    if (arg.id == null) break;
                    return syncObjectsFromS3(arg.id);
                  }
                  case 'deleteForgettableConnections': {
                    try {
                      await Connections.deleteForgettableConnections();
                      return {
                        result: true,
                        ack: new Date().getTime(),
                      };
                    } catch (error) {
                      console.error(error);
                      break;
                    }
                  }
                  default:
                    console.log('bad action');
                    break;
                }
                break;
              }
              case 'settings': {
                switch (action) {
                  case 'get': {
                    try {
                      let settings = await Settings.get();
                      const userInfo = os.userInfo();
                      const username = userInfo.username;
                      if (!settings) {
                        settings = await Settings.create({
                          apparence: {
                            mode: 'light',
                          },
                          username,
                        });
                      }
                      return {
                        ...settings,
                        isDev: !app.isPackaged || process.env.NODE_ENV === 'development',
                        logs: {
                          enabled: true,
                          savePath: path.join(app.getPath('userData'), 'logs'),
                        },
                      };
                    } catch (error) {
                      console.error(error);
                    }
                    break;
                  }
                  case 'set': {
                    if (!arg.settings) break;
                    const settings = await Settings.upsert(arg.settings);
                    return settings;
                  }
                  default:
                    console.log('bad action');
                    break;
                }
                break;
              }
              case 'apparence': {
                switch (action) {
                  case 'toggle': {
                    if (nativeTheme.shouldUseDarkColors) {
                      nativeTheme.themeSource = 'light';
                    } else {
                      nativeTheme.themeSource = 'dark';
                    }
                    return nativeTheme.shouldUseDarkColors;
                    break;
                  }
                  case 'system': {
                    nativeTheme.themeSource = 'system';
                    break;
                  }
                  default:
                    console.log('bad action');
                    break;
                }
                break;
              }
              case 'objects': {
                switch (action) {
                  case 'getObjects': {
                    try {
                      if (arg.connectionId == null) break;
                      const result = await Objects.getObjects({
                        connectionId: arg.connectionId,
                        dirname: arg.dirname ?? '',
                        keyword: arg.keyword,
                        after: arg.after,
                        limit: arg.limit ?? 50,
                      });
                      return { result, ack: new Date().getTime() };
                    } catch (err) {
                      console.error(err);
                      break;
                    }
                  }
                  case 'createFile': {
                    try {
                      if (arg.connectionId == null || arg.localPath == null) break;
                      const result = await Objects.createFile({
                        $event: event,
                        localPath: arg.localPath,
                        dirname: arg.dirname,
                        onProgressChannel: arg.onProgressChannel,
                        onEndChannel: arg.onEndChannel,
                        connectionId: arg.connectionId,
                      });
                      return { result, ack: new Date().getTime() };
                    } catch (err) {
                      console.error(err);
                      break;
                    }
                  }
                  case 'copyObjects': {
                    try {
                      if (
                        arg.connectionId == null ||
                        !arg.sourceIds?.length ||
                        arg.targetDirname === undefined
                      )
                        break;
                      const result = await Objects.copyObjects({
                        sourceIds: arg.sourceIds,
                        targetDirname: arg.targetDirname,
                        connectionId: arg.connectionId,
                        move: arg.move,
                      });
                      return { result, ack: new Date().getTime() };
                    } catch (err) {
                      console.error(err);
                      break;
                    }
                  }
                  default:
                    break;
                }
                break;
              }
              default:
                console.log('bad command');
                break;
            }
            return {
              ...arg,
              nak: new Date().getTime(),
            };
          })
          .flat(),
      );
      return {
        results,
        [results.some((result) => Object.prototype.hasOwnProperty.call(result, 'nak'))
          ? 'nak'
          : 'ack']: new Date().getTime(),
      };
    });
    console.log(`ipc handler: ${ipc.MAIN_API} initted: ${ts}`);
  } catch (error) {
    console.error(error);
  }
})(new Date().getTime());
