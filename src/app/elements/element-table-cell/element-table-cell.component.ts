import { Component, ElementRef, HostBinding, inject, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-element-table-cell',
    templateUrl: './element-table-cell.component.html',
    styleUrls: ['./element-table-cell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        FontAwesomeModule,
    ]
})
export class ElementTableCellComponent implements OnChanges {
  private elem = inject(ElementRef);

  @Input() isHeader = false;
  @Input() columnStart = 'auto';
  @Input() columnEnd = 'auto';
  @Input() rowStart = 'auto';
  @Input() rowEnd = 'auto';

  // @HostBinding('class.element-table-header') get header() { return this.isHeader; }
  @HostBinding('style') get style() {
    return {
      '--column-start': this.columnStart,
      '--column-end': this.columnEnd,
      '--row-start': this.rowStart,
      '--row-end': this.rowEnd,
    };
  }

  @Input() isExpandButton = false;
  @Input() expanded = false;

  get icon() {
    return this.expanded ? faCaretDown : faCaretRight;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.isHeader && changes.isHeader.currentValue !== changes.isHeader.previousValue) {
      // The good way did not work for me 🙃
      const clsList = (this.elem.nativeElement.classList as DOMTokenList);

      if (this.isHeader) {
        clsList.add('element-table-header');
      } else {
        clsList.remove('element-table-header');
      }
    }
    if (changes.isExpandButton && changes.isExpandButton.currentValue !== changes.isExpandButton.previousValue) {
      const clsList = (this.elem.nativeElement.classList as DOMTokenList);

      if (this.isExpandButton) {
        clsList.add('element-table-expand-button');
      } else {
        clsList.remove('element-table-expand-button');
      }
    }
  }

}
