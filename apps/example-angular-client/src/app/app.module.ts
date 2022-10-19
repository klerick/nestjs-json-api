import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { JsonApiNestjsSdkModule } from 'json-api-nestjs-sdk';
import { BookList, Users, Roles, Comments, Addresses } from 'database/entity';

import { AppComponent } from './app.component';
import { NxWelcomeComponent } from './nx-welcome.component';

@NgModule({
  declarations: [AppComponent, NxWelcomeComponent],
  imports: [
    CommonModule,
    BrowserModule,
    JsonApiNestjsSdkModule.forRoot(
      {
        apiPrefix: '/api/v1',
        apiHost: window.location.origin,
      },
      { BookList, Users, Roles, Comments, Addresses }
    ),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
