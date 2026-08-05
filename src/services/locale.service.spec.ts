import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { faker } from '@faker-js/faker';
import { LocaleService, availableLocaleNames } from './locale.service';
import { TranslateService } from '@ngx-translate/core';
import { LocalizeRouterService } from '@oengusio/ngx-translate-router';
import { DateTimeAdapter } from '@oengus/angular-datetime-picker';
import { TemporalServiceService } from './termporal/temporal-service.service';
import { of } from 'rxjs';

describe('LocaleService', () => {
  let service: LocaleService;
  let translateStub: { use: ReturnType<typeof vi.fn>; setFallbackLang: ReturnType<typeof vi.fn> };
  let routerStub: { changeLanguage: ReturnType<typeof vi.fn>; parser: { currentLang: string } };
  let temporalStub: { changeLocale: ReturnType<typeof vi.fn> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let adapterStub: any;

  beforeEach(() => {
    localStorage.clear();

    translateStub = { use: vi.fn(), setFallbackLang: vi.fn() };
    routerStub = { changeLanguage: vi.fn(), parser: { currentLang: '' } };
    temporalStub = { changeLocale: vi.fn() };
    adapterStub = { setLocale: vi.fn(), localeChanges: of('en') };

    TestBed.configureTestingModule({
      providers: [
        LocaleService,
        { provide: TranslateService, useValue: translateStub },
        { provide: LocalizeRouterService, useValue: routerStub },
        { provide: DateTimeAdapter, useValue: adapterStub },
        { provide: TemporalServiceService, useValue: temporalStub },
      ],
    });
    service = TestBed.inject(LocaleService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('availableLocaleNames', () => {
    it('contains en-GB', () => {
      expect(service.availableLocaleNames).toContain('en-GB');
    });

    it('contains multiple locales', () => {
      expect(service.availableLocaleNames.length).toBeGreaterThan(5);
    });
  });

  describe('useLanguage()', () => {
    it('updates language and persists to localStorage', () => {
      const lang = faker.helpers.arrayElement(availableLocaleNames);

      service.useLanguage(lang);

      expect(service.language).toBe(lang);
      expect(localStorage.getItem('language')).toBe(lang);
    });

    it('calls translate.use with the language', () => {
      const lang = faker.helpers.arrayElement(availableLocaleNames);

      service.useLanguage(lang);

      expect(translateStub.use).toHaveBeenCalledWith(lang);
    });

    it('calls temporal.changeLocale', () => {
      const lang = faker.helpers.arrayElement(availableLocaleNames);

      service.useLanguage(lang);

      expect(temporalStub.changeLocale).toHaveBeenCalledWith(lang);
    });

    it('calls translateRouter.changeLanguage', () => {
      const lang = faker.helpers.arrayElement(availableLocaleNames);

      service.useLanguage(lang);

      expect(routerStub.changeLanguage).toHaveBeenCalledWith(lang);
    });
  });

  describe('languagesJson', () => {
    it('returns an object with language entries', () => {
      const json = service.languagesJson;

      expect(json).toBeDefined();
      expect(json['en']).toBeDefined();
      expect(json['en'].name).toContain('English');
    });
  });
});
