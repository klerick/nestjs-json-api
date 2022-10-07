import { TypeormMixinService } from '../../typeorm.mixin';
import { ServiceOptions } from '../../../../../types';
import { Meta, Relationship } from '../../../../../types-common';
import { snakeToCamel } from '../../../../../helper';
import { Equal } from 'typeorm';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { NotFoundException } from '@nestjs/common';
import { FindOptionsSelect } from 'typeorm/find-options/FindOptionsSelect';

export async function getRelationship<T>(
  this: TypeormMixinService<T>,
  options: ServiceOptions<T>
): Promise<
  {
    meta?: Partial<Meta>;
  } & Relationship<T>
> {
  const startTime = Date.now();
  const preparedResourceName = snakeToCamel(this.repository.metadata.name);
  const { relName, id } = options.route;
  const prepareParams = Date.now() - startTime;
  const whereCondition = {
    id: Equal(id),
  } as unknown as FindOptionsWhere<T>;

  const findOptionsRelations = {
    [relName]: true,
  } as FindOptionsRelations<T>;

  const primaryColumns =
    this.repository.metadata.primaryColumns[0].propertyName;
  const relPrimaryColumns = this.repository.metadata.relations.filter(
    (i) => i.propertyName === relName
  )[0].inverseEntityMetadata.primaryColumns[0].propertyName;

  const findOptionsSelect = {
    [primaryColumns]: true,
    [relName]: {
      [relPrimaryColumns]: true,
    },
  } as FindOptionsSelect<T>;

  const callQuery = Date.now() - startTime;

  const result = await this.repository.findOne({
    select: findOptionsSelect,
    where: whereCondition,
    relations: findOptionsRelations,
  });
  if (!result) {
    throw new NotFoundException({
      detail: `Resource '${preparedResourceName}' with id '${id}' does not exist`,
    });
  }

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
    data: this.transform.transformData(result, [relName])['relationships'][
      relName
    ]['data'],
  };
}
