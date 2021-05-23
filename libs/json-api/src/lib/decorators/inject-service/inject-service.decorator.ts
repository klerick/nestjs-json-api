import { Inject } from '@nestjs/common';

import { getServiceToken } from '../../helpers';


export function InjectService(): PropertyDecorator {
  return (target, key) => {
    Inject(getServiceToken(target.constructor))(target, key);
  };
}
