import { DataSource } from 'typeorm';

import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';

import AjvCall from 'ajv';

import { AjvCallFactory } from './ajv.factory';
import { GLOBAL_MODULE_OPTIONS_TOKEN } from '../../constants';
import { ModuleOptions, QueryParams } from '../../types';
import { mockDBTestModule, entities, Users } from '../../mock-utils';

describe('AJV factory', () => {
  let options: ModuleOptions;
  let ajvCall: AjvCall;
  let dataSource: DataSource;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule()],
      providers: [
        {
          provide: GLOBAL_MODULE_OPTIONS_TOKEN,
          useValue: {
            entities: entities,
          } as ModuleOptions,
        },
      ],
    }).compile();

    dataSource = module.get<DataSource>(getDataSourceToken());
    options = module.get<ModuleOptions>(GLOBAL_MODULE_OPTIONS_TOKEN);
    ajvCall = AjvCallFactory(dataSource, options);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should be call', () => {
    expect(ajvCall).toBeInstanceOf(AjvCall);
  });

  it('Should be have schema for input', () => {
    const inputQuerySchema = ajvCall.getSchema<Users>(
      `inputQuerySchema-${Users.name}`
    );
    const repository = dataSource.getRepository<Users>(Users);
    const relationField = repository.metadata.relations.reduce((acum, item) => {
      const relations = item.inverseEntityMetadata.relations.map(
        (i) => i.propertyName
      );
      acum.push(
        ...item.inverseEntityMetadata.columns
          .filter((i) => !relations.includes(i.propertyName))
          .map((i) => `${item.propertyName}.${i.propertyName}`)
      );
      return acum;
    }, []);

    expect(inputQuerySchema.schema).toHaveProperty(
      'properties.fields.properties.target'
    );
    expect(inputQuerySchema.schema).toHaveProperty(
      `properties.fields.properties.${repository.metadata.relations[0].propertyName}`
    );
    for (const { propertyName } of repository.metadata.columns) {
      if (propertyName === 'lastName') {
        expect(inputQuerySchema.schema).not.toHaveProperty(
          `properties.filter.properties.${propertyName}`
        );
      } else {
        expect(inputQuerySchema.schema).toHaveProperty(
          `properties.filter.properties.${propertyName}`
        );
      }
    }

    for (const propertyName of relationField) {
      if (propertyName === 'manager.lastName') {
        expect(
          inputQuerySchema.schema['properties'].filter.properties
        ).not.toHaveProperty([propertyName]);
      } else {
        expect(
          inputQuerySchema.schema['properties'].filter.properties
        ).toHaveProperty([propertyName]);
      }
    }
  });

  it('Should be have schema for transform', () => {
    const transformQuerySchema = ajvCall.getSchema<QueryParams<Users>>(
      `transformQuerySchema-${Users.name}`
    );
    const repository = dataSource.getRepository<Users>(Users);
    const relationField = repository.metadata.relations.reduce((acum, item) => {
      const relations = item.inverseEntityMetadata.relations.map(
        (i) => i.propertyName
      );
      acum.push(
        ...item.inverseEntityMetadata.columns
          .filter((i) => !relations.includes(i.propertyName))
          .map((i) => `${item.propertyName}.${i.propertyName}`)
      );
      return acum;
    }, []);

    const relationProps = repository.metadata.relations.map((item) => {
      return item.propertyName;
    });
    const propsColumns = repository.metadata.columns
      .filter((i) => {
        return !relationProps.includes(i.propertyName);
      })
      .map((i) => i.propertyName);
    const targetProps = [];

    for (const propertyName of propsColumns) {
      if (propertyName === 'lastName') {
        expect(transformQuerySchema.schema).not.toHaveProperty(
          `$defs.sortDefs.properties.target.properties.${propertyName}`
        );

        expect(transformQuerySchema.schema).not.toHaveProperty(
          `$defs.filterTarget.properties.${propertyName}`
        );
      } else {
        targetProps.push(propertyName);
        expect(transformQuerySchema.schema).toHaveProperty(
          `$defs.sortDefs.properties.target.properties.${propertyName}`
        );
        expect(transformQuerySchema.schema).toHaveProperty(
          `$defs.filterTarget.properties.${propertyName}`
        );
      }
    }
    const relationObject = {};
    for (const propertyName of relationField) {
      const [relation, field] = propertyName.split('.');
      if (propertyName === 'manager.lastName') {
        expect(transformQuerySchema.schema).not.toHaveProperty(
          `$defs.sortDefs.properties.${relation}.properties.${field}`
        );
      } else {
        relationObject[relation] = relationObject[relation] || [];
        relationObject[relation].push(field);
        expect(transformQuerySchema.schema).toHaveProperty(
          `$defs.sortDefs.properties.${relation}.properties.${field}`
        );
        expect(transformQuerySchema.schema).toHaveProperty(
          `$defs.fieldsDefs.properties.${relation}`
        );
      }
    }

    for (const propertyName in relationObject) {
      expect(relationObject[propertyName]).toEqual(
        transformQuerySchema.schema['$defs'].fieldsDefs.properties[propertyName]
          .items.enum
      );
    }

    expect(relationProps).toEqual(
      transformQuerySchema.schema['$defs'].includeDefs.items.enum
    );
    expect(targetProps).toEqual(
      transformQuerySchema.schema['$defs'].fieldsDefs.properties.target.items
        .enum
    );
  });

  it('Should be have schema for input body', () => {
    const transformQuerySchema = ajvCall.getSchema<QueryParams<Users>>(
      `inputBodyPostSchema-${Users.name}`
    );

    const repository = dataSource.getRepository<Users>(Users);

    const relationField = repository.metadata.relations.map((item) => {
      return item.propertyName;
    });

    const propsColumns = repository.metadata.columns
      .filter((i) => {
        return (
          !relationField.includes(i.propertyName) && i.propertyName !== 'id'
        );
      })
      .map((i) => i.propertyName)
      .filter((i) => i !== 'lastName');
    expect(transformQuerySchema.schema).toHaveProperty('properties');
    expect(transformQuerySchema.schema).toHaveProperty('required');
    expect(transformQuerySchema.schema['required']).toEqual(['data']);

    expect(transformQuerySchema.schema['properties']).toHaveProperty('data');
    expect(transformQuerySchema.schema['properties']['data']).toHaveProperty(
      'required'
    );
    expect(
      transformQuerySchema.schema['properties']['data']['required']
    ).toEqual(['type', 'attributes']);

    const dataProperty =
      transformQuerySchema.schema['properties']['data']['properties'];

    expect(
      dataProperty['relationships']['properties']['comments']['properties'][
        'data'
      ]['type']
    ).toBe('array');
    expect(
      dataProperty['relationships']['properties']['comments']['properties'][
        'data'
      ]['items']
    ).toEqual({
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Use string should be as number string',
          pattern: '^\\d+$',
        },
        type: {
          type: 'string',
          enum: ['comments'],
        },
      },
      required: ['type', 'id'],
    });

    expect(Object.keys(dataProperty['relationships']['properties'])).toEqual(
      relationField
    );
    expect(dataProperty).toHaveProperty('attributes');
    expect(Object.keys(dataProperty['attributes']['properties'])).toEqual(
      propsColumns
    );
  });
});
