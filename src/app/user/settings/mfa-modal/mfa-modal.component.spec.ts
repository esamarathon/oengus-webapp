import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { of } from 'rxjs';
import { MfaModalComponent } from './mfa-modal.component';
import { TranslateTestingModule } from '../../../../testing';
import { AuthService } from '../../../../services/auth.service';

describe('MfaModalComponent', () => {
  let fixture: ComponentFixture<MfaModalComponent>;
  let component: MfaModalComponent;
  let authServiceStub: { storeMfa: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceStub = { storeMfa: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MfaModalComponent, TranslateTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MfaModalComponent);
    component = fixture.componentInstance;
  });
  it('saveMfa does nothing when mfaCode is empty', () => {
    component.mfaCode = '';
    component.saveMfa();
    expect(authServiceStub.storeMfa).not.toHaveBeenCalled();
  });

  it('saveMfa emits true on success', () => {
    const code = faker.string.numeric(6);
    component.mfaCode = code;
    authServiceStub.storeMfa.mockReturnValue(of({ status: true }));
    const spy = vi.fn();
    component.mfaResult.subscribe(spy);

    component.saveMfa();

    expect(authServiceStub.storeMfa).toHaveBeenCalledWith(code);
    expect(spy).toHaveBeenCalledWith(true);
    expect(component.loading).toBe(false);
  });

  it('saveMfa sets mfaCodeIncorrect on failure', () => {
    component.mfaCode = faker.string.numeric(6);
    authServiceStub.storeMfa.mockReturnValue(of({ status: false }));

    component.saveMfa();

    expect(component.mfaCodeIncorrect).toBe(true);
    expect(component.mfaCode).toBe('');
    expect(component.loading).toBe(false);
  });
});
