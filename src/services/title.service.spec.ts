import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { faker } from '@faker-js/faker';
import { TitleService } from './title.service';
import { environment } from '../environments/environment';

const BASE = !environment.sandbox ? 'Oengus' : 'Oengus [Sandbox]';

describe('TitleService', () => {
  let service: TitleService;
  let platformTitle: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TitleService, Title] });
    service = TestBed.inject(TitleService);
    platformTitle = TestBed.inject(Title);
  });

  describe('setSubTitle()', () => {
    it('should format as "subtitle | baseTitle"', () => {
      const subtitle = faker.lorem.word();

      service.setSubTitle(subtitle);

      expect(platformTitle.getTitle()).toBe(`${subtitle} | ${BASE}`);
    });
  });

  describe('resetSubTitle()', () => {
    it('should restore to the current main title', () => {
      service.setSubTitle(faker.lorem.word());
      service.resetSubTitle();

      expect(platformTitle.getTitle()).toBe(BASE);
    });

    it('should restore to a custom main title if setTitle was called', () => {
      const marathon = faker.company.name();
      service.setTitle(marathon);
      service.setSubTitle('Settings');
      service.resetSubTitle();

      expect(platformTitle.getTitle()).toBe(`${marathon} | ${BASE}`);
    });
  });

  describe('setTitle()', () => {
    it('should format as "title | baseTitle"', () => {
      const marathon = faker.company.name();

      service.setTitle(marathon);

      expect(platformTitle.getTitle()).toBe(`${marathon} | ${BASE}`);
    });

    it('should update the main title for subsequent subtitles', () => {
      const marathon = faker.company.name();
      const page = faker.lorem.word();

      service.setTitle(marathon);
      service.setSubTitle(page);

      expect(platformTitle.getTitle()).toBe(`${page} | ${marathon} | ${BASE}`);
    });
  });

  describe('resetTitle()', () => {
    it('should restore to base title', () => {
      service.setTitle(faker.company.name());
      service.resetTitle();

      expect(platformTitle.getTitle()).toBe(BASE);
    });

    it('should make subsequent subtitles use base again', () => {
      service.setTitle(faker.company.name());
      service.resetTitle();
      service.setSubTitle('About');

      expect(platformTitle.getTitle()).toBe(`About | ${BASE}`);
    });
  });
});
