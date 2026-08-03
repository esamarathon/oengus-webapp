import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ActivatedRoute } from '@angular/router';
import { ScheduleInfo } from '../../../../model/schedule';
import { environment } from '../../../../environments/environment';
import { ScheduleService } from '../../../../services/schedule.service';
import { firstValueFrom } from 'rxjs';
import { LineRunner, V2ScheduleLine } from '../../../../model/schedule-line';
import { SubmissionService } from '../../../../services/submission.service';
import { SelectionService } from '../../../../services/selection.service';
import { MarathonService } from '../../../../services/marathon.service';
import { DataSetDataGroup, DataSetDataItem, IdType, Timeline } from 'vis-timeline/esnext';
import { DataSet } from 'vis-data';
import { Availability, AvailabilityResponse } from '../../../../model/availability';
import { ScheduleTableComponent } from './schedule-table/schedule-table.component';
import { ScheduleTableOldElementComponent } from './schedule-table-old-element/schedule-table-old-element.component';
import { WarningModalComponent } from '../warning-modal/warning-modal.component';
import { SubmissionsTableComponent } from './submissions-table/submissions-table.component';
import { ClonePopupComponent } from './clone-popup/clone-popup.component';
import {
  MarathonScheduleExportComponent,
} from '../../schedule/marathon-schedule-export/marathon-schedule-export.component';
import { ElementI18nComponent } from '../../../elements/element-i18n/element-i18n.component';
import { DirectivesModule } from '../../../directives/directives.module';
import { LoadingIndicatorComponent } from '../../../elements/loading-indicator/loading-indicator.component';
import { TemporalServiceService } from '../../../../services/termporal/temporal-service.service';
import { NotificationService } from '../../../../services/notification.service';
import { NwbSwitchComponent } from '../../../components/wizi/switch/switch.component';

