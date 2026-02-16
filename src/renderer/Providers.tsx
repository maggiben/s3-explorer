import React from 'react';
import { Provider as JotaiProvider } from 'jotai';

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <JotaiProvider>
      {/* <I18nextProvider i18n={i18n}> */}
      {children}
      {/* </I18nextProvider> */}
    </JotaiProvider>
  );
}
