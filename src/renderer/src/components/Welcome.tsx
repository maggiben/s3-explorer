import { Button, Typography } from 'antd';
import Versions from './Versions';
const { Title } = Typography;
export default function Welcome() {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');
  return (
    <>
      <Title>Hello World</Title>
      <Button onClick={() => ipcHandle()}>Click Me</Button>
      <br />
      <br />
      <Versions />
    </>
  );
}