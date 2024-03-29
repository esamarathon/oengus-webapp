import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarathonComponent } from './marathon.component';
import { HomeComponent } from './home/home.component';
import { NewMarathonComponent } from './new-marathon/new-marathon.component';
import { FormsModule } from '@angular/forms';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@busacca/ng-pick-datetime';
import { NwbCommonModule, NwbEditInPlaceModule, NwbPaginatorModule, NwbSwitchModule } from '@wizishop/ng-wizi-bulma';
import { DirectivesModule } from '../directives/directives.module';
import { CanActivateMarathonSettingsGuard } from '../guards/can-activate-marathon-settings-guard.service';
import { MarathonResolver } from '../resolvers/marathon-resolver';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SettingsComponent } from './settings/settings.component';
import { SubmitComponent } from './submit/submit.component';
import { SubmissionResolver } from '../resolvers/submission-resolver';
import { SubmissionsComponent } from './submissions/submissions.component';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { TranslateModule } from '@ngx-translate/core';
import { SelectionComponent } from './selection/selection.component';
import { SelectionResolver } from '../resolvers/selection-resolver';
import { CanActivateMarathonSubmitGuard } from '../guards/can-activate-marathon-submit-guard.service';
import { ScheduleManagementComponent } from './schedule-management/schedule-management.component';
import { ScheduleResolver } from '../resolvers/schedule-resolver';
import { OengusCommonModule } from '../oengus-common/oengus-common.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScheduleComponent } from './schedule/schedule.component';
import { AvailabilitiesResolver } from '../resolvers/availabilities-resolver';
import { IncentiveManagementComponent } from './incentive-management/incentive-management.component';
import { IncentivesResolver } from '../resolvers/incentives-resolver';
import { IncentiveComponent } from './incentive/incentive.component';
import { CanActivateMarathonIncentivesGuard } from '../guards/can-activate-marathon-incentives-guard.service';
import { DonateComponent } from './donate/donate.component';
import { CanActivateMarathonDonationsGuard } from '../guards/can-activate-marathon-donations-guard.service';
import { DonationsComponent } from './donations/donations.component';
import { DonationsResolver } from '../resolvers/donations-resolver';
import { DonationsStatsResolver } from '../resolvers/donations-stats-resolver';
import { CanActivateMarathonActiveGuard } from '../guards/can-activate-marathon-active-guard.service';
import { AdsenseComponent } from '../adsense/adsense.component';
import { OengusShirtTallComponent } from '../adsense/oengus/oengus-shirt-tall/oengus-shirt-tall.component';
import { OengusShirtWideComponent } from '../adsense/oengus/oengus-shirt-wide/oengus-shirt-wide.component';
import { SubmissionCategoryComponent } from './submissions/submission-category/submission-category.component';
import { SubmissionGameComponent } from './submissions/submission-game/submission-game.component';
import { ButtonsModule } from '../buttons/buttons.module';
import { AnswersResolver } from '../resolvers/answers-resolver';
import { GeneralSettingsComponent } from './settings/general-settings/general-settings.component';
import { SubmissionSettingsComponent } from './settings/submission-settings/submission-settings.component';
import { DiscordSettingsComponent } from './settings/discord-settings/discord-settings.component';
import { IncentiveSettingsComponent } from './settings/incentive-settings/incentive-settings.component';
import { MarathonScheduleExportComponent } from './schedule/marathon-schedule-export/marathon-schedule-export.component';
import { ElementModule } from '../elements/elements.module';
import { MarathonScheduleCurrentComponent } from './schedule/marathon-schedule-current/marathon-schedule-current.component';
import { MarathonScheduleListComponent } from './schedule/marathon-schedule-list/marathon-schedule-list.component';
import { MarathonScheduleRowComponent } from './schedule/marathon-schedule-row/marathon-schedule-row.component';
import { RunDetailsComponent } from './schedule/run-details/run-details.component';
import { MarathonHeaderComponent } from './layout/marathon-header/marathon-header.component';
import { SidebarTrackerComponent } from './layout/sidebar-tracker/sidebar-tracker.component';
import { SidebarAdminComponent } from './layout/sidebar-admin/sidebar-admin.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { SidebarModeratorsComponent } from './layout/sidebar-moderators/sidebar-moderators.component';
import { DetailsComponent } from './home/details/details.component';
import { DescriptionComponent } from './home/description/description.component';
import { ComponentsModule } from '../components/components.module';
import { RouterModule, Routes } from '@angular/router';
import { DeactivateRouteGuard } from '../guards/deactivate-route-guard.service';
import { LocalizeRouterModule } from '@gilsdav/ngx-translate-router';

