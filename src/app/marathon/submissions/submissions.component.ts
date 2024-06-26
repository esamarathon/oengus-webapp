import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { MarathonService } from '../../../services/marathon.service';
import { UserService } from '../../../services/user.service';
import { Submission } from '../../../model/submission';
import { GameService } from '../../../services/game.service';
import { SubmissionService } from '../../../services/submission.service';
import { CategoryService } from '../../../services/category.service';
import { Question } from 'src/model/question';
import { Answer } from '../../../model/answer';
import { BehaviorSubject, debounceTime, distinctUntilChanged, firstValueFrom, Observable, Subject, switchMap, tap } from 'rxjs';

interface SearchItem {
  term: string;
  status: string;
}

@Component({
  selector: 'app-submissions',
  templateUrl: './submissions.component.html',
  styleUrls: ['./submissions.component.scss']
})
export class SubmissionsComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', {static: true}) searchInput: ElementRef<HTMLInputElement>;

  loading = true;
  public canLoadMore = true;
  waitingOnNextPage = false;
  private lastPageLoaded = 0;

  public submissions$ = new BehaviorSubject<Submission[]>([]);
  filteredSubmissions$: Observable<Submission[]>;
  public selection: Map<number, Selection>;
  public questions: Map<number, Question>;
  // username -> answers
  public answers: Map<string, Answer[]>;

  public gameFilter = '';
  public statusFilter = '';

  public active = 'submissions';

  public faTimes = faTimes;
  public faSearch = faSearch;

  private searchTerm = new Subject<SearchItem>();

  private handlerBound = this.ctrlFHandler.bind(this);
  private observer = new IntersectionObserver(async (entries) => {
    if (entries[0] && entries[0].isIntersecting) {
      if (!this.gameFilter && !this.statusFilter) {
        await this.loadNextSubmissionPage();
      }
    }
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 1.0
  });

  constructor(private route: ActivatedRoute,
              public marathonService: MarathonService,
              public userService: UserService,
              public gameService: GameService,
              private submissionService: SubmissionService,
              private categoryService: CategoryService) {
    // this.submissions = this.route.snapshot.data.submissions;
    this.selection = this.route.snapshot.data.selection;
    this.answers = new Map<string, Answer[]>();
    this.questions = new Map<number, Question>();

    // Order of operations, questions go before answers.
    this.marathonService.marathon.questions.forEach((question) => {
      if (question.fieldType === 'FREETEXT') {
        return;
      }

      this.questions.set(question.id, question);
    });

    // TODO: lazy load answers!
    // map all the answers to the username
    const answers = this.route.snapshot.data.answers as Answer[];

    for (const answer of answers) {
      if (!this.answers.has(answer.username)) {
        this.answers.set(answer.username, []);
      }

      this.answers.get(answer.username).push(answer);
    }
  }

  ngOnInit() {
    this.loading = true;
    this.canLoadMore = true;
    this.lastPageLoaded = 0;
    window.addEventListener('keydown', this.handlerBound);

    this.filteredSubmissions$ = this.searchTerm.pipe(
      debounceTime(300),

      distinctUntilChanged((prev, curr) => prev.term === curr.term && prev.status === curr.status),

      tap(() => {
        this.loading = true;
      }),

      switchMap(({ term, status }: SearchItem) => {
        if (term || status) {
          return this.submissionService.searchSubmissions(
            this.marathonService.marathon.id, term, status ? status : null
          );
        }

        return this.submissions$;
      }),

      tap(() => {
        this.loading = false;
      })
    );

    // set-up lazy loading
    window.requestAnimationFrame(() => {
      this.observer.observe(document.getElementById('lazyLoadTrigger'));
      this.search('');
    });
  }

  // TODO: handler does not get removed
  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.handlerBound);
  }

  async loadNextSubmissionPage(): Promise<void> {
    if (!this.canLoadMore || this.waitingOnNextPage) {
      return;
    }

    this.waitingOnNextPage = true;
    this.loading = true;

    const nextPage = await firstValueFrom(this.submissionService.submissions(
      this.marathonService.marathon.id,
      ++this.lastPageLoaded
    ));

    this.canLoadMore = !nextPage.empty && !nextPage.last;

    if (!nextPage.empty) {
      const content = nextPage.content.filter(
        (submission) => submission.games.filter(
          (game) => game.categories.length > 0
        ).length > 0
      );

      this.submissions$.next(this.submissions$.getValue().concat(...content));
    }

    this.loading = false;
    this.waitingOnNextPage = false;
  }

  ctrlFHandler(event: KeyboardEvent): boolean {
    console.log('handling ctrl+f');
    if (event.ctrlKey && event.key === 'f' && this.active === 'submissions') {
      event.preventDefault();

      const el = this.searchInput.nativeElement;

      el.scrollIntoView();
      el.focus();

      return false;
    }

    return true;
  }

  get displaysTabs() {
    return this.marathonService.isAdmin(this.userService.user) &&
      !!this.marathonService.marathon.questions &&
      this.marathonService.marathon.questions.length > 0;
  }

  exportToCsv() {
    this.gameService.exportAllForMarathon(this.marathonService.marathon.id);
  }

  search(value: string): void {
    this.searchTerm.next({
      term: value,
      status: this.statusFilter,
    });
  }

  deleteSubmission(id: number) {
    this.submissionService.delete(this.marathonService.marathon.id, id).add(() => {
      this.submissions$.next(this.submissions$.getValue().filter(submission => submission.id !== id));
    });
  }

  deleteGame(id: number, doApi: boolean = true) {
    const delFromList = () => {
      this.submissions$.getValue().forEach((submission) => {
        submission.games = submission.games.filter(game => game.id !== id);
      });
    };

    if (doApi) {
      this.gameService.delete(this.marathonService.marathon.id, id).add(delFromList);
    } else {
      delFromList();
    }
  }

  deleteCategory(gameId: number, id: number) {
    this.categoryService.delete(this.marathonService.marathon.id, id).add(() => {
      this.submissions$.getValue().forEach((submission) => {
        const game = submission.games.find(g => g.id === gameId);
        game.categories = game.categories.filter(c => c.id !== id);
        if (game.categories.length === 0) {
          this.deleteGame(gameId, false);
        }
      });
    });
  }

  get title(): string {
    return 'Submissions';
  }

  get showDelete(): boolean {
    return !this.marathonService.marathon.selectionDone && this.userIsAdmin;
  }

  get userIsAdmin(): boolean {
    return this.marathonService.isAdmin(this.userService.user);
  }
}
