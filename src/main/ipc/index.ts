import os from 'os';
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import ipc from '../../shared/constants/ipc';
import * as Settings from '../ipc/settings';
import SettingsModel from '../models/data/settings-model';
import * as Buckets from '../ipc/buckets';
import * as Connections from '../ipc/connections';

type TBucketCommands = 'buckets:add' | 'buckets:getAll';
type TConnectionCommands = 'connections:add' | 'connections:getAll';
type TSettingsCommands = 'settings:add' | 'settings:getAll';
interface IMessage {
  command: TBucketCommands | TSettingsCommands | TConnectionCommands;
  connection?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    remember?: string;
  };
  settings?: ReturnType<SettingsModel['toJSON']>;
  id?: number;
}
(async (ts: number) => {
  try {
    await Connections.init();
    await Buckets.init();
    await Settings.init();
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
                      return settings;
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
