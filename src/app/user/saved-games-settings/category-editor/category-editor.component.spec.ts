import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { CategoryEditorComponent } from './category-editor.component';
import { TranslateTestingModule, makeSavedCategory } from '../../../../testing';
import { SavedGamesService } from '../../../../services/saved-games.service';

describe('CategoryEditorComponent', () => {
  let fixture: ComponentFixture<CategoryEditorComponent>;
  let component: CategoryEditorComponent;
  let savedGamesServiceStub: { createCategory: ReturnType<typeof vi.fn>; updateCategory: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    savedGamesServiceStub = {
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CategoryEditorComponent, TranslateTestingModule],
      providers: [
        { provide: SavedGamesService, useValue: savedGamesServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(CategoryEditorComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(CategoryEditorComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    component.inputCategory = makeSavedCategory();
    component.gameId = 1;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('starts in editing mode for new categories (id < 1)', () => {
    component.inputCategory = makeSavedCategory({ id: -1, estimate: 'PT1H30M' });
    component.gameId = 1;
    fixture.detectChanges();
    expect(component.editing).toBe(true);
  });

  it('starts in non-editing mode for existing categories', () => {
    component.inputCategory = makeSavedCategory({ id: 5, estimate: 'PT1H30M' });
    component.gameId = 1;
    fixture.detectChanges();
    expect(component.editing).toBe(false);
  });

  it('cancelEdit restores original category', () => {
    const original = makeSavedCategory({ id: -1, estimate: 'PT1H30M' });
    component.inputCategory = original;
    component.gameId = 1;
    fixture.detectChanges();

    component['category'].name = 'Modified';
    component['cancelEdit']();

    expect(component['category'].name).toBe(original.name);
    expect(component.editing).toBe(false);
  });

  it('ngOnChanges resets editing when gameId changes', () => {
    component.inputCategory = makeSavedCategory({ id: -1, estimate: 'PT1H30M' });
    component.gameId = 1;
    fixture.detectChanges();
    expect(component.editing).toBe(true);

    component.ngOnChanges({
      gameId: new SimpleChange(1, 2, false),
    });

    expect(component.editing).toBe(false);
    expect(component.loading).toBe(false);
  });

  it('saveCategory emits saveGameInstead when gameId < 0', async () => {
    component.inputCategory = makeSavedCategory({ id: -1, estimate: 'PT1H30M' });
    component.gameId = -1;
    fixture.detectChanges();

    const spy = vi.fn();
    component.saveGameInstead.subscribe(spy);

    await component['saveCategory']();

    expect(component.loading).toBe(true);
  });

  it('saveCategory creates new category when id < 1 and gameId > 0', async () => {
    const cat = makeSavedCategory({ id: -1, estimate: 'PT1H30M' });
    const created = makeSavedCategory({ id: 42, estimate: 'PT1H30M' });
    component.inputCategory = cat;
    component.gameId = 10;
    fixture.detectChanges();

    savedGamesServiceStub.createCategory.mockReturnValue(of(created));
    const spy = vi.fn();
    component.categoryChange.subscribe(spy);

    await component['saveCategory']();

    expect(savedGamesServiceStub.createCategory).toHaveBeenCalledWith(10, expect.objectContaining({ id: -1 }));
    expect(spy).toHaveBeenCalledWith(created);
    expect(component.editing).toBe(false);
  });

  it('saveCategory updates when category id > 0', async () => {
    const cat = makeSavedCategory({ id: 5, estimate: 'PT1H30M' });
    const updated = { ...cat, name: 'Updated' };
    component.inputCategory = cat;
    component.gameId = 10;
    fixture.detectChanges();

    savedGamesServiceStub.updateCategory.mockReturnValue(of(updated));
    const spy = vi.fn();
    component.categoryChange.subscribe(spy);

    component.editing = true;
    await component['saveCategory']();

    expect(savedGamesServiceStub.updateCategory).toHaveBeenCalledWith(10, expect.objectContaining({ id: 5 }));
    expect(spy).toHaveBeenCalledWith(updated);
  });

  it('parsedEstimate getter converts ISO to human format', () => {
    component.inputCategory = makeSavedCategory();
    component.gameId = 1;
    fixture.detectChanges();

    component['category'].estimate = 'PT1H30M';
    expect(component.parsedEstimate).toBe('01:30:00');
  });
});
