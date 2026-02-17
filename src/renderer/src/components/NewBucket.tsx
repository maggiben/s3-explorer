import type { FormProps } from 'antd';
import { Button, Typography, Checkbox, Form, Input, Select, Space } from 'antd';
import Icon from '@ant-design/icons';
import { connectionAtom } from '@renderer/atoms/connection';
import { useAtom } from 'jotai';
import { recentAtom } from '@renderer/atoms/recent';
import ipc from '../../../shared/constants/ipc';
import regions from '../../../shared/constants/regions.json';
import s3Icon from '../assets/icons/s3.svg?react';
import { useParams } from 'react-router';
import { useEffect } from 'react';

const { Title } = Typography;

type FieldType = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  remember?: boolean;
  onFinish: () => Promise<FieldType | undefined>;
};

const onFinish = async (connection: FieldType): Promise<FieldType | undefined> => {
  try {
    const payload = {
      ts: new Date().getTime(),
      command: 'connections:add',
      connection,
    };
    const result = window.electron.ipcRenderer.invoke(ipc.MAIN_API, payload);
    console.log(result);
    return await result
      .then(({ results, ack }) => ack && results.shift())
      .then(({ result, ack }) => ack && result);
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
  console.log('Failed:', errorInfo);
};

function randomRange(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1)) + minCeiled;
}

function randomPass(length: number) {
  return Array.from(
    { length },
    () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
        Math.floor(Math.random() * 62)
      ],
  ).join('');
}

export default function NewBucket() {
  const [connection, setConnection] = useAtom(connectionAtom);
  const [recent, setRecent] = useAtom(recentAtom);
  const [form] = Form.useForm();
  const params = useParams();
  const getAll = () =>
    window.electron.ipcRenderer.invoke(ipc.MAIN_API, { command: 'connections:getAll' });

  useEffect(() => {
    if (!params.id || !params.id.match(/[0-9]/)) return;

    console.log('getId', params.id);
    const get = (id) =>
      window.electron.ipcRenderer.invoke(ipc.MAIN_API, { command: 'connections:get', id });
    get(params.id)
      .then(({ results, ack }) => ack && results.shift())
      .then(({ result, ack }) => ack && result)
      .then((con) => {
        console.log('connnn', con);
        setConnection(con);
        form.setFieldsValue({
          ...con,
          secretAccessKey: randomPass(randomRange(8, 16)),
        });
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  return (
    <>
      <Title level={2} editable>
        <Space>
          <Icon component={s3Icon} />
          {connection.bucket || 'New Bucket'}
        </Space>
      </Title>
      <Form
        name="basic"
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 16 }}
        // style={{ maxWidth: 600 }}
        initialValues={connection}
        onFinish={async (...args) => {
          const result = await onFinish(...args);
          console.log('result', result);
          if (result) {
            // setConnection(result);
            setRecent([...recent, ...[result]]);
          }
        }}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          label="Access Key"
          name="accessKeyId"
          rules={[{ required: true, message: 'Please input your access key!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType>
          label="Secret"
          name="secretAccessKey"
          rules={[{ required: true, message: 'Please input your secret!' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item<FieldType>
          label="Region"
          name="region"
          rules={[{ required: true, message: 'Please input your region!' }]}
        >
          <Select
            showSearch={{
              filterOption: (input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
            }}
            placeholder="Select a person"
            options={regions.map((region) => ({
              value: region.code,
              label: region.code,
            }))}
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Bucket"
          name="bucket"
          rules={[{ required: true, message: 'Please input your bucket!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<FieldType> name="remember" valuePropName="checked" label={null}>
          <Checkbox>Remember me</Checkbox>
        </Form.Item>

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit">
            Connect
          </Button>
        </Form.Item>

        <Form.Item label={null}>
          <Button
            onClick={async () => {
              const result = await getAll();
              console.log(result);
            }}
          >
            getAll
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
