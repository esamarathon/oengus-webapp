import { Component, ElementRef, inject, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendarTimes, faCalendarWeek, faFilm } from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { SelectionService } from '../../../services/selection.service';
import { MarathonService } from '../../../services/marathon.service';
import { DurationService } from '../../../services/duration.service';
import { Selection } from '../../../model/selection';
import { Availability } from '../../../model/availability';
import { DataSetDataGroup, DataSetDataItem, Timeline } from 'vis-timeline/esnext';
import { DataSet } from 'vis-data';
import { SubmissionService } from '../../../services/submission.service';
import { Submission } from '../../../model/submission';
import { firstValueFrom } from 'rxjs';
import { UserComponent } from '../../oengus-common/user/user.component';
import { LoadingIndicatorComponent } from '../../elements/loading-indicator/loading-indicator.component';
import { TemporalServiceService } from '../../../services/termporal/temporal-service.service';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    FontAwesomeModule,
    UserComponent,
    LoadingIndicatorComponent,
  ],
})
export class SelectionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private selectionService = inject(SelectionService);
  private submissionService = inject(SubmissionService);
  private marathonService = inject(MarathonService);
  private temporalService = inject(TemporalServiceService);

  public submissionsLoaded = false;
  public submissions: Submission[] = [];
  public selection: Record<string, Selection>;
  public loading = false;

  public faFilm = faFilm;
  public faCalendarWeek = faCalendarWeek;
  public faCalendarTimes = faCalendarTimes;

  // @ts-expect-error meh.
  @ViewChild('timeline', { static: false }) timeline: ElementRef;
  public availabilitiesGroups: DataSetDataGroup;
  public availabilitiesItems: DataSetDataItem;

  public availabilitiesSelected: string[] = [];

  readonly title = 'Select Runs';

  constructor() {
    this.availabilitiesGroups = new DataSet([]);
    this.availabilitiesItems = new DataSet([]);
    this.selection = this.route.snapshot.data.selection;
    this.loadSubmissions();
  }

  async loadSubmissions(): Promise<void> {
    this.submissionsLoaded = false;
    this.submissions = await this.submissionService.loadAllSubmissions(this.marathonService.marathon.id, (submissions) => {
      submissions.forEach(submission => {
        submission.games.forEach(game => {
          game.categories.forEach(category => {
            category.estimateHuman = DurationService.toHuman(category.estimate);
            if (!Object.keys(this.selection).includes(category.id.toString())) {
              const selection = new Selection();
              selection.status = 'TODO';
              selection.categoryId = category.id;
              this.selection[category.id] = selection;
            }
          });
        });
      });

      return submissions;
    });
    this.submissionsLoaded = true;
  }

  async loadSelection(): Promise<void> {
    // @ts-expect-error SHUT UP
    this.selection = await firstValueFrom(this.selectionService.getAllForMarathonAdmin(
      this.route.snapshot.parent?.paramMap.get('id') ?? '',
      this.route.snapshot.data['statuses']),
    )
      .catch(() => new Map());
  }

  async ngOnInit() {
    // Somehow this delay solves the availabilities not showing.
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    const oneHour = Temporal.Duration.from({ hours: 1 });
    const timelineEl = document.getElementById('timeline');

    if (!timelineEl) {
      throw new Error('missing timeline');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const timeline = new Timeline(timelineEl,
      this.availabilitiesItems,
      this.availabilitiesGroups,
      {
        min: this.temporalService.parseDate(this.marathonService.marathon.startDate as unknown as string)
          .subtract(oneHour).epochMilliseconds,
        max: this.temporalService.parseDate(this.marathonService.marathon.endDate as unknown as string)
          .add(oneHour).epochMilliseconds,
      });
  }

  getSelectColor(value: string) {
    switch (value) {
      case 'TODO':
        return 'is-warning';
      case 'REJECTED':
        return 'is-danger';
      case 'BONUS':
        return 'is-info';
      case 'BACKUP':
        return 'is-primary';
      case 'VALIDATED':
        return 'is-success';
    }
  }

  submit() {
    this.loading = true;
    this.selectionService.save(this.marathonService.marathon.id, Object.values(this.selection)).add(() => {
      // Reload the selections so we have their ids to update.
      this.loadSelection().then(() => {
        this.loading = false;
      });
    });
  }

  getNumberOfRuns() {
    return Object.keys(this.selection).length;
  }

  getNumberOfRunners() {
    const runners: number[] = [];
    this.submissions.forEach(submission => {
      if (!runners.includes(submission.user.id)) {
        runners.push(submission.user.id);
      }
    });
    return runners.length;
  }

  getTotalTime() {
    let duration = Temporal.Duration.from({ seconds: 0 });
    this.submissions.forEach(submission => {
      submission.games.forEach(game => {
        game.categories.forEach(category => {
          duration = duration.add(category.estimate);
        });
      });
    });

    return DurationService.toHuman(duration);
  }

  getAverageTime() {
    const numberOfRuns = this.getNumberOfRuns();
    if (numberOfRuns === 0) {
      return '0:00:00';
    }

    let duration = Temporal.Duration.from({ seconds: 0 });
    this.submissions.forEach(submission => {
      submission.games.forEach(game => {
        game.categories.forEach(category => {
          duration = duration.add(category.estimate);
        });
      });
    });

    const avgMs = Math.ceil(duration.total('milliseconds') / numberOfRuns);
    const averageDuration = Temporal.Duration.from({ milliseconds: avgMs }).round({
      largestUnit: 'hours',
      smallestUnit: 'seconds',
    });

    return DurationService.toHuman(averageDuration);
  }

  getMarathonLength() {
    const start = this.temporalService.parseDate(this.marathonService.marathon.startDate as unknown as string).round('minutes');
    const end = this.temporalService.parseDate(this.marathonService.marathon.endDate as unknown as string).round('minutes');

    const diff = start.until(end);

    return DurationService.toHuman(diff);
  }

  getDefaultSetupTime() {
    return DurationService.toHuman(this.marathonService.marathon.defaultSetupTime);
  }

  getValidatedRunsTime() {
    let duration = Temporal.Duration.from({ seconds: 0 });
    this.submissions.forEach(submission => {
      submission.games.forEach(game => {
        game.categories.forEach(category => {
          if (this.selection[category.id].status === 'VALIDATED') {
            duration = duration.add(category.estimate)
              .add(this.marathonService.marathon.defaultSetupTime);
          }
        });
      });
    });

    if (duration.total('milliseconds') > 0) {
      duration = duration.subtract(this.marathonService.marathon.defaultSetupTime);
    }

    return DurationService.toHuman(duration);
  }

  setTodoToDeclined(): void {
    for (const catId in this.selection) {
      if (this.selection[catId].status === 'TODO') {
        this.selection[catId].status = 'REJECTED';
      }
    }
  }

  canPublish() {
    return !Object.values(this.selection).find((value: Selection) => value.status === 'TODO');
  }

  publish() {
    const conf = confirm('HOLD UP!!\nYou are about to PUBLISH this selection. Are you 200% sure?');

    if (!conf) {
      return;
    }

    this.loading = true;
    this.selectionService.save(this.marathonService.marathon.id, Object.values(this.selection)).add(() => {
      this.marathonService.publishSelection(this.marathonService.marathon).add(() => {
        this.loading = false;
      });
    });
  }

  getAvailabilitiesForRunner(userId: number) {
    this.submissionService.availabilitiesForUser(this.marathonService.marathon.id, userId).subscribe(response => {
      for (const [key, value] of Object.entries(response)) {
        const availabilityArray = value as Availability[];
        this.availabilitiesSelected.push(key);
        this.availabilitiesGroups.add({
          id: key,
          content: availabilityArray[0].username,
        });
        availabilityArray.forEach((availability, index) => {
          this.availabilitiesItems.add({
            id: key + index,
            group: key,
            start: availability.from.epochMilliseconds,
            end: availability.to.epochMilliseconds,
            content: '',
          });
        });
      }
    });
  }

  removeAvailabilitiesForRunner(username: string) {
    this.availabilitiesGroups.remove(username);
    this.availabilitiesItems.remove(this.availabilitiesItems.getIds({ filter: (item) => item.group === username }));
    this.availabilitiesSelected.splice(this.availabilitiesSelected.findIndex(name => name === username), 1);
  }

  clearAvailabilities() {
    this.availabilitiesSelected.forEach(username => {
      this.availabilitiesGroups.remove(username);
      this.availabilitiesItems.remove(this.availabilitiesItems.getIds({ filter: (item) => item.group === username }));
    });
    this.availabilitiesSelected = [];
  }

  get marathonId() {
    return this.marathonService.marathon.id.toLowerCase();
  }
}
