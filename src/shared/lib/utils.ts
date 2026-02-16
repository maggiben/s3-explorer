/*
 * @file         : utils.ts
 * @summary      : connmon utilitis
 * @version      : 1.0.0
 * @project      : YtKit
 * @description  : micelaneous utilities used thought the project
 * @author       : Benjamin Maggi
 * @email        : benjaminmaggi@gmail.com
 * @date         : 24 Fef 2024
 * @license:     : MIT
 *
 * Copyright 2021 Benjamin Maggi <benjaminmaggi@gmail.com>
 *
 *
 * License:
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import sanitizeName from 'sanitize-filename';

export const timeStringToSeconds = (timeString: string): number => {
  const parts = timeString.split(':').map((part) => parseInt(part, 10));
  let seconds = 0;

  if (parts.length === 3) {
    // If hours, minutes, and seconds are provided
    seconds += parts[0] * 3600; // Convert hours to seconds
    seconds += parts[1] * 60; // Convert minutes to seconds
    seconds += parts[2]; // Add seconds
  } else if (parts.length === 2) {
    // If only minutes and seconds are provided
    seconds += parts[0] * 60; // Convert minutes to seconds
    seconds += parts[1]; // Add seconds
  } else {
    throw new Error('Invalid time format');
  }

  return seconds;
};

/**
 * Converts seconds into human readable time hh:mm:ss
 *
 * @param {number} seconds
 * @return {string}
 */
export const toHumanTime = (
  seconds: number,
  zeroPadding: boolean = false,
  maxHours: number = 0,
): string => {
  const h = Math.floor(seconds / 3600);
  let m: number | string = Math.floor(seconds / 60) % 60;
  let s: number | string = seconds % 60;

  let time = '';

  if (zeroPadding || h > 0 || maxHours > 9) {
    time =
      seconds > 3600 && !zeroPadding ? `${String(h).padStart(String(maxHours).length, '0')}:` : '';
    time =
      seconds > 3600 && zeroPadding
        ? `${String(h).padStart(Math.max(String(maxHours).length, String(h).length + 1), '0')}:`
        : '';
    m = String(m).padStart(2, '0');
  } else {
    m = String(m);
  }

  s = String(s).padStart(2, '0');

  return `${time}${m}:${s}`;
};

/**
 * Converts bytes to human readable unit.
 * Thank you Amir from StackOverflow.
 *
 * @param {number} bytes
 * @return {string}
 */
const UNITS = ' KMGTPEZYXWVU';
export const toHumanSize = (bytes: number): string => {
  if (bytes <= 0) {
    return '0';
  }
  const t2 = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 12);
  return `${Math.round((bytes * 100) / Math.pow(1024, t2)) / 100}${UNITS.charAt(t2).replace(' ', '')}B`;
};

/**
 * Converts human size input to number of bytes.
 *
 * @param {string} size ie. 128KB 96KB
 * @return {number} number in bytes
 */
export function fromHumanSize(size: string): number {
  if (!size) {
    return 0;
  }

  const num = parseFloat(size);
  const unit = size[num.toString().length];
  const unitIndex = UNITS.indexOf(unit);

  if (unitIndex < 0) {
    return num;
  }

  return Math.pow(1024, unitIndex) * num;
}

/**
 * Template a string with variables denoted by {prop}.
 *
 * @param {string} str
 * @param {Array.<Object>} objs
 * @return {string}
 */
export const tmpl = (
  str: string,
  obj: Record<string, unknown>,
  sep: string = '.',
  replacement: string = '-',
): string => {
  const result = str.replace(/{([^{}]+)}/g, (_match, key) => {
    const value = key.split(sep).reduce((acc, curr) => {
      return acc && typeof acc === 'object' ? acc[curr] : undefined;
    }, obj);
    return value !== undefined ? String(value) : '';
  });
  return sanitizeName(result, { replacement });
};

/**
 * Convert a number to string and padd n zeroes
 *
 * @param {number} number number to convert and padd
 * @param {number} maxLength the amount of zeroes to padd
 * @return {string} the converted and zero padded number
 */
export const padZeroes = (number: number, maxLength: number): string => {
  const numberString = number.toString();
  const numZeroes = Math.max(0, maxLength - numberString.length);
  return '0'.repeat(numZeroes) + numberString;
};

