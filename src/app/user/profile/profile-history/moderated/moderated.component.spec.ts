import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ModeratedComponent } from './moderated.component';
import { TranslateTestingModule, routerTestProviders, makeHistoryMarathon } from '../../../../../testing';

describe('ModeratedComponent', () => {
  let fixture: ComponentFixture<ModeratedComponent>;
  let component: ModeratedComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeratedComponent, TranslateTestingModule],
      providers: [...routerTestProviders],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModeratedComponent);
    component = fixture.componentInstance;
  });
  it('moderatedMarathons returns history in reverse order', () => {
    const first = makeHistoryMarathon();
    const second = makeHistoryMarathon();
    const third = makeHistoryMarathon();
    component.history = [first, second, third];

    expect(component.moderatedMarathons).toEqual([third, second, first]);
  });

  it('moderatedMarathons does not mutate the original array', () => {
    const first = makeHistoryMarathon();
    const second = makeHistoryMarathon();
    component.history = [first, second];

    component.moderatedMarathons;

    expect(component.history).toEqual([first, second]);
  });

  it('exposes getRowParity function', () => {
    expect(component.getRowParity).toBeDefined();
  });
});
