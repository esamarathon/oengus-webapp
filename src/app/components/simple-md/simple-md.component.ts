import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownService } from '../../../services/markdown.service';

@Component({
    selector: 'app-simple-md',
    templateUrl: './simple-md.component.html',
    styleUrls: ['./simple-md.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
    ]
})
export class SimpleMdComponent {
  private readonly markdown = inject(MarkdownService);

  private _data = '';
  // Rendered markdown is cached and only recomputed when `data` changes,
  // instead of being re-rendered on every change-detection cycle.
  protected markdownText = '';

  @Input()
  public set data(value: string) {
    this._data = value ?? '';
    this.markdownText = this._data ? this.markdown.renderInlineSimple(this._data) : '';
  }

  public get data(): string {
    return this._data;
  }

}
