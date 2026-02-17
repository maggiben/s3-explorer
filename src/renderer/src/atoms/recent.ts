import { atom } from 'jotai';

export const recentAtom = atom<
  {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    remember?: boolean;
    id?: string;
  }[]
>([]);
