import type { DependencyList } from 'react';
import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { recentAtom } from '@renderer/atoms/recent';
import ipc from '../../../shared/constants/ipc';

export default function useRecent<T>(deps?: DependencyList): T[] | undefined | void {
  const [recent, setRecent] = useAtom(recentAtom);
  const getRecent = async () =>
    window.electron.ipcRenderer.invoke(ipc.MAIN_API, { command: 'connections:getRecent' });

  useEffect(() => {
    getRecent()
      .then(({ results, ack }) => ack && results.shift())
      .then(({ result, ack }) => ack && result)
      .then((results) =>  setRecent(results))
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);

  return recent as T[];
}
