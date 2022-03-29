import {Component, OnInit, ViewChild} from '@angular/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { MarathonService } from '../../services/marathon.service';
import { Router } from '@angular/router';
import {CalendarOptions, EventClickArg} from '@fullcalendar/core'; // useful for typechecking
import {DatesSetArg, FullCalendarComponent} from '@fullcalendar/angular';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  @ViewChild('calendar', {static: true}) calendarComponent: FullCalendarComponent;

  public events = [];
  public calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin],
    locale: localStorage.getItem('language'),
    events: this.events,
    eventClick: this.goToEvent.bind(this),
    datesSet: this.fetchMarathons.bind(this),
  };

  constructor(private marathonService: MarathonService,
              private router: Router) {
  }

  ngOnInit() {
    //
  }

  fetchMarathons(info: DatesSetArg) {
    console.log(info);
    // Cannot set visible range somehow
    /*const dateRange = localStorage.getItem('calendar-range');

    if (dateRange) {
      console.log(dateRange);

      const { activeStart, activeEnd } = JSON.parse(dateRange);
      localStorage.removeItem('calendar-range');

      // @ts-ignore
      this.calendarComponent.calendar.setOption('visibleRange', {
        start: new Date(activeStart),
        end: new Date(activeEnd)
      });
    }*/

    this.marathonService.findForMonth(info.view.activeStart, info.view.activeEnd).subscribe(response => {
      this.events = [];
      response.forEach(marathon => {
        this.events.push({
          id: marathon.id,
          title: marathon.name,
          start: marathon.startDate,
          end: marathon.endDate
        });
      });
    });
  }

  goToEvent(eventClickInfo: EventClickArg) {
    /*// @ts-ignore
    const { activeStart, activeEnd } = this.calendarComponent.calendar.view;
    const json = JSON.stringify({ activeStart, activeEnd });

    localStorage.setItem('calendar-range', json);*/

    this.router.navigate(['/marathon', eventClickInfo.event.id]);
  }

  get title(): string {
    return 'Calendar';
  }
}
