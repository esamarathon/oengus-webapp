import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { SubmissionSettingsComponent } from './submission-settings.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';
import { MarathonService } from '../../../../services/marathon.service';

describe('SubmissionSettingsComponent', () => {
  let fixture: ComponentFixture<SubmissionSettingsComponent>;
  let component: SubmissionSettingsComponent;
  let marathonServiceStub: Record<string, any>;

  beforeEach(async () => {
    marathonServiceStub = {
      marathon: makeMarathon(),
      fetchDiscordInfo: vi.fn().mockReturnValue(of({ id: '123', name: 'Test Guild' })),
    };

    await TestBed.configureTestingModule({
      imports: [SubmissionSettingsComponent, TranslateTestingModule],
      providers: [
        { provide: MarathonService, useValue: marathonServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SubmissionSettingsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SubmissionSettingsComponent);
    component = fixture.componentInstance;
    component.settings = makeMarathon() as any;
    component.submissionsQuestions = [];
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('checkDiscordStatus clears guild info when discordRequired is false', () => {
    component.settings.discordRequired = false;
    component.settings.discordGuildId = 'old';
    component.settings.discordGuildName = 'Old Guild';

    component.checkDiscordStatus();

    expect(component.settings.discordGuildId).toBeNull();
    expect(component.settings.discordGuildName).toBeNull();
  });

  it('checkDiscordStatus fetches discord info when required and discord set', () => {
    component.settings.discordRequired = true;
    component.settings.discord = 'abc123';

    component.checkDiscordStatus();

    expect(marathonServiceStub.fetchDiscordInfo).toHaveBeenCalledWith(component.settings);
    expect(component.settings.discordGuildId).toBe('123');
    expect(component.settings.discordGuildName).toBe('Test Guild');
  });

  it('checkDiscordStatus does not fetch when discord is empty', () => {
    component.settings.discordRequired = true;
    component.settings.discord = '';

    component.checkDiscordStatus();

    expect(marathonServiceStub.fetchDiscordInfo).not.toHaveBeenCalled();
  });
});
