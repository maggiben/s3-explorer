import { ExtractAtomValue } from 'jotai';
import type { ThemeConfig } from 'antd';
import { selectAtom } from 'jotai/utils';
import { settingsAtom } from './settings';

export const themeAtom = selectAtom<
  { apparence: { mode: 'light' | 'dark' | 'system'; theme?: ThemeConfig } },
  ExtractAtomValue<typeof settingsAtom>
>(settingsAtom, (settings) => ({ apparence: settings.apparence }));
