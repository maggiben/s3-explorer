import path from 'path';
import { app } from 'electron';
import { Sequelize } from 'sequelize';
import { DATABASE_FILENAME } from '@shared/constants/config';

export const DATABASE_PATH = path.join(app.getPath('userData'), DATABASE_FILENAME);

// Instance type, not constructor type
let sequelize: Sequelize | null = null;

export function connect({ isLogSQL = false } = {}): Sequelize {
  if (!sequelize) {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: DATABASE_PATH,
      logging: isLogSQL ? console.log : false,
    });
  }

  return sequelize;
}

export async function disconnect(): Promise<void> {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
}
