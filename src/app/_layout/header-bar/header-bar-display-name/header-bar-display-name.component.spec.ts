import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HeaderBarDisplayNameComponent } from './header-bar-display-name.component';
import { TranslateTestingModule, makeUser } from '../../../../testing';
import { UserService } from '../../../../services/user.service';

describe('HeaderBarDisplayNameComponent', () => {
  let fixture: ComponentFixture<HeaderBarDisplayNameComponent>;
  let component: HeaderBarDisplayNameComponent;
  let userServiceStub: { user: any };

  beforeEach(async () => {
    userServiceStub = { user: null };

    await TestBed.configureTestingModule({
      imports: [HeaderBarDisplayNameComponent, TranslateTestingModule],
      providers: [
        { provide: UserService, useValue: userServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderBarDisplayNameComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('returns falsy when user is null', () => {
    userServiceStub.user = null;
    expect(component.isMissingDisplayName).toBeFalsy();
  });

  it('returns false when user has displayName', () => {
    userServiceStub.user = makeUser({ displayName: 'duncte123' });
    expect(component.isMissingDisplayName).toBeFalsy();
  });

  it('returns true when user exists but displayName is empty', () => {
    userServiceStub.user = makeUser({ displayName: '' });
    expect(component.isMissingDisplayName).toBeTruthy();
  });
});
