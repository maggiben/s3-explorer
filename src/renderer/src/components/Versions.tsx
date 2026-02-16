import { useState } from 'react';
import { Flex, Tag } from 'antd';

function Versions(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions);

  return (
    <Flex gap="small" align="center" wrap>
      <Tag>Electron v{versions.electron}</Tag>
      <Tag>Chromium v{versions.chrome}</Tag>
      <Tag>Node v{versions.node}</Tag>
    </Flex>
  );
}

export default Versions;
