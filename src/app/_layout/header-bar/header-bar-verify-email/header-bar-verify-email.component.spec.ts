import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HeaderBarVerifyEmailComponent } from './header-bar-verify-email.component';
import { TranslateTestingModule, makeUser } from '../../../../testing';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';

describe('HeaderBarVerifyEmailComponent', () => {
  let fixture: ComponentFixture<HeaderBarVerifyEmailComponent>;
  let component: HeaderBarVerifyEmailComponent;
  let userServiceStub: { user: any };
  let authServiceStub: { requestNewVerificationEmail: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userServiceStub = { user: null };
    authServiceStub = { requestNewVerificationEmail: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HeaderBarVerifyEmailComponent, TranslateTestingModule],
      providers: [
        { provide: UserService, useValue: userServiceStub },
        { provide: AuthService, useValue: authServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderBarVerifyEmailComponent);
    component = fixture.componentInstance;
  });
  describe('show', () => {
    it('returns falsy when user is null', () => {
      userServiceStub.user = null;
      expect(component.show).toBeFalsy();
    });

    it('returns false when email is verified', () => {
      userServiceStub.user = makeUser({ emailVerified: true });
      expect(component.show).toBeFalsy();
    });

    it('returns true when email is not verified', () => {
      userServiceStub.user = makeUser({ emailVerified: false });
      expect(component.show).toBeTruthy();
    });
  });

  describe('requestNewEmail', () => {
    it('sets loading and disables button on call', () => {
      authServiceStub.requestNewVerificationEmail.mockReturnValue(of({ status: 'ok' }));
      vi.spyOn(window, 'alert').mockImplementation(() => {});

      component.requestNewEmail();

      expect(component.canPressButton).toBe(false);
      expect(component.loading).toBe(false);
    });

    it('alerts on success', () => {
      authServiceStub.requestNewVerificationEmail.mockReturnValue(of({ status: 'ok' }));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      component.requestNewEmail();

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Email sent!'));
      alertSpy.mockRestore();
    });

    it('alerts with error message on failure', () => {
      authServiceStub.requestNewVerificationEmail.mockReturnValue(
        throwError(() => ({ error: { message: 'Rate limited' } }))
      );
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      component.requestNewEmail();

      expect(alertSpy).toHaveBeenCalledWith('Something went wrong: Rate limited');
      expect(component.loading).toBe(false);
      alertSpy.mockRestore();
    });
  });
});
