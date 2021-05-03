import {Component, OnInit} from '@angular/core';
import {SubmissionService} from '../../../services/submission.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Submission} from '../../../model/submission';
import {MarathonService} from '../../../services/marathon.service';
import {faCheck, faClone, faPlus, faTimes} from '@fortawesome/free-solid-svg-icons';
import {Game} from '../../../model/game';
import {Category} from '../../../model/category';
import moment from 'moment-timezone';
import {Availability} from '../../../model/availability';
import {Answer} from '../../../model/answer';
import {environment} from '../../../environments/environment';
import {faTwitter} from '@fortawesome/free-brands-svg-icons';
import {CategoryService} from '../../../services/category.service';
import {NwbAlertConfig, NwbAlertService} from '@wizishop/ng-wizi-bulma';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '../../../services/user.service';
import {HttpClient} from '@angular/common/http';
import {Location} from '@angular/common';

@Component({
  selector: 'app-submit',
  templateUrl: './submit.component.html',
})
export class SubmitComponent implements OnInit {

  public submission: Submission;
  public faCheck = faCheck;
  public faTimes = faTimes;
  public faPlus = faPlus;
  public faTwitter = faTwitter;
  public faClone = faClone;
  public moment = moment;
  public timezone = moment.tz.guess();
  public loading = false;
  public localStorage = localStorage;
  public environment = environment;
  public possibleConsoles = Game.consoles;
  public deleteConfirm = false;

  public code: string;

  public isDiscordCheckLoading = false;
  private showDiscordRequirement = true;
  public discordErrors = {
    userNotInGuild: false,
    botNotInGuild: false,
  };

  constructor(public submissionService: SubmissionService,
              public marathonService: MarathonService,
              private categoryService: CategoryService,
              private translateService: TranslateService,
              private userService: UserService,
              private toastr: NwbAlertService,
              private route: ActivatedRoute,
              private http: HttpClient,
              private location: Location,
              private router: Router) {
    if (this.route.snapshot.data.submission && this.route.snapshot.data.submission !== {}) {
      this.initSubmission(this.route.snapshot.data.submission);
    } else {
      this.initSubmission(new Submission());
    }
  }

  initSubmission(submission: Submission) {
    delete this.submission;
    this.submission = {...submission};
    this.submission.games.forEach(game => {
      game.categories.forEach(category => {
        const duration = moment.duration(category.estimate);
        const hours = Math.floor(duration.asHours()).toString().padStart(2, '0');
        const minutes = duration.minutes().toString().padStart(2, '0');
        const seconds = duration.seconds().toString().padStart(2, '0');
        category.estimateHuman = '' + hours + ':' + minutes + ':' + seconds;
      });
    });
    if (this.marathonService.marathon.questions.length > 0) {
      if (!this.submission.answers || this.submission.answers.length === 0) {
        this.submission.answers = [];
        this.marathonService.marathon.questions.forEach(question => {
          if (question.questionType === 'SUBMISSION') {
            const answer = new Answer();
            answer.question = question;
            if (question.fieldType === 'CHECKBOX') {
              answer.answer = false;
            }
            this.submission.answers.push(answer);
          }
        });
      } else {
        this.marathonService.marathon.questions.forEach(question => {
          if (question.questionType === 'SUBMISSION') {
            let found = false;
            this.submission.answers.forEach(existingAnswer => {
              if (existingAnswer.question.id === question.id) {
                found = true;
              }
            });
            if (!found) {
              const answer = new Answer();
              answer.question = question;
              if (question.fieldType === 'CHECKBOX') {
                answer.answer = false;
              }
              this.submission.answers.push(answer);
            }
          }
        });
        this.submission.answers.forEach(answer => {
          if (answer.question.fieldType === 'CHECKBOX') {
            answer.answer = Boolean(answer.answer);
          }
        });
      }
    }
    if (!this.submission.opponentDtos || this.submission.opponentDtos.length === 0) {
      this.submission.opponentDtos = [];
    }
  }

  ngOnInit() {

  }

  goBack() {
    this.location.back();
  }

  addGame() {
    const game = new Game();
    game.categories.push(new Category());
    this.submission.games.push(game);
  }

  addCategory(index: number) {
    this.submission.games[index].categories.push(new Category());
  }

  addAvailability() {
    this.submission.availabilities.push(new Availability());
  }

