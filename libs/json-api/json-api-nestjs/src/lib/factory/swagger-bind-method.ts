import { ValueProvider } from '@nestjs/common';
import { SwaggerMethod, swaggerMethod } from '../helper/swagger/method';
import { SWAGGER_METHOD } from '../constants';

export const SwaggerBindMethod: ValueProvider<SwaggerMethod> = {
  provide: SWAGGER_METHOD,
  useValue: swaggerMethod,
};
