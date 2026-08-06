import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { PasswordResetComponent } from './password-reset.component';
import { TranslateTestingModule } from '../../../testing';
import { AuthService } from '../../../services/auth.service';

describe('PasswordResetComponent', () => {
  let fixture: ComponentFixture<PasswordResetComponent>;
  let component: PasswordResetComponent;
  let authServiceStub: { resetPassword: ReturnType<typeof vi.fn> };
  let paramsSubject: Subject<any>;

  beforeEach(async () => {
    authServiceStub = { resetPassword: vi.fn() };
    paramsSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [PasswordResetComponent, TranslateTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: ActivatedRoute, useValue: { params: paramsSubject.asObservable() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordResetComponent);
    component = fixture.componentInstance;
  });
  describe('ngOnInit', () => {
    it('sets resetToken from route params and clears error', () => {
      component.ngOnInit();
      paramsSubject.next({ token: 'abc123' });

      expect(component.resetToken).toBe('abc123');
      expect(component.errorTranslationKey).toBeNull();
      expect(component.loading).toBe(false);
    });

    it('keeps error when token is missing', () => {
      component.ngOnInit();
      paramsSubject.next({});

      expect(component.resetToken).toBeUndefined();
      expect(component.loading).toBe(false);
    });
  });

  describe('performReset', () => {
    it('sets error when token is null', async () => {
      component.resetToken = null;

      await component.performReset();

      expect(component.errorTranslationKey).toBe('auth.passwordReset.error.PASSWORD_RESET_CODE_INVALID');
      expect(authServiceStub.resetPassword).not.toHaveBeenCalled();
    });

    it('sets success state on PASSWORD_RESET_SUCCESS', async () => {
      component.resetToken = 'valid-token';
      component.newPassword = 'newPass123!';
      authServiceStub.resetPassword.mockReturnValue(of({ status: 'PASSWORD_RESET_SUCCESS' }));

      await component.performReset();

      expect(component.notificationClass).toBe('is-success');
      expect(component.errorTranslationKey).toBe('auth.passwordReset.success');
      expect(component.newPassword).toBe('');
      expect(component.loading).toBe(false);
    });

    it('sets danger state on error', async () => {
      component.resetToken = 'expired-token';
      component.newPassword = 'newPass123!';
      authServiceStub.resetPassword.mockReturnValue(
        throwError(() => ({ error: { status: 'token_expired' } }))
      );

      await component.performReset();

      expect(component.notificationClass).toBe('is-danger');
      expect(component.errorTranslationKey).toBe('auth.passwordReset.error.TOKEN_EXPIRED');
      expect(component.loading).toBe(false);
    });
  });
});
