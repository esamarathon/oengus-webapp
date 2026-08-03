import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { V2ScheduleLine } from '../../../../../../model/schedule-line';
import { DurationService } from '../../../../../../services/duration.service';

@Component({
    selector: 'app-setup-block-editor',
    templateUrl: './setup-block-editor.component.html',
    styleUrls: ['./setup-block-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
    ]
})
export class SetupBlockEditorComponent implements OnInit {
  @Output() setupTimeChanged = new EventEmitter<string>();

  // @ts-expect-error meh.
  @Input() line: V2ScheduleLine;
  // @ts-expect-error meh.
  @Input() i: number;

  humanSetupTime = '00:00:00';

  ngOnInit(): void {
    this.humanSetupTime = DurationService.toHuman(this.line.setupTime);
  }

  onSetupTimeBlur(): void {
    this.line.setupTime = DurationService.toIso(this.humanSetupTime);
    this.setupTimeChanged.emit(this.line.setupTime);
  }
}
