import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FolderOutlined, FileOutlined } from '@ant-design/icons';
import type { TableColumnsType, TableProps } from 'antd';
import { Flex, Table, Progress, notification, Divider } from 'antd';
import { useParams } from 'react-router';
import { toHumanSize } from '../../../../shared/lib/utils';
import { FOLDER, FILE } from '../../../../shared/constants/object-type';
import type { IpcMainInvokeEvent } from 'electron';
import FileToolbar from './FileToolbar';

type TableRowSelection<T extends object = object> = TableProps<T>['rowSelection'];

interface DataType {
  id: string;
  key?: React.Key;
  type: number;
  path: string;
  size: number;
  lastModified: Date;
  storageClass: string;
  children?: DataType[];
  listItemHeight?: number;
}

const typeToIcon = [
  { type: FOLDER, icon: FolderOutlined },
  { type: FILE, icon: FileOutlined },
];

const columns: TableColumnsType<DataType> = [
  {
    title: 'path',
    dataIndex: 'path',
    key: 'path',
    ellipsis: true,
    render: (path: string, record: DataType) => {
      const { icon: Icon } = typeToIcon.find((e) => e.type === record.type) ?? {};
      let name: string;
      if (
        path
          .split(/\/(\/)/)
          .slice(0, -1)
          .pop() === '/'
      ) {
        name = '/';
      } else {
        name = basename(path);
      }
      return (
        <Flex align="center" gap={8} style={{ overflow: 'ellipsis' }}>
          {Icon ? <Icon /> : null}
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{name}</span>
        </Flex>
      );
    },
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
    width: '28%',
    key: 'lastModified',
    render: (value: Date) => value.toLocaleString(),
  },
];

// rowSelection objects indicates the need for row selection

async function getLocalPaths(files: File[]): Promise<string[]> {
  return Promise.all(files.map((file) => window.api.getFilePath(file)));
}

/** Last path segment (no folder prefix). Handles trailing slash: "movies/" → "movies". */
function basename(s3Path: string): string {
  const trimmed = s3Path.replace(/\/$/, '');
  const i = trimmed.lastIndexOf('/');
  return i >= 0 ? trimmed.slice(i + 1) : trimmed;
}

const S3_SEP = '/';

function normalizePath(p: string): string {
  return p.replace(/\/$/, '');
}

function getParentPath(path: string): string {
  const i = path.lastIndexOf(S3_SEP);
  return i >= 0 ? path.slice(0, i) : '';
}

/** All path prefixes for a given path (e.g. "a/b/c" → ["a", "a/b"]). */
function getPathPrefixes(path: string): string[] {
  const trimmed = path; //normalizePath(path);
  if (trimmed === '') return [];
  const parts = trimmed.split(S3_SEP).filter(Boolean);
  if (
    trimmed
      .split(/\/(\/)/)
      .slice(0, -1)
      .pop() === '/'
  ) {
    parts.push('/');
  } else if (trimmed.slice(-1) === '/') {
    parts.push('/');
  }
  const prefixes = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join(S3_SEP));
  return prefixes;
}

