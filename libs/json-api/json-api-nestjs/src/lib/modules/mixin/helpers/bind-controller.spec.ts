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
});
