import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { QueryField } from '../../../../utils/nestjs-shared';
import { Equal, Repository } from 'typeorm';
import { IMemoryDb } from 'pg-mem';

import {
  Addresses,
  Comments,
  entities,
  getRepository,
  mockDBTestModule,
  Notes,
  providerEntities,
  pullAllData,
  Roles,
  UserGroups,
  Users,
} from '../../../../mock-utils/typeorm';
import {
  CurrentDataSourceProvider,
  CurrentEntityManager,
  CurrentEntityRepository,
  EntityPropsMap,
  OrmServiceFactory,
} from '../../factory';
import {
  CONTROL_OPTIONS_TOKEN,
  DEFAULT_CONNECTION_NAME,
  ORM_SERVICE,
  DEFAULT_QUERY_PAGE,
  DEFAULT_PAGE_SIZE,
  CURRENT_ENTITY,
} from '../../../../constants';
import { ObjectLiteral as Entity } from '../../../../types';

import { Query } from '../../../mixin/zod';

import { TypeOrmService, TypeormUtilsService } from '../../service';
import { createAndPullSchemaBase } from '../../../../mock-utils';
import { JsonApiTransformerService } from '../../../mixin/service/json-api-transformer.service';

function getDefaultQuery<R extends Entity>() {
  const filter = {
    relation: null,
    target: null,
  };
  const defaultQuery: Query<R> = {
    [QueryField.filter]: filter,
    [QueryField.fields]: null,
    [QueryField.include]: null,
    [QueryField.sort]: null,
    [QueryField.page]: {
      size: DEFAULT_PAGE_SIZE,
      number: DEFAULT_QUERY_PAGE,
    },
  };

  return defaultQuery;
}

