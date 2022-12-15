import { NgModule } from '@angular/core';
import { ChildComponent } from './child.component';
import { JsonApiNestjsSdkModule } from 'json-api-nestjs-sdk';
import { BookList } from 'database/entity';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: ChildComponent,
      },
    ]),
    JsonApiNestjsSdkModule.forChild({ BookList }),
  ],
  declarations: [ChildComponent],
  exports: [ChildComponent],
})
export class ChildModule {}
