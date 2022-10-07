import { Inject } from '@nestjs/common';

import { getProviderName } from '../../helper';
import { JSON_API_SERVICE_POSTFIX } from '../../constants';

export function InjectService(): PropertyDecorator {
  return (target, key) => {
    Inject(getProviderName(target.constructor, JSON_API_SERVICE_POSTFIX))(
      target,
      key
    );
  };
}
