import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { generateSchema } from '@anatine/zod-openapi';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { OperationController } from '../controllers';
import { ZodInputOperation } from '../utils';
import { ZOD_INPUT_OPERATION } from '../constants';

@Injectable()
export class SwaggerService implements OnModuleInit {
  @Inject(ModuleRef) private readonly moduleRef!: ModuleRef;
  @Inject(ZOD_INPUT_OPERATION)
  private typeZodInputOperation!: ZodInputOperation<object>;

  private initSwagger() {
    const operationControllerInst = this.moduleRef.get(OperationController);
    if (!operationControllerInst)
      throw new Error('OperationController not found');
    const controller = operationControllerInst.constructor.prototype;
    const descriptor = Reflect.getOwnPropertyDescriptor(controller, 'index');
    if (!descriptor)
      throw new Error(`Descriptor for controller OperationController is empty`);

    ApiTags('Atomic operation')(operationControllerInst.constructor);
    ApiOperation({
      summary: `Atomic operation for several entity"`,
      operationId: `atomic_operation`,
    })(controller, 'index', descriptor);

    ApiBody({
      description: `Json api schema for new atomic operatiom`,
      schema: generateSchema(this.typeZodInputOperation) as
        | SchemaObject
        | ReferenceObject,
      required: true,
      examples: {
        allField: {
          summary: 'Examples several operation',
          description: 'Examples several operation',
          value: {
            ['atomic:operations']: [
              {
                op: 'add',
                ref: {
                  type: 'users',
                },
                data: 'EntityPostOne',
              },
              {
                op: 'update',
                ref: {
                  type: 'users',
                  id: '1',
                },
                data: 'EntityPatchOne',
              },
              {
                op: 'remove',
                ref: {
                  type: 'users',
                  id: '1',
                },
              },
              {
                op: 'add',
                ref: {
                  type: 'users',
                  id: '1',
                  relationship: 'EntityRelationName',
                },
                data: 'UsersPostRelationship',
              },
              {
                op: 'update',
                ref: {
                  type: 'users',
                  id: '1',
                  relationship: 'EntityRelationName',
                },
                data: 'UsersDeleteRelationship',
              },
            ],
          },
        },
      },
    })(controller, 'index', descriptor);
  }

  onModuleInit(): void {
    this.initSwagger();
  }
}
