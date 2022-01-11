import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { paramCase } from 'param-case';

import { JSON_API_SDK_CONFIG, JsonApiSdkConfig } from '../token/json-api-sdk';


@Injectable()
export class JsonApiSdkService{
  public constructor(
    private http: HttpClient,
    @Inject(JSON_API_SDK_CONFIG) private jsonApiSdkConfig: JsonApiSdkConfig,
  ) {
  }

  public getUrlForResource(resource: string): string{

    const url: string[] = [
      paramCase(resource).toLocaleLowerCase()
    ];
    if (this.jsonApiSdkConfig.apiPrefix) {
      url.unshift(this.jsonApiSdkConfig.apiPrefix)
    }
    return new URL(
      url.join('/'),
      this.jsonApiSdkConfig.apiHost
    ).toString();
  }
}
