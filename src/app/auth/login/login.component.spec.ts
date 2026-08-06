import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { TranslateTestingModule, makeUser, routerTestProviders } from '../../../testing';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { LoginResponseStatus } from '../../../model/auth';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authServiceStub: { performLogin: ReturnType<typeof vi.fn>; oauthUrl: ReturnType<typeof vi.fn> };
  let userServiceStub: { token: string | null; user: any; me: ReturnType<typeof vi.fn> };
  let routerStub: { navigate: ReturnType<typeof vi.fn> };
  let toastrStub: { toast: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceStub = { performLogin: vi.fn(), oauthUrl: vi.fn().mockReturnValue('') };
    userServiceStub = { token: null, user: null, me: vi.fn() };
    routerStub = { navigate: vi.fn() };
    toastrStub = { toast: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateTestingModule],
      providers: [
        ...routerTestProviders,
        { provide: AuthService, useValue: authServiceStub },
        { provide: UserService, useValue: userServiceStub },
        { provide: Router, useValue: routerStub },
        { provide: NotificationService, useValue: toastrStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });
  it('lowercases username before login', () => {
    component.loginData = { username: 'Duncte123', password: 'secret', twoFactorCode: '' };
    authServiceStub.performLogin.mockReturnValue(of({ status: LoginResponseStatus.MFA_REQUIRED, token: null }));

    component.performLogin();

    expect(authServiceStub.performLogin).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'duncte123' })
    );
  });

  it('sets mfaNeeded on MFA_REQUIRED', () => {
    component.loginData = { username: 'duncte123', password: 'secret', twoFactorCode: '' };
    authServiceStub.performLogin.mockReturnValue(of({ status: LoginResponseStatus.MFA_REQUIRED, token: null }));

    component.performLogin();

    expect(component.mfaNeeded).toBe(true);
    expect(component.loading).toBe(false);
  });

  it('stores token and navigates on LOGIN_SUCCESS', () => {
    const user = makeUser({ email: 'duncte123@example.com' });
    userServiceStub.me.mockReturnValue({ add: (cb: () => void) => { userServiceStub.user = user; cb(); } });
    component.loginData = { username: 'duncte123', password: 'secret', twoFactorCode: '' };
    authServiceStub.performLogin.mockReturnValue(of({ status: LoginResponseStatus.LOGIN_SUCCESS, token: 'jwt-token' }));

    component.performLogin();

    expect(userServiceStub.token).toBe('jwt-token');
    expect(routerStub.navigate).toHaveBeenCalledWith(['/']);
  });

  it('sets loginError on error response', () => {
    component.loginData = { username: 'duncte123', password: 'wrong', twoFactorCode: '' };
    authServiceStub.performLogin.mockReturnValue(
      throwError(() => ({ error: { status: LoginResponseStatus.USERNAME_PASSWORD_INCORRECT } }))
    );

    component.performLogin();

    expect(component.loginError).toBe(LoginResponseStatus.USERNAME_PASSWORD_INCORRECT);
    expect(component.loading).toBe(false);
  });

  it('navigates to forgot-password on PASSWORD_RESET_REQUIRED', () => {
    component.loginData = { username: 'duncte123', password: 'old', twoFactorCode: '' };
    authServiceStub.performLogin.mockReturnValue(
      throwError(() => ({ error: { status: LoginResponseStatus.PASSWORD_RESET_REQUIRED } }))
    );

    component.performLogin();

    expect(routerStub.navigate).toHaveBeenCalledWith(['/forgot-password']);
    expect(toastrStub.toast).toHaveBeenCalledWith('alert.user.login.passwordResetRequired', 8000, 'warning');
  });
});
