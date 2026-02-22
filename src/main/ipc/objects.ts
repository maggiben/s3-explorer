import fs from 'fs';
import path from 'path';
import mimeTypes from 'mime-types';
import { Op } from 'sequelize';
// const { NotFoundError, ConflictError } = require('../../../shared/errors');
import * as OBJECT_TYPE from '../../shared/constants/object-type';
import * as STORAGE_CLASS from '../../shared/constants/storage-class';
import * as s3 from '../common/s3';
import Objects from '../models/data/objects-model';
import { IpcMainInvokeEvent } from 'electron';
import { serial } from '../../shared/lib/utils';
import { generateLikeSyntax, parseKeyword } from '../common/database';

export async function init() {
  try {
    // This will create the table if it doesn't exist
    await Objects.sync({ alter: true });
    console.log('Objects table synced successfully');
  } catch (error) {
    console.error('Failed to sync Objects table', error);
  }
}

export async function getObjects(
  {
    connectionId,
    dirname,
    keyword,
    after,
    limit,
  }: {
    connectionId: number;
    dirname: string;
    keyword?: string;
    after?: number;
    limit: number;
  } = {
    connectionId: 0,
    dirname: '',
    limit: 50,
  } as {
    connectionId: number;
    dirname: string;
    limit: number;
  },
) {
  const keywordConditions = keyword
    ? (({ plus, minus }) => [
        plus.map((plusKeyword) => ({ path: { [Op.like]: generateLikeSyntax(plusKeyword) } })),
        minus.map((minusKeyword) => ({ path: { [Op.like]: generateLikeSyntax(minusKeyword) } })),
      ])(parseKeyword(keyword))
    : [];

  const afterConditions = after
    ? await (async (id: number) => {
        const cursor = await Objects.findOne({
          where: { id },
          attributes: ['id', 'type', 'basename'],
        });

        if (!cursor) {
          throw new Error(`not found object ${after}`);
        }

        return [
          {
            [Op.and]: [
              { type: { [Op.gte]: cursor.type } },
              { basename: { [Op.gt]: cursor.basename } },
            ],
          },
          {
            [Op.and]: [
              { type: { [Op.gte]: cursor.type } },
              { basename: cursor.basename },
              { id: { [Op.gt]: cursor.id } },
            ],
          },
        ];
      })(after)
    : [];

  const objects = await Objects.findAll({
    where: {
      connectionId,
      dirname: keywordConditions.length
        ? { [Op.like]: generateLikeSyntax(dirname, { start: '' }) }
        : dirname,
      ...(afterConditions.length ? { [Op.or]: afterConditions } : undefined),
      ...(keywordConditions.length ? { [Op.and]: keywordConditions } : undefined),
    },
    order: [
      ['type', 'ASC'],
      ['basename', 'ASC'],
      ['id', 'ASC'],
    ],
    limit: limit + 1,
  });

  return {
    hasNextPage: objects.length > limit,
    items: objects.slice(0, limit).map((object) => object.toJSON()),
  };
}

/**
 * @param {number} id
 * @returns {Promise<Objects>}
 */
export async function getObject({ id, connectionId }: { id: number; connectionId: number }) {
  const object = await Objects.findOne({ where: { id } });

  if (!object) {
    throw new Error('Object not found');
  }

  const headers = await s3.headObject(object.path, connectionId);

  let url: string | undefined = undefined;
  if (headers?.ContentType?.startsWith('image/')) {
    url = await s3.getSignedUrl(object.path, { expiresIn: 60 * 60 }, id);
  } else if (headers?.ContentType?.startsWith('video/')) {
    url = await s3.getSignedUrl(object.path, { expiresIn: 60 * 60 }, id);
  }

  return {
    ...object.toJSON(),
    url,
    objectHeaders: headers,
  };
}

/**
 * @param {string} dirname
 * @param {string} basename
 * @returns {Promise<Objects>}
 */
