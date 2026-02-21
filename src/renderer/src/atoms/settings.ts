import { atom } from 'jotai';
import { ISettings } from '../../../types/ISettings';

const initialValue = {
  apparence: {
    mode: 'dark',
    language: 'en',
    sider: {
      collapsed: false,
    },
  },
} as ISettings;

export const settingsAtom = atom<ISettings>(initialValue);
