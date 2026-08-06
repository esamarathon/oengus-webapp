import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SignUpComponent } from './sign-up.component';
import { TranslateTestingModule, routerTestProviders } from '../../../testing';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

describe('SignUpComponent', () => {
  let fixture: ComponentFixture<SignUpComponent>;
  let component: SignUpComponent;
  let authServiceStub: { performRegister: ReturnType<typeof vi.fn> };
  let toastrStub: { toast: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceStub = { performRegister: vi.fn() };
    toastrStub = { toast: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SignUpComponent, TranslateTestingModule],
      providers: [
        ...routerTestProviders,
        { provide: AuthService, useValue: authServiceStub },
        { provide: NotificationService, useValue: toastrStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('lowercases username on submit', async () => {
    component.data.username = 'Duncte123';
    component.data.email = 'test@example.com';
    component.data.password = 'Pass123!';
    authServiceStub.performRegister.mockResolvedValue({ status: 'SIGNUP_SUCCESS' });

    await component.submit();

    expect(authServiceStub.performRegister).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'duncte123' })
    );
  });

  it('uses username as displayName when displayName is empty', async () => {
    component.data.username = 'duncte123';
    component.data.displayName = '';
    component.data.email = 'test@example.com';
    component.data.password = 'Pass123!';
    authServiceStub.performRegister.mockResolvedValue({ status: 'SIGNUP_SUCCESS' });

    await component.submit();

    expect(authServiceStub.performRegister).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'duncte123' })
    );
  });

  it('shows next step on SIGNUP_SUCCESS', async () => {
    component.data.username = 'duncte123';
    component.data.email = 'test@example.com';
    component.data.password = 'Pass123!';
    authServiceStub.performRegister.mockResolvedValue({ status: 'SIGNUP_SUCCESS' });

    await component.submit();

    expect(component.showNextStep).toBe(true);
    expect(component.loading).toBe(false);
  });

  it('populates errors on validation failure', async () => {
    component.data.username = 'duncte123';
    component.data.email = 'bad';
    component.data.password = '';
    authServiceStub.performRegister.mockRejectedValue({
      error: { errors: [{ field: 'email', defaultMessage: 'invalid email' }] },
    });
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    await component.submit();

    expect(component.errors['email']).toBe('invalid email');
    expect(component.showNextStep).toBe(false);
    expect(component.loading).toBe(false);
    expect(toastrStub.toast).toHaveBeenCalledWith('alert.generic.validationError', 5000, 'right');
  });

  it('filters empty connections before submitting', async () => {
    component.data.username = 'duncte123';
    component.data.email = 'test@example.com';
    component.data.password = 'Pass123!';
    component.data.connections = [
      { platform: 'TWITCH', username: 'duncte123' },
      { platform: '', username: '' },
    ] as any;
    authServiceStub.performRegister.mockResolvedValue({ status: 'SIGNUP_SUCCESS' });

    await component.submit();

    expect(authServiceStub.performRegister).toHaveBeenCalledWith(
      expect.objectContaining({ connections: [{ platform: 'TWITCH', username: 'duncte123' }] })
    );
  });
});
