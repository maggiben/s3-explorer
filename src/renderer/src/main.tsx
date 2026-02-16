import './assets/main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Modal from './Modal';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

document.getElementById('modal') &&
  createRoot(document.getElementById('modal')!).render(
    <StrictMode>
      <Modal />
    </StrictMode>,
  );

// Use contextBridge
window.electron.ipcRenderer.on('main-process-message', (event, message) => {
  console.log(event, message);
});
