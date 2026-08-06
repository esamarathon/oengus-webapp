import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DiscordSettingsComponent } from './discord-settings.component';

describe('DiscordSettingsComponent', () => {
  let fixture: ComponentFixture<DiscordSettingsComponent>;
  let component: DiscordSettingsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscordSettingsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DiscordSettingsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(DiscordSettingsComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });
});
