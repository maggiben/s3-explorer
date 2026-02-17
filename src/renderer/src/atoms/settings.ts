import { atom } from 'jotai';
import type { ThemeConfig } from 'antd';

export const settingsAtom = atom<{
  apparence: {
    mode: 'light' | 'dark' | 'system';
    theme?: ThemeConfig;
  };
  username: string;
}>({
  apparence: {
    mode: 'light',
  },
  username: '',
});
