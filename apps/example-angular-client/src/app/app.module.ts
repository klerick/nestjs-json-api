import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { JsonApiNestjsSdkModule } from 'json-api-nestjs-sdk';
import { Users, Roles, Comments, Addresses } from 'database/entity';

import { AppComponent } from './app.component';
import { NxWelcomeComponent } from './nx-welcome.component';
import { ChildModule } from './child/child.module';
import { Route, RouterModule } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'child',
    loadChildren: () =>
      import('./child/child.module').then((r) => r.ChildModule),
  },
];

@NgModule({
  declarations: [AppComponent, NxWelcomeComponent],
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    JsonApiNestjsSdkModule.forRoot(
      {
        apiPrefix: '/api/v1',
        apiHost: window.location.origin,
      },
      { Users, Roles, Comments, Addresses }
    ),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
