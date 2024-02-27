import { Inject } from '@nestjs/common';

import { TYPEORM_SERVICE } from '../../constants';

export function InjectService(): PropertyDecorator & ParameterDecorator {
  return Inject(TYPEORM_SERVICE);
}
