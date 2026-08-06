import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubmitHeaderComponent } from './submit-header.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';
import { MarathonService } from '../../../../services/marathon.service';

describe('SubmitHeaderComponent', () => {
  let fixture: ComponentFixture<SubmitHeaderComponent>;
  let component: SubmitHeaderComponent;
  const marathon = makeMarathon({
    unlimitedGames: true,
    maxGamesPerRunner: 5,
    unlimitedCategories: false,
    maxCategoriesPerGame: 3,
    hasMultiplayer: true,
    maxNumberOfScreens: 2,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitHeaderComponent, TranslateTestingModule],
      providers: [
        { provide: MarathonService, useValue: { marathon } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitHeaderComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('startDate proxies marathon startDate', () => {
    expect(component.startDate).toBe(marathon.startDate);
  });

  it('endDate proxies marathon endDate', () => {
    expect(component.endDate).toBe(marathon.endDate);
  });

  it('unlimitedGames proxies marathon value', () => {
    expect(component.unlimitedGames).toBe(true);
  });

  it('maxGamesPerRunner proxies marathon value', () => {
    expect(component.maxGamesPerRunner).toBe(5);
  });

  it('unlimitedCategories proxies marathon value', () => {
    expect(component.unlimitedCategories).toBe(false);
  });

  it('maxCategoriesPerGame proxies marathon value', () => {
    expect(component.maxCategoriesPerGame).toBe(3);
  });

  it('hasMultiplayer proxies marathon value', () => {
    expect(component.hasMultiplayer).toBe(true);
  });

  it('maxNumberOfScreens proxies marathon value', () => {
    expect(component.maxNumberOfScreens).toBe(2);
  });
});
