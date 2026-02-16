import objectSchema from '../model-schemas/object';

export default {
  createFolderFormSchema: {
    dirname: objectSchema.dirname,
    basename: objectSchema.basename,
  },
};
