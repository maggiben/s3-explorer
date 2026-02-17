import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { connect } from '../../common/database';
import { mergeDeep } from '../../../shared/lib/utils';

const sequelize = connect();

class Buckets extends Model<InferAttributes<Buckets>, InferCreationAttributes<Buckets>> {
  declare id: CreationOptional<number>;
  declare type: CreationOptional<string>;
  declare color: CreationOptional<string>;
  declare icon: CreationOptional<string>;
  declare name: CreationOptional<string>;
  declare bucketIds: CreationOptional<number[]>;

  override toJSON() {
    const result = mergeDeep(this.get({ plain: true }));

    return result as InferAttributes<Buckets>;
  }
}

Buckets.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'BUCKET',
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#fafafa',
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bucketIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'buckets',
    indexes: [],
  },
);

export default Buckets;
