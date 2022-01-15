import Vue from 'vue';
import { ActionTree, MutationTree } from 'vuex';
import { OengusAPI } from '~/plugins/oengus';
import { FrontPageMarathons, FullMarathon, Marathon, MarathonState } from '~/types/api/marathon';

const MarathonOengusAPI = new OengusAPI<MarathonState>('marathons');

export const state = (): MarathonState => ({
  marathons: { },
  calendars: { },
  frontPage: undefined,
});

export const mutations: MutationTree<MarathonState> = {
  addMarathon(state, { id, value: marathon }): void {
    Vue.set(state.marathons, id, marathon);
  },
  addFrontPage(state, { value: frontPage }): void {
    Vue.set(state, 'frontPage', frontPage);
  },
  addCalendar(state, { value: calendar, data }): void {
    Vue.set(state.calendars, `${data.start}-${data.end}`, calendar);
  },
};

export const actions: ActionTree<MarathonState, MarathonState> = {
  get: MarathonOengusAPI.get<FullMarathon>({ key: 'marathons', mutation: 'addMarathon' }),
  frontPage: MarathonOengusAPI.get<FrontPageMarathons>({ key: 'frontPage' }),
  calendar: MarathonOengusAPI.get<Array<Marathon>, { calendar: Array<Marathon> }>({
    path: 'forDates',
    key: 'calendars',
    mutation: 'addCalendar',
    transform: ({ value: calendar }) => ({ calendar }),
  }),
};