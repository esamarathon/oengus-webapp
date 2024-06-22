import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ScheduleService } from '../../services/schedule.service';
import { Schedule, V2Schedule } from '../../model/schedule';
import { RunType, ScheduleLine, V2ScheduleLine } from '../../model/schedule-line';

/**
 * @deprecated api has changed!
 */
@Injectable()
export class ScheduleResolver  {

  constructor(private scheduleService: ScheduleService) {
  }

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<V2Schedule> {
    const withCustomData = route.data['withCustomData'] || false;
    const adminRoute = route.data['isAdminRoute'] || false;

    const oldSchedule = await firstValueFrom(
      this.scheduleService.getAllForMarathon(route.parent.paramMap.get('id'), withCustomData, adminRoute)
    ).catch(() => {
      return new Schedule();
    });

    return this.mapToV2Schedule(oldSchedule);
  }

  private mapToV2Schedule(schedule: Schedule): V2Schedule {
    return {
      id: schedule.id,
      name: schedule.name || 'MissingNo',
      slug: schedule.slug || 'MissingNo',
      marathonId: schedule?.marathon?.id || '',
      published: true,
      lines: schedule.lines.map((line) => this.mapToV2ScheduleLine(line))
    };
  }

  private mapToV2ScheduleLine(line: ScheduleLine): V2ScheduleLine {
    return {
      id: line.id,
      game: line.gameName,
      console: line.console,
      emulated: line.emulated,
      ratio: line.ratio,
      type: line.type as RunType,
      runners: line.runners.map((runner) => ({
        // @ts-ignore
        runnerName: runner.displayName,
        // @ts-ignore
        profile: (runner.id > -1) ? {
          // @ts-ignore
          id: runner.id,
          // @ts-ignore
          username: runner.username,
          // @ts-ignore
          displayName: runner.displayName
        } : null,
      })),
      category: line.categoryName,
      estimate: line.estimate,
      setupTime: line.setupTime,
      position: line.position,
      customRun: line.customRun,
      setupBlock: line.setupBlock,
      setupBlockText: line.setupBlockText,
      customData: line.customData,
      date: line.date,
      categoryId: line.categoryId,
    };
  }
}
