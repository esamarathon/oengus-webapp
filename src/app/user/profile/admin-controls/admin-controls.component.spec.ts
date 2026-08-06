import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminControlsComponent } from './admin-controls.component';
import { TranslateTestingModule } from '../../../../testing';
import { UserService } from '../../../../services/user.service';

describe('AdminControlsComponent', () => {
  let fixture: ComponentFixture<AdminControlsComponent>;
  let component: AdminControlsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminControlsComponent, TranslateTestingModule],
      providers: [
        { provide: UserService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminControlsComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('openAdminDialog emits openDialog event', () => {
    const spy = vi.fn();
    component.openDialog.subscribe(spy);

    component.openAdminDialog();

    expect(spy).toHaveBeenCalled();
  });
});
