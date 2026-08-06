import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubmitShareButtonsComponent } from './submit-share-buttons.component';
import { TranslateTestingModule, makeMarathon } from '../../../../testing';
import { MarathonService } from '../../../../services/marathon.service';

describe('SubmitShareButtonsComponent', () => {
  let fixture: ComponentFixture<SubmitShareButtonsComponent>;
  let component: SubmitShareButtonsComponent;
  const marathon = makeMarathon({ id: 'bsm2025', name: 'BSM 2025' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitShareButtonsComponent, TranslateTestingModule],
      providers: [
        { provide: MarathonService, useValue: { marathon } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitShareButtonsComponent);
    component = fixture.componentInstance;
    component.gameNames = 'Celeste, Hollow Knight';
  });
  it('marathonName returns marathon name', () => {
    expect(component.marathonName).toBe('BSM 2025');
  });

  it('marathonId returns marathon id', () => {
    expect(component.marathonId).toBe('bsm2025');
  });
});
