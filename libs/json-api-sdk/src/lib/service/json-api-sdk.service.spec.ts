import { getTestBed, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { JsonApiSdkService } from './json-api-sdk.service';
import {JsonApiSdkConfig, JSON_API_SDK_CONFIG} from '../token/json-api-sdk';

const config: JsonApiSdkConfig = {
  apiHost: 'http://localhost:3000',
  apiPrefix: 'api'
}

describe('JsonApiSdkService', () => {
  let injector;
  let service: JsonApiSdkService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [JsonApiSdkService, {
        provide: JSON_API_SDK_CONFIG,
        useValue: config
      }]
    });
    injector = getTestBed();
    service = injector.get(JsonApiSdkService);
    httpMock = injector.get(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('Check getUrlForResource: resource is "CamelCase"', () => {
    const result = service.getUrlForResource('CamelCase');
    expect(result).toBe(`${config.apiHost}/${config.apiPrefix}/camel-case`)
  })

  it('Check getUrlForResource: resource is "Resource"', () => {
    const result = service.getUrlForResource('Resource');
    expect(result).toBe(`${config.apiHost}/${config.apiPrefix}/resource`)
  })
});
