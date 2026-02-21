import React, { useEffect, useState } from 'react';
import { Flex, Pagination, Space, Switch, Table } from 'antd';
import { FolderOutlined, FileOutlined } from '@ant-design/icons';
import type { TableColumnsType, TableProps } from 'antd';
import { useParams } from 'react-router';
import { toHumanSize } from '../../../../shared/lib/utils';
import { FOLDER, FILE } from '../../../../shared/constants/object-type';
import { serial } from '../../../../shared/lib/utils';

type TableRowSelection<T extends object = object> = TableProps<T>['rowSelection'];

interface DataType {
  key: React.ReactNode;
  type: React.ReactNode;
  path: string;
  size: string;
  lastModified: Date;
  storageClass: string;
  children?: DataType[];
  listItemHeight?: number;
}

const columns: TableColumnsType<DataType> = [
  {
    title: 'type',
    dataIndex: 'type',
    width: '8%',
    key: 'type',
    render: (type: number) => {
      const { icon } =
        [
          { type: FOLDER, icon: FolderOutlined },
          { type: FILE, icon: FileOutlined },
        ].find((icon) => icon.type === type) ?? {};
      if (!icon) {
        return type;
      }
      return React.createElement(icon);
    },
  },
  {
    title: 'path',
    dataIndex: 'path',
    key: 'path',
  },
  {
    title: 'size',
    dataIndex: 'size',
    key: 'size',
    width: '12%',
    render: (value: number) => toHumanSize(value, 0),
  },
  {
    title: 'Last Modified',
    dataIndex: 'lastModified',
    width: '22%',
    key: 'lastModified',
    render: (value: Date) => value.toLocaleString(),
  },
  {
    title: 'storageClass',
    dataIndex: 'storageClass',
    width: '15%',
    key: 'storageClass',
  },
];

// const data: DataType[] = [
//   {
//     key: 1,
//     name: 'John Brown sr.',
//     age: 60,
//     address: 'New York No. 1 Lake Park',
//     children: [
//       {
//         key: 11,
//         name: 'John Brown',
//         age: 42,
//         address: 'New York No. 2 Lake Park',
//       },
//       {
//         key: 12,
//         name: 'John Brown jr.',
//         age: 30,
//         address: 'New York No. 3 Lake Park',
//         children: [
//           {
//             key: 121,
//             name: 'Jimmy Brown',
//             age: 16,
//             address: 'New York No. 3 Lake Park',
//           },
//         ],
//       },
//       {
//         key: 13,
//         name: 'Jim Green sr.',
//         age: 72,
//         address: 'London No. 1 Lake Park',
//         children: [
//           {
//             key: 131,
//             name: 'Jim Green',
//             age: 42,
//             address: 'London No. 2 Lake Park',
//             children: [
//               {
//                 key: 1311,
//                 name: 'Jim Green jr.',
//                 age: 25,
//                 address: 'London No. 3 Lake Park',
//               },
//               {
//                 key: 1312,
//                 name: 'Jimmy Green sr.',
//                 age: 18,
//                 address: 'London No. 4 Lake Park',
//               },
//             ],
//           },
//         ],
//       },
//     ],
//   },
//   {
//     key: 2,
//     name: 'Joe Black',
//     age: 32,
//     address: 'Sydney No. 1 Lake Park',
//   },
// ];

// rowSelection objects indicates the need for row selection
const rowSelection: TableRowSelection<DataType> = {
  onChange: (selectedRowKeys, selectedRows, info) => {
    console.log(
      `selectedRowKeys: ${selectedRowKeys}`,
      'selectedRows: ',
      selectedRows,
      'info',
      info,
    );
  },
  onSelect: (record, selected, selectedRows) => {
    console.log(record, selected, selectedRows);
  },
};

export default function Browser() {
  const params = useParams();
  const [data, setData] = useState<DataType[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    console.log(Array.from(files));

    // default = root
    // await uploadFiles(files, null);
  };

  useEffect(() => {
    if (!params.id || !params.id.match(/[0-9]/)) return;
    const promises = Array(10)
      .fill(1000)
      .map((ms, index) => () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log(`timer ${index} done!`);
            return resolve(true);
          }, ms);
        });
      });
    serial(promises).then(console.log);

    window.connections
      .connect(parseInt(params.id, 10))
      .then((result) => {
        console.log('result', result);
        setData(result);
      })
      .catch((error) => {
        console.error(error);
        alert(error);
      });
  }, [params.id]);
  return (
    <Flex
      vertical
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        maxHeight: 'calc(100vh - 80px)',
      }}
    >
      <div
        style={{
          flex: 1,
          flexGrow: 1,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 80px)',
        }}
      >
        <Table<DataType>
          columns={columns}
          rowSelection={{ ...rowSelection }}
          dataSource={data}
          sticky
          pagination={false}
          onRow={(record) => ({
            onDragOver: (event: React.DragEvent) => {
              if (record.type === FOLDER) {
                event.preventDefault();
              }
            },
            onDrop: async (event: React.DragEvent) => {
              event.preventDefault();
              event.stopPropagation();

              if (record.type !== FOLDER) return;

              const files = Array.from(event.dataTransfer.files);

              console.log('files', files);
              // await uploadFiles(files, record.path);
            },
          })}
        />
      </div>
    </Flex>
  );
}
