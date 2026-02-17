import { Button, Typography, Flex, Col, Row, theme, Space, Divider, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import Versions from './Versions';
import ipc from '../../../shared/constants/ipc';
import { ExtractAtomValue, useAtom } from 'jotai';
import { settingsAtom } from '@renderer/atoms/settings';
const { Title } = Typography;
export default function Welcome() {
  const navigate = useNavigate();
  const [settings, setSettings] = useAtom(settingsAtom);

  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');
  const update = () =>
    window.electron.ipcRenderer.invoke(ipc.MAIN_API, { ts: new Date().getTime() });

  const darkMode = async () => {
    const { results } = await window.electron.ipcRenderer.invoke(ipc.MAIN_API, {
      command: 'settings:set',
      settings: {
        apparence: {
          mode: 'dark',
        },
      },
    });
    const { apparence } = results.shift() as ExtractAtomValue<typeof settingsAtom>;
    setSettings({
      ...settings,
      apparence: {
        ...apparence,
        theme: {
          algorithm: [theme.darkAlgorithm],
        },
      },
    });
  };

  const lightMode = async () => {
    const { results } = await window.electron.ipcRenderer.invoke(ipc.MAIN_API, {
      command: 'settings:set',
      settings: {
        apparence: {
          mode: 'light',
        },
      },
    });

    const { apparence } = results.shift() as ExtractAtomValue<typeof settingsAtom>;
    setSettings({
      ...settings,
      apparence: {
        ...apparence,
        theme: {
          algorithm: [theme.defaultAlgorithm],
        },
      },
    });
  };

  const getRecent = () =>
    window.electron.ipcRenderer.invoke(
      ipc.MAIN_API,
      { command: 'connections:getRecent' },
      { command: 'connections:getAll' },
      { command: 'connections:geto' },
    );

  return (
    <Flex vertical justify="space-between" style={{ height: '100%' }}>
      <Space align="center">
        <Title style={{ marginBottom: 0 }}>Welcome:&nbsp;</Title>
        <Avatar shape="square" icon={<UserOutlined />} />
        <Title level={2} style={{ marginBottom: 0 }}>
          {settings.username}
        </Title>
      </Space>
      <Flex vertical style={{ flexGrow: 1 }}>
        <Row>
          <Col span={12}>
            <Button type="primary" onClick={() => ipcHandle()}>
              Ping
            </Button>
          </Col>
          <Divider />
          <Col span={24}>
            <Space>
              <Button onClick={() => navigate('/new')}>Nav</Button>
              <Button onClick={() => darkMode()}>Dark</Button>
              <Button onClick={() => lightMode()}>Light</Button>
            </Space>
          </Col>
          <Col span={24}>
            <Space>
              <Button onClick={async () => { 
                const result = await getRecent();
                console.log(result);
              }}>recent</Button>
            </Space>
          </Col>
        </Row>
      </Flex>
      <Flex align="center" justify="flex-end">
        <Versions />
      </Flex>
    </Flex>
  );
}
