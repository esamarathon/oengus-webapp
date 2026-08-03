import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-element-table-detail',
    templateUrl: './element-table-detail.component.html',
    styleUrls: ['./element-table-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
    ]
})
export class ElementTableDetailComponent {
  //
}
