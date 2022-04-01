// renderer's result contains a Set and Function,
// here we are handling their serializations

import { RendererResponse } from './cache';

export function serialize(result: RendererResponse): string {
  return JSON.stringify(result, (_key, value) => {
    if (typeof value === 'object' && value instanceof Set) {
      return { _t: 'set', _v: [ ...value ] };
    }

    if (typeof value === 'function') {
      return { _t: 'func', _v: value() };
    }

    return value;
  });
}

export function deserialize(jsoned: string) {
  return JSON.parse(jsoned, (_key, value) => {
    if (value && value._v) {
      if (value._t === 'set') {
        return new Set(value._v);
      }

      if (value._t === 'func') {
        const result = value._v;
        return () => result;
      }
    }

    return value;
  });
}