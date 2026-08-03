import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemporalServiceService } from '../../../../services/termporal/temporal-service.service';
import { dateTimeFormatKey } from '../../../../services/termporal/config';

@Component({
    selector: 'app-element-temporal-datetime',
    templateUrl: './element-temporal-datetime.component.html',
    styleUrls: ['./element-temporal-datetime.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
    ]
})
export class ElementTemporalDatetimeComponent {
  private temporal = inject(TemporalServiceService);

  private _dateTime: string | Temporal.ZonedDateTime = this.temporal.now;
  private _format: dateTimeFormatKey = 'mediumDateTime';

  // Formatted output is cached and only recomputed when an input changes,
  // instead of parsing + formatting on every change-detection cycle.
  protected formatted = '';

  @Input()
  public set dateTime(value: string | Temporal.ZonedDateTime) {
    this._dateTime = value;
    this.updateFormatted();
  }

  public get dateTime(): string | Temporal.ZonedDateTime {
    return this._dateTime;
  }

  @Input()
  public set format(value: dateTimeFormatKey) {
    this._format = value;
    this.updateFormatted();
  }

  public get format(): dateTimeFormatKey {
    return this._format;
  }

  private updateFormatted(): void {
    const date = this.temporal.parseDate(this._dateTime);
    this.formatted = this.temporal.format.format(date, this._format);
  }
}
