import {TypeormMixinService} from '../../typeorm.mixin';
import {ServiceOptions} from '../../../../../types';
import {ResourceObject} from '../../../../../types-common';
import {snakeToCamel} from '../../../../../helper';
import {BadRequestException, NotFoundException} from '@nestjs/common';

export async function getOne<T>(
  this: TypeormMixinService<T>,
  options: ServiceOptions<T>,
): Promise<ResourceObject<T>>{
  const startTime = Date.now();
  const {route: {id: id}, query: {include: include, fields: fields}} = options;
  const preparedResourceName = snakeToCamel(this.repository.metadata.name);

  if (this.config.requiredSelectField && fields === null) {
    throw new BadRequestException([{
      source: {parameter: '/fields'},
      detail: 'Fields params in query is required'
    }])
  }

  const fieldsSelect = new Set<string>();
  const builder = this.repository.createQueryBuilder(preparedResourceName);
  for (const item of (include || [])) {
    builder.leftJoin(`${preparedResourceName}.${item}`, item);
    fieldsSelect.add(item);
  }
  fieldsSelect.add(preparedResourceName);

  if (fields) {
    fieldsSelect.clear();
    for (const rel of (include || [])) {
      const propsName = this.repository.metadata.relations
        .find(relations => relations.propertyName === rel)
        .entityMetadata.primaryColumns[0].propertyName;
      fieldsSelect.add(`${rel}.${propsName}`);
    }

    const {target, ...other} = fields;
    const targetArray = ([...target, this.repository.metadata.primaryColumns[0].propertyName] || []);
    for (const fieldTarget of targetArray) {
      fieldsSelect.add(`${preparedResourceName}.${fieldTarget}`)
    }

    Object.keys(other || {}).forEach(relation => {
      (other[relation] || [])
        .forEach(i => {
          fieldsSelect.add(`${relation}.${i}`)
        })
    });

  }
  const prepareParams = Date.now() - startTime
  const result = await builder
    .select([...fieldsSelect])
    .where({ id })
    .getRawOne();
  
  if (!result) {
    throw new NotFoundException({
      detail: `Resource '${preparedResourceName}' with id '${id}' does not exist`
    });
  }
  const callQuery = Date.now() - startTime;
  const itemResult = this.transform.transformRawData([result]);
  const data = this.transform.transformData(itemResult[0], include);
  const included = this.transform.transformInclude(itemResult);

  const transform = Date.now() - startTime;
  const debug = {
    prepareParams,
    callQuery: callQuery - prepareParams,
    transform: transform - callQuery
  };
  return {
    ...(this.config.debug ? {meta: {debug}} : {}),
    data,
    included
  }
}
