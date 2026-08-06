import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { LoginOauthComponent } from './login-oauth.component';
import { TranslateTestingModule, makeUser } from '../../../testing';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { NotificationService } from '../../../services/notification.service';
import { LoadingBarService } from '../../../services/loading-bar.service';
import { LoginResponseStatus } from '../../../model/auth';
import { TranslateService } from '@ngx-translate/core';

describe('LoginOauthComponent', () => {
  let fixture: ComponentFixture<LoginOauthComponent>;
  let component: LoginOauthComponent;
  let authServiceStub: { performOauthLogin: ReturnType<typeof vi.fn> };
  let userServiceStub: { token: string | null; user: any; me: ReturnType<typeof vi.fn> };
  let routerStub: { navigate: ReturnType<typeof vi.fn> };
  let toastrStub: { toast: ReturnType<typeof vi.fn>; toastRaw: ReturnType<typeof vi.fn>; notify: ReturnType<typeof vi.fn> };
  let loaderStub: { setLoading: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceStub = { performOauthLogin: vi.fn() };
    userServiceStub = { token: null, user: null, me: vi.fn() };
    routerStub = { navigate: vi.fn() };
    toastrStub = { toast: vi.fn(), toastRaw: vi.fn(), notify: vi.fn() };
    loaderStub = { setLoading: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginOauthComponent, TranslateTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: UserService, useValue: userServiceStub },
        { provide: ActivatedRoute, useValue: { params: of({ service: 'discord' }), queryParams: of({ code: 'abc123' }) } },
        { provide: Router, useValue: routerStub },
        { provide: NotificationService, useValue: toastrStub },
        { provide: LoadingBarService, useValue: loaderStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginOauthComponent);
    component = fixture.componentInstance;
  });
  it('loginTo navigates home on LOGIN_SUCCESS', async () => {
    const user = makeUser({ email: 'duncte123@example.com' });
    userServiceStub.me.mockReturnValue({ add: (cb: () => void) => { userServiceStub.user = user; cb(); } });
    authServiceStub.performOauthLogin.mockReturnValue(of({ status: LoginResponseStatus.LOGIN_SUCCESS, token: 'jwt' }));

    await component.loginTo('discord', 'abc123');

    expect(userServiceStub.token).toBe('jwt');
    expect(routerStub.navigate).toHaveBeenCalledWith(['/']);
  });

  it('loginTo shows disabled account toast on ACCOUNT_DISABLED', async () => {
    authServiceStub.performOauthLogin.mockReturnValue(
      throwError(() => ({ error: { status: LoginResponseStatus.ACCOUNT_DISABLED, token: null } }))
    );

    await component.loginTo('discord', 'abc');

    expect(routerStub.navigate).toHaveBeenCalledWith(['/']);
    expect(toastrStub.toast).toHaveBeenCalledWith('alert.user.login.disabledAccount', 8000, 'warning');
  });

  it('loginTo navigates to forgot-password on PASSWORD_RESET_REQUIRED', async () => {
    authServiceStub.performOauthLogin.mockReturnValue(
      throwError(() => ({ error: { status: LoginResponseStatus.PASSWORD_RESET_REQUIRED, token: null } }))
    );

    await component.loginTo('discord', 'abc');

    expect(routerStub.navigate).toHaveBeenCalledWith(['/forgot-password']);
  });

  it('loginTo navigates to login with username on OAUTH_ACCOUNT_NOT_FOUND', async () => {
    authServiceStub.performOauthLogin.mockReturnValue(
      throwError(() => ({ error: { status: LoginResponseStatus.OAUTH_ACCOUNT_NOT_FOUND, token: 'duncte123' } }))
    );

    await component.loginTo('discord', 'abc');

    expect(routerStub.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { username: 'duncte123' } });
    expect(toastrStub.notify).toHaveBeenCalledWith('alert.user.login.noAccountFound', 'warning');
  });
});
