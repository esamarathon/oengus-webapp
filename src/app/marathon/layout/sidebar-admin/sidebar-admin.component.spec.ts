import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SidebarAdminComponent } from './sidebar-admin.component';
import { TranslateTestingModule, makeMarathon, routerTestProviders } from '../../../../testing';

describe('SidebarAdminComponent', () => {
  let fixture: ComponentFixture<SidebarAdminComponent>;
  let component: SidebarAdminComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarAdminComponent, TranslateTestingModule],
      providers: [...routerTestProviders],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarAdminComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
  });
  it('marathonId returns the marathon id', () => {
    component.marathon = makeMarathon({ id: 'my-marathon' });
    expect(component.marathonId).toBe('my-marathon');
  });

  it('collapsed defaults to false', () => {
    expect(component.collapsed).toBe(false);
  });
});
