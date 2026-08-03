import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemporalServiceService } from '../../../../services/termporal/temporal-service.service';

@Component({
    selector: 'app-element-temporal-duration',
    templateUrl: './element-temporal-duration.component.html',
    styleUrls: ['./element-temporal-duration.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
    ]
})
export class ElementTemporalDurationComponent {
  private temporal = inject(TemporalServiceService);

  private _duration = 'PT0S';

  // Formatted output is cached and only recomputed when `duration` changes,
  // instead of being recomputed on every change-detection cycle.
  protected formatted = this.temporal.duration.toHumanReadable(this._duration);

  @Input()
  public set duration(value: string) {
    this._duration = value ?? 'PT0S';
    this.formatted = this.temporal.duration.toHumanReadable(this._duration);
  }

  public get duration(): string {
    return this._duration;
  }
}
