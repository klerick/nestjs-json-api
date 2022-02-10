import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import {JsonApiSdkModule, JsonApiSdkService} from 'json-api-nestjs-sdk';

import {Comments, Users, Roles, Addresses} from 'database/entity'

import { AppComponent } from './app.component';


export class Test extends JsonApiSdkService{

  someMethode(){

    this.getList<Addresses>(Addresses).subscribe(console.log)
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    JsonApiSdkModule.forRoot({
      apiHost: 'http://localhost:3000',
      apiPrefix: 'api'
    }, {
      Comments, Users, Roles, Addresses
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
