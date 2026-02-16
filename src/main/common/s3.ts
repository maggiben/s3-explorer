import { Op } from 'sequelize';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import * as OBJECT_TYPE from '@shared/constants/object-type';
const ObjectModel = require('../models/data/object-model');


/**
 * Sync all objects on S3 to local database.
 * @returns {Promise<void>}
 */
export async function syncObjectsFromS3() {
  const start = new Date();
  const client = new S3Client({
    region: settings.region,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });
  const scanObjects = async (continuationToken?: string) => {
    const pathSet = new Set();
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: settings.bucket,
        ContinuationToken: continuationToken,
      }),
    );
    const convertS3Object = ({ Key, Size, LastModified, StorageClass }) => ({
      type: Key.slice(-1) === '/' ? OBJECT_TYPE.FOLDER : OBJECT_TYPE.FILE,
      path: Key,
      lastModified: LastModified,
      size: Size,
      storageClass: StorageClass,
    });

    await Promise.all([
      result.Contents
        ? ObjectModel.bulkCreate(
            result.Contents.map((content) => {
              const pieces = content.Key?.split('/').slice(0, -1) ? [];

              return [
                convertS3Object(content),
                ...pieces.map((piece, index) =>
                  convertS3Object({
                    Key: `${pieces.slice(0, index + 1).join('/')}/`,
                  }),
                ),
              ];
            })
              .flat()
              .filter((object) => {
                if (object.type === OBJECT_TYPE.FILE) {
                  pathSet.add(object.path);
                  return true;
                }

                if (pathSet.has(object.path)) {
                  return false;
                }

                pathSet.add(object.path);
                return true;
              }),
            { updateOnDuplicate: ['type', 'lastModified', 'size', 'updatedAt', 'storageClass'] },
          )
        : null,
      result.NextContinuationToken ? scanObjects(result.NextContinuationToken) : null,
    ]);
  };

  await scanObjects();

  // Remove missing objects.
  await ObjectModel.destroy({
    where: { updatedAt: { [Op.lt]: start } },
  });
};

/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/headobjectcommand.html
 * @param {string} path
 * @param {Object} options
 * @returns {Promise<HeadObjectCommandOutput>}
 */
export async function headObject(path, options) {
  const client = new S3Client({
    region: settings.region,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });
  const headObjectCommand = new HeadObjectCommand({
    ...options,
    Bucket: settings.bucket,
    Key: path,
  });

  return client.send(headObjectCommand);
};

/**
 * @param {string} path
 * @param {number} expiresIn - Expires in seconds. Default is 24 hours.
 * @returns {Promise<string>}
 */
export async function getSignedUrl(path, { expiresIn = 24 * 60 * 60 } = {}) {
  const client = new S3Client({
    region: settings.region,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });
  const getObjectCommand = new GetObjectCommand({
    Bucket: settings.bucket,
    Key: path,
  });

  return awsGetSignedUrl(client, getObjectCommand, { expiresIn });
};

/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
 * @param {string} path
 * @returns {Promise<GetObjectCommandOutput>}
 */
export async function getObject(path) {
  const client = new S3Client({
    region: settings.region,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });
  const getObjectCommand = new GetObjectCommand({
    Bucket: settings.bucket,
    Key: path,
  });

  return client.send(getObjectCommand);
}

/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/putobjectcommand.html
 * @param {string} path
 * @param {Object} options
 * @returns {Promise<PutObjectCommandOutput>}
 */
export async function putObject(path, options = {}) {
  const client = new S3Client({
    region: settings.region,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });
  const putObjectCommand = new PutObjectCommand({
    ...options,
    Bucket: settings.bucket,
    Key: path,
    // ...(options.Body == null ? { Body: null, ContentLength: 0 } : {}),
  });

  return client.send(putObjectCommand);
};

/**
 * @param {string} path
 * @param {Buffer|Stream} content
 * @param {Object} options
 * @param {function({Bucket: string, Key: string, loaded: number, part: number, total: number})} onProgress
 * @returns {Promise<CompleteMultipartUploadCommandOutput | AbortMultipartUploadCommandOutput>}
 */
export async function upload({ path, content, options, onProgress }) {
  const client = new S3Client({
    region: settings.region,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });
  const upload = new Upload({
    client,
    params: {
      ...options,
      Bucket: settings.bucket,
      Key: path,
      Body: content,
    },
  });

  if (onProgress) {
    upload.on('httpUploadProgress', onProgress);
  }

  return upload.done();
}

/**
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/deleteobjectscommand.html
 * @param {Array<string>} paths
 * @returns {Promise<DeleteObjectsCommandOutput>}
 */
export async function deleteObjects(paths: string[]) {
  const client = new S3Client({
    region: settings.region,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
  });
  const deleteObjectsCommand = new DeleteObjectsCommand({
    Bucket: settings.bucket,
    Delete: {
      Objects: paths.map((path) => ({ Key: path })),
    },
  });

  return client.send(deleteObjectsCommand);
}
