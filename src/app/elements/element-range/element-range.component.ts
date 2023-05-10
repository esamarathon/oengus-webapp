import { Component, HostBinding, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-element-range',
  templateUrl: './element-range.component.html',
  styleUrls: ['./element-range.component.scss']
})
export class ElementRangeComponent implements OnInit {
  @Input() start = 0;
  @Input() end = 0;
  @HostBinding('attr.aria-valuemin') @Input() min = 0;
  @HostBinding('attr.aria-valuemax') @Input() max = 0;

  @HostBinding('attr.aria-valuetext') get valText() {
    return `${this.start} - ${this.end}`;
  }

  constructor() { }

  ngOnInit(): void {
  }

  @HostBinding('style')
  get rangeCutoffs(): { '--start-range': string, '--end-range': string } {
    return {
      '--start-range': `${100 * (this.start - this.min) / (this.max - this.min)}%`,
      '--end-range': `${100 * (this.max - this.end) / (this.max - this.min)}%`,
    };
  }

}