/** Unique folder paths that must exist as nodes, sorted by path (parent before child). */
function getSortedFolderPaths(flat: Omit<DataType, 'children'>[]): string[] {
  const set = flat.reduce<Set<string>>((acc, item) => {
    getPathPrefixes(item.path).forEach((p) => {
      acc.add(p);
    });
    return acc;
  }, new Set());
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Synthetic folder node (path prefix not present in API data); uses stable id for table key. */
function createFolderNode(pathPrefix: string): DataType {
  const pathKey = normalizePath(pathPrefix);
  const id = `folder:${pathKey}`;
  return {
    id,
    key: id,
    path: pathPrefix,
    type: FOLDER,
    size: 0,
    lastModified: new Date(0),
    storageClass: '',
    children: [],
  };
}

/** Build path → node map from tree (one entry per path; node is from tree). */
function buildPathMap(nodes: DataType[]): Map<string, DataType> {
  return nodes.reduce<Map<string, DataType>>((acc, n) => {
    const key = normalizePath(n.path);
    const childMap = n.children?.length ? buildPathMap(n.children) : new Map();
    return new Map([...acc, ...childMap, [key, n]]);
  }, new Map());
}

/** Return new roots with the node at pathKey replaced by newNode. Preserves key/id on updated nodes. */
function replaceNodeInTree(roots: DataType[], pathKey: string, newNode: DataType): DataType[] {
  return roots.map((node) => {
    if (normalizePath(node.path) === pathKey) return newNode;
    if (node.children?.length) {
      const children = replaceNodeInTree(node.children, pathKey, newNode);
      return { ...node, key: node.id, children };
    }
    return { ...node, key: node.id };
  });
}

/** Return new roots with node added under parentPath (or at root if parentPath === ''). Works for any nesting depth. */
function addNodeToTree(roots: DataType[], parentPath: string, node: DataType): DataType[] {
  if (parentPath === '') return [...roots, node];
  const parentKey = normalizePath(parentPath);
  return roots.map((n) => {
    if (normalizePath(n.path) !== parentKey) {
      if (n.children?.length) {
        const children = addNodeToTree(n.children, parentPath, node);
        return { ...n, key: n.id, children };
      }
      return { ...n, key: n.id };
    }
    return { ...n, key: n.id, children: [...(n.children ?? []), node] };
  });
}

/**
 * Builds a tree from flat S3 paths using "/" as folder separator.
 * Pure functional style: map, reduce, filter, sort; no side effects; returns new objects.
 */
function transformPlainS3PathToTreeTableData(flat: Omit<DataType, 'children'>[]): DataType[] {
  const sortedFlat = [...flat].sort((a, b) => a.path.localeCompare(b.path));
  const sortedFolderPaths = getSortedFolderPaths(sortedFlat);

  // Build folder-only tree: map path → node, then attach children deep-first (immutable).
  const folderPathsDeepFirst = [...sortedFolderPaths].sort((a, b) => b.localeCompare(a));
  const initialFolderMap = new Map(
    sortedFolderPaths.map((pathPrefix) => [
      normalizePath(pathPrefix),
      createFolderNode(pathPrefix),
    ]),
  );
  const folderMapWithChildren = folderPathsDeepFirst.reduce<Map<string, DataType>>((map, path) => {
    const node = map.get(normalizePath(path))!;
    const parentPath = getParentPath(path);
    if (parentPath === '') return map;
    const parent = map.get(normalizePath(parentPath))!;
    const newParent: DataType = {
      ...parent,
      key: parent.id,
      children: [...(parent.children ?? []), node],
    };
    return new Map(map).set(normalizePath(parentPath), newParent);
  }, initialFolderMap);

  const folderRoots = sortedFolderPaths
    .filter((p) => getParentPath(p) === '')
    .map((p) => folderMapWithChildren.get(normalizePath(p))!);

  // Attach each flat item to the tree; merge real folder data onto synthetic folders.
  const pathToNode = buildPathMap(folderRoots);

  const { roots } = sortedFlat.reduce<{ roots: DataType[]; pathToNode: Map<string, DataType> }>(
    (acc, item) => {
      const key = normalizePath(item.path);
      const parentPath = getParentPath(item.path);
      const existingFolder = item.type === FOLDER ? acc.pathToNode.get(key) : undefined;

      if (existingFolder) {
        const newNode: DataType = {
          ...item,
          key: item.id,
          children: existingFolder.children ?? [],
        };
        const newRoots = replaceNodeInTree(acc.roots, key, newNode);
        const newMap = new Map(acc.pathToNode).set(key, newNode);
        return { roots: newRoots, pathToNode: newMap };
      }

      const node: DataType = {
        ...item,
        key: item.id,
        children: item.type === FOLDER ? [] : undefined,
      };
      const newRoots = addNodeToTree(acc.roots, parentPath, node);
      const newMap = new Map(acc.pathToNode).set(key, node);
      return { roots: newRoots, pathToNode: newMap };
    },
    { roots: folderRoots, pathToNode },
  );

  return roots;
}

/** Cached presigned URL for drag-out via DownloadURL (instant drag; may not work on all OS). */
const DOWNLOAD_URL_MIME = 'application/octet-stream';

export default function Browser() {
  const params = useParams();
  const [data, setData] = useState<Omit<DataType, 'children'>[]>([]);
  const [selected, setSelected] = useState<DataType[]>([]);
  const [api, contextHolder] = notification.useNotification();
  const connectionId = params.id ? parseInt(params.id, 10) : undefined;
  const dragUrlRef = useRef<{ path: string; url: string } | null>(null);

  const refreshList = (connectionId?: number): Promise<void> => {
    if (!connectionId || !Number.isFinite(connectionId)) return Promise.resolve(void 0);
    return window.connections
      .connect(connectionId)
      .then((result) => {
        console.log('result', result);
        return result;
      })
      .then((result) => setData(Array.isArray(result) ? result : []))
      .catch((err) => console.error(err));
  };

  const treeData = useMemo(() => transformPlainS3PathToTreeTableData(data), [data]);

  const rowSelection: TableRowSelection<DataType> = {
    onChange: (selectedRowKeys, selectedRows, info) => {
      console.log(
        `selectedRowKeys: ${selectedRowKeys}`,
        'selectedRows: ',
        selectedRows,
        'info',
        info,
      );
      setSelected(selectedRows);
    },
    onSelect: (record, selected, selectedRows) => {
      console.log(record, selected, selectedRows);
    },
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('handleDrop', event, connectionId, params.id);
    if (connectionId == null || !Number.isFinite(connectionId)) return;

    // const objectId = event.dataTransfer.getData(S3_OBJECT_ID_KEY);
    // if (objectId) return;

    const files = Array.from(event.dataTransfer.files);
    // const filePaths = await Promise.all(files.map((file) => window.api.getFilePath(file)));
    const localPaths = await getLocalPaths(files);
    // console.log('localPaths', localPaths, files, files.map((f) => (f as File & { path?: string }).path ?? ''));
    if (localPaths.length === 0) return;
    try {
      const results = await Promise.all(
        localPaths.map(async (localPath, index) => {
          const rate = 1 / localPaths.length;
          const id = window.crypto.randomUUID();
          const newFile = await window.objects.createFile({
            id,
            connectionId,
            localPath,
            dirname: undefined,
            onProgress: (
              event: IpcMainInvokeEvent,
              { loaded, total }: { loaded: number; total: number; part: number },
            ) => {
              // const progress = Math.round(index * rate * 100 + (loaded / total) * rate * 100);
              const progress = Math.round((loaded / total) * 100);
              api.open({
                key: id,
                title: `file ${localPath} progress`,
                description: (
                  <Flex gap="small" vertical>
                    <Progress percent={progress} />
                  </Flex>
                ),
                duration: false,
              });
              console.log('progress', progress);
            },
            onEnd: () => {
              api.destroy(id);
              refreshList(connectionId);
              console.log('file ended', id);
            },
          });
          console.log('newFile', newFile);
          return newFile;
        }),
      );
      console.log('results', results);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  useEffect(() => {
    refreshList(connectionId);
  }, [connectionId]);

  return (
    <Flex
      vertical
      onDragOver={(event) => {
        !treeData.length && handleDragOver(event);
      }}
      onDrop={(event) => {
        !treeData.length && handleDrop(event);
      }}
      style={{
        maxHeight: 'calc(100vh - 80px)',
      }}
    >
      {contextHolder}
      <div
        style={{
          flex: 1,
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        <FileToolbar selected={selected} connectionId={connectionId} refreshList={refreshList} />
        <Divider style={{ margin: '10px 0' }} />
        <div
          style={{
            flex: 1,
            flexGrow: 1,
            overflow: 'auto',
            height: '100vh',
            // maxHeight: 'calc(100vh - 80px)',
          }}
        >
          <Table<DataType>
            rowKey="id"
            columns={columns}
            rowSelection={{ ...rowSelection }}
            dataSource={treeData}
            pagination={false}
            sticky
            style={{
              height: 'calc(100vh + 200px)',
            }}
            onRow={(record) => {
              return {
                draggable: true,
                // onMouseDown: () => {
                //   if (record.type !== FILE || connectionId == null) return;
                //   window.api
                //     .getSignedUrlForDrag(connectionId, record.path)
                //     .then((url) => {
                //       if (url) dragUrlRef.current = { path: record.path, url };
                //     })
                //     .catch(() => {});
                // },
                onDragStart: (event: React.DragEvent) => {
                  if (record.type !== FILE || connectionId == null) return;
                  const name = basename(record.path) || 'download';
                  const cached = dragUrlRef.current;
                  if (cached?.path === record.path && cached.url) {
                    try {
                      event.dataTransfer.setData(
                        'DownloadURL',
                        `${DOWNLOAD_URL_MIME}:${name}:${cached.url}`,
                      );
                      event.dataTransfer.effectAllowed = 'copy';
                      // Do NOT preventDefault so the OS receives the DownloadURL drag
                      return;
                    } catch {
                      // fall through to main-process drag
                    }
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  window.api.startDrag({
                    connectionId,
                    path: record.path,
                    basename: name,
                  });
                },
                onDragEnd: () => {
                  dragUrlRef.current = null;
                },
                onDragOver: (event: React.DragEvent) => {
                  if (record.type === FOLDER) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = 'move';
                  }
                },
                onDrop: async (event: React.DragEvent) => {
                  if (record.type === FOLDER) {
                    event.preventDefault();
                    event.stopPropagation();
                    console.log(event.dataTransfer, event.dataTransfer.getData('text/plain'));
                    const localPaths = await getLocalPaths(Array.from(event.dataTransfer.files));
                    if (localPaths.length === 0 || !connectionId) return;
                    try {
                      const results = await Promise.all(
                        localPaths.map(async (localPath, index) => {
                          const rate = 1 / localPaths.length;
                          const id = window.crypto.randomUUID();
                          const newFile = await window.objects.createFile({
                            id,
                            connectionId,
                            localPath,
                            dirname: record.path,
                            onProgress: (
                              event: IpcMainInvokeEvent,
                              { loaded, total }: { loaded: number; total: number; part: number },
                            ) => {
                              // const progress = Math.round(index * rate * 100 + (loaded / total) * rate * 100);
                              const progress = Math.round((loaded / total) * 100);
                              api.open({
                                key: id,
                                title: `file ${localPath} progress`,
                                description: (
                                  <Flex gap="small" vertical>
                                    <Progress percent={progress} />
                                  </Flex>
                                ),
                                duration: false,
                              });
                              console.log('progress', progress);
                            },
                            onEnd: () => {
                              api.destroy(id);
                              refreshList(connectionId);
                              console.log('file ended', id);
                            },
                          });
                          console.log('newFile', newFile);
                          return newFile;
                        }),
                      );
                      console.log('results', results);
                    } catch (err) {
                      console.error(err);
                      alert(err instanceof Error ? err.message : 'Upload failed');
                    }
                    // const result = await Promise.all(
                    //   files.map(async (file) => {
                    //     try {
                    //       await window.objects.copyObjects({
                    //         connectionId,
                    //         sourceIds: [sourceId],
                    //         targetDirname: folderPath,
                    //         move: true,
                    //       });
                    //       refreshList();
                    //     } catch (err) {
                    //       console.error(err);
                    //       alert(err instanceof Error ? err.message : 'Move failed');
                    //     }
                    //   }),
                    // );
                  }
                },
              };
            }}
            // onRow={(record) => {
            //   const folderPath =
            //     record.type === FOLDER && record.path ? record.path.replace(/\/$/, '') : '';
            //   return {
            //     draggable: true,
            //     onDragStart: (e: React.DragEvent) => {
            //       e.dataTransfer.setData(
            //         S3_OBJECT_ID_KEY,
            //         String(record.id ?? record.key ?? record.path),
            //       );
            //       e.dataTransfer.effectAllowed = 'move';
            //     },
            //     onDragOver: (e: React.DragEvent) => {
            //       if (record.type === FOLDER) {
            //         e.preventDefault();
            //         e.stopPropagation();
            //         e.dataTransfer.dropEffect = 'move';
            //       }
            //     },
            //     onDrop: async (e: React.DragEvent) => {
            //       e.preventDefault();
            //       e.stopPropagation();
            //       if (record.type !== FOLDER || !connectionId) return;
            //       // LOCAL FILE UPLOAD
            //       const files = Array.from(e.dataTransfer.files);
            //       if (!files.length) return;

            //       try {
            //         for (const file of files) {
            //           await window.objects.createFile({
            //             connectionId,
            //             file,
            //             dirname: folderPath,
            //             mimeType: file.type || 'application/octet-stream',
            //             onProgressChannel: undefined,
            //           });
            //         }
            //         refreshList();
            //       } catch (err) {
            //         console.error(err);
            //         alert(err instanceof Error ? err.message : 'Upload failed');
            //       } finally {
            //         setUploading(false);
            //       }
            //       // const sourceId = e.dataTransfer.getData('text/plain');

            //       // console.log('sourceId', sourceId);

            //       // if (!sourceId) {
            //       //   const files = Array.from(e.dataTransfer.files);
            //       //   const localPaths = getLocalPaths(files);
            //       //   if (localPaths.length === 0) return;
            //       //   setUploading(true);
            //       //   try {
            //       //     for (const localPath of localPaths) {
            //       //       await window.objects.createFile({
            //       //         connectionId,
            //       //         localPath,
            //       //         dirname: folderPath,
            //       //         onProgressChannel: undefined,
            //       //       });
            //       //     }
            //       //     refreshList();
            //       //   } catch (err) {
            //       //     console.error(err);
            //       //     alert(err instanceof Error ? err.message : 'Upload failed');
            //       //   } finally {
            //       //     setUploading(false);
            //       //   }
            //       //   return;
            //       // }

            //       // if (sourceId === record.id) return;
            //       // try {
            //       //   await window.objects.copyObjects({
            //       //     connectionId,
            //       //     sourceIds: [sourceId],
            //       //     targetDirname: folderPath,
            //       //     move: true,
            //       //   });
            //       //   refreshList();
            //       // } catch (err) {
            //       //   console.error(err);
            //       //   alert(err instanceof Error ? err.message : 'Move failed');
            //       // }
            //     },
            //   };
            // }}
          />
        </div>
      </div>
    </Flex>
  );
}
