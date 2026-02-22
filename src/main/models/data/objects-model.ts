import path from 'path';
import { randomUUID } from 'crypto';
import * as OBJECT_TYPE from '../../../shared/constants/object-type';
import * as STORAGE_CLASS from '../../../shared/constants/storage-class';
import { connect } from '../../common/database';
import {
  DataTypes,
  Model,
  NOW,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { mergeDeep } from '../../../shared/lib/utils';

const sequelize = connect();

class Objects extends Model<InferAttributes<Objects>, InferCreationAttributes<Objects>> {
  declare id: CreationOptional<string>;
  declare connectionId: CreationOptional<number>;
  declare type: CreationOptional<number>;
  declare path: CreationOptional<string>;
  declare dirname: CreationOptional<string>;
  declare basename: CreationOptional<string>;
  declare lastModified: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare size: CreationOptional<number>;
  declare storageClass: CreationOptional<number>;

  override toJSON() {
    return mergeDeep(this.get({ plain: false })) as InferAttributes<Objects>;
  }
}

Objects.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    connectionId: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        isIn: [Object.values(OBJECT_TYPE)],
      },
    },
    path: {
      type: new DataTypes.STRING(1024),
      allowNull: false,
      set(value: string) {
        const { dir, base } = path.parse(value);

        this.setDataValue('path', value);
        this.setDataValue('dirname', dir);
        this.setDataValue('basename', base);
      },
    },
    /**
     * The folder name.
     * 	"test.txt": ""
     * 	"a/b/": "a"
     * 	"a/b/test.txt": "a/b"
     */
    dirname: {
      type: new DataTypes.STRING(1024),
      allowNull: false,
    },
    /**
     * The file, folder name.
     * 	"test.txt": "test.txt"
     * 	"a/b/": "b"
     * 	"a/b/test.txt": "test.txt"
     */
    basename: {
      type: DataTypes.CITEXT,
      allowNull: false,
    },
    lastModified: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: NOW,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
    },
    storageClass: {
      type: DataTypes.TINYINT,
      allowNull: true,
      validate: {
        isIn: [Object.values(STORAGE_CLASS)],
      },
      set(value: number) {
        if (typeof value === 'number' && Object.values(STORAGE_CLASS).includes(value)) {
          this.setDataValue('storageClass', value);
          return;
        }

        this.setDataValue('storageClass', STORAGE_CLASS[value] || null);
      },
      get() {
        const storageClass = this.getDataValue('storageClass');

        if (!storageClass) {
          return storageClass;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const entry = Object.entries(STORAGE_CLASS).find(([_, value]) => value === storageClass);

        return entry?.[0];
      },
    },
  },
  {
    sequelize,
    modelName: 'objects',
    indexes: [
      {
        unique: false,
        fields: ['path'],
      },
      {
        unique: false,
        fields: ['connectionId'],
      },
      {
        unique: false,
        fields: ['updatedAt'],
      },
      {
        unique: false,
        fields: ['dirname', 'type', 'basename', 'id'],
      },
    ],
  },
);

export default Objects;
