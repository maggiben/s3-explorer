const PAGINATION_MAX_LIMIT = 100;
const MAX_ID_VALUE = 0x7fffffff;

function generateIdSchema({ fieldName = 'id' } = {}) {
  // Ref: https://dev.mysql.com/doc/refman/8.0/en/integer-types.html
  return {
    [fieldName]: {
      type: 'number',
      optional: false,
      convert: true,
      min: 1,
      max: MAX_ID_VALUE,
      integer: true,
    },
  };
}

export const generateCursorPaginationSchema = () => ({
  after: {
    ...generateIdSchema().id,
    optional: true,
  },
  limit: {
    type: 'number',
    optional: true,
    convert: true,
    min: 1,
    max: PAGINATION_MAX_LIMIT,
    integer: true,
  },
});

export const generateKeywordSchema = ({ fieldName = 'keyword' } = {}) => ({
  [fieldName]: {
    type: 'string',
    optional: true,
    trim: true,
    max: 255,
  },
});
