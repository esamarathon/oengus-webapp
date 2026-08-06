import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SidebarModeratorsComponent } from './sidebar-moderators.component';
import { TranslateTestingModule, makeMarathon, makeBasicUserInfo, routerTestProviders } from '../../../../testing';

describe('SidebarModeratorsComponent', () => {
  let fixture: ComponentFixture<SidebarModeratorsComponent>;
  let component: SidebarModeratorsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarModeratorsComponent, TranslateTestingModule],
      providers: [...routerTestProviders],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarModeratorsComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    const creator = makeBasicUserInfo({ username: 'duncte123' });
    component.marathon = makeMarathon({ creator, moderators: [] });
    expect(component).toBeTruthy();
  });

  it('populates moderators with creator and marathon moderators on init', () => {
    const creator = makeBasicUserInfo({ username: 'duncte123' });
    const mod1 = makeBasicUserInfo({ username: 'mod_one' });
    const mod2 = makeBasicUserInfo({ username: 'mod_two' });
    component.marathon = makeMarathon({ creator, moderators: [mod1, mod2] });

    component.ngOnInit();

    expect(component.moderators).toHaveLength(3);
    expect(component.moderators[0].username).toBe('duncte123');
    expect(component.moderators[1].username).toBe('mod_one');
    expect(component.moderators[2].username).toBe('mod_two');
  });

  it('includes only creator when no moderators', () => {
    const creator = makeBasicUserInfo({ username: 'duncte123' });
    component.marathon = makeMarathon({ creator, moderators: [] });

    component.ngOnInit();

    expect(component.moderators).toHaveLength(1);
    expect(component.moderators[0].username).toBe('duncte123');
  });
});
