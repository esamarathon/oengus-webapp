import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { faker } from '@faker-js/faker';
import { DescriptionEditorComponent } from './description-editor.component';
import { TranslateTestingModule } from '../../../../../testing';

describe('DescriptionEditorComponent', () => {
  let fixture: ComponentFixture<DescriptionEditorComponent>;
  let component: DescriptionEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescriptionEditorComponent, TranslateTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DescriptionEditorComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(DescriptionEditorComponent);
    component = fixture.componentInstance;
  });
  it('previewActive defaults to false', () => {
    expect(component.previewActive).toBe(false);
  });

  it('descriptionValue getter returns the input value', () => {
    const text = faker.lorem.paragraph();
    component.value = text;

    expect(component.descriptionValue).toBe(text);
  });

  it('descriptionValue setter emits valueChange', () => {
    const newText = faker.lorem.sentence();
    let emitted: string | undefined;
    component.valueChange.subscribe((v: string) => (emitted = v));

    component.descriptionValue = newText;

    expect(emitted).toBe(newText);
  });
});
