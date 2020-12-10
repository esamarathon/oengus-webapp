// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  sandbox: false,
  baseSite: 'http://localhost:8080',
  api: 'http://localhost:8080/api',
  twitchLoginClientId: 'lsaqyn1omrou7dq2l12m0l865xyjsh',
  // TODO: make these the same
  twitchSyncClientId: '5tb0get51hgu1bu8reszobgangbhrq',
  // these two get the service name appended to it (eg twitch, twitter, discord)
  loginRedirect: 'http://localhost:4200/login/',
  syncRedirect: 'http://localhost:4200/user/settings/sync/',
  discordClientId: '559625844197163008',
  matomoId: 1,
  paypalClientId: 'Ac7rzLgpb5emA9JuRxRXpRDVMdULzgA_BxwyhPlAxPHtg1NtDv3nyjLcWgHBOUEmtdWJ5npWnMN-b7_8'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