export async function createFolder({
  dirname,
  basename,
  connectionId,
}: {
  dirname?: string;
  basename?: string;
  connectionId: number;
}) {
  const object = new Objects({
    type: OBJECT_TYPE.FOLDER,
    connectionId,
    path: dirname || null ? `${dirname}/${basename}/` : `${basename}/`,
  });

  if (object.dirname) {
    const parent = await Objects.findOne({
      where: {
        type: OBJECT_TYPE.FOLDER,
        path: `${object.dirname}/`,
      },
    });

    if (!parent) {
      throw new Error(`not found parent "${object.dirname}"`);
    }
  }

  try {
    await object.save();
    await s3.putObject(object.path, connectionId, {
      Body: new Uint8Array(0),
      ContentLength: 0,
    });
    return object.toJSON();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * @param {IpcMainInvokeEvent} $event
 * @param {string} localPath
 * @param {string} dirname
 * @param {string} onProgressChannel
 * @returns {Promise<Objects>}
 */
export async function createFile({
  $event,
  localPath = '/',
  dirname,
  onProgressChannel,
  onEndChannel,
  connectionId,
}: {
  $event: IpcMainInvokeEvent;
  localPath?: string;
  dirname?: string;
  onProgressChannel?: string;
  onEndChannel?: string;
  connectionId: number;
}) {
  const basename = path.basename(localPath);
  const object = new Objects({
    type: OBJECT_TYPE.FILE,
    path: dirname ? `${dirname.split('/').slice(0, -1).join('/')}/${basename}` : `${basename}`,
    storageClass: STORAGE_CLASS.STANDARD,
    connectionId,
  });

  const onProgress = onProgressChannel
    ? (progress) => $event.sender.send(onProgressChannel, progress)
    : null;
  const onEnd = onEndChannel ? () => $event.sender.send(onEndChannel, object.toJSON()) : null;

  if (object.dirname) {
    // const parentPath = `${String(object.dirname).replace(/\/+$/, '')}/`;
    const parent = await Objects.findOne({
      where: {
        type: OBJECT_TYPE.FOLDER,
        // path: `${object.dirname}/`,
      },
    });

    if (!parent) {
      throw new Error(`not found parent "${object.dirname}"`);
    }
  }

  try {
    await object.save();
    // await s3.upload(
    //   {
    //     path: object.path,
    //     content: fs.createReadStream(localPath),
    //     options: {
    //       ContentType: mimeTypes.lookup(basename),
    //     },
    //     onProgress,
    //   },
    //   connectionId,
    // );
    // const objectHeaders = await s3.headObject(object.path, connectionId);

    // object.size = objectHeaders?.ContentLength ?? 0;
    // object.lastModified = objectHeaders?.LastModified ?? new Date();
    // await object.save();
    s3.upload(
      {
        path: object.path,
        content: fs.createReadStream(localPath),
        options: {
          ContentType: mimeTypes.lookup(basename),
        },
        onProgress,
      },
      connectionId,
    )
      .then(async () => {
        const objectHeaders = await s3.headObject(object.path, connectionId);
        object.size = objectHeaders?.ContentLength ?? 0;
        object.lastModified = objectHeaders?.LastModified ?? new Date();
        await object.save();
      })
      .finally(onEnd);
    return object.toJSON();
  } catch (error) {
    await object.destroy();
    throw error;
  }
}

/**
 * @param {IpcMainInvokeEvent} $event
 * @param {string} localPath
 * @param {string} dirname
 * @param {Array<number>} ids - Object ids
 * @param {string} onProgressChannel
 * @returns {Promise<void>}
 */
export async function downloadObjects({
  $event,
  localPath = '/',
  dirname = '/',
  ids,
  onProgressChannel,
  connectionId,
}: {
  $event: IpcMainInvokeEvent;
  localPath?: string;
  dirname?: string;
  ids: string[];
  onProgressChannel?: string;
  connectionId: number;
}) {
  const objects = await Objects.findAll({
    where: {
      id: { [Op.in]: ids },
    },
  });

  if (objects.length !== ids.length) {
    const existsIds = objects.map(({ id }) => id);

    ids.forEach((id) => {
      if (!existsIds.includes(id)) {
        throw new Error(`not found object "${id}"`);
      }
    });

    throw new Error(`not found "${ids}"`);
  }

  const files: Objects[] = [];
  const onProgress = onProgressChannel
    ? (progress) => {
        $event.sender.send(onProgressChannel, progress);
      }
    : null;

  await Promise.all(
    objects.map((object) =>
      serial(async () => {
        if (object.type === OBJECT_TYPE.FILE) {
          files.push(object);
          return;
        }

        const deepFiles = await Objects.findAll({
          where: {
            path: { [Op.like]: generateLikeSyntax(object.path, { start: '' }) },
            type: OBJECT_TYPE.FILE,
          },
        });

        files.push(...deepFiles);
      }),
    ),
  );

  await Promise.all(
    files.map((file, index) =>
      serial(async () => {
        const result = await s3.getObject(file.path, connectionId);
        const total = result?.ContentLength ?? 0;
        let loaded = 0;
        const writeStream = fs.createWriteStream(
          path.join(localPath, ...file.path.replace(dirname, '').split(path.sep)),
        );

        const body = result?.Body as NodeJS.ReadableStream;
        body.pipe(writeStream);
        body.on('data', (chunk) => {
          loaded += chunk.length;

          if (onProgress) {
            const rate = 1 / files.length;

            onProgress({
              basename: file.basename,
              total: 100,
              loaded: Math.round(index * rate * 100 + (loaded / total) * rate * 100),
            });
          }
        });

        return new Promise((resolve, reject) => {
          body.on('error', reject);
          body.on('end', resolve);
        });
      }),
    ),
  );
}

export async function deleteObjects({
  ids,
  connectionId,
}: {
  ids: string[];
  connectionId: number;
}): Promise<null> {
  const objects = await Objects.findAll({
    where: {
      id: { [Op.in]: ids },
    },
  });

  if (objects.length !== ids.length) {
    const existsIds = objects.map(({ id }) => id);

    ids.forEach((id) => {
      if (!existsIds.includes(id)) {
        throw new Error(`not found "${id}"`);
      }
    });
  }

  const [files, folders] = await objects.reduce(
    async (acc, object) => {
      if (object.type === OBJECT_TYPE.FILE) {
        const result = await acc;
        result[0].push(object);
        return acc;
      }
      const [deepFiles, deepFolders] = await Promise.all([
        Objects.findAll({
          where: {
            type: OBJECT_TYPE.FILE,
            path: { [Op.like]: generateLikeSyntax(object.path, { start: '' }) },
          },
        }),
        Objects.findAll({
          where: {
            type: OBJECT_TYPE.FOLDER,
            path: { [Op.like]: generateLikeSyntax(object.path, { start: '' }) },
          },
        }),
      ]);
      const result = await acc;
      result[0].push(...deepFiles);
      result[1].push(...deepFolders);
      return result;
    },
    Promise.resolve([[], []]) as Promise<[Objects[], Objects[]]>,
  );

  if (files.length) {
    await Promise.all([
      s3.deleteObjects(
        files.map((file) => file.path),
        connectionId,
      ),
      Objects.destroy({
        where: { id: { [Op.in]: files.map((file) => file.id) } },
      }),
    ]);
  }

  if (folders.length) {
    await Promise.all([
      s3.deleteObjects(
        folders
          .map((folder) => folder.path)
          .sort((a, b) => b.split('/').length - a.split('/').length),
        connectionId,
      ),
      Objects.destroy({
        where: { id: { [Op.in]: folders.map((folder) => folder.id) } },
      }),
    ]);
  }

  return null;
}

/**
 * Copy or move objects (files and folders) to a target folder.
 * @param sourceIds - Object ids (from Objects table)
 * @param targetDirname - Destination folder path (e.g. "foo/bar" or "" for root)
 * @param connectionId
 * @param move - If true, delete source objects after copy
 */
export async function copyObjects({
  sourceIds,
  targetDirname,
  connectionId,
  move = false,
}: {
  sourceIds: string[];
  targetDirname: string;
  connectionId: number;
  move?: boolean;
}) {
  if (sourceIds.length === 0) return [];

  const targetPrefix = targetDirname ? `${targetDirname.replace(/\/$/, '')}/` : '';

  const objects = await Objects.findAll({
    where: { id: { [Op.in]: sourceIds }, connectionId },
  });

  if (objects.length !== sourceIds.length) {
    throw new Error(`One or more objects not found: ${sourceIds.join(', ')}`);
  }

  const toCopy: { source: (typeof objects)[0]; newPath: string }[] = [];

  for (const obj of objects) {
    if (obj.type === OBJECT_TYPE.FILE) {
      const newPath = targetPrefix ? `${targetPrefix}${obj.basename}` : obj.basename;
      toCopy.push({ source: obj, newPath });
    } else {
      const folderPath = obj.path;
      const descendants = await Objects.findAll({
        where: { path: { [Op.startsWith]: folderPath } },
        order: [['path', 'ASC']],
      });
      for (const d of descendants) {
        const suffix = d.path.startsWith(folderPath) ? d.path.slice(folderPath.length) : d.basename;
        const newPath = targetPrefix ? `${targetPrefix}${suffix}` : suffix;
        toCopy.push({ source: d, newPath });
      }
    }
  }

  const created: Objects[] = [];

  await serial(
    toCopy.map(({ source, newPath }) => async () => {
      await s3.copyObject(source.path, newPath, connectionId);
      const attrs = {
        type: source.type,
        path: newPath,
        storageClass: source.storageClass,
        connectionId,
      };
      const headers = await s3.headObject(newPath, connectionId);
      const record = await Objects.create({
        ...attrs,
        size: headers?.ContentLength ?? 0,
        lastModified: headers?.LastModified ?? new Date(),
        connectionId,
      });
      created.push(record);
    }),
  );

  if (move) {
    const idsToDelete = [...new Set(toCopy.map(({ source }) => source.id))];
    await deleteObjects({ ids: idsToDelete, connectionId });
  }

  return created.map((r) => r.toJSON());
}