describe('getAll', () => {
  let db: IMemoryDb;
  let typeormService: TypeOrmService<Users>;
  let transformDataService: JsonApiTransformerService<Users>;

  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;

  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [
        ...providerEntities(getDataSourceToken()),
        CurrentDataSourceProvider(DEFAULT_CONNECTION_NAME),
        {
          provide: CONTROL_OPTIONS_TOKEN,
          useValue: {
            requiredSelectField: false,
            debug: false,
          },
        },
        {
          provide: CURRENT_ENTITY,
          useValue: Users,
        },
        EntityPropsMap(entities as any),
        CurrentEntityManager(),
        CurrentEntityRepository(Users),
        TypeormUtilsService,
        JsonApiTransformerService,
        OrmServiceFactory(),
      ],
    }).compile();
    ({
      userRepository,
      addressesRepository,
      notesRepository,
      commentsRepository,
      rolesRepository,
      userGroupRepository,
    } = getRepository(module));
    await pullAllData(
      userRepository,
      addressesRepository,
      notesRepository,
      commentsRepository,
      rolesRepository,
      userGroupRepository
    );
    typeormService = module.get<TypeOrmService<Users>>(ORM_SERVICE);
    transformDataService = module.get<JsonApiTransformerService<Users>>(
      JsonApiTransformerService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('order', async () => {
    const spyOnTransformData = jest.spyOn(
      transformDataService,
      'transformData'
    );

    const checkData = await userRepository.find({
      relations: {
        addresses: true,
        comments: true,
      },
      order: {
        id: 'DESC',
        comments: {
          id: 'DESC',
        },
      },
    });

    const query = getDefaultQuery<Users>();
    query.include = ['addresses', 'comments'];
    query.sort = {
      target: {
        id: 'DESC',
      },
      comments: {
        id: 'DESC',
      },
    };
    await typeormService.getAll(query);
    expect(spyOnTransformData).toBeCalledWith(checkData, query);
  });

  it('include', async () => {
    const spyOnTransformData = jest.spyOn(
      transformDataService,
      'transformData'
    );

    const checkData = await userRepository.findOne({
      where: {
        id: 1,
      },
      relations: {
        addresses: true,
        comments: true,
      },
    });

    const query = getDefaultQuery<Users>();
    query.include = ['addresses', 'comments'];
    query.filter.target = {
      id: {
        eq: `${checkData?.id}`,
      },
    };
    await typeormService.getAll(query);
    expect(spyOnTransformData).toBeCalledWith([checkData], query);
  });

  it('select', async () => {
    const spyOnTransformData = jest.spyOn(
      transformDataService,
      'transformData'
    );

    const checkData = await userRepository.findOne({
      select: {
        id: true,
        isActive: true,
        addresses: {
          state: true,
          id: true,
        },
        comments: {
          text: true,
          id: true,
        },
      },
      where: {
        id: 1,
      },
      relations: {
        addresses: true,
        comments: true,
      },
    });

    const query = getDefaultQuery<Users>();
    query.fields = {
      target: ['id', 'isActive'],
      addresses: ['state'],
      comments: ['text'],
    };
    query.include = ['addresses', 'comments'];
    query.filter.target = {
      id: {
        eq: `${checkData?.id}`,
      },
    };
    await typeormService.getAll(query);
    expect(spyOnTransformData).toBeCalledWith([checkData], query);
  });

  describe('filter', () => {
    let firstRole: Roles;
    let secondRole: Roles;
    let addresses: Addresses[];
    let comments: Comments[];
    beforeAll(async () => {
      firstRole = (await rolesRepository.findOneBy({
        id: 1,
      })) as Roles;
      secondRole = (await rolesRepository.findOneBy({
        id: 2,
      })) as Roles;

      addresses = await addressesRepository.find();
      comments = await commentsRepository.find();
    });

    it('Target props with null', async () => {
      const spyOnTransformData = jest.spyOn(
        transformDataService,
        'transformData'
      );

      const query = getDefaultQuery<Users>();
      query.filter.target = {
        id: { eq: '1' },
        firstName: { eq: null },
      };
      await typeormService.getAll(query);
      expect(spyOnTransformData).toHaveBeenCalledTimes(0);
    });

    it('Target props', async () => {
      const spyOnTransformData = jest.spyOn(
        transformDataService,
        'transformData'
      );
      const checkData = await userRepository.findOne({
        where: {
          id: 1,
        },
      });
      const query = getDefaultQuery<Users>();
      query.filter.target = {
        id: { eq: `${checkData?.id}` },
      };
      await typeormService.getAll(query);
      expect(spyOnTransformData).toBeCalledWith([checkData], query);
    });

    it('Check relation with the same Entity', async () => {
      const spyOnTransformData = jest.spyOn(
        transformDataService,
        'transformData'
      );
      const checkData = await userRepository.findOne({
        where: {
          id: 1,
          comments: {
            text: Equal(comments[0].text),
          },
        },
        relations: {
          comments: true,
        },
      });
      const query = getDefaultQuery<Users>();
      query.filter.relation = {
        comments: {
          text: {
            eq: comments[0].text,
          },
        },
      };
      await typeormService.getAll(query);
      expect(spyOnTransformData).toBeCalledWith([checkData], query);
    });

    // it('Target relation is null', async () => {
    //   const query = getDefaultQuery<Users>();
    //   query.filter.target = {
    //     comments: {
    //       eq: 'null',
    //     },
    //   };
    //   await typeormService.getAll(query);
    // });

    it('Relation many-to-one', async () => {
      const spyOnTransformData = jest.spyOn(
        transformDataService,
        'transformData'
      );
      const checkData = await userRepository.findOne({
        where: {
          id: 1,
        },
        relations: {
          manager: true,
        },
      });

      const query = getDefaultQuery<Users>();
      query.filter.target = {
        id: {
          eq: '1',
        },
      };
      query.filter.relation = {
        manager: {
          id: {
            eq: '2',
          },
        },
      };
      query.include = ['manager'];
      await typeormService.getAll(query);
      expect(spyOnTransformData).toBeCalledWith([checkData], query);
    });

    it('Relation one-to-many', async () => {
      const spyOnTransformData = jest.spyOn(
        transformDataService,
        'transformData'
      );
      const checkData = await userRepository.findOne({
        where: {
          id: 1,
          addresses: {
            state: Equal(addresses[0].state),
          },
        },
        relations: {
          addresses: true,
        },
      });
      const query = getDefaultQuery<Users>();
      query.filter.relation = {
        addresses: {
          state: {
            eq: addresses[0].state,
          },
        },
      };
      await typeormService.getAll(query);
      expect(spyOnTransformData).toBeCalledWith([checkData], query);
    });

    it('Relation many-to-many', async () => {
      const spyOnTransformData = jest.spyOn(
        transformDataService,
        'transformData'
      );
      const checkData = await userRepository.find({
        where: {
          id: 1,
          roles: {
            name: Equal(firstRole.name),
          },
        },
        relations: {
          roles: true,
        },
      });

      const query = getDefaultQuery<Users>();
      query.include = ['roles'];
      query.filter.relation = {
        roles: {
          name: {
            eq: firstRole.name,
          },
        },
      };
      const { data } = await typeormService.getAll(query);
      expect(spyOnTransformData).not.toHaveBeenCalled();
      expect(data).toEqual([]);
    });
  });
});
