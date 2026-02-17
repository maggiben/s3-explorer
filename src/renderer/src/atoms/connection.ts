import { atom } from 'jotai';
import regions from '../../../shared/constants/regions.json';

export const connectionAtom = atom<{
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  remember?: boolean;
  id?: string;
}>({
  accessKeyId: '',
  secretAccessKey: '',
  region: regions[0].code,
  bucket: '',
  remember: true,
});
