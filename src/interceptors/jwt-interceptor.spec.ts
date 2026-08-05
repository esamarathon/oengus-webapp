import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpResponse } from '@angular/common/http';
import { faker } from '@faker-js/faker';
import { of } from 'rxjs';
import { JwtInterceptor } from './jwt-interceptor';
import { UserService } from '../services/user.service';

describe('JwtInterceptor', () => {
  let interceptor: JwtInterceptor;
  let userServiceStub: { token: string | null };
  let next: HttpHandler;

  beforeEach(() => {
    userServiceStub = { token: null };
    next = { handle: vi.fn().mockReturnValue(of(new HttpResponse())) };

    TestBed.configureTestingModule({
      providers: [
        JwtInterceptor,
        { provide: UserService, useValue: userServiceStub },
      ],
    });
    interceptor = TestBed.inject(JwtInterceptor);
  });

  it('always adds oengus-version header', () => {
    const req = new HttpRequest('GET', '/api/test');

    interceptor.intercept(req, next);

    const cloned = (next.handle as any).mock.calls[0][0] as HttpRequest<unknown>;
    expect(cloned.headers.get('oengus-version')).toBe('1');
  });

  it('adds Authorization header when token exists', () => {
    const token = faker.string.alphanumeric(32);
    userServiceStub.token = token;
    const req = new HttpRequest('GET', '/api/test');

    interceptor.intercept(req, next);

    const cloned = (next.handle as any).mock.calls[0][0] as HttpRequest<unknown>;
    expect(cloned.headers.get('Authorization')).toBe(`Bearer ${token}`);
  });

  it('does not add Authorization header when no token', () => {
    const req = new HttpRequest('GET', '/api/test');

    interceptor.intercept(req, next);

    const cloned = (next.handle as any).mock.calls[0][0] as HttpRequest<unknown>;
    expect(cloned.headers.has('Authorization')).toBe(false);
  });
});
