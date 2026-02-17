import { Op } from 'sequelize';
import Connections from '../models/data/connections-model';

export async function init() {
  try {
    // This will create the table if it doesn't exist
    await Connections.sync({ alter: true });
    console.log('Connections table synced successfully');
  } catch (error) {
    console.error('Failed to sync Connections table', error);
  }
}

export async function create({
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
}: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}): Promise<ReturnType<Connections['toJSON']> | undefined> {
  try {
    console.log('creating connection');
    const result = await Connections.create({
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
    });
    if (!result) {
      throw new Error('failed to get settings');
    }
    console.log('inserted');
    return result.toJSON();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
/**
 * @param {string} accessKeyId
 * @param {string} secretAccessKey
 * @param {string} region
 * @param {string} bucket
 * @returns {Promise<Connections>}
 */
export async function upsert({
  id,
  accessKeyId,
  secretAccessKey,
  region,
  bucket,
}: {
  id: number;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}): Promise<ReturnType<Connections['toJSON']> | undefined> {
  try {
    await Connections.upsert({
      id,
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
    });
    const result = await Connections.findOne({ where: { id } });
    if (!result) {
      throw new Error('failed to get bucket');
    }
    return result.toJSON();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function get(id: number): Promise<ReturnType<Connections['toJSON']> | undefined> {
  try {
    const settings = await Connections.findOne({ where: { id } });

    if (!settings) {
      throw new Error('failed to get bucket');
    }
    return settings.toJSON();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function getRecent(
  fromDate: Date,
  limit: number,
): Promise<ReturnType<Connections['toJSON']>[]> {
  try {
    const results = await Connections.findAll({
      where: {
        createdAt: {
          [Op.lt]: fromDate, // greater than or equal to given date
        },
      },
      order: [['createdAt', 'DESC']], // newest first
      limit,
    });

    return results.map((result) => result.toJSON());
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
}

export async function getAll(): Promise<ReturnType<Connections['toJSON']>[] | undefined> {
  try {
    const connections = await Connections.findAll();

    if (!connections) {
      throw new Error('failed to get connections');
    }
    return connections.map((connection) => connection.toJSON());
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
