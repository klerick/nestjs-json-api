import AjvCall from 'ajv';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { plainToClass } from 'class-transformer';

import { ModuleOptions } from '../../types';
import { GLOBAL_MODULE_OPTIONS_TOKEN } from '../../constants';
import {
  inputQuerySchema,
  inputBodyPostSchema,
  transformQuerySchema,
  inputBodyPatchSchema,
  bodyRelationshipSchema,
  bodyRelationshipPatchSchema,
} from './utils';

export function AjvCallFactory(
  dataSource: DataSource,
  options: ModuleOptions
): AjvCall {
  const AjvCallInst = new AjvCall({ allErrors: true });

  for (const entity of options.entities) {
    const arrayProps: { [key: string]: boolean } = {};
    const relationArrayProps: { [key: string]: { [key: string]: boolean } } =
      {};
    const repository = dataSource.getRepository(entity);
    const relations = repository.metadata.relations.map((i) => {
      return i.propertyName;
    });
    const columns = repository.metadata.columns
      .filter((i) => !relations.includes(i.propertyName))
      .map((i) => {
        arrayProps[i.propertyName] = i.isArray;
        return i.propertyName;
      });
    const relationType = repository.metadata.relations.reduce((acum, i) => {
      i.inverseEntityMetadata.target;
      acum[i.propertyName] = i.inverseEntityMetadata.target;
      return acum;
    }, {});
    const fakeObject = columns.reduce<Record<string, string>>(
      (acum, item) => ((acum[item] = ''), acum),
      {}
    );
    const fieldsArray = Object.keys(
      plainToClass(repository.target as any, fakeObject)
    );

    const relationsField = repository.metadata.relations.reduce<
      Record<string, string[]>
    >((acum, item) => {
      const relations = item.inverseEntityMetadata.relations.map(
        (i) => i.propertyName
      );
      const columns = item.inverseEntityMetadata.columns
        .filter((i) => !relations.includes(i.propertyName))
        .map((i) => {
          relationArrayProps[item.propertyName] =
            relationArrayProps[item.propertyName] || {};
          relationArrayProps[item.propertyName][i.propertyName] = i.isArray;
          return i.propertyName;
        });
      const fakeObject = columns.reduce<Record<string, string>>(
        (acum, item) => ((acum[item] = ''), acum),
        {}
      );

      acum[item.propertyName] = Object.keys(
        plainToClass(item.inverseEntityMetadata.target as any, fakeObject)
      );
      return acum;
    }, {});
    const schemaName =
      entity instanceof Function ? entity.name : entity.options.name;
    AjvCallInst.addSchema(
      inputQuerySchema(
        entity,
        fieldsArray,
        relationsField,
        `inputQuerySchema-${schemaName}`
      ),
      `inputQuerySchema-${schemaName}`
    );
    AjvCallInst.addSchema(
      transformQuerySchema(
        entity,
        fieldsArray,
        relationsField,
        `transformQuerySchema-${schemaName}`,
        {
          arrayProps,
          relationArrayProps,
          relationType,
        }
      ),
      `transformQuerySchema-${schemaName}`
    );
    AjvCallInst.addSchema(
      inputBodyPostSchema(
        entity,
        fieldsArray,
        relationsField,
        `inputBodyPostSchema-${schemaName}`,
        {
          arrayProps,
          relationArrayProps,
          relationType,
        }
      ),
      `inputBodyPostSchema-${schemaName}`
    );
    AjvCallInst.addSchema(
      inputBodyPatchSchema(
        entity,
        fieldsArray,
        relationsField,
        `inputBodyPatchSchema-${schemaName}`,
        {
          arrayProps,
          relationArrayProps,
          relationType,
        }
      ),
      `inputBodyPatchSchema-${schemaName}`
    );
  }

  AjvCallInst.addSchema(bodyRelationshipSchema(), 'body-relationship-schema');

  AjvCallInst.addSchema(
    bodyRelationshipPatchSchema(),
    'body-relationship-patch-schema'
  );

  return AjvCallInst;
}

export const ajvFactory: FactoryProvider<AjvCall> = {
  provide: AjvCall,
  useFactory: AjvCallFactory,
  inject: [
    getDataSourceToken(),
    {
      token: GLOBAL_MODULE_OPTIONS_TOKEN,
      optional: false,
    },
  ],
};
