import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { of } from 'rxjs';
import { GeneralSettingsComponent } from './general-settings.component';
import { TranslateTestingModule, makeMarathon, makeUser, makeUserProfile } from '../../../../testing';
import { MarathonService } from '../../../../services/marathon.service';
import { UserService } from '../../../../services/user.service';

describe('GeneralSettingsComponent', () => {
  let fixture: ComponentFixture<GeneralSettingsComponent>;
  let component: GeneralSettingsComponent;
  let marathonServiceStub: Record<string, any>;
  let userServiceStub: Record<string, any>;

  beforeEach(async () => {
    const creator = { id: faker.number.int(), username: faker.internet.username() };

    marathonServiceStub = {
      marathon: makeMarathon({ creator: creator as any }),
      isWebhookOnline: vi.fn().mockReturnValue(of(true)),
    };

    userServiceStub = {
      user: makeUser({ id: creator.id }),
      searchV1: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [GeneralSettingsComponent, TranslateTestingModule],
      providers: [
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: UserService, useValue: userServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(GeneralSettingsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(GeneralSettingsComponent);
    component = fixture.componentInstance;
    component.settings = { webhook: '' } as any;
    component.moderators = [];
  });
  it('currentUserIsOwner returns true when user id matches creator', () => {
    expect(component.currentUserIsOwner).toBe(true);
  });

  it('currentUserIsOwner returns false when user id differs', () => {
    userServiceStub.user = makeUser({ id: faker.number.int({ min: 9000 }) });

    expect(component.currentUserIsOwner).toBe(false);
  });

  it('ngOnInit sets isOengusBotWebhook when webhook starts with oengus-bot', () => {
    component.settings = { webhook: 'oengus-bot?marathon=test' } as any;

    component.ngOnInit();

    expect(component.isOengusBotWebhook).toBe(true);
  });

  it('ngOnInit sets isOengusBotWebhook to false for normal webhook', () => {
    component.settings = { webhook: 'https://example.com/hook' } as any;

    component.ngOnInit();

    expect(component.isOengusBotWebhook).toBe(false);
  });

  it('checkWebhook sets all to default when text is empty', () => {
    component.checkWebhook('');

    expect(component.isWebhookOnline).toBe(true);
    expect(component.isOengusBotWebhook).toBe(false);
    expect(component.isMissingMarathon).toBe(false);
  });

  it('checkWebhook detects oengus-bot webhook with correct marathon', () => {
    marathonServiceStub.marathon.id = 'my-marathon';
    component.checkWebhook('oengus-bot?marathon=my-marathon');

    expect(component.isOengusBotWebhook).toBe(true);
    expect(component.isMissingMarathon).toBe(false);
  });

  it('checkWebhook detects oengus-bot webhook missing marathon id', () => {
    marathonServiceStub.marathon.id = 'my-marathon';
    component.checkWebhook('oengus-bot?marathon=other');

    expect(component.isOengusBotWebhook).toBe(true);
    expect(component.isMissingMarathon).toBe(true);
  });

  it('onSelectMod adds moderator if not already present', () => {
    const mod = makeUserProfile({ id: faker.number.int() });
    component.moderators = [];

    component.onSelectMod(mod);

    expect(component.moderators).toContain(mod);
  });

  it('onSelectMod does not add duplicate moderator', () => {
    const mod = makeUserProfile({ id: faker.number.int() });
    component.moderators = [mod];

    component.onSelectMod(mod);

    expect(component.moderators).toHaveLength(1);
  });

  it('onSelectMod does not add the creator as moderator', () => {
    const creatorProfile = makeUserProfile({ id: marathonServiceStub.marathon.creator.id });
    component.moderators = [];

    component.onSelectMod(creatorProfile);

    expect(component.moderators).toHaveLength(0);
  });

  it('removeModerator splices at index', () => {
    const mod1 = makeUserProfile();
    const mod2 = makeUserProfile();
    component.moderators = [mod1, mod2];

    component.removeModerator(0);

    expect(component.moderators).toEqual([mod2]);
  });

  it('onSearchMod does nothing for short input', () => {
    component.onSearchMod('ab');

    expect(userServiceStub.searchV1).not.toHaveBeenCalled();
  });

  it('onSearchMod calls userService.searchV1 for 3+ chars', () => {
    const term = faker.internet.username().slice(0, 5);
    component.onSearchMod(term);

    expect(userServiceStub.searchV1).toHaveBeenCalledWith(term);
  });
});
