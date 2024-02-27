import {
  Body,
  Controller,
  Inject,
  MethodNotAllowedException,
  NotFoundException,
  Post,
  Type,
} from '@nestjs/common';
import { Module } from '@nestjs/core/injector/module';

import { InputArray } from '../utils';
import { InputOperationPipe } from '../pipes/input-operation.pipe';
import { ExecuteService, ExplorerService } from '../service';
import { KEY_MAIN_INPUT_SCHEMA, KEY_MAIN_OUTPUT_SCHEMA } from '../constants';
import { OperationMethode, ParamsForExecute } from '../types';
import { JsonBaseController } from '../../../mixin/controller/json-base.controller';
import { Entity, ValidateQueryError } from '../../../types';

@Controller('/')
export class OperationController {
  @Inject(ExplorerService) private readonly explorerService!: ExplorerService;
  @Inject(ExecuteService) private readonly executeService!: ExecuteService;

  @Post('')
  async index(@Body(InputOperationPipe) inputOperationData: InputArray) {
    const paramForCall: ParamsForExecute[] = [];
    let i = 0;
    for (const dataInput of inputOperationData) {
      const {
        ref: { relationship, id, type },
        op,
      } = dataInput;

      let controller: Type<JsonBaseController<Entity>>;
      let methodName: OperationMethode;
      let module: Module;
      try {
        controller = this.explorerService.getControllerByEntityName(type);
      } catch (e) {
        const error: ValidateQueryError = {
          code: 'invalid_arguments',
          message: `Resource '${type}' does not exist`,
          path: [KEY_MAIN_INPUT_SCHEMA, `${i}`, 'ref', 'type'],
        };
        throw new NotFoundException([error]);
      }
      try {
        methodName = this.explorerService.getMethodNameByParam(
          op,
          id,
          relationship
        );
      } catch (e) {
        const error: ValidateQueryError = {
          code: 'invalid_arguments',
          message: `Operation '${op}' not allowed`,
          path: [KEY_MAIN_INPUT_SCHEMA, `${i}`, 'op'],
        };
        throw new MethodNotAllowedException([error]);
      }

      const params = this.explorerService.getParamsForMethod(
        methodName,
        dataInput
      );

      try {
        module = this.explorerService.getModulesByController(controller);
      } catch (e) {
        const error: ValidateQueryError = {
          code: 'invalid_arguments',
          message: `Resource '${type}' does not exist`,
          path: [KEY_MAIN_INPUT_SCHEMA, `${i}`, 'ref', 'type'],
        };
        throw new NotFoundException([error]);
      }

      paramForCall.push({
        controller,
        methodName,
        params,
        module,
      });

      i++;
    }
    const tmpIds: (string | number)[] = [];
    for (const item of inputOperationData) {
      if (item.op !== 'add') continue;
      if (!item.ref.tmpId) continue;
      tmpIds.push(item.ref.tmpId);
    }

    const result = await this.executeService.run(paramForCall, tmpIds);
    if (result.length === 0) return void 0;

    return {
      [KEY_MAIN_OUTPUT_SCHEMA]: result.map((i) => ({ data: i.data })),
    };
  }
}
