import { Flex, Space, Button, Divider, Input } from 'antd';
import { SearchOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

interface DataType {
  id: string;
  key?: React.Key;
  type: number;
  path: string;
  size: number;
  lastModified: Date;
  storageClass: string;
  children?: DataType[];
}

export default function FileToolbar({
  selected,
  connectionId,
  refreshList,
}: {
  selected: DataType[];
  connectionId?: number;
  refreshList: (connectionId: number) => Promise<void>;
}) {
  const handleDelete = async () => {
    if (!connectionId) return;
    try {
      await window.objects.deleteObjects({
        ids: selected.map(({ id }) => id) as string[],
        connectionId,
      });
      await refreshList(connectionId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateFolder = async () => {
    if (!connectionId) return;
    try {
      await window.objects.createFolder({
        basename: 'music/classical',
        // basename: 'music/jazz',
        // basename: 'music',
        connectionId,
      });
      await refreshList(connectionId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = () => {
    console.log('search');
  };

  return (
    <Flex wrap gap="small" align="center">
      <Space.Compact>
      <Button icon={<PlusOutlined />} onClick={handleCreateFolder}></Button>
        <Button icon={<DeleteOutlined />} shape="square" danger onClick={handleDelete}></Button>
      </Space.Compact>
      <Divider vertical />
      <Space.Compact>
        <Input defaultValue="" />
        <Button icon={<SearchOutlined />} onClick={handleSearch}></Button>
      </Space.Compact>
    </Flex>
  );
}
