import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';
import { NotificationListComponent } from './notification-list.component';
import { NotificationService } from '../../../services/notification.service';

describe('NotificationListComponent', () => {
  let fixture: ComponentFixture<NotificationListComponent>;
  let component: NotificationListComponent;
  let notificationSubject: Subject<{ message: string; color: string }>;

  beforeEach(async () => {
    notificationSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [NotificationListComponent],
      providers: [
        { provide: NotificationService, useValue: { notificationObservable: notificationSubject.asObservable() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationListComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
    expect(component.notifications).toEqual([]);
  });

  it('adds notifications from the observable', () => {
    notificationSubject.next({ message: 'Hello', color: 'success' });
    notificationSubject.next({ message: 'Warning', color: 'warning' });

    expect(component.notifications).toHaveLength(2);
    expect(component.notifications[0]).toEqual({ message: 'Hello', color: 'success' });
  });

  it('deleteNotification removes by index', () => {
    notificationSubject.next({ message: 'First', color: 'info' });
    notificationSubject.next({ message: 'Second', color: 'danger' });

    component.deleteNotification(0);

    expect(component.notifications).toHaveLength(1);
    expect(component.notifications[0].message).toBe('Second');
  });
});
