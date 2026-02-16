import '@renderer/assets/styles/Modal.css';
// import i18n from '@utils/i18n';
// import { I18nextProvider } from 'react-i18next';
import { Provider as JotaiProvider } from 'jotai';
// import { preferencesState } from '@states/atoms';

// Global style to set the background color of the body

export default function Modal() {
  return (
    <JotaiProvider>
      {/* <I18nextProvider i18n={i18n}> */}
      <h1>My Modal</h1>
      {/* </I18nextProvider> */}
    </JotaiProvider>
  );
}
