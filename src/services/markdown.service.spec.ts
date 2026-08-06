import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MarkdownService } from './markdown.service';

describe('MarkdownService', () => {
  let service: MarkdownService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MarkdownService] });
    service = TestBed.inject(MarkdownService);
  });

  describe('render()', () => {
    it('should render markdown to HTML', () => {
      const result = service.render('**bold**');

      expect(result).toContain('<strong>bold</strong>');
    });

    it('should render links', () => {
      const result = service.render('[Oengus](https://oengus.io)');

      expect(result).toContain('<a');
      expect(result).toContain('https://oengus.io');
      expect(result).toContain('Oengus');
    });

    it('should render tables', () => {
      const result = service.render('| A | B |\n|---|---|\n| 1 | 2 |');

      expect(result).toContain('<table');
      expect(result).toContain('<td>');
    });

    it('should render emoji shortcodes', () => {
      const result = service.render(':smile:');

      expect(result).not.toContain(':smile:');
    });

    it('should sanitize XSS attempts', () => {
      const result = service.render('<script>alert("xss")</script>');

      expect(result).not.toContain('<script');
    });
  });

  describe('renderInlineSimple()', () => {
    it('should render bold and italic', () => {
      const result = service.renderInlineSimple('**bold** and _italic_');

      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('should render links', () => {
      const result = service.renderInlineSimple('[link](https://oengus.io)');

      expect(result).toContain('<a');
      expect(result).toContain('https://oengus.io');
    });

    it('should not render complex markdown like tables', () => {
      const result = service.renderInlineSimple('| A | B |');

      expect(result).not.toContain('<table');
    });

    it('should not render raw HTML tags', () => {
      const result = service.renderInlineSimple('<img src=x onerror=alert(1)>');

      expect(result).not.toContain('<img');
    });
  });

  describe('sanitizeHtml()', () => {
    it('should strip dangerous tags', () => {
      const result = service.sanitizeHtml('<div><script>bad</script><p>good</p></div>');

      expect(result).not.toContain('<script');
      expect(result).toContain('<p>good</p>');
    });
  });
});
