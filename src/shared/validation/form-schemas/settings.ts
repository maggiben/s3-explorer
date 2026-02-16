import settingsSchema from '../model-schemas/settings';

export default {
  setupS3SettingsFormSchema: {
    accessKeyId: settingsSchema.accessKeyId,
    secretAccessKey: settingsSchema.secretAccessKey,
    region: settingsSchema.region,
    bucket: settingsSchema.bucket,
  },
  updateS3SettingsFormSchema: {
    accessKeyId: settingsSchema.accessKeyId,
    secretAccessKey: {
      ...settingsSchema.secretAccessKey,
      optional: true,
      empty: true,
    },
    region: settingsSchema.region,
    bucket: settingsSchema.bucket,
  },
};
