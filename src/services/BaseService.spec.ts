import { describe, it, expect, vi } from 'vitest';
import { faker } from '@faker-js/faker';
import { BaseService } from './BaseService';
import { environment } from '../environments/environment';

class TestService extends BaseService {
  constructor(base = '') {
    super({ toastRaw: vi.fn() } as any, base);
  }

  testUrl(path: string, version?: string) {
    return this.url(path, version);
  }

  testV1Url(path?: string) {
    return this.v1Url(path);
  }

  testV2Url(path?: string) {
    return this.v2Url(path);
  }
}

describe('BaseService', () => {
  describe('url()', () => {
    it('builds a v1 url with base and path', () => {
      const base = faker.word.noun();
      const path = faker.word.noun();
      const service = new TestService(base);

      expect(service.testUrl(path)).toBe(`${environment.api}/v1/${base}/${path}`);
    });

    it('builds a url without base', () => {
      const path = faker.word.noun();
      const service = new TestService();

      expect(service.testUrl(path)).toBe(`${environment.api}/v1/${path}`);
    });

    it('strips trailing slash from path', () => {
      const path = faker.word.noun();
      const service = new TestService();

      expect(service.testUrl(`${path}/`)).toBe(`${environment.api}/v1/${path}`);
    });

    it('uses custom version', () => {
      const path = faker.word.noun();
      const version = `v${faker.number.int({ min: 1, max: 9 })}`;
      const service = new TestService();

      expect(service.testUrl(path, version)).toBe(`${environment.api}/${version}/${path}`);
    });
  });

  describe('v1Url()', () => {
    it('builds v1 url with base', () => {
      const base = faker.word.noun();
      const service = new TestService(base);

      expect(service.testV1Url()).toBe(`${environment.api}/v1/${base}`);
    });
  });

  describe('v2Url()', () => {
    it('builds v2 url with base and path', () => {
      const base = faker.word.noun();
      const path = faker.word.noun();
      const service = new TestService(base);

      expect(service.testV2Url(path)).toBe(`${environment.api}/v2/${base}/${path}`);
    });
  });
});
