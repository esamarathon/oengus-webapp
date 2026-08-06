import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { of, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { TranslateTestingModule } from '../../../testing';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { LocalizeRouterService } from '@oengusio/ngx-translate-router';
import { SelfUser } from '../../../model/user';
import { makeSelfUser } from '../../../testing/mocks';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let selfUser: SelfUser;
  let userServiceStub: Record<string, any>;

  let twitchUsername: string;
  let discordUsername: string;

  beforeEach(async () => {
    twitchUsername = faker.internet.username();
    discordUsername = faker.internet.username();

    selfUser = makeSelfUser({
      connections: [
        { platform: 'TWITCH', username: twitchUsername },
        { platform: 'DISCORD', username: discordUsername },
      ],
    });

    userServiceStub = {
      user: selfUser,
      isLoggedIn: vi.fn().mockReturnValue(true),
      update: vi.fn().mockResolvedValue(selfUser),
      delete: vi.fn().mockReturnValue(of(undefined)),
      logout: vi.fn(),
      sync: vi.fn().mockResolvedValue({ id: '123', name: 'synced_user' }),
      updatePatreonStatus: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, TranslateTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { user: selfUser } }, params: of({}), queryParams: of({}) } },
        { provide: UserService, useValue: userServiceStub },
        { provide: AuthService, useValue: { initMfaSettings: vi.fn(), storeMfa: vi.fn(), deleteMfa: vi.fn(), requestPasswordReset: vi.fn(), getDiscordAuthUri: vi.fn(), getTwitchAuthUrl: vi.fn(), patreonSyncUrl: '' } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: NotificationService, useValue: { toast: vi.fn(), toastRaw: vi.fn() } },
        { provide: LocalizeRouterService, useValue: { translateRoute: (p: string) => p, routerEvents: new Subject(), currentLang: 'en' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SettingsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });
  it('getUsernameByConnectionType finds existing connection', () => {
    expect(component.getUsernameByConnectionType('TWITCH')).toBe(twitchUsername);
  });

  it('getUsernameByConnectionType returns empty for missing type', () => {
    expect(component.getUsernameByConnectionType('YOUTUBE')).toBe('');
  });

  it('deleteConnection removes connection by reference', () => {
    const conn = component.user.connections[0];
    component.deleteConnection(conn);
    expect(component.user.connections).toHaveLength(1);
    expect(component.user.connections[0].platform).toBe('DISCORD');
  });

  it('removeConnectionByType removes by platform string', () => {
    component.removeConnectionByType('DISCORD');
    expect(component.user.connections.every(c => c.platform !== 'DISCORD')).toBe(true);
  });

  it('addOrUpdateConnectionByType updates existing connection username', () => {
    component.addOrUpdateConnectionByType('TWITCH', 'newname');
    const twitch = component.user.connections.find(c => c.platform === 'TWITCH');
    expect(twitch!.username).toBe('newname');
  });

  it('addOrUpdateConnectionByType adds new connection for valid platform', () => {
    component.addOrUpdateConnectionByType('YOUTUBE', 'mychannel');
    const yt = component.user.connections.find(c => c.platform === 'YOUTUBE');
    expect(yt).toBeDefined();
    expect(yt!.username).toBe('mychannel');
  });

  it('usernameConfirmed returns true when deleteUsername matches', () => {
    component.deleteUsername = selfUser.username;
    expect(component.usernameConfirmed).toBe(true);
  });

  it('usernameConfirmed returns false when deleteUsername differs', () => {
    component.deleteUsername = faker.internet.username();
    expect(component.usernameConfirmed).toBe(false);
  });

  it('handleMfaResult sets mfaEnabled and clears settings', () => {
    component.mfaSettings = { qrCode: 'data:test', secretKey: '12345' };
    component.mfaLoading = true;

    component.handleMfaResult(true);

    expect(component.user.mfaEnabled).toBe(true);
    expect(component.mfaSettings).toBeNull();
    expect(component.mfaLoading).toBe(false);
  });

  it('submit filters empty connections', async () => {
    component.user.connections.push({ platform: '' as any, username: '' });

    await component.submit();

    expect(userServiceStub.update).toHaveBeenCalledWith(
      expect.objectContaining({
        connections: expect.not.arrayContaining([expect.objectContaining({ platform: '' })]),
      })
    );
  });

  it('submit sanitizes displayName by stripping HTML tags', async () => {
    component.user.displayName = '<script>alert("xss")</script>Hello';

    await component.submit();

    expect(userServiceStub.update).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'Hello' })
    );
  });

  it('submit falls back to username when displayName is only HTML', async () => {
    component.user.displayName = '<div><img src=x onerror=alert(1)></div>';

    await component.submit();

    expect(userServiceStub.update).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: selfUser.username })
    );
  });
});
