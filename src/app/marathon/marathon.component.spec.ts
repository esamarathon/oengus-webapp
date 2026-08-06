import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { ActivatedRoute } from '@angular/router';
import { MarathonComponent } from './marathon.component';
import { TranslateTestingModule, makeMarathon, makeUser } from '../../testing';
import { MarathonService } from '../../services/marathon.service';
import { UserService } from '../../services/user.service';
import { TitleService } from '../../services/title.service';

describe('MarathonComponent', () => {
  let fixture: ComponentFixture<MarathonComponent>;
  let component: MarathonComponent;
  let marathonServiceStub: Record<string, any>;
  let titleServiceStub: Record<string, any>;
  const routeMarathon = makeMarathon();

  beforeEach(async () => {
    marathonServiceStub = {
      marathon: routeMarathon,
      isAdmin: vi.fn().mockReturnValue(false),
    };

    titleServiceStub = {
      setSubTitle: vi.fn(),
      resetSubTitle: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MarathonComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { marathon: routeMarathon } } } },
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: UserService, useValue: { user: makeUser() } },
        { provide: TitleService, useValue: titleServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(MarathonComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(MarathonComponent);
    component = fixture.componentInstance;
  });
  it('isAdmin delegates to marathonService.isAdmin', () => {
    marathonServiceStub.isAdmin.mockReturnValue(true);

    expect(component.isAdmin).toBe(true);
  });

  it('toggleSidebar updates collapsed state', () => {
    component.toggleSidebar(true);

    expect(component.collapsed).toBe(true);

    component.toggleSidebar(false);

    expect(component.collapsed).toBe(false);
  });

  it('title returns marathon name', () => {
    expect(component.title).toBe(routeMarathon.name);
  });

  it('marathonRouteActivate sets subtitle when component has title on prototype', () => {
    class MockComp {}
    Object.defineProperty(MockComp.prototype, 'title', { value: 'Schedule', writable: false });
    const mockComponent = new MockComp();

    component.marathonRouteActivate(mockComponent);

    expect(titleServiceStub.setSubTitle).toHaveBeenCalledWith('Schedule');
  });

  it('marathonRouteActivate resets subtitle when component has no title', () => {
    const mockComponent = {};

    component.marathonRouteActivate(mockComponent);

    expect(titleServiceStub.resetSubTitle).toHaveBeenCalled();
  });

  it('ngOnInit sets collapsed based on window width', () => {
    vi.stubGlobal('innerWidth', 800);

    component.ngOnInit();

    expect(component.collapsed).toBe(true);

    vi.stubGlobal('innerWidth', 1200);

    component.ngOnInit();

    expect(component.collapsed).toBe(false);

    vi.unstubAllGlobals();
  });
});