/**
 * Replaces characters in str1 starting from the rightmost position with characters from str2
 *
 * @param {string} str1 original string
 * @param {string} str2 replacement
 * @return {string} the replaced string
 */
export const replaceFromRight = (str1: string, str2: string): string => {
  const reversedStr1 = str1.split('').reverse();
  const reversedStr2 = str2.split('').reverse();

  let index = 0;
  for (let i = 0; i < reversedStr1.length; i++) {
    if (index < reversedStr2.length) {
      reversedStr1[i] = reversedStr2[index];
      index++;
    } else {
      break;
    }
  }

  return reversedStr1.reverse().join('');
};

/**
 * Returns tru if argument is array of arrays
 *
 * @param {T[]} arr the input array
 * @return {boolean} true or false
 */
export const isArrayofArrays = <T>(array: T[]): boolean => {
  return Array.isArray(array) && array.every((innerArr) => Array.isArray(innerArr));
};

/**
 * Returns tru if argument is array of object
 *
 * @param {T[]} arr the input array
 * @return {boolean} true or false
 */
export const isArrayofObjects = <T>(array: T[]): boolean => {
  return (
    Array.isArray(array) &&
    array.every((obj) => typeof obj === 'object' && obj !== null && !Array.isArray(obj))
  );
};

/**
 * Deep compares two objects
 *
 * @param {T} firstVal input object
 * @param {T} secondVal comparsion object
 * @return {boolean} true or false
 */
export const isObjectEqual = <T>(firstVal: T | undefined, secondVal: T | undefined): boolean =>
  JSON.stringify(firstVal) === JSON.stringify(secondVal);

/**
 * Removes an object property from all objects inside the array
 * works on root level properties only
 *
 * @param {T[]} array the input array of objects
 * @param {K} property property to be removed from all objects
 * @return {T[]} the mapped array without the property
 */
export const removeProperty = <T, K extends keyof T>(array: T[], property: K): T[] =>
  array.map((item) => {
    delete item[property];
    return item as T; // Explicit type cast to T
  });

export const splitIntoTuples = <T>(array: T[], size: number): T[][] => {
  return array.reduce((result, current, index) => {
    const tupleIndex = Math.floor(index / size);
    if (!result[tupleIndex]) {
      result[tupleIndex] = [];
    }
    result[tupleIndex].push(current);
    return result;
  }, [] as T[][]);
};

/**
 * Performs a deep merge of objects and returns new object. Does not modify
 * objects (immutable) and merges arrays via concatenation.
 *
 * @param {...object} objects - Objects to merge
 * @returns {object} New object with merged key/values
 */
export const mergeDeep = <T>(...objects): T => {
  const isObject = (obj): boolean => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
};

/**
 * @brief Retrieves the previous and next items in a circular array based on the given id.
 *
 * @tparam T The type of items in the array.
 * @param list The array of items.
 * @param id The id of the item to find.
 * @return The previous and next items, or undefined if the item with the given id is not found.
 */
export const getCircularArrayItems = <T>(
  list: T[],
  prop: string = 'id',
  value: string,
): { prev: T; next: T } | undefined => {
  const index = list.findIndex((item) => item[prop] === value);
  if (index === -1) {
    return; // Item with given id not found
  }

  const length = list.length;
  const prevIndex = (index - 1 + length) % length; // Handle negative indexes
  const nextIndex = (index + 1) % length;

  return {
    prev: list[prevIndex],
    next: list[nextIndex],
  };
};

/**
 * Retrieves a nested property from an object using a dot-separated path.
 *
 * @param {T} obj The object from which to retrieve the nested property.
 * @param {string} path The dot-separated path to the nested property.
 * @return {unknown | undefined} The value of the nested property, or undefined if not found.
 */
export const getNestedProperty = <T>(obj: T, path: string): unknown | undefined => {
  return path.split('.').reduce((acc, key) => {
    if (!acc || typeof acc !== 'object') {
      return undefined;
    }
    const [propertyName, index] = key.replace(/\]/g, '').split('[');
    const value = acc[propertyName as keyof typeof acc];
    if (index && Array.isArray(value)) {
      return value[parseInt(index, 10)];
    }
    return value;
  }, obj);
};

