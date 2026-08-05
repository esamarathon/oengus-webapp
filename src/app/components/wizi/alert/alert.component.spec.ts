import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { NwbAlertComponent } from './alert.component';
import { NotificationService } from '../../../../services/notification.service';
import { NwbAlertConfig } from './NwbAlertConfig';

describe('NwbAlertComponent', () => {
  let fixture: ComponentFixture<NwbAlertComponent>;
  let component: NwbAlertComponent;
  let toastSubject: Subject<NwbAlertConfig>;

  beforeEach(async () => {
    vi.useFakeTimers();
    toastSubject = new Subject<NwbAlertConfig>();

    await TestBed.configureTestingModule({
      imports: [NwbAlertComponent],
      providers: [
        { provide: NotificationService, useValue: { observableToastr: toastSubject.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NwbAlertComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates the component with empty configs', () => {
    expect(component).toBeTruthy();
    expect(component['configs']).toHaveLength(0);
  });

  it('adds a config when notification fires', () => {
    toastSubject.next({ id: 'abc', message: 'Hello', duration: 3000 });

    expect(component['configs']).toHaveLength(1);
    expect(component['configs'][0].message).toBe('Hello');
  });

  it('sets open to true after 50ms', () => {
    toastSubject.next({ id: 'abc', message: 'Hello' });

    expect(component['configs'][0].open).toBe(false);

    vi.advanceTimersByTime(50);

    expect(component['configs'][0].open).toBe(true);
  });

  it('dismiss sets open to false and removes after 200ms', () => {
    toastSubject.next({ id: 'abc', message: 'Hello' });
    vi.advanceTimersByTime(50);

    component.dismiss('abc');

    expect(component['configs'][0].open).toBe(false);

    vi.advanceTimersByTime(200);

    expect(component['configs']).toHaveLength(0);
  });

  it('auto-dismisses after duration', () => {
    toastSubject.next({ id: 'xyz', message: 'Auto', duration: 1000 });
    vi.advanceTimersByTime(1000);

    expect(component['configs'][0].open).toBe(false);

    vi.advanceTimersByTime(200);

    expect(component['configs']).toHaveLength(0);
  });
});