const marathonRoutes: Routes = [
  {
    path: 'marathon/new',
    component: NewMarathonComponent
  },
  {
    path: 'marathon/:id',
    component: MarathonComponent,
    resolve: {
      marathon: MarathonResolver
    },
    children: [
      {
        path: '',
        component: HomeComponent,
        canActivate: [DeactivateRouteGuard]
      },
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [CanActivateMarathonSettingsGuard]
      },
      {
        path: 'submit',
        component: SubmitComponent,
        resolve: {
          submission: SubmissionResolver
        },
        canActivate: [CanActivateMarathonSubmitGuard, CanActivateMarathonActiveGuard]
      },
      {
        path: 'submissions',
        component: SubmissionsComponent,
        resolve: {
          answers: AnswersResolver,
          selection: SelectionResolver,
        }
      },
      {
        path: 'selection',
        component: SelectionComponent,
        resolve: {
          selection: SelectionResolver
        },
        data: {
          statuses: [],
          isAdminRoute: true,
        },
        canActivate: [CanActivateMarathonSettingsGuard, CanActivateMarathonActiveGuard]
      },
      {
        path: 'schedule',
        component: ScheduleComponent,
        resolve: {
          schedule: ScheduleResolver
        },
        canActivate: [DeactivateRouteGuard]
      },
      {
        path: 'schedule/manage',
        component: ScheduleManagementComponent,
        resolve: {
          selection: SelectionResolver,
          schedule: ScheduleResolver,
          availabilities: AvailabilitiesResolver
        },
        data: {
          statuses: ['VALIDATED', 'BONUS'],
          withCustomData: true,
          isAdminRoute: true,
        },
        canActivate: [CanActivateMarathonSettingsGuard, CanActivateMarathonActiveGuard]
      },
      {
        path: 'incentives',
        component: IncentiveComponent,
        resolve: {
          incentives: IncentivesResolver
        },
        data: {
          withLocked: true,
          withUnapproved: false
        },
        canActivate: [CanActivateMarathonIncentivesGuard]
      },
      {
        path: 'incentives/manage',
        component: IncentiveManagementComponent,
        resolve: {
          schedule: ScheduleResolver,
          incentives: IncentivesResolver
        },
        data: {
          withLocked: true,
          withUnapproved: true
        },
        canActivate: [CanActivateMarathonSettingsGuard, CanActivateMarathonIncentivesGuard, CanActivateMarathonActiveGuard]
      },
      {
        path: 'donate',
        component: DonateComponent,
        resolve: {
          incentives: IncentivesResolver
        },
        data: {
          withLocked: false,
          withUnapproved: false
        },
        canActivate: [CanActivateMarathonDonationsGuard, CanActivateMarathonActiveGuard]
      },
      {
        path: 'donations',
        component: DonationsComponent,
        resolve: {
          donations: DonationsResolver,
          stats: DonationsStatsResolver
        },
        canActivate: [CanActivateMarathonDonationsGuard]
      }
    ]
  }
];

@NgModule({
  declarations: [
    MarathonComponent,
    HomeComponent,
    NewMarathonComponent,
    SettingsComponent,
    SubmitComponent,
    SubmissionsComponent,
    SelectionComponent,
    ScheduleManagementComponent,
    ScheduleComponent,
    IncentiveManagementComponent,
    IncentiveComponent,
    DonateComponent,
    DonationsComponent,
    AdsenseComponent,
    OengusShirtTallComponent,
    OengusShirtWideComponent,
    SubmissionCategoryComponent,
    SubmissionGameComponent,
    GeneralSettingsComponent,
    SubmissionSettingsComponent,
    DiscordSettingsComponent,
    IncentiveSettingsComponent,
    MarathonScheduleExportComponent,
    MarathonScheduleCurrentComponent,
    MarathonScheduleListComponent,
    MarathonScheduleRowComponent,
    RunDetailsComponent,
    MarathonHeaderComponent,
    SidebarTrackerComponent,
    SidebarAdminComponent,
    SidebarComponent,
    SidebarModeratorsComponent,
    DetailsComponent,
    DescriptionComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    RouterModule.forChild(marathonRoutes),
    LocalizeRouterModule.forChild(marathonRoutes),
    FormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    NwbSwitchModule,
    DirectivesModule,
    FontAwesomeModule,
    NwbCommonModule,
    AutocompleteLibModule,
    OengusCommonModule,
    DragDropModule,
    NwbEditInPlaceModule,
    NwbPaginatorModule,
    ButtonsModule,
    ElementModule,
    ComponentsModule,
  ],
  exports: [
    //
  ],
  providers: [
    CanActivateMarathonSettingsGuard,
    CanActivateMarathonSubmitGuard,
    CanActivateMarathonIncentivesGuard,
    CanActivateMarathonDonationsGuard,
    CanActivateMarathonActiveGuard,
    MarathonResolver,
    SubmissionResolver,
    ScheduleResolver,
    SelectionResolver,
    IncentivesResolver,
    AvailabilitiesResolver,
    DonationsResolver,
    DonationsStatsResolver,
    AnswersResolver,
  ]
})
export class MarathonModule {
}
