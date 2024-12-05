import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMemoryDb } from 'pg-mem';
import { z, ZodError } from 'zod';

import {
  Addresses,
  Comments,
  createAndPullSchemaBase,
  getRepository,
  mockDBTestModule,
  Notes,
  providerEntities,
  pullAllData,
  pullUser,
  Roles,
  UserGroups,
  Users,
} from '../../mock-utils';
import {
  QueryField,
  zodInputQuerySchema,
  ZodInputQuerySchema,
  zodQuerySchema,
  ZodQuerySchema,
  zodInputPostSchema,
  ZodInputPostSchema,
  ZodInputPatchSchema,
  zodInputPatchSchema,
  zodInputPostRelationshipSchema,
  zodInputPatchRelationshipSchema,
} from './zod-helper';
import { DEFAULT_PAGE_SIZE, DEFAULT_QUERY_PAGE } from '../../constants';

const page = {
  [QueryField.page]: {
    size: DEFAULT_PAGE_SIZE,
    number: DEFAULT_QUERY_PAGE,
  },
};

describe('zod-helper', () => {
  let userRepository: Repository<Users>;
  let addressesRepository: Repository<Addresses>;
  let notesRepository: Repository<Notes>;
  let commentsRepository: Repository<Comments>;
  let rolesRepository: Repository<Roles>;
  let userGroupRepository: Repository<UserGroups>;
  let db: IMemoryDb;
  let zodInputQuerySchemaTest: ZodInputQuerySchema<Users>;
  type zodInputQuerySchema = z.infer<typeof zodInputQuerySchemaTest>;
  type TypeFilterInputQuery = zodInputQuerySchema['filter'];
  type TypeIncludeInputQuery = zodInputQuerySchema['include'];
  type TypeFieldsInputQuery = zodInputQuerySchema['fields'];
  type TypePageInputQuery = zodInputQuerySchema['page'];

  let zodQuerySchemaTest: ZodQuerySchema<Users>;
  type zodQuerySchema = z.infer<typeof zodQuerySchemaTest>;
  type TypeFilterQuery = zodQuerySchema['filter'];
  type TypeIncludeQuery = zodQuerySchema['include'];
  type TypeFieldsQuery = zodQuerySchema['fields'];
  type TypePageQuery = zodQuerySchema['page'];
  type TypeSortQuery = zodQuerySchema['sort'];
  const dataCheckDefault = {
    [QueryField.filter]: null,
    [QueryField.fields]: null,
    [QueryField.include]: null,
    [QueryField.sort]: null,
    [QueryField.page]: page[QueryField.page],
  };

  let zodInputPostSchemaTest: ZodInputPostSchema<Users>;
  type zodInputPostSchema = z.infer<typeof zodInputPostSchemaTest>;

  let zodInputPatchSchemaTest: ZodInputPatchSchema<Users>;
  type zodInputPatchSchema = z.infer<typeof zodInputPatchSchemaTest>;

  beforeAll(async () => {
    db = createAndPullSchemaBase();
    const module: TestingModule = await Test.createTestingModule({
      imports: [mockDBTestModule(db)],
      providers: [...providerEntities(getDataSourceToken())],
    }).compile();
    ({
      userRepository,
      addressesRepository,
      notesRepository,
      commentsRepository,
      rolesRepository,
      userGroupRepository,
    } = getRepository(module));

    const user = await pullUser(userRepository);
    const userWithRelation = await pullAllData(
      userRepository,
      addressesRepository,
      notesRepository,
      commentsRepository,
      rolesRepository,
      userGroupRepository
    );
    zodInputQuerySchemaTest = zodInputQuerySchema<Users>(userRepository);
    zodQuerySchemaTest = zodQuerySchema<Users>(userRepository);
    zodInputPostSchemaTest = zodInputPostSchema<Users>(userRepository);
    zodInputPatchSchemaTest = zodInputPatchSchema<Users>(userRepository);
  });

  describe('Test input query schema', () => {
    it('Empty object is correct', () => {
      const check = {};
      const result = zodInputQuerySchemaTest.parse(check);
      expect(result).toEqual({
        ...check,
        ...page,
      });
    });

    describe('Test filter', () => {
      it('Valid schema', () => {
        const check1: TypeFilterInputQuery = {
          id: '1',
          firstName: {
            ne: 'dfs',
            eq: 'sdf',
          },
          isActive: {
            in: 'sdf',
          },
        };
        const check2: TypeFilterInputQuery = {
          addresses: {
            eq: 'null',
          },
          manager: {
            ne: 'null',
          },
        };

        const check3: TypeFilterInputQuery = {
          'addresses.createdAt': 'sdfsdf',
          'comments.createdAt': {
            eq: 'sdfsd',
            ne: 'sdfsdf',
            like: 'sdfsdf',
          },
        };
        const arrayCheck = [check1, check2, check3];

        for (const item of arrayCheck) {
          const dataCheck: zodInputQuerySchema = {
            filter: item,
            ...page,
          };
          const result = zodInputQuerySchemaTest.parse(dataCheck);
          expect(result).toEqual(dataCheck);
        }
      });
      it('In Valid schema', () => {
        const check1 = {};
        const check2 = {
          addresses: {
            in: null,
          },
          manager: {
            like: null,
            sdfsdf: 'sdfsdf',
          },
        };
        const check3 = {
          sdfsdf: 'sdfsdf',
        };
        const check4 = {
          id: '',
          firstName: {
            ne: '',
            eq: '',
          },
          isActive: {
            in: '',
          },
        };
        const arrayCheck = [check1, check2, check3, check4];

        expect.assertions(arrayCheck.length);
        for (const item of arrayCheck) {
          const dataCheck = {
            filter: item,
          };
          try {
            zodInputQuerySchemaTest.parse(dataCheck);
          } catch (e) {
            expect(e).toBeInstanceOf(ZodError);
          }
        }
      });
    });

    describe('Test include', () => {
      it('Valid schema', () => {
        const check1: TypeIncludeInputQuery = 'manager';
        const check2: TypeIncludeInputQuery = 'addresses,roles';

        const arrayCheck = [check1, check2];

        for (const item of arrayCheck) {
          const dataCheck: zodInputQuerySchema = {
            [QueryField.include]: item,
            ...page,
          };
          const result = zodInputQuerySchemaTest.parse(dataCheck);
          expect(result).toEqual(dataCheck);
        }
      });
      it('In Valid schema', () => {
        const check1 = [] as unknown;
        const check2 = ['dfsdfsdf', 'addresses'];
        const check3 = ['addresses', 'addresses'];
        const check4 = {};
        const arrayCheck = [check1, check2, check3, check4];

        expect.assertions(arrayCheck.length);
        for (const item of arrayCheck) {
          const dataCheck = {
            include: item,
          };
          try {
            zodInputQuerySchemaTest.parse(dataCheck);
          } catch (e) {
            expect(e).toBeInstanceOf(ZodError);
          }
        }
      });
    });

    describe('Test select field', () => {
      it('Valid schema', () => {
        const check1: TypeFieldsInputQuery = {
          target: 'sdfsdf',
          manager: 'dfsdfsdf',
        };
        const check2: TypeFieldsInputQuery = {
          target: 'sdfsdf',
        };
        const check3: TypeFieldsInputQuery = {
          addresses: 'sdfsdf',
          manager: 'sdfsdf',
        };

        const arrayCheck = [check1, check2, check3];

        for (const item of arrayCheck) {
          const dataCheck: zodInputQuerySchema = {
            fields: item,
            ...page,
          };
          const result = zodInputQuerySchemaTest.parse(dataCheck);
          expect(result).toEqual(dataCheck);
        }
      });
      it('In Valid schema', () => {
        const check1 = [] as unknown[];
        const check2 = {
          addresses: 'sdfsdf',
          manager: 'sdfsdf',
          otherField: 'dsfsdf',
        };
        const check3 = { otherField: 'dsfsdf' };
        const check4 = 'sdfsdf';
        const check5 = {};
        const check6 = 'dssd';
        const arrayCheck = [check1, check2, check3, check4, check5, check6];

        expect.assertions(arrayCheck.length);
        for (const item of arrayCheck) {
          const dataCheck = {
            fields: item,
          };
          try {
            zodInputQuerySchemaTest.parse(dataCheck);
          } catch (e) {
            expect(e).toBeInstanceOf(ZodError);
          }
        }
      });
    });

    describe('Test page field', () => {
      it('Valid schema', () => {
        const check1 = page['page'];
        const check2 = {};
        const check3 = undefined;

        const arrayCheck = [check1, check2, check3];

        for (const item of arrayCheck) {
          const dataCheck = {
            [QueryField.page]: item,
          };
          const result = zodInputQuerySchemaTest.parse(dataCheck);
          expect(result).toEqual(page);
        }
      });
    });
  });

  describe('test query schema', () => {
    describe('Test filter', () => {
      it('Valid schema', () => {
        const check1: TypeFilterQuery = {
          target: null,
          relation: null,
        };
        const check2: TypeFilterQuery = {
          target: {
            id: {
              in: ['123'],
            },
          },
          relation: {
            addresses: {
              arrayField: {
                some: ['dsfsdf'],
              },
            },
            roles: {
              id: {
                eq: '123',
              },
            },
          },
        };
        const arrayCheck = [check1, check2];
        for (const item of arrayCheck) {
          const dataCheck = {
            ...dataCheckDefault,
            [QueryField.filter]: item,
          };
          const result = zodQuerySchemaTest.parse(dataCheck);
          expect(result).toEqual(dataCheck);
        }
      });
      it('Invalid schema', () => {
        const check1 = {};
        const check2 = '';
        const check3: unknown[] = [];
        const check4 = null;
        const check5 = undefined;
        const check6 = 1;
        const check7 = {
          dsfsdf: 'sdf',
        };
        const check8 = {
          target: null,
        };
        const check9 = {
          target: {},
          relation: null,
        };
        const check10 = {
          target: '',
          relation: null,
        };
        const check11 = {
          target: [],
          relation: null,
        };
        const check12 = {
          target: undefined,
          relation: null,
        };
        const check13 = {
          target: 1,
          relation: null,
        };
        const check14 = {
          target: null,
          relation: {},
        };
        const check15 = {
          target: null,
          relation: '',
        };
        const check16 = {
          target: null,
          relation: [],
        };
        const check17 = {
          target: null,
          relation: undefined,
        };
        const check18 = {
          target: null,
          relation: 1,
        };

        const arrayCheck = [
          check1,
          check2,
          check3,
          check4,
          check5,
          check6,
          check7,
          check8,
          check9,
          check10,
          check11,
          check12,
          check13,
          check14,
          check15,
          check16,
          check17,
          check18,
        ];

        expect.assertions(arrayCheck.length);
        for (const item of arrayCheck) {
          const dataCheck = {
            ...dataCheckDefault,
            [QueryField.filter]: item,
          };
          try {
            zodQuerySchemaTest.parse(dataCheck);
          } catch (e) {
            expect(e).toBeInstanceOf(ZodError);
          }
        }
      });
    });
  });
  describe('test zodInputPostSchema', () => {
    it('should be ok', () => {
      const real = 123.123;
      const date = new Date();
      const attributes = {
        lastName: 'sdfsdf',
        isActive: true,
        testDate: date.toISOString(),
        testReal: [`${real}`],
        testArrayNull: null,
      };
      const relationships = {
        notes: [
          {
            type: 'notes',
            id: 'dsfsdf',
          },
        ],
      };
      const check = {
        data: {
          type: 'users',
          attributes,
          relationships,
        },
      };
      const check2 = {
        data: {
          type: 'users',
          attributes,
        },
      };
      const check3 = {
        data: {
          id: '1',
          type: 'users',
          attributes,
        },
      };

      const checkResult = {
        data: {
          type: 'users',
          attributes: {
            ...attributes,
            ['testDate']: date,
            testReal: [real],
          },
          relationships,
        },
      };
      const checkResult2 = {
        data: {
          type: 'users',
          attributes: {
            ...attributes,
            ['testDate']: date,
            testReal: [real],
          },
        },
      };
      const checkResult3 = {
        data: {
          id: '1',
          type: 'users',
          attributes: {
            ...attributes,
            ['testDate']: date,
            testReal: [real],
          },
        },
      };

      expect(zodInputPostSchemaTest.parse(check)).toEqual(checkResult);
      expect(zodInputPostSchemaTest.parse(check2)).toEqual(checkResult2);
      expect(zodInputPostSchemaTest.parse(check3)).toEqual(checkResult3);
    });

    it('should be not ok', () => {
      const check1 = {};
      const check2 = null;
      const check3: unknown[] = [];
      const check4 = '';
      const check5 = {
        sdf: 'sdf',
      };
      const check6 = {
        data: {},
      };
      const check7 = {
        data: {
          type: 'users',
        },
      };
      const check8 = {
        data: {
          type: 'users',
          attributes: {
            lastName: 'sdfsdf',
            isActive: true,
          },
          relationships: {
            notes: [
              {
                type: 'sdfsdf',
                id: 'dsfsdf',
              },
            ],
          },
        },
      };
      const check9 = {
        data: {
          type: 'users',
          attributes: {
            lastName: 'sdfsdf',
            id: 1,
          },
        },
      };
      const arrayCheck = [
        check1,
        check2,
        check3,
        check4,
        check5,
        check6,
        check7,
        check8,
        check9,
      ];
      expect.assertions(arrayCheck.length);
      for (const item of arrayCheck) {
        try {
          zodInputPostSchemaTest.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });

  describe('test zodInputPatchSchema', () => {
    it('should be ok', () => {
      const attributes = {
        lastName: 'sdfsdf',
        isActive: true,
      };
      const relationships = {
        notes: [],
        manager: null,
      };
      const check = {
        data: {
          id: '1',
          type: 'users',
          attributes,
          relationships,
        },
      };
      const check2 = {
        data: {
          id: '1',
          type: 'users',
          attributes,
        },
      };
      const check3 = {
        data: {
          id: '1',
          type: 'users',
          relationships,
        },
      };

      expect(zodInputPatchSchemaTest.parse(check)).toEqual(check);
      expect(zodInputPatchSchemaTest.parse(check2)).toEqual(check2);
      expect(zodInputPatchSchemaTest.parse(check3)).toEqual({
        data: {
          id: '1',
          type: 'users',
          relationships,
          attributes: {},
        },
      });
    });

    it('should be not ok', () => {
      const check1 = {
        data: {
          type: 'users',
          attributes: {
            lastName: 'sdfsdf',
            isActive: true,
          },
        },
      };
      const check2 = {
        data: {
          id: 'sdfsdf',
          type: 'users',
          attributes: {
            lastName: 'sdfsdf',
            isActive: true,
          },
        },
      };
      const check3 = {
        data: {
          id: '1',
          type: 'users',
          attributes: {
            id: 1,
            isActive: true,
          },
        },
      };
      const check4 = {
        data: {
          id: '1',
          type: 'users',
        },
      };
      const arrayCheck = [check1, check2, check3, check4];
      expect.assertions(arrayCheck.length);
      for (const item of arrayCheck) {
        try {
          zodInputPatchSchemaTest.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });
  describe('test zodInputPostRelationshipSchema', () => {
    const check = {
      data: [{ type: 'type', id: 'id' }],
    };
    const check1 = {
      data: { type: 'type', id: 'id' },
    };
    it('should be ok', () => {
      expect(zodInputPostRelationshipSchema.parse(check)).toEqual(check);
      expect(zodInputPostRelationshipSchema.parse(check1)).toEqual(check1);
    });
    it('should be not ok', () => {
      const check = {};
      const check1 = {
        data: { type: 'type', id: 'id' },
        tes: 'sdfsdf',
      };
      expect.assertions(2);
      try {
        zodInputPostRelationshipSchema.parse(check);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
      try {
        zodInputPostRelationshipSchema.parse(check1);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    });
  });

  describe('test zodInputPatchRelationshipSchema', () => {
    const check = {
      data: [],
    };
    const check1 = {
      data: null,
    };
    it('should be ok', () => {
      expect(zodInputPatchRelationshipSchema.parse(check)).toEqual(check);
      expect(zodInputPatchRelationshipSchema.parse(check1)).toEqual(check1);
    });
    it('should be not ok', () => {
      const check = {};
      const check1 = {
        data: { type: 'type', id: 'id' },
        tes: 'sdfsdf',
      };
      expect.assertions(2);
      try {
        zodInputPatchRelationshipSchema.parse(check);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
      try {
        zodInputPatchRelationshipSchema.parse(check1);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
      }
    });
  });
});
