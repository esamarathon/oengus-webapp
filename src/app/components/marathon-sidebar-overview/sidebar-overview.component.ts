import { Component, HostBinding, Input } from '@angular/core';
import { Marathon } from '../../../model/marathon';
import { faBook, faCalendar, faCircle, faHome, faHomeLg, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-marathon-sidebar-overview',
  templateUrl: './sidebar-overview.component.html',
  styleUrls: ['./sidebar-overview.component.scss']
})
export class SidebarOverviewComponent {
  @Input() marathon: Marathon;
  @Input() isBigHome = false;
  @HostBinding('class.collapsed') @Input() collapsed = false;

  iconCircle = faCircle;
  iconPaperPlane = faPaperPlane;
  iconCalendar = faCalendar;
  iconBook = faBook;

  get iconHome() {
    return this.isBigHome ? faHomeLg : faHome;
  }

  get marathonId() {
    return this.marathon.id;
  }

}
