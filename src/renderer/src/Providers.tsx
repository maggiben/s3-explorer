import React from 'react';
import { Provider as JotaiProvider } from 'jotai';
import type { ExtractAtomValue } from 'jotai';
import { theme } from 'antd';
import { settingsAtom } from './atoms/settings';
import { themeAtom } from './atoms/theme';
import { useHydrateAtoms } from 'jotai/utils';

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
  settings: {
    apparence: {
      mode: string;
      theme: ExtractAtomValue<typeof themeAtom>;
    };
  };
}>) {
  const algorithm = settings.apparence.mode === 'dark' ? [theme.darkAlgorithm] : null;
  return (
    <JotaiProvider>
      {/* <I18nextProvider i18n={i18n}> */}
      <HydrateAtoms
        initialValues={[
          [
            settingsAtom,
            {
              ...settings,
              apparence: {
                ...settings.apparence,
                theme: { ...settings.apparence.theme, algorithm },
              },
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
