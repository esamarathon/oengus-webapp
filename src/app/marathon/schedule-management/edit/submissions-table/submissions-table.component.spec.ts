import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SubmissionsTableComponent } from './submissions-table.component';
import { TranslateTestingModule } from '../../../../../testing';

describe('SubmissionsTableComponent', () => {
  let fixture: ComponentFixture<SubmissionsTableComponent>;
  let component: SubmissionsTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionsTableComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SubmissionsTableComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SubmissionsTableComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('todoLines defaults to empty array', () => {
    expect(component.todoLines).toEqual([]);
  });

  it('selectedAvailabilities defaults to empty array', () => {
    expect(component.selectedAvailabilities).toEqual([]);
  });

  it('moveToSchedule emits index', () => {
    let emitted: number | undefined;
    component.moveToSchedule.subscribe((v: number) => (emitted = v));

    component.moveToSchedule.emit(5);

    expect(emitted).toBe(5);
  });
});
