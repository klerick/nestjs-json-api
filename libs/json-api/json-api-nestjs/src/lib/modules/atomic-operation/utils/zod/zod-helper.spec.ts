import { Test, TestingModule } from '@nestjs/testing';
import {
  RelationKeys,
  KEY_MAIN_INPUT_SCHEMA,
  Operation,
  AnyEntity,
  EntityClass,
} from '@klerick/json-api-nestjs-shared';
import { z, ZodError } from 'zod';
import {
  ZodAdd,
  zodAdd,
  zodInputOperation,
  ZodInputOperation,
  zodOperationRel,
  ZodOperationRel,
  zodRemove,
  ZodRemove,
  zodUpdate,
  ZodUpdate,
} from './zod-helper';

import { MapController } from '../../types';
import { JsonBaseController } from '../../../mixin/controllers';
import { mapMock } from '../../../../utils/___test___/test.helper';
import { Users } from '../../../../utils/___test___/test-classes.helper';
import { ENTITY_PARAM_MAP } from '../../../../constants';
import { EntityParamMap } from '../../../mixin/types';
import { UnionToTuple } from '../../../../types';

describe('ZodHelperSpec', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('zodAdd', () => {
    it('should be correct', () => {
      const user = 'user';
      const schema = zodAdd(user);
      const check: z.infer<ZodAdd<'user'>> = {
        op: Operation.add,
        ref: {
          type: user,
        },
        data: {},
      };
      const check1: z.infer<ZodAdd<'user'>> = {
        op: Operation.add,
        ref: {
          type: user,
        },
        data: [{}],
      };
      const check2: z.infer<ZodAdd<'user'>> = {
        op: Operation.add,
        ref: {
          type: user,
        },
        data: null,
      };
      const check3: z.infer<ZodAdd<'user'>> = {
        op: Operation.add,
        ref: {
          type: user,
        },
        data: null,
      };
      const checkArray = [check, check1, check2, check3];
      for (const item of checkArray) {
        const result = schema.parse(item);
        expect(result.op).toBe(Operation.add);
        expect(result.ref.type).toBe(user);
        expect(result).toHaveProperty('data');
      }
    });
    it('should be not correct', () => {
      const schema = zodAdd('user');
      const check = {
        op: Operation.add,
        ref: {
          type: 'user',
        },
        data: {},
        sdfsf: {},
      };
      const check1 = {
        op: Operation.add,
        ref: {
          type: 'user',
        },
      };
      const check2 = {
        op: Operation.add,
        ref: {
          type: 'user',
          sdsdf: 'ssdfdsf',
        },
        data: {},
      };
      const check3 = {
        op: Operation.add,
        ref: {
          type12: 'user',
        },
        data: {},
      };
      const check4 = {
        op: Operation.add,
        ref: {
          type: 'sdfsdf',
        },
        data: {},
      };
      const check5 = {
        op: 'sdfsdf',
        ref: {
          type: 'user',
        },
        data: {},
      };

      const checkArray = [check, check1, check2, check3, check4, check5];
      expect.assertions(checkArray.length);
      for (const item of checkArray) {
        try {
          schema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });
  describe('zodUpdate', () => {
    it('should be correct', () => {
      const user = 'user';
      const schema = zodUpdate(user);
      const check: z.infer<ZodUpdate<'user'>> = {
        op: Operation.update,
        ref: {
          type: 'user',
          id: '1',
        },
        data: {},
      };
      const checkArray = [check];
      for (const item of checkArray) {
        const result = schema.parse(item);
        expect(result.op).toBe(Operation.update);
        expect(result.ref.type).toBe(user);
        expect(result).toHaveProperty('data');
      }
    });
    it('should be not correct', () => {
      const schema = zodUpdate('user');
      const check = {
        op: Operation.update,
        ref: {
          type: 'user',
          id: '12',
        },
        data: {},
        sdfsf: {},
      };
      const check1 = {
        op: Operation.update,
        ref: {
          type: 'user',
          id: '12',
        },
      };
      const check2 = {
        op: Operation.update,
        ref: {
          type: 'user',
          id: '12',
          sdsdf: 'ssdfdsf',
        },
        data: {},
      };
      const check3 = {
        op: Operation.update,
        ref: {
          type12: 'user',
          id: '12',
        },
        data: {},
      };
      const check4 = {
        op: Operation.update,
        ref: {
          type: 'sdfsdf',
          id: '12',
        },
        data: {},
      };
      const check5 = {
        op: 'sdfsdf',
        ref: {
          type: 'user',
          id: '12',
        },
        data: {},
      };
      const check6 = {
        op: Operation.update,
        ref: {
          type: 'user',
        },
        data: {},
      };

      const checkArray = [
        check,
        check1,
        check2,
        check3,
        check4,
        check5,
        check6,
      ];
      expect.assertions(checkArray.length);
      for (const item of checkArray) {
        try {
          schema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });
  describe('zodRemove', () => {
    it('should be correct', () => {
      const user = 'user';
      const schema = zodRemove(user);
      const check: z.infer<ZodRemove<'user'>> = {
        op: Operation.remove,
        ref: {
          type: 'user',
          id: '1',
        },
      };
      const checkArray = [check];
      for (const item of checkArray) {
        const result = schema.parse(item);
        expect(result.op).toBe(Operation.remove);
        expect(result.ref.type).toBe(user);
        expect(result).not.toHaveProperty('data');
      }
    });

    it('should be not correct', () => {
      const schema = zodRemove('user');
      const check = {
        op: Operation.remove,
        ref: {
          type: 'user',
          id: '12',
        },
        sdfsf: {},
      };
      const check1 = {
        op: Operation.remove,
        ref: {
          type: 'user',
          idsdf: '12',
        },
      };
      const check2 = {
        op: Operation.remove,
        ref: {
          type: 'user',
          id: '12',
          sdsdf: 'ssdfdsf',
        },
      };
      const check3 = {
        op: Operation.remove,
        ref: {
          type12: 'user',
          id: '12',
        },
      };
      const check4 = {
        op: Operation.remove,
        ref: {
          type: 'sdfsdf',
          id: '12',
        },
      };
      const check5 = {
        op: 'sdfsdf',
        ref: {
          type: 'user',
          id: '12',
        },
      };
      const check6 = {
        op: Operation.remove,
        ref: {
          type: 'user',
        },
      };

      const checkArray = [
        check,
        check1,
        check2,
        check3,
        check4,
        check5,
        check6,
      ];
      expect.assertions(checkArray.length);
      for (const item of checkArray) {
        try {
          schema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });
  describe('zodOperationRel', () => {
    it('should be correct', () => {
      const user = 'user';
      const rel = ['address', 'notes'] as unknown as UnionToTuple<
        RelationKeys<Users>
      >;
      const schema = zodOperationRel<Users, Operation>(
        user,
        rel,
        Operation.remove
      );
      const check: z.infer<ZodOperationRel<Users, Operation.remove>> = {
        op: Operation.remove,
        ref: {
          type: 'user',
          id: '1',
          relationship: 'notes',
        },
        data: {
          id: 1,
          type: 'notes',
        },
      };
      const checkArray = [check];
      for (const item of checkArray) {
        const result = schema.parse(item);
        expect(result.op).toBe(Operation.remove);
        expect(result.ref.type).toBe(user);
        expect(result).toHaveProperty('data');
        expect(result['data']).toEqual(check.data);
      }
    });
    it('should be not correct', () => {
      const user = 'user';
      const rel = ['address', 'notes'] as unknown as UnionToTuple<
        RelationKeys<Users>
      >;
      const schema = zodOperationRel<Users, Operation>(
        user,
        rel,
        Operation.remove
      );

      const check = {
        op: Operation.remove,
        ref: {
          type: 'user',
          id: '12',
          relationship: 'notes',
        },
        data: {},
        sdfsf: {},
      };
      const check1 = {
        op: Operation.remove,
        ref: {
          type: 'user',
          id: '12',
          relationship: 'notes',
          sdfsdf: 'sdfsdf',
        },
        data: {},
      };
      const check2 = {
        op: Operation.remove,
        ref: {
          type: 'user',
          id: '12',
          relationship1: 'notes',
        },
        data: {},
      };
      const check3 = {
        op: Operation.remove,
        ref: {
          type12: 'user',
          id: '12',
          relationship: 'notes',
        },
        data: {},
      };
      const check4 = {
        op: Operation.remove,
        ref: {
          type: 'sdfsdf',
          id: '12',
          relationship: 'notes',
        },
        data: {},
      };
      const check5 = {
        op: 'sdfsdf',
        ref: {
          type: 'user',
          id: '12',
          relationship: 'notes',
        },
        data: {},
      };
      const check6 = {
        op: Operation.remove,
        ref: {
          type: 'user',
          id: '12',
          relationship: 'notes1',
        },
        data: {},
      };

      const checkArray = [
        check,
        check1,
        check2,
        check3,
        check4,
        check5,
        check6,
      ];
      expect.assertions(checkArray.length);
      for (const item of checkArray) {
        try {
          schema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });
  describe('zodInputOperation', () => {
    let entityParamMap: EntityParamMap<EntityClass<AnyEntity>>;
    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: ENTITY_PARAM_MAP,
            useValue: mapMock,
          },
        ],
      }).compile();
      entityParamMap =
        module.get<EntityParamMap<EntityClass<AnyEntity>>>(ENTITY_PARAM_MAP);
    });

    it('should be correct', () => {
      const mapController: MapController<Users> = new Map([
        [Users as any, JsonBaseController],
      ]);
      const schema = zodInputOperation(mapController, entityParamMap);
      const check: z.infer<ZodInputOperation<any>> = {
        [KEY_MAIN_INPUT_SCHEMA]: [
          {
            data: {},
            op: Operation.update,
            ref: {
              type: 'users',
              relationship: 'manager',
              id: '1',
            },
          },
          {
            data: {},
            op: Operation.update,
            ref: {
              type: 'users',
              id: '1',
            },
          },
          {
            data: {},
            op: Operation.add,
            ref: {
              type: 'users',
            },
          },
          {
            op: Operation.remove,
            ref: {
              type: 'users',
              id: '1',
            },
          },
        ],
      };
      expect(schema.parse(check)).toEqual(check);
    });

    it('incorrect input main data', () => {
      const mapController: MapController<Users> = new Map([
        [Users as any, JsonBaseController],
      ]);
      const schema = zodInputOperation(mapController, entityParamMap);
      const check = {};
      const check1 = {
        ssdf: 'sdfsdf',
      };
      const check2 = {
        [KEY_MAIN_INPUT_SCHEMA]: null,
      };
      const check3 = {
        [KEY_MAIN_INPUT_SCHEMA]: '',
      };
      const check4 = {
        [KEY_MAIN_INPUT_SCHEMA]: {},
      };
      const check5 = {
        [KEY_MAIN_INPUT_SCHEMA]: [],
      };
      const checkArray = [check, check1, check2, check3, check4, check5];
      expect.assertions(checkArray.length);
      for (const item of checkArray) {
        try {
          schema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });

    it('should be incorrect methode not allow', () => {
      class Test extends JsonBaseController<any> {
        override deleteOne(id: string | number): Promise<void> {
          return super.deleteOne(id);
        }
      }
      const mapController: MapController<Users> = new Map([
        [Users as any, Test],
      ]);
      const schema = zodInputOperation(mapController, entityParamMap);
      const check: z.infer<ZodInputOperation<any>> = {
        [KEY_MAIN_INPUT_SCHEMA]: [
          {
            data: {},
            op: Operation.update,
            ref: {
              type: 'users',
              relationship: 'manager',
              id: '1',
            },
          },
        ],
      };
      const check1: z.infer<ZodInputOperation<any>> = {
        [KEY_MAIN_INPUT_SCHEMA]: [
          {
            data: {},
            op: Operation.remove,
            ref: {
              type: 'users1',
              relationship: 'manager',
              id: '1',
            },
          },
        ],
      };
      const checkArray = [check, check1];
      expect.assertions(checkArray.length);
      for (const item of checkArray) {
        try {
          schema.parse(item);
        } catch (e) {
          expect(e).toBeInstanceOf(ZodError);
        }
      }
    });
  });
});
