import {
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { ObjectTyped } from '@klerick/json-api-nestjs-shared';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';

import { bindController } from './bind-controller';

import {
  ParseIntPipe,
  Query,
  Body,
  Param,
  PipeTransform,
  ArgumentMetadata,
} from '@nestjs/common';
import { OrmService } from '../types';
import { PatchData } from '../zod';
import { JsonApi } from '../decorators';
import { JsonBaseController } from '../controllers/json-base.controller';
import { excludeMethod } from './utils';

import { Bindings } from '../config/bindings';

const mapParams = new Map();
mapParams.set(Query, RouteParamtypes.QUERY);
mapParams.set(Body, RouteParamtypes.BODY);
mapParams.set(Param, RouteParamtypes.PARAM);

class Users {}

describe('bindController', () => {
  it('Should be all methode', () => {
    class Controller {}
    const config = {
      requiredSelectField: false,
      pipeForId: ParseIntPipe,
      debug: false,
      useSoftDelete: false,
    } as any;
    bindController(Controller, Users, config);

    expect(Object.getOwnPropertyNames(Controller.prototype)).toEqual([
      'constructor',
      'getAll',
      'getOne',
      'deleteOne',
      'postOne',
      'patchOne',
      'getRelationship',
      'postRelationship',
      'deleteRelationship',
      'patchRelationship',
    ]);

    for (const [key, value] of ObjectTyped.entries(Bindings)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(
        Controller.prototype,
        key
      );
      if (!descriptor) {
        throw new Error('descriptor is empty:' + key);
      }

      expect(Reflect.getMetadata(PATH_METADATA, descriptor.value)).toBe(
        value.path
      );
      expect(Reflect.getMetadata(METHOD_METADATA, descriptor.value)).toBe(
        value.method
      );
      const paramsMetadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        Controller.prototype.constructor,
        key
      );
      for (const params in value.parameters) {
        const tmp = value.parameters[params];
        if (!tmp.decorator) {
          expect(paramsMetadata).toEqual(tmp.decorator);
          continue;
        }
        const paramsMetadataItem =
          paramsMetadata[`${mapParams.get(tmp.decorator)}:${params}`];
        expect(paramsMetadataItem).not.toEqual(undefined);
        expect(paramsMetadataItem.index).toBe(parseInt(params));
        tmp.mixins.forEach((i, k) => {
          expect(i(Users, config).name).toEqual(
            paramsMetadataItem.pipes[k].name
          );
        });
      }
    }
  });

  it('Should be without methode: postOne, getRelationship', () => {
    @JsonApi(Users, {
      allowMethod: excludeMethod(['postOne', 'getRelationship']),
    })
    class Controller {}
    const config = {
      requiredSelectField: false,
      pipeForId: ParseIntPipe,
      debug: false,
      useSoftDelete: false,
    } as any;
    bindController(Controller, Users, config);
    expect(Object.getOwnPropertyNames(Controller.prototype)).toEqual([
      'constructor',
      'getAll',
      'getOne',
      'deleteOne',
      'patchOne',
      'postRelationship',
      'deleteRelationship',
      'patchRelationship',
    ]);
  });

  it('Should be use custom pipe', () => {
    class SomePipes implements PipeTransform {
      transform(value: any, metadata: ArgumentMetadata): any {
        return undefined;
      }
    }
    class Controller extends JsonBaseController<Users, 'id'> {
      override patchOne(
        @Param('id', SomePipes) id: string | number,
        @Body(SomePipes) inputData: PatchData<Users, 'id'>
      ): ReturnType<OrmService<Users>['patchOne']> {
        return super.patchOne(id, inputData);
      }
    }
    const config = {
      requiredSelectField: false,
      pipeForId: SomePipes,
      debug: false,
      useSoftDelete: false,
    } as any;
    bindController(Controller, Users, config);

    const paramsMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Controller.prototype.constructor,
      'patchOne'
    );
    expect(paramsMetadata[`${mapParams.get(Param)}:0`].pipes[0]).toEqual(
      SomePipes
    );

    expect(paramsMetadata[`${mapParams.get(Param)}:0`].pipes.length).toBe(
      Bindings.patchOne.parameters[0].mixins.length + 1
    );
    expect(paramsMetadata[`${mapParams.get(Param)}:0`].pipes.at(-1)).toEqual(
      SomePipes
    );

    expect(paramsMetadata[`${mapParams.get(Body)}:1`].pipes.length).toBe(
      Bindings.patchOne.parameters[1].mixins.length + 1
    );
    expect(paramsMetadata[`${mapParams.get(Body)}:1`].pipes.at(-1)).toEqual(
      SomePipes
    );
  });

  it('Should have meta parameter in postOne and patchOne', () => {
    class Controller {}
    const config = {
      requiredSelectField: false,
      pipeForId: ParseIntPipe,
      debug: false,
      useSoftDelete: false,
    } as any;
    bindController(Controller, Users, config);

    // Check postOne has 2 parameters: data and meta
    const postOneMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Controller.prototype.constructor,
      'postOne'
    );
    expect(postOneMetadata[`${mapParams.get(Body)}:0`]).toBeDefined();
    expect(postOneMetadata[`${mapParams.get(Body)}:1`]).toBeDefined();
    expect(postOneMetadata[`${mapParams.get(Body)}:0`].index).toBe(0);
    expect(postOneMetadata[`${mapParams.get(Body)}:1`].index).toBe(1);

    // Check patchOne has 3 parameters: id, data, and meta
    const patchOneMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Controller.prototype.constructor,
      'patchOne'
    );
    expect(patchOneMetadata[`${mapParams.get(Param)}:0`]).toBeDefined();
    expect(patchOneMetadata[`${mapParams.get(Body)}:1`]).toBeDefined();
    expect(patchOneMetadata[`${mapParams.get(Body)}:2`]).toBeDefined();
    expect(patchOneMetadata[`${mapParams.get(Param)}:0`].index).toBe(0);
    expect(patchOneMetadata[`${mapParams.get(Body)}:1`].index).toBe(1);
    expect(patchOneMetadata[`${mapParams.get(Body)}:2`].index).toBe(2);

    // Check deleteOne has only 1 parameter: id (no meta)
    const deleteOneMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Controller.prototype.constructor,
      'deleteOne'
    );
    expect(deleteOneMetadata[`${mapParams.get(Param)}:0`]).toBeDefined();
    expect(deleteOneMetadata[`${mapParams.get(Body)}:1`]).toBeUndefined();
  });

  it('Should allow custom pipe for meta parameter', () => {
    class CustomMetaPipe implements PipeTransform {
      transform(value: any, metadata: ArgumentMetadata): any {
        return value;
      }
    }

    class Controller extends JsonBaseController<Users, 'id'> {
      override postOne(
        @Body() inputData: any,
        @Body(CustomMetaPipe) meta: {name: number}
      ): ReturnType<OrmService<Users>['postOne']> {
        return super.postOne(inputData);
      }
    }

    const config = {
      requiredSelectField: false,
      pipeForId: ParseIntPipe,
      debug: false,
      useSoftDelete: false,
    } as any;
    bindController(Controller, Users, config);

    const paramsMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Controller.prototype.constructor,
      'postOne'
    );

    // Check that custom pipe is added to meta parameter (index 1)
    expect(paramsMetadata[`${mapParams.get(Body)}:1`].pipes.at(-1)).toEqual(
      CustomMetaPipe
    );
    expect(paramsMetadata[`${mapParams.get(Body)}:1`].pipes.length).toBe(
      Bindings.postOne.parameters[1].mixins.length + 1
    );
  });

  it('Should have meta parameter in relationship methods', () => {
    class Controller {}
    const config = {
      requiredSelectField: false,
      pipeForId: ParseIntPipe,
      debug: false,
      useSoftDelete: false,
    } as any;
    bindController(Controller, Users, config);

    // Check postRelationship has 4 parameters: id, relName, data, meta
    const postRelMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Controller.prototype.constructor,
      'postRelationship'
    );
    expect(postRelMetadata[`${mapParams.get(Param)}:0`]).toBeDefined();
    expect(postRelMetadata[`${mapParams.get(Param)}:1`]).toBeDefined();
    expect(postRelMetadata[`${mapParams.get(Body)}:2`]).toBeDefined();
    expect(postRelMetadata[`${mapParams.get(Body)}:3`]).toBeDefined();
    expect(postRelMetadata[`${mapParams.get(Body)}:3`].index).toBe(3);

    // Check patchRelationship has 4 parameters: id, relName, data, meta
    const patchRelMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Controller.prototype.constructor,
      'patchRelationship'
    );
    expect(patchRelMetadata[`${mapParams.get(Param)}:0`]).toBeDefined();
    expect(patchRelMetadata[`${mapParams.get(Param)}:1`]).toBeDefined();
    expect(patchRelMetadata[`${mapParams.get(Body)}:2`]).toBeDefined();
    expect(patchRelMetadata[`${mapParams.get(Body)}:3`]).toBeDefined();
    expect(patchRelMetadata[`${mapParams.get(Body)}:3`].index).toBe(3);

    // Check deleteRelationship has 4 parameters: id, relName, data, meta
    const deleteRelMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Controller.prototype.constructor,
      'deleteRelationship'
    );
    expect(deleteRelMetadata[`${mapParams.get(Param)}:0`]).toBeDefined();
    expect(deleteRelMetadata[`${mapParams.get(Param)}:1`]).toBeDefined();
    expect(deleteRelMetadata[`${mapParams.get(Body)}:2`]).toBeDefined();
    expect(deleteRelMetadata[`${mapParams.get(Body)}:3`]).toBeDefined();
    expect(deleteRelMetadata[`${mapParams.get(Body)}:3`].index).toBe(3);
  });

  it('Should apply custom pipes only to their respective parameters', () => {
    class FirstParamPipe implements PipeTransform {
      transform(value: any, metadata: ArgumentMetadata): any {
        return value;
      }
    }

    class SecondParamPipe implements PipeTransform {
      transform(value: any, metadata: ArgumentMetadata): any {
        return value;
      }
    }

    class Controller extends JsonBaseController<Users, 'id'> {
      override postOne(
        @Body(FirstParamPipe) inputData: any,
        @Body(SecondParamPipe) meta: Record<string, unknown>
      ): ReturnType<OrmService<Users>['postOne']> {
        return super.postOne(inputData, meta);
      }
    }

    const config = {
      requiredSelectField: false,
      pipeForId: ParseIntPipe,
      debug: false,
      useSoftDelete: false,
    } as any;
    bindController(Controller, Users, config);

    const paramsMetadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      Controller.prototype.constructor,
      'postOne'
    );

    // Check that FirstParamPipe is ONLY in parameter 0, not in parameter 1
    const param0Pipes = paramsMetadata[`${mapParams.get(Body)}:0`].pipes;
    const param1Pipes = paramsMetadata[`${mapParams.get(Body)}:1`].pipes;

    expect(param0Pipes.at(-1)).toEqual(FirstParamPipe);
    expect(param0Pipes).toContain(FirstParamPipe);
    expect(param0Pipes).not.toContain(SecondParamPipe);

    // Check that SecondParamPipe is ONLY in parameter 1, not in parameter 0
    expect(param1Pipes.at(-1)).toEqual(SecondParamPipe);
    expect(param1Pipes).toContain(SecondParamPipe);
    expect(param1Pipes).not.toContain(FirstParamPipe);

    // Verify each parameter has the correct number of pipes
    // Bindings pipes + 1 custom pipe
    expect(param0Pipes.length).toBe(
      Bindings.postOne.parameters[0].mixins.length + 1
    );
    expect(param1Pipes.length).toBe(
      Bindings.postOne.parameters[1].mixins.length + 1
    );
  });
});
