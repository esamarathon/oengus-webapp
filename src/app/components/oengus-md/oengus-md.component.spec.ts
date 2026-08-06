import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faker } from '@faker-js/faker';
import { OengusMdComponent } from './oengus-md.component';
import { MarkdownService } from '../../../services/markdown.service';

describe('OengusMdComponent', () => {
  let fixture: ComponentFixture<OengusMdComponent>;
  let component: OengusMdComponent;
  let markdownServiceStub: { render: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    markdownServiceStub = { render: vi.fn((v: string) => `<p>${v}</p>`) };

    await TestBed.configureTestingModule({
      imports: [OengusMdComponent],
      providers: [
        { provide: MarkdownService, useValue: markdownServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OengusMdComponent);
    component = fixture.componentInstance;
  });
  it('markdownText returns empty string for falsy data', () => {
    component.data = '';
    expect(component.markdownText).toBe('');
  });

  it('markdownText calls MarkdownService.render', () => {
    const text = faker.lorem.sentence();
    component.data = text;

    expect(component.markdownText).toBe(`<p>${text}</p>`);
    expect(markdownServiceStub.render).toHaveBeenCalledWith(text);
  });

  it('ngOnInit sets trustedContent', () => {
    const text = faker.lorem.sentence();
    component.data = text;

    component.ngOnInit();

    expect(component.trustedContent).toBeTruthy();
  });
});
