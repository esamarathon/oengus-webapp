import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarathonScheduleShareComponent } from './marathon-schedule-share.component';
import { TranslateTestingModule } from '../../../../testing';
import { NotificationService } from '../../../../services/notification.service';
import { V2Schedule } from '../../../../model/schedule';

describe('MarathonScheduleShareComponent', () => {
  let fixture: ComponentFixture<MarathonScheduleShareComponent>;
  let component: MarathonScheduleShareComponent;
  let notificationStub: { toast: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    notificationStub = { toast: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MarathonScheduleShareComponent, TranslateTestingModule],
      providers: [
        { provide: NotificationService, useValue: notificationStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MarathonScheduleShareComponent);
    component = fixture.componentInstance;
    component.schedule = { id: 1, marathonId: 'bsm2025', slug: 'main', name: 'Main', published: true, lines: [] } as V2Schedule;
  });
  it('shareUrl builds from environment shortUrl, marathonId, and slug', () => {
    expect(component.shareUrl).toBe('https://d.ong.run/bsm2025/main');
  });

  it('onShareClick uses navigator.share when available', () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });

    component.onShareClick();

    expect(shareMock).toHaveBeenCalledWith({ text: 'https://d.ong.run/bsm2025/main' });

    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  it('onShareClick copies to clipboard when navigator.share is unavailable', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeTextMock }, configurable: true });

    component.onShareClick();
    await writeTextMock.mock.results[0].value;

    expect(writeTextMock).toHaveBeenCalledWith('https://d.ong.run/bsm2025/main');
    expect(notificationStub.toast).toHaveBeenCalledWith('alert.generic.clipboardOk');
  });
});
