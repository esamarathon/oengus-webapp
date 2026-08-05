import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

class FakeLoader implements TranslateLoader {
  getTranslation() {
    return of({});
  }
}

export const TranslateTestingModule = TranslateModule.forRoot({
  loader: { provide: TranslateLoader, useClass: FakeLoader },
});
