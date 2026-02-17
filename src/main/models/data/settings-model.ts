import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { connect } from '../../common/database';
import { mergeDeep } from '../../../shared/lib/utils';
import type { ThemeConfig } from 'antd';

const sequelize = connect();

class Settings extends Model<InferAttributes<Settings>, InferCreationAttributes<Settings>> {
  declare id: CreationOptional<number>;
  declare apparence: CreationOptional<{
    mode: string;
    theme?: ThemeConfig;
  }>;
  declare username: CreationOptional<string | null>;

  override toJSON() {
    return mergeDeep(this.get({ plain: false })) as InferAttributes<Settings>;
  }
}

Settings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    apparence: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        mode: 'light',
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'settings',
    indexes: [],
  },
);

export default Settings;