// Options are 'id' and 'content'
const AVAILABILITY_SORT_KEY = 'id';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    FontAwesomeModule,
    ScheduleTableOldElementComponent,
    WarningModalComponent,
    SubmissionsTableComponent,
    ClonePopupComponent,
    MarathonScheduleExportComponent,
    ElementI18nComponent,
    DirectivesModule,
    LoadingIndicatorComponent,
    NwbSwitchComponent,
  ],
})
export class EditComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private scheduleService = inject(ScheduleService);
  private submissionService = inject(SubmissionService);
  private selectionService = inject(SelectionService);
  private marathonService = inject(MarathonService);
  private toastr = inject(NotificationService);
  private temporalService = inject(TemporalServiceService);

  // @ts-expect-error meh.
  @ViewChild('scheduleTableComponent') scheduleTable: ScheduleTableComponent | ScheduleTableOldElementComponent;

  scheduleInfo: ScheduleInfo;
  marathonId = '';
  oldSlug = '';
  todoLines: V2ScheduleLine[] = [];
  lines: V2ScheduleLine[] = [];

  loading = true;
  warningModalActive = false;

  env = environment;

  submissionsLoaded = false;
  showAllCustomData = false;

  // @ts-expect-error meh.
  private timeline: Timeline;
  // @ts-expect-error meh.
  private timebar: IdType;
  public availabilitiesGroups: DataSetDataGroup;
  public availabilitiesItems: DataSetDataItem;
  public availabilitiesSelected: IdType[] = [];
  private availabilitiesSelectedItems: IdType[] = [];
  public allAvailabilities: AvailabilityResponse = {};

  private _hideCompleteUsers = true;

  get hideCompleteUsers() {
    return this._hideCompleteUsers;
  }

  set hideCompleteUsers(val: boolean) {
    localStorage.setItem('hideCompleteUsers', val ? 'true' : 'false');
    this._hideCompleteUsers = val;
  }

  constructor() {
    const localItem = localStorage.getItem('hideCompleteUsers');

    if (localItem === null) {
      this.hideCompleteUsers = true;
    }

    this._hideCompleteUsers = localStorage.getItem('hideCompleteUsers') === 'true';

    this.availabilitiesGroups = new DataSet([], {queue: {delay: 1000}});
    this.availabilitiesItems = new DataSet([], {queue: {delay: 1000}});
    this.marathonId = this.route.snapshot.parent?.paramMap.get('id') as string;
    this.scheduleInfo = this.route.snapshot.data.scheduleInfo;
    this.oldSlug = this.scheduleInfo.slug;
  }

  async ngOnInit() {
    const timelinePromise = new Promise<void>((resolve) => {
      this.loadAllAvailabilities().then(() => {
        this.initTimeline().then(() => {
          resolve();
        });
      });
    });

    const {data} = await firstValueFrom(this.scheduleService.getLines(this.marathonId, this.scheduleInfo.id));

    this.lines = data;
    await this.loadAllSubmissions();
    this.computeSchedule();
    await timelinePromise;
    this.loading = false;
  }

  ngOnDestroy(): void {
    this.timeline.destroy();
  }

  async initTimeline() {
    // Somehow this delay solves the availabilities not showing.
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    const oneHour = Temporal.Duration.from({hours: 1});

    console.log(this.marathonService.marathon.startDate);

    const timelineEl = document.getElementById('timeline');

    if (!timelineEl) {
      return;
    }

    this.timeline = new Timeline(timelineEl,
      this.availabilitiesItems,
      this.availabilitiesGroups,
      {
        min: this.marathonService.marathon.startDate.subtract(oneHour).epochMilliseconds,
        max: this.marathonService.marathon.endDate.add(oneHour).epochMilliseconds,
        orientation: {
          axis: 'both',
          item: 'bottom',
        },
      });
    this.timebar = this.timeline.addCustomTime(this.marathonService.marathon.startDate.epochMilliseconds);
    this.computeSchedule();
  }

  async loadAllSubmissions(): Promise<void> {
    this.submissionsLoaded = false;

    const selections = await firstValueFrom(
      this.selectionService.getAllForMarathonAdmin(this.marathonId, ['VALIDATED', 'BONUS']),
    ).catch(() => new Map());

    // TODO: implement pagination on search endpoint so we can just pass our desired statuses to it
    const filteredSubmissions = await this.submissionService.loadAllSubmissions(
      this.marathonId,
      (page) => page.filter(submission =>
        submission.games.filter(game => game.categories
          .filter(category =>
            Object.keys(selections).includes(category.id.toString()))
          .length > 0).length > 0,
      ),
    );

    const setupTime = this.marathonService.marathon.defaultSetupTime ?? 'PT15M';

    filteredSubmissions.forEach((submission) => {
      submission.games.forEach(game => {
        game.categories
          .filter(category => Object.keys(selections).includes(category.id.toString()))
          // TODO: find a better way of doing this, category ID works but I hate to store it.
          .filter(category => !this.lines.map(line => line.categoryId).includes(category.id))
          .forEach((category) => {
            const runners: LineRunner[] = [{profile: submission.user}];

            category.opponents.forEach((opponent) => {
              runners.push({profile: opponent.user});
            });

            this.todoLines.push({
              id: -1,
              game: game.name,
              console: game.console,
              emulated: game.emulated,
              ratio: game.ratio,
              type: runners.length > 1 ? category.type : 'SINGLE',
              runners,
              category: category.name,
              estimate: category.estimate,
              setupTime: setupTime,
              position: -1,
              customRun: false,
              setupBlock: false,
              setupBlockText: '',
              customData: '',
              date: this.temporalService.now,
              categoryId: category.id,
            });
          });
      });
    });

    if (this.hideCompleteUsers) {
      this.hideAllUsersNotInTodo();
    }

    this.submissionsLoaded = true;
  }

  async submit(): Promise<void> {
    if (this.loading) {
      return;
    }

    this.scheduleInfo.slug = this.scheduleInfo.slug.toLowerCase();

    try {
      this.loading = true;
      this.scheduleInfo = await firstValueFrom(
        this.scheduleService.updateSchedule(this.marathonId, this.scheduleInfo.id, this.scheduleInfo),
      );

      const {data: newLines} = await firstValueFrom(
        this.scheduleService.updateLines(
          this.marathonId, this.scheduleInfo.id, this.lines,
        ),
      );

      this.lines = newLines;

      this.toastr.toast('alert.schedule.save.success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.log(e);
      alert(`Something broke: ${e.message}`);
    } finally {
      this.loading = false;
    }
  }

  handlePublishCallback(didConfirm: boolean): void {
    this.warningModalActive = false;

    if (didConfirm) {
      this.publish();
    }
  }

  async publish(): Promise<void> {
    this.loading = true;

    this.scheduleService.publish(this.marathonId, this.scheduleInfo.id).subscribe({
      next: () => {
        // Reload the window to see the new changes?
        // window.location.reload();
        this.scheduleInfo.published = true;
        this.toastr.toast('marathon.schedule.management.action.published', 5000);

        this.loading = false;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (err: any) => {
        console.log(err);
        this.toastr.toastRaw(`Something went wrong: ${err.message}`, 5000, 'warning');
      },
    });
  }

  async loadAllAvailabilities() {
    const allAvailabilities = await firstValueFrom(
      this.submissionService.availabilities(this.marathonId),
    );

    this.allAvailabilities = allAvailabilities;

    const entries = Object.entries<Availability[]>(allAvailabilities)
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [username, availabilities] of entries) {
      const contentName = availabilities.length ? availabilities[0].username : username;

      this.availabilitiesGroups.add({
        id: username.toLowerCase(),
        content: contentName,
      });

      availabilities.forEach((availability, index) => {
        this.availabilitiesItems.add({
          id: username + index,
          group: username.toLowerCase(),
          start: availability.from.epochMilliseconds,
          end: availability.to.epochMilliseconds,
          content: '',
        });
      });
    }

    this.availabilitiesGroups.flush?.();
    this.availabilitiesItems.flush?.();

    // Sort availabilities alphabetically.
    const sortedData = this.availabilitiesGroups.get({order: AVAILABILITY_SORT_KEY});

    this.availabilitiesGroups.clear();
    this.availabilitiesGroups.add(sortedData);
    this.availabilitiesGroups.flush?.();
  }

  async loadAvailabilitiesForRunner(userId: number) {
    // TODO: do not load if we have a user in the array already.

    try {
      const availabilities = await firstValueFrom(
        this.submissionService.availabilitiesForUser(this.marathonId, userId),
      );

      this.allAvailabilities = {
        ...this.allAvailabilities,
        ...availabilities,
      };

      for (const [key, value] of Object.entries(availabilities)) {

        // in case of adding a runner that did not submit.
        // TODO: add to empty array either way?
        if (!value.length) {
          continue;
        }

        // data already exists, just ignore
        if (this.availabilitiesGroups.get(key)) {
          continue;
        }

        this.availabilitiesGroups.add({
          id: key.toLowerCase(),
          content: value[0].username,
        });

        value.forEach((availability, index) => {
          this.availabilitiesItems.add({
            id: key + index,
            group: key.toLowerCase(),
            start: availability.from.epochMilliseconds,
            end: availability.to.epochMilliseconds,
            content: '',
          });
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e);
    }
  }

  clearSelectedAvailabilities() {
    const toRemove = this.availabilitiesItems.getIds({
      filter: (item) => this.availabilitiesSelected.includes(item.group),
    });
    this.availabilitiesSelected = [];
    this.availabilitiesSelectedItems = this.availabilitiesSelectedItems.filter(el => !toRemove.includes(el));
    this.timeline.setSelection(this.availabilitiesSelectedItems);
  }

  triggerSelectedAvailability(inp: { username: string, on: boolean }) {
    if (inp.on) {
      this.selectAvailabilities(inp.username);
    } else {
      this.unselectAvailabilities(inp.username);
    }
  }

  selectAvailabilities(username: string) {
    this.availabilitiesSelected.push(username);
    this.availabilitiesSelectedItems = [
      ...new Set([
        ...this.availabilitiesSelectedItems,
        ...this.availabilitiesItems.getIds({
          filter: (item) => item.group === username,
        }),
      ]),
    ];
    this.timeline.setSelection(this.availabilitiesSelectedItems);
  }

  unselectAvailabilities(username: string) {
    this.availabilitiesSelected.splice(this.availabilitiesSelected.findIndex(name => name === username), 1);
    const toRemove = this.availabilitiesItems.getIds({
      filter: (item) => item.group === username,
    });
    this.availabilitiesSelectedItems = this.availabilitiesSelectedItems.filter(el => !toRemove.includes(el));
    this.timeline.setSelection(this.availabilitiesSelectedItems);
  }

  addCustomLine(isSetup: boolean): void {
    const customLine: V2ScheduleLine = {
      category: '',
      categoryId: 0,
      console: '',
      customData: '',
      customRun: true,
      // @ts-expect-error meh.
      date: undefined,
      emulated: false,
      estimate: 'PT0S',
      game: '',
      id: -1,
      position: this.lines.length,
      ratio: '',
      runners: [],
      setupBlock: isSetup,
      setupBlockText: '',
      setupTime: this.marathonService.marathon.defaultSetupTime,
      type: 'OTHER',
    };

    this.lines.push(customLine);

    this.scheduleTable.toggleExpand(this.lines.length - 1, true);

    this.computeSchedule();
  }

  computeSchedule(): void {
    if (!this.lines.length) {
      return;
    }

    this.lines[0].date = this.marathonService.marathon.startDate;
    this.lines[0].position = 0;

    for (let i = 1; i < this.lines.length; i++) {
      const prevEl = this.lines[i - 1];

      this.lines[i].date = prevEl.date
          .add(Temporal.Duration.from(prevEl.estimate))
          .add(Temporal.Duration.from(prevEl.setupTime));
      this.lines[i].position = i;
    }
    const lastElement = this.lines[this.lines.length - 1];

    if (this.timeline) {
      this.timeline.setCustomTime(
        lastElement.date
          .add(Temporal.Duration.from(lastElement.estimate))
          .add(Temporal.Duration.from(lastElement.setupTime))
          .epochMilliseconds,
        this.timebar,
      );
    }

    // Reassign the array reference (keeping the same line objects) so child
    // tables notice the change and recompute derived state (e.g. availability).
    this.lines = [...this.lines];
  }

  moveToSchedule(index: number): void {
    const run = this.todoLines[index];

    this.lines.push(run);
    this.todoLines.splice(index, 1);
    this.computeSchedule();

    const usernames = run.runners
      .map((runner) => runner.profile ? runner.profile.username : null)
      .filter((runner) => runner) as string[];

    this.removeFromTimelineWhenNoMoreRunsTodo(usernames);
  }

  removeScheduleLine(index: number) {
    const run = this.lines[index];

    if (run) {
      this.lines.splice(index, 1);
      // Reassign so child tables notice the removal and recompute derived state.
      this.lines = [...this.lines];
    }
  }

  moveToTodo(index: number) {
    const run = this.lines[index];

    this.todoLines.push(run);
    this.lines.splice(index, 1);
    this.computeSchedule();

    const usernames = run.runners
      .map((runner) => runner.profile ? runner.profile.username : null)
      .filter((runner) => runner) as string[];

    this.addToTimelineWhenRunsInTodo(usernames);
  }

  toggleCollapseAllRows(open: boolean): void {
    this.scheduleTable.toggleCollapseAll(open);
  }

  private removeFromTimelineWhenNoMoreRunsTodo(usernames: string[]) {
    if (!this.hideCompleteUsers) {
      return;
    }

    // We can just remove the group, that will hide the user from the timeline.
    const usernamesInTodo = this.getUsernamesInTodo();
    const filteredUsernames = usernames.filter((username) => !usernamesInTodo.includes(username));

    if (filteredUsernames.length) {
      this.availabilitiesGroups.remove(filteredUsernames);
    }

    this.availabilitiesGroups.flush?.();
  }

  private addToTimelineWhenRunsInTodo(usernames: string[]) {
    // We're not checking if the feature is on here.
    // The user might enable it mid schedule config, and we should always add the user to the groups.

    // We can just remove the group, that will hide the user from the timeline.
    const usernamesInTodo = this.getUsernamesInTodo();
    const filteredUsernames = usernames
      .filter((username) => usernamesInTodo.includes(username))
      .filter((username) => !this.availabilitiesGroups.get(username));

    if (filteredUsernames.length) {
      this.availabilitiesGroups.add(
        filteredUsernames.map((username) => {
          const av = this.allAvailabilities[username];

          const contentUsername = av.length ? av[0].username : username;

          return {
            id: username.toLowerCase(),
            content: contentUsername,
          };
        }),
      );
    }

    this.availabilitiesGroups.flush?.();

    const sortedData = this.availabilitiesGroups.get({order: AVAILABILITY_SORT_KEY});

    this.availabilitiesGroups.clear();
    this.availabilitiesGroups.add(sortedData);
    this.availabilitiesGroups.flush?.();
  }

  private getUsernamesInTodo(): string[] {
    return [
      ...new Set(
        this.todoLines.map(
          (run) => run.runners
            .map((runner) => runner.profile ? runner.profile.username : null)
            .filter((runner) => runner) as string[],
        )
          .flat(),
      ),
    ];
  }

  private hideAllUsersNotInTodo() {
    this.lines.forEach((run) => {
      const usernames = run.runners
        .map((runner) => runner.profile ? runner.profile.username : null)
        .filter((runner) => runner) as string[];

      this.removeFromTimelineWhenNoMoreRunsTodo(usernames);
    });
  }
}
