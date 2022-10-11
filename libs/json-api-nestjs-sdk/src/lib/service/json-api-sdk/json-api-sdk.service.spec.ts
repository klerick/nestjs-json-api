import { getTestBed, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { JsonApiSdkService } from './json-api-sdk.service';
import { JsonApiUtilsService } from '../json-api-utils/json-api-utils.service';

import {
  JsonApiSdkConfig,
  JSON_API_SDK_CONFIG,
  ALL_ENTITIES,
} from '../../token/json-api-sdk';

const config: JsonApiSdkConfig = {
  apiHost: 'http://localhost:3000',
  apiPrefix: 'api',
};

class Roles {
  id!: string;
  name!: string;
}

class Comments {
  id!: string;
  text!: string;
}

class Users {
  id!: string;
  name!: string;
  items!: string[];
  role!: Roles[];
  comments!: Comments;
}

describe('JsonApiSdkService', () => {
  let injector;
  let service: JsonApiSdkService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        JsonApiUtilsService,
        {
          provide: JSON_API_SDK_CONFIG,
          useValue: config,
        },
        {
          provide: ALL_ENTITIES,
          useValue: {
            User: Users,
          },
        },
      ],
    });
    service = TestBed.inject(JsonApiSdkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
