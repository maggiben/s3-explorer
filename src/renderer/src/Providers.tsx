import React from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { theme } from 'antd';
import { settingsAtom } from './atoms/settings';
import { useHydrateAtoms } from 'jotai/utils';
import type { ISettings } from '../../types/ISettings';

function HydrateAtoms({ initialValues, children }) {
  // initialising on state with prop on render here
  useHydrateAtoms(initialValues);
  return children;
}

export default function Providers({
  children,
  settings,
}: Readonly<{
  children: React.ReactNode;
  settings?: ISettings;
}>) {
  return (
    <JotaiProvider>
      {/* <I18nextProvider i18n={i18n}> */}
      <HydrateAtoms
        initialValues={[
          [
            settingsAtom,
            {
              ...settings,
            },
          ],
        ]}
      >
        {children}
      </HydrateAtoms>
      {/* </I18nextProvider> */}
    </JotaiProvider>
  );
}
