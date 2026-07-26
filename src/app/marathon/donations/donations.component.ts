import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Donation } from '../../../model/donation';
import { MarathonService } from '../../../services/marathon.service';
import { DonationService } from '../../../services/donation.service';
import { Page } from '../../../model/page';
import { DonationStats } from '../../../model/donation-stats';
import { UserService } from '../../../services/user.service';
import { OengusCommonModule } from '../../oengus-common/oengus-common.module';
import { OengusMdComponent } from '../../components/oengus-md/oengus-md.component';
import { ElementTemporalDatetimeComponent } from '../../elements/temporal/element-temporal-datetime/element-temporal-datetime.component';

@Component({
    selector: 'app-donations',
    templateUrl: './donations.component.html',
    styleUrls: ['./donations.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        CommonModule,
        TranslateModule,
        OengusCommonModule,
        OengusMdComponent,
        ElementTemporalDatetimeComponent,
    ]
})
export class DonationsComponent {
  private route = inject(ActivatedRoute);
  marathonService = inject(MarathonService);
  private donationService = inject(DonationService);
  userService = inject(UserService);

  public donations: Page<Donation>;
  public stats: DonationStats;
  public pageSizeOptions = [10, 25, 50, 100];

  readonly title = 'Donations';

  constructor() {
    this.donations = this.route.snapshot.data.donations;
    this.stats = this.route.snapshot.data.stats;
    this.marathonService.marathon.donationsTotal = this.stats.total;
  }

  /*pageChange(event: NwbPageEvent) {
    this.donationService.find(this.marathonService.marathon.id, event.pageIndex, event.pageSize).subscribe(response => {
      this.donations = response;
    });
  }*/

  exportToCsv() {
    this.donationService.exportAllForMarathon(this.marathonService.marathon.id);
  }
}
