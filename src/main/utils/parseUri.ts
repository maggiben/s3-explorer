import os from 'node:os';
import path from 'node:path';
import checkPath from './checkPath';

/**
 * Parse an URI, encoding some characters
 */
const parseUri = (uri: string, check: boolean = true): string | undefined => {
  if (check && !checkPath(uri)) return;
  // path and os should not be used
  const root = os.platform() === 'win32' ? '' : path.parse(uri).root;

  const location = path
    .resolve(uri)
    .split(path.sep)
    .map((d, i) => (i === 0 ? d : encodeURIComponent(d)))
    .reduce((a, b) => path.join(a, b));

  return `file://${root}${location}`;
};

export default parseUri;
