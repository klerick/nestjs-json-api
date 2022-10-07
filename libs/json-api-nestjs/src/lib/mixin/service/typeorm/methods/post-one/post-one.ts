import { DeepPartial } from 'typeorm';

import { TypeormMixinService } from '../../typeorm.mixin';
import { ServiceOptions } from '../../../../../types';
import { ResourceObject } from '../../../../../types-common';
import { ResourceRequestObject } from '../../../../../types-common/request';

export async function postOne<T>(
  this: TypeormMixinService<T>,
  options: ServiceOptions<T>
): Promise<ResourceObject<T>> {
  const startTime = Date.now();
  const body = options.body as ResourceRequestObject<T>['data'];
  const target = this.repository.manager.create(
    this.repository.target,
    body.attributes as DeepPartial<T>
  );
  const prepareParams = Date.now() - startTime;
  if (body.relationships) {
    for await (const relationships of this.UtilsMethode.asyncIterateFindRelationships(
      body.relationships,
      this.repository
    )) {
      target[relationships.propsName] = relationships.rel;
    }
  }
  const callQuery = Date.now() - startTime;

  return this.repository.save<T>(target).then((r) => {
    const resultTransform = this.transform.transformData(r, []);
    const transform = Date.now() - startTime;
    const debug = {
      prepareParams,
      callQuery: callQuery - prepareParams,
      transform: transform - callQuery,
    };

    return {
      meta: {
        ...(this.config.debug ? { debug } : {}),
      },
      data: resultTransform,
    };
  });
}
