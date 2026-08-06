import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { ImportRunDialogComponent } from './import-run-dialog.component';
import { TranslateTestingModule, makeSavedGame, makeSavedCategory } from '../../../../testing';

describe('ImportRunDialogComponent', () => {
  let fixture: ComponentFixture<ImportRunDialogComponent>;
  let component: ImportRunDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportRunDialogComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ImportRunDialogComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ImportRunDialogComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('modalActive defaults to false', () => {
    expect(component.modalActive).toBe(false);
  });

  it('savedGames defaults to empty array', () => {
    expect(component.savedGames).toEqual([]);
  });

  it('selectedCategories defaults to empty array', () => {
    expect(component.selectedCategories).toEqual([]);
  });

  it('durationToHuman converts ISO duration to human-readable', () => {
    const result = (component as any).durationToHuman('PT1H30M');

    expect(result).toBe('01:30:00');
  });

  it('durationToHuman caches results', () => {
    const first = (component as any).durationToHuman('PT2H');
    const second = (component as any).durationToHuman('PT2H');

    expect(first).toBe(second);
    expect(first).toBe('02:00:00');
  });

  it('doImport emits selected categories', () => {
    const categories = [makeSavedCategory(), makeSavedCategory()];
    let emitted: any[] | undefined;
    component.doImport.subscribe((v: any[]) => (emitted = v));

    component.doImport.emit(categories);

    expect(emitted).toEqual(categories);
  });

  it('cancel emits when triggered', () => {
    let emitted = false;
    component.cancel.subscribe(() => (emitted = true));

    component.cancel.emit();

    expect(emitted).toBe(true);
  });
});
