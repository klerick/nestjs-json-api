import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {JsonApiSdkModule} from 'json-api-nestjs-sdk';

import { AppComponent } from './app.component';
import { NxWelcomeComponent } from './nx-welcome.component';


@NgModule({
  declarations: [AppComponent, NxWelcomeComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
