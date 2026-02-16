import { atom } from 'jotai';

export const themeAtom = atom<{
  theme: unknown;
}>({
  theme: process.env.DEFAULT_THEME,
});
