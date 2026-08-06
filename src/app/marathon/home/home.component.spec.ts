import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HomeComponent } from './home.component';
import { TranslateTestingModule, makeMarathon } from '../../../testing';
import { MarathonService } from '../../../services/marathon.service';
import { UserService } from '../../../services/user.service';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let marathonServiceStub: Record<string, any>;

  beforeEach(async () => {
    marathonServiceStub = {
      marathon: makeMarathon(),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent, TranslateTestingModule],
      providers: [
        { provide: MarathonService, useValue: marathonServiceStub },
        { provide: UserService, useValue: { user: null } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(HomeComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });
  it('marathon getter returns marathon from service', () => {
    const marathon = makeMarathon({ id: 'test-home' });
    marathonServiceStub.marathon = marathon;

    expect(component.marathon).toBe(marathon);
  });
});
