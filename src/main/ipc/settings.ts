import Settings from '../models/data/settings-model';
import { MAIN_SETTINGS_ID } from '../../shared/constants/settings';
import type { ThemeConfig } from 'antd';

export async function init() {
  try {
    // This will create the table if it doesn't exist
    await Settings.sync({ alter: true });
    console.log('Settings table synced successfully');
  } catch (error) {
    console.error('Failed to sync Settings table', error);
  }
}

export async function create({
  apparence,
  username,
}: {
  apparence: {
    mode: 'light' | 'dark' | 'system';
    theme?: ThemeConfig;
  };
  username: string;
}): Promise<ReturnType<Settings['toJSON']> | undefined> {
  try {
    const settings = await Settings.create({
      id: MAIN_SETTINGS_ID,
      apparence,
      username,
    });
    if (!settings) {
      throw new Error('failed to create settings');
    }
    return settings.toJSON();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function upsert({
  apparence,
}: {
  id?: number;
  apparence: {
    mode: string;
    theme?: ThemeConfig;
  };
}): Promise<ReturnType<Settings['toJSON']> | undefined> {
  try {
    await Settings.upsert({
      id: MAIN_SETTINGS_ID,
      apparence,
    });
    const settings = await Settings.findOne({ where: { id: MAIN_SETTINGS_ID } });
    if (!settings) {
      throw new Error('failed to upsert settings');
    }
    console.log('setting', settings.toJSON());
    return settings.toJSON();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function get(id?: number): Promise<ReturnType<Settings['toJSON']> | undefined> {
  try {
    const settings = await Settings.findOne({ where: { id: id ?? MAIN_SETTINGS_ID } });

    if (!settings) {
      throw new Error('failed to get settings');
    }
    return settings.toJSON();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