  duplicateAvailabilityToNextDay(index: number) {
    const endDate = this.marathonService.marathon.endDate;
    const availability = {...this.submission.availabilities[index]};
    const fromMoment = moment.tz(availability.from, this.timezone);
    const toMoment = moment.tz(availability.to, this.timezone);
    const duration = moment.duration(toMoment.diff(fromMoment));
    let tmpFrom = moment.tz(availability.to, this.timezone);

    // only add one day if we're not in midnight on the to day
    if (!(toMoment.hour() >= 0 && toMoment.hour() <= 5)) {
      tmpFrom = tmpFrom.add(1, 'days');
    }

    availability.from = tmpFrom.hour(fromMoment.hour())
      .minute(fromMoment.minute())
      .toDate();

    availability.to = moment.tz(availability.from, this.timezone).add(duration).toDate();

    if (moment.tz(availability.to, this.timezone).isAfter(moment.tz(endDate, this.timezone))) {
      availability.to = moment.tz(endDate, this.timezone).toDate();
    }

    this.submission.availabilities.push(availability);
  }

  removeGame(index: number) {
    this.submission.games.splice(index, 1);
  }

  removeCategory(gameIndex: number, categoryIndex: number) {
    this.submission.games[gameIndex].categories.splice(categoryIndex, 1);
  }

  removeAvailability(index: number) {
    this.submission.availabilities.splice(index, 1);
  }

  submit() {
    // ignore double clicks
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.submission.games.forEach(game => {
      game.categories.forEach(category => {
        category.estimate = moment.duration(category.estimateHuman).toISOString();
      });
    });
    if (!this.submission.id) {
      this.submissionService.create(this.marathonService.marathon.id, this.submission).add(() => {
        this.refresh();
        this.loading = false;
        this.marathonService.marathon.hasSubmitted = true;
      });
    } else {
      this.submissionService.update(this.marathonService.marathon.id, this.submission).add(() => {
        this.refresh();
        this.loading = false;
        this.marathonService.marathon.hasSubmitted = true;
      });
    }
  }

  refresh() {
    this.submissionService.mine(this.marathonService.marathon.id).subscribe(response => {
      this.initSubmission(response);
    });
  }

  getGames() {
    return this.submission.games.map(game => game.name).join(',');
  }

  getMultiplayerSubmission() {
    this.categoryService.getFromCode(this.marathonService.marathon.id, this.code).subscribe(response => {
      this.submission.opponentDtos.push(response);
    }, error => {
      this.translateService.get('alert.submit.' + error.error.message).subscribe((res: string) => {
        const alertConfig: NwbAlertConfig = {
          message: res,
          duration: 3000,
          position: 'is-right',
          color: 'is-warning'
        };
        this.toastr.open(alertConfig);
      });
    });
  }

  removeMultiplayer(index: number) {
    this.submission.opponentDtos.splice(index, 1);
  }

  deleteSubmission(marathonId: string, submissionId: number) {
    this.submissionService.delete(marathonId, submissionId, () => this.router.navigate(['/marathon', this.marathonService.marathon.id]));
  }

  checkUserInDiscord() {
    if (!this.userHasDiscord) {
      return;
    }

    this.discordErrors.botNotInGuild = false;
    this.discordErrors.userNotInGuild = false;
    this.isDiscordCheckLoading = true;

    const marathonId = this.marathonService.marathon.id;
    const discordUserId = this.userService.user.discordId;

    this.http.get<string>(
      `${environment.api}/marathon/${marathonId}/discord/in-guild/${discordUserId}`
    )
      .subscribe(
        () => {
          this.showDiscordRequirement = false;

          this.translateService.get('alert.submit.DISCORD_VERIFIED').subscribe((res: string) => {
            const alertConfig: NwbAlertConfig = {
              message: res,
              duration: 3000,
              position: 'is-right',
              color: 'is-success'
            };
            this.toastr.open(alertConfig);
          });
        },
        error => {
          console.log(error);

          if (error.status === 404) { // user not in guild
            this.discordErrors.userNotInGuild = true;
          } else if (error.status === 403) { // bot not in guild
            this.discordErrors.botNotInGuild = true;
          }
        }
      )
      .add(() => this.isDiscordCheckLoading = false);
  }

  get discordRequired(): boolean {
    const marathon = this.marathonService.marathon;

    return !marathon.discordPrivacy && marathon.discordRequired && !marathon.hasSubmitted && this.showDiscordRequirement;
  }

  get userHasDiscord(): boolean {
    const user = this.userService.user;

    return user && Boolean(user.discordId);
  }

  get marathonDiscord(): string {
    return `https://discord.gg/${this.marathonService.marathon.discord}`;
  }

  get title(): string {
    return 'Submit';
  }
}
