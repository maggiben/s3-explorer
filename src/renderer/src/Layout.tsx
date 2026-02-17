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
import { ConfigProvider, Breadcrumb, Layout, Menu, theme, Avatar, Space } from 'antd';
import type { SiderTheme } from 'antd/es/layout/Sider';
import { useAtomValue } from 'jotai';
import { themeAtom } from './atoms/theme';
import useRecent from './hooks/useRecent';

import NewBucket from './components/NewBucket';
import Welcome from './components/Welcome';

const { Header, Content, Sider } = Layout;

const items2: MenuProps['items'] = [
  {
    icon: ClockCircleOutlined,
    label: 'Recent',
  },
  {
    icon: HeartOutlined,
    label: 'Favourites',
  },
  {
    icon: HddOutlined,
    label: 'Buckets',
  },
].map(({ icon, label }, index) => {
  const key = String(index + 1);

  return {
    key: `sub${key}`,
    icon: React.createElement(icon),
    label,
    children: Array.from({ length: 4 }).map((_, j) => {
      const subKey = index * 4 + j + 1;
      return {
        key: subKey,
        label: `option${subKey}`,
        icon: React.createElement(FolderOutlined),
      };
    }),
  };
});

const settings: MenuProps['items'] = [UserOutlined].map((icon, index) => {
  const key = String(index + 1);

  return {
    key: `sub${key}`,
    icon: React.createElement(icon),
    label: `subnav ${key}`,
    children: Array.from({ length: 4 }).map((_, j) => {
      const subKey = index * 4 + j + 1;
      return {
        key: subKey,
        label: `option${subKey}`,
      };
    }),
  };
});

function createRecentMenu(connections: { bucket: string; id: number; }[]): MenuProps['items'] {
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
  const [collapsed, setCollapsed] = React.useState(true);
  const { apparence } = useAtomValue(themeAtom);
  const recent = useRecent();
  console.log('recent', recent);
  // const [xxxa, setxxxa] = useAtom(asyncStrAtom);

  // console.log('xxxa', xxxa);

  console.log('appTheme', apparence);

  return (
    <HashRouter>
      <ConfigProvider theme={apparence.theme}>
        <Layout style={{ minHeight: '100vh', minWidth: '100vw' }}>
          <Layout>
            <Sider
              width={200}
              theme={apparence.mode as SiderTheme}
              collapsible
              collapsed={collapsed}
              onCollapse={(value) => setCollapsed(value)}
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
                  items={recent?.length ? createRecentMenu(recent) : []}
                />
                <Menu
                  mode="inline"
                  defaultSelectedKeys={['1']}
                  defaultOpenKeys={[]}
                  style={{ height: '100%', borderInlineEnd: 0, alignContent: 'end' }}
                  items={settings}
                />
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
                  <Route path="/new" element={<NewBucket />} />
                  <Route path="/new/:id" element={<NewBucket />} />
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
