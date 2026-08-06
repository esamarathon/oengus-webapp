import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let translateStub: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    translateStub = { get: vi.fn().mockReturnValue(of('Translated message')) };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: TranslateService, useValue: translateStub },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  describe('notifyRw()', () => {
    it('should emit a notification item with message and color', () => {
      let emitted: any;
      service.notificationObservable.subscribe((item) => { emitted = item; });

      service.notifyRw('Hello', 'danger');

      expect(emitted).toEqual({ message: 'Hello', color: 'danger' });
    });

    it('should default color to success', () => {
      let emitted: any;
      service.notificationObservable.subscribe((item) => { emitted = item; });

      service.notifyRw('Done');

      expect(emitted).toEqual({ message: 'Done', color: 'success' });
    });
  });

  describe('notify()', () => {
    it('should translate the key then emit', async () => {
      let emitted: any;
      service.notificationObservable.subscribe((item) => { emitted = item; });

      service.notify('alert.save.success', 'warning');
      await vi.waitFor(() => expect(emitted).toBeDefined());

      expect(translateStub.get).toHaveBeenCalledWith('alert.save.success');
      expect(emitted).toEqual({ message: 'Translated message', color: 'warning' });
    });
  });

  describe('toastRaw()', () => {
    it('should emit a toast config with correct properties', () => {
      let emitted: any;
      service.observableToastr.subscribe((config) => { emitted = config; });

      service.toastRaw('Toast!', 4000, 'info', 'left');

      expect(emitted.message).toBe('Toast!');
      expect(emitted.duration).toBe(4000);
      expect(emitted.color).toBe('is-info');
      expect(emitted.position).toBe('is-left');
      expect(emitted.id).toBeDefined();
    });

    it('should use default duration, color, and position', () => {
      let emitted: any;
      service.observableToastr.subscribe((config) => { emitted = config; });

      service.toastRaw('Default toast');

      expect(emitted.duration).toBe(5000);
      expect(emitted.color).toBe('is-success');
      expect(emitted.position).toBe('is-right');
    });
  });

  describe('toast()', () => {
    it('should translate and emit a toast', async () => {
      let emitted: any;
      service.observableToastr.subscribe((config) => { emitted = config; });

      service.toast('alert.done', 2000, 'danger');
      await vi.waitFor(() => expect(emitted).toBeDefined());

      expect(translateStub.get).toHaveBeenCalledWith('alert.done');
      expect(emitted.message).toBe('Translated message');
      expect(emitted.duration).toBe(2000);
      expect(emitted.color).toBe('is-danger');
    });
  });
});
