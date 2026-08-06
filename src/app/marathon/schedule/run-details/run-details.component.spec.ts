import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { RunDetailsComponent } from './run-details.component';
import { TranslateTestingModule, routerTestProviders } from '../../../../testing';

describe('RunDetailsComponent', () => {
  let fixture: ComponentFixture<RunDetailsComponent>;
  let component: RunDetailsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RunDetailsComponent, TranslateTestingModule],
      providers: [...routerTestProviders],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(RunDetailsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(RunDetailsComponent);
    component = fixture.componentInstance;
  });
  it('titleText returns game name when not a setup block', () => {
    const gameName = faker.commerce.productName();
    component.run = { setupBlock: false, game: gameName } as any;

    expect(component.titleText).toBe(gameName);
  });

  it('titleText returns setupBlockText when setup block with text', () => {
    const text = faker.lorem.words(3);
    component.run = { setupBlock: true, setupBlockText: text, game: 'Portal' } as any;

    expect(component.titleText).toBe(text);
  });

  it('titleText returns null when setup block with no text', () => {
    component.run = { setupBlock: true, setupBlockText: '', game: 'Portal' } as any;

    expect(component.titleText).toBeNull();
  });
});
