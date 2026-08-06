import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HomeSubmitButtonComponent } from './home-submit-button.component';
import { TranslateTestingModule, makeMarathon, makeUser } from '../../../../testing';
import { UserService } from '../../../../services/user.service';
import { MarathonService } from '../../../../services/marathon.service';

describe('HomeSubmitButtonComponent', () => {
  let fixture: ComponentFixture<HomeSubmitButtonComponent>;
  let component: HomeSubmitButtonComponent;
  let userServiceStub: { user: any };
  let marathonServiceStub: { isArchived: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userServiceStub = { user: null };
    marathonServiceStub = { isArchived: vi.fn().mockReturnValue(false) };

    await TestBed.configureTestingModule({
      imports: [HomeSubmitButtonComponent, TranslateTestingModule],
      providers: [
        { provide: UserService, useValue: userServiceStub },
        { provide: MarathonService, useValue: marathonServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeSubmitButtonComponent);
    component = fixture.componentInstance;
    component.marathon = makeMarathon();
  });
  describe('loggedIn', () => {
    it('returns false when user is null', () => {
      userServiceStub.user = null;
      expect(component.loggedIn).toBe(false);
    });

    it('returns true when user exists', () => {
      userServiceStub.user = makeUser();
      expect(component.loggedIn).toBe(true);
    });
  });

  describe('archived', () => {
    it('returns false when marathon is not archived', () => {
      marathonServiceStub.isArchived.mockReturnValue(false);
      expect(component.archived).toBe(false);
    });

    it('returns true when marathon is archived', () => {
      marathonServiceStub.isArchived.mockReturnValue(true);
      expect(component.archived).toBe(true);
    });
  });
});
