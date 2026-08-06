import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HeaderLanguagePickerComponent } from './header-language-picker.component';
import { LocaleService } from '../../../../services/locale.service';

describe('HeaderLanguagePickerComponent', () => {
  let fixture: ComponentFixture<HeaderLanguagePickerComponent>;
  let component: HeaderLanguagePickerComponent;
  let localeServiceStub: {
    availableLocaleNames: string[];
    languagesJson: Record<string, any>;
    language: string;
    useLanguage: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    localeServiceStub = {
      availableLocaleNames: ['en', 'fr', 'nl'],
      languagesJson: { en: { nativeName: 'English' }, fr: { nativeName: 'Français' }, nl: { nativeName: 'Nederlands' } },
      language: 'en',
      useLanguage: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderLanguagePickerComponent],
      providers: [
        { provide: LocaleService, useValue: localeServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderLanguagePickerComponent);
    component = fixture.componentInstance;
  });
  it('usableLocales returns available locale names', () => {
    expect(component.usableLocales).toEqual(['en', 'fr', 'nl']);
  });

  it('languages returns languagesJson', () => {
    expect(component.languages).toBe(localeServiceStub.languagesJson);
  });

  it('currentLocale returns entry for current language', () => {
    expect(component.currentLocale).toEqual({ nativeName: 'English' });
  });

  it('changeLanguage calls localeService and returns false', () => {
    const result = component.changeLanguage('nl');

    expect(localeServiceStub.useLanguage).toHaveBeenCalledWith('nl');
    expect(result).toBe(false);
  });
});
