import './assets/main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Modal from './Modal';
import ipc from '../../shared/constants/ipc';

(async (ts: number) => {
  const settings = await window.electron.ipcRenderer.invoke(ipc.MAIN_API, {
    command: 'settings:get',
  });
  console.log(settings)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App settings={settings.results.shift()} ts={ts} />
    </StrictMode>,
  );
})(new Date().getTime());

(async (ts: number) => {
  const settings = await window.electron.ipcRenderer.invoke(ipc.MAIN_API, {
    command: 'settings:get',
  });
  document.getElementById('modal') &&
    createRoot(document.getElementById('modal')!).render(
      <StrictMode>
        <Modal settings={settings} ts={ts} />
      </StrictMode>,
    );
})(new Date().getTime());

// Use contextBridge
window.electron.ipcRenderer.on('main-process-message', (event, message) => {
  console.log(event, message);
});
