import React from 'react';
import {
  ClockCircleOutlined,
  HeartOutlined,
  UserOutlined,
  FolderOutlined,
  HddOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { Routes, Route, HashRouter, Link } from 'react-router';
import type { MenuProps } from 'antd';
import { ConfigProvider, Breadcrumb, Layout, Menu, theme } from 'antd';
import type { SiderTheme } from 'antd/es/layout/Sider';
import { useAtom, useAtomValue } from 'jotai';
import { themeAtom } from './atoms/theme';
import { settingsAtom } from './atoms/settings';
import useRecent from './hooks/useRecent';

import Connection from './components/Connection/Connection';
import Browser from './components/Browser/Browser';
import Welcome from './components/Welcome';
import { mergeDeep } from '../../shared/lib/utils';

const { Header, Content, Sider } = Layout;

// const settings: MenuProps['items'] = [UserOutlined].map((icon, index) => {
//   const key = String(index + 1);
//   return {
//     key: `sub${key}`,
//     icon: React.createElement(icon),
//     label: `subnav ${key}`,
//     children: Array.from({ length: 4 }).map((_, j) => {
//       const subKey = index * 4 + j + 1;
//       return {
//         key: subKey,
//         label: `option${subKey}`,
//       };
//     }),
//   };
// });

function createRecentMenu(connections: { bucket: string; id: number }[]): MenuProps['items'] {
  const menu = [
    {
      icon: ClockCircleOutlined,
      label: 'Recent',
    },
  ].map(({ icon, label }, index) => {
    const key = String(index + 1);
    return {
      key: `sub${key}`,
      icon: React.createElement(icon),
      label,
      children: connections.map(({ bucket, id }, j) => ({
        key: `subx${index * 4 + j + 1}`,
        label: <Link to={`/new/${id}`}>{bucket}</Link>,
        icon: React.createElement(FolderOutlined),
      })),
    };
  });
  return menu;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [recent] = useRecent();
  const algorithm = settings.apparence.mode === 'dark' ? [theme.darkAlgorithm] : [];
  return (
    <HashRouter>
      <ConfigProvider theme={{ ...settings.apparence.theme, algorithm }}>
        <Layout style={{ minHeight: '100vh', minWidth: '100vw' }}>
          <Layout>
            <Sider
              width={200}
              theme={settings.apparence.mode as SiderTheme}
              collapsible
              collapsed={settings.apparence.sider?.collapsed}
              onCollapse={async (value) => {
                const newSettings = await window.settings.set(
                  mergeDeep({
                    ...settings,
                    apparence: {
                      ...settings.apparence,
                      sider: {
                        collapsed: value,
                      },
                    },
                  }),
                );
                console.log('newSetting', newSettings);
                setSettings(newSettings);
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                <Menu
                  mode="inline"
                  defaultSelectedKeys={['1']}
                  defaultOpenKeys={[]}
                  style={{ height: '100%', borderInlineEnd: 0 }}
                  items={
                    recent?.length
                      ? createRecentMenu(recent as { bucket: string; id: number }[])
                      : []
                  }
                />
                {/* <Menu
                  mode="inline"
                  defaultSelectedKeys={['1']}
                  defaultOpenKeys={[]}
                  style={{ height: '100%', borderInlineEnd: 0, alignContent: 'end' }}
                  items={settings}
                /> */}
              </div>
            </Sider>
            <Layout style={{ padding: '0 24px 24px' }}>
              <Breadcrumb
                items={[
                  {
                    title: (
                      <>
                        <HomeOutlined />
                        <span>Home</span>
                      </>
                    ),
                    href: '/',
                  },
                ]}
                style={{ margin: '16px 0' }}
              />
              <Content>
                <Routes>
                  <Route index path="/" element={<Welcome />} />
                  <Route path="/new" element={<Connection />} />
                  <Route path="/new/:id" element={<Connection />} />
                  <Route path="/browse" element={<Browser />} />
                  <Route path="/browse/:id" element={<Browser />} />
                  <Route path="/motd" element={children} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </ConfigProvider>
    </HashRouter>
  );
}
