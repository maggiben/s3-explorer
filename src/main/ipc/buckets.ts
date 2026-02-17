import { InferAttributes } from 'sequelize';
import Buckets from '../models/data/buckets-model';

export async function init() {
  try {
    // This will create the table if it doesn't exist
    await Buckets.sync({ alter: true });
    console.log('Buckets table synced successfully');
  } catch (error) {
    console.error('Failed to sync Buckets table', error);
  }
}

export async function create({
  type,
  name,
  color,
  icon,
  bucketIds,
}: {
  id?: number;
  type: string;
  name: string;
  color: string;
  icon: string;
  bucketIds: number[];
}): Promise<ReturnType<Buckets['toJSON']> | undefined> {
  try {
    const buckets = await Buckets.create({
      type,
      name,
      color,
      icon,
      bucketIds,
    });
    if (!buckets) {
      throw new Error('failed to get buckets');
    }
    return buckets.toJSON();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export async function upsert({
  id,
  type,
  name,
  color,
  icon,
  bucketIds,
}: {
  id?: number;
  type: string;
  name: string;
  color: string;
  icon: string;
  bucketIds: number[];
}): Promise<InferAttributes<Buckets>> {
  try {
    await Buckets.upsert({
      id,
      type,
      name,
      color,
      icon,
      bucketIds,
    });
    const buckets = await Buckets.findOne({ where: { id } });
    if (!buckets) {
      throw new Error('failed to get buckets');
    }
    return buckets.toJSON();
  } catch (error) {
    console.error(error);
    return {} as InferAttributes<Buckets>;
  }
}

export async function get(id?: number): Promise<Buckets> {
  try {
    const buckets = await Buckets.findOne({ where: { id: id } });

    if (!buckets) {
      throw new Error('failed to get buckets');
    }
    return buckets;
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
}

export async function getAll(): Promise<ReturnType<Buckets['toJSON']>[] | undefined> {
  try {
    const buckets = await Buckets.findAll();

    if (!buckets) {
      throw new Error('failed to get buckets');
    }
    return buckets.map((bucket) => bucket.toJSON());
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
