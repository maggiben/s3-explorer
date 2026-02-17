import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { connect } from '../../common/database';
import { encrypt, decrypt } from '../../common/crypto';
import { mergeDeep } from '../../../shared/lib/utils';

const sequelize = connect();

class Connections extends Model<
  InferAttributes<Connections>,
  InferCreationAttributes<Connections>
> {
  declare id: CreationOptional<number>;
  declare accessKeyId: CreationOptional<string>;
  declare secretAccessKey: CreationOptional<string>;
  declare region: CreationOptional<string>;
  declare bucket: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  override toJSON() {
    const result = mergeDeep(this.get({ plain: true })) as Record<string, unknown>;
    delete result.secretAccessKey;
    return result as InferAttributes<Connections>;
  }
}

Connections.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },

    accessKeyId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },

    secretAccessKey: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',

      get(this: Bucket): string | null {
        const value = this.getDataValue('secretAccessKey');
        if (!value) {
          return null;
        }
        return decrypt(Buffer.from(value, 'base64')).toString();
      },

      set(this: Bucket, value: string | null): void {
        if (!value) {
          this.setDataValue('secretAccessKey', '');
          return;
        }

        this.setDataValue(
          'secretAccessKey',
          encrypt(Buffer.from(value, 'utf8')).toString('base64'),
        );
      },
    },

    region: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },

    bucket: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'connections',
    indexes: [],
  },
);

export default Connections;
