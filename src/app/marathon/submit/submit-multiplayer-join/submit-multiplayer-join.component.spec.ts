import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SubmitMultiplayerJoinComponent } from './submit-multiplayer-join.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';
import { CategoryService } from '../../../../services/category.service';
import { MarathonService } from '../../../../services/marathon.service';
import { NotificationService } from '../../../../services/notification.service';

describe('SubmitMultiplayerJoinComponent', () => {
  let fixture: ComponentFixture<SubmitMultiplayerJoinComponent>;
  let component: SubmitMultiplayerJoinComponent;
  let categoryServiceStub: { getFromCode: ReturnType<typeof vi.fn> };
  let notifyStub: { toast: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    categoryServiceStub = { getFromCode: vi.fn() };
    notifyStub = { toast: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SubmitMultiplayerJoinComponent, TranslateTestingModule],
      providers: [
        { provide: CategoryService, useValue: categoryServiceStub },
        { provide: MarathonService, useValue: { marathon: makeMarathon({ id: 'bsm2025' }) } },
        { provide: NotificationService, useValue: notifyStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitMultiplayerJoinComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('getMultiplayerSubmission emits opponent on success', async () => {
    const opponent = { id: 1, user: { username: 'duncte123' } };
    categoryServiceStub.getFromCode.mockReturnValue(of(opponent));
    component.code = 'ABC123';

    const spy = vi.fn();
    component['addOpponent'].subscribe(spy);

    await component.getMultiplayerSubmission();

    expect(categoryServiceStub.getFromCode).toHaveBeenCalledWith('bsm2025', 'ABC123');
    expect(spy).toHaveBeenCalledWith(opponent);
  });

  it('getMultiplayerSubmission toasts on error', async () => {
    categoryServiceStub.getFromCode.mockReturnValue(throwError(() => ({ error: 'CODE_NOT_FOUND' })));
    component.code = 'BAD';

    await component.getMultiplayerSubmission();

    expect(notifyStub.toast).toHaveBeenCalledWith('alert.submit.CODE_NOT_FOUND', 3000, 'warning');
  });

  it('removeMultiplayer emits index', () => {
    const spy = vi.fn();
    component['removeOpponent'].subscribe(spy);

    component.removeMultiplayer(2);

    expect(spy).toHaveBeenCalledWith(2);
  });
});
