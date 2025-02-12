import { Inject } from '@nestjs/common';

import { ORM_SERVICE } from '../../../../constants';

export function InjectService(): PropertyDecorator & ParameterDecorator {
  return Inject(ORM_SERVICE);
}
