import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MarkdownPipe } from './markdown.pipe';
import { MarkdownService } from '../../services/markdown.service';
import { faker } from '@faker-js/faker';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let markdownServiceStub: { renderInlineSimple: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    markdownServiceStub = { renderInlineSimple: vi.fn((v: string) => `<em>${v}</em>`) };

    TestBed.configureTestingModule({
      providers: [
        MarkdownPipe,
        { provide: MarkdownService, useValue: markdownServiceStub },
      ],
    });
    pipe = TestBed.inject(MarkdownPipe);
  });

  it('returns empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('delegates to MarkdownService.renderInlineSimple', () => {
    const input = faker.lorem.sentence();

    const result = pipe.transform(input);

    expect(markdownServiceStub.renderInlineSimple).toHaveBeenCalledWith(input);
    expect(result).toBe(`<em>${input}</em>`);
  });
});