export const setNestedProperty = <T>(obj: T, path: string, value: unknown): T => {
  const pathParts = path.split('.');
  const lastKey = pathParts.pop() as string;

  const nestedObj = pathParts.reduce((acc, key) => {
    if (!acc[key]) {
      const [propertyName, index] = key.replace(/\]/g, '').split('[');
      if (Array.isArray(acc[propertyName])) {
        if (!acc[propertyName][index]) {
          acc[propertyName][index] = {};
        }
        return acc[propertyName][index];
      }
      acc[key] = {};
    }
    return acc[key];
  }, obj);

  const [propertyName, index] = lastKey.replace(/\]/g, '').split('[');
  if (Array.isArray(nestedObj[propertyName])) {
    nestedObj[propertyName][index] = value;
  } else {
    nestedObj[lastKey] = value;
  }

  return { ...obj };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ThrottledFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

/**
 * Creates a throttled function that only invokes the provided function (`func`) at most once per within a given number of milliseconds
 * (`wait`)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any) => any>(
  func: T,
  wait: number,
): ThrottledFunction<T> {
  throttle['cancel'] = false;
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: any, ...args): any {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    if (!inThrottle) {
      inThrottle = true;
      throttle['cancel'] = setTimeout(() => (inThrottle = false), wait);

      lastResult = func.apply(context, args);
    }
    return lastResult;
  };
}

/**
 * Creates a debounced function that will not call the give function untill a wait delay has elapsed
 * (`wait`)
 */
export function debounce<T extends unknown[], U>(
  callback: (...args: T) => PromiseLike<U> | U,
  wait: number,
): (...args: T) => Promise<U> {
  type IState =
    | unknown
    | undefined
    | {
        timeout: ReturnType<typeof setTimeout>;
        promise: Promise<U>;
        resolve: (value: U | PromiseLike<U>) => void;
        reject: (value: unknown) => void;
        latestArgs: T;
      };
  let state: IState = undefined;

  return (...args: T): Promise<U> => {
    if (!state) {
      state = {};
      state!['promise'] = new Promise((resolve, reject) => {
        state!['resolve'] = resolve;
        state!['reject'] = reject;
      });
    }
    clearTimeout(state!['timeout']);
    state!['latestArgs'] = args;
    state!['timeout'] = setTimeout(() => {
      const s = state!;
      state = undefined;
      try {
        s['resolve'](callback(...s['latestArgs']));
      } catch (e) {
        s['reject'](e);
      }
    }, wait);

    return state!['promise'];
  };
}

/**
 * Perform a deep clone of an object or array compatible with JSON stringification.
 * Object fields that are not compatible with stringification will be omitted. Array
 * entries that are not compatible with stringification will be censored as `null`.
 *
 * @param obj A JSON-compatible object or array to clone.
 * @throws {Error} If the object contains circular references or causes
 * other JSON stringification errors.
 */
export function cloneJson<T extends Record<string, unknown>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function getYoutubeVideoId(url: string): string | undefined {
  const regExp = new RegExp(
    /(?:http|https|)(?::\/\/|)(?:www.|)(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/ytscreeningroom\?v=|\/feeds\/api\/videos\/|\/user\S*[^\w\-\s]|\S*[^\w\-\s]))([\w-]{11})[a-z0-9;:@#?&%=+/$_.-]*/,
  );
  const match = url.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  return undefined;
}
/**
 * Get playlist id from url
 *
 * @param {string} url the youtube url
 * @returns {string|undefined} the playlist id
 */
export function getYoutubePlaylistId(url: string): string | undefined {
  const regExp = new RegExp(
    /(?:http|https|)(?::\/\/|)(?:www.|)(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/ytscreeningroom\?v=|\/feeds\/api\/videos\/|\/user\S*[^\w\-\s]|\S*[^\w\-\s]))([\w-]{12,})[a-z0-9;:@#?&%=+/$_.-]*/,
  );
  if (url.includes('list=')) {
    const match = url.match(regExp);
    if (match && match[1]) {
      return match[1];
    }
  }
  return;
}

export const isRenderer = typeof process === 'undefined' || !process || process.type === 'renderer';
