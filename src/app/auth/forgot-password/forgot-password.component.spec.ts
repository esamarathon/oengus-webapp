import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { TranslateTestingModule } from '../../../testing';
import { AuthService } from '../../../services/auth.service';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let authServiceStub: { requestPasswordReset: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceStub = { requestPasswordReset: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, TranslateTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
  });
  it('returns early when form is null', async () => {
    await component.requestNewPassword(null);
    expect(authServiceStub.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('returns early when form is not an HTMLFormElement', async () => {
    await component.requestNewPassword(document.createElement('div'));
    expect(authServiceStub.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('returns early when form is invalid', async () => {
    const form = document.createElement('form');
    vi.spyOn(form, 'reportValidity').mockReturnValue(false);

    await component.requestNewPassword(form);

    expect(authServiceStub.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('sets success state on PASSWORD_RESET_SENT', async () => {
    const form = document.createElement('form');
    vi.spyOn(form, 'reportValidity').mockReturnValue(true);
    component.email = 'duncte123@example.com';
    authServiceStub.requestPasswordReset.mockReturnValue(of({ status: 'PASSWORD_RESET_SENT' }));

    await component.requestNewPassword(form);

    expect(component.notificationClass).toBe('is-success');
    expect(component.errorTranslationKey).toBe('auth.passwordReset.requested');
    expect(component.email).toBe('');
    expect(component.loading).toBe(false);
  });

  it('sets danger state on error', async () => {
    const form = document.createElement('form');
    vi.spyOn(form, 'reportValidity').mockReturnValue(true);
    component.email = 'duncte123@example.com';
    authServiceStub.requestPasswordReset.mockReturnValue(
      throwError(() => ({ error: { status: 'user_not_found' } }))
    );

    await component.requestNewPassword(form);

    expect(component.notificationClass).toBe('is-danger');
    expect(component.errorTranslationKey).toBe('auth.passwordReset.error.USER_NOT_FOUND');
    expect(component.loading).toBe(false);
  });
});
