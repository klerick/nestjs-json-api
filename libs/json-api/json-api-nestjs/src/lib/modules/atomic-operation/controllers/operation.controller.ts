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
import {
  KEY_MAIN_INPUT_SCHEMA,
  KEY_MAIN_OUTPUT_SCHEMA,
} from '@klerick/json-api-nestjs-shared';
import { InputArray } from '../utils';
import { InputOperationPipe } from '../pipes/input-operation.pipe';
import { ExecuteService, ExplorerService } from '../service';
import { OperationMethode, ParamsForExecute } from '../types';
import { JsonBaseController } from '../../mixin/controllers/json-base.controller';
import { ValidateQueryError } from '../../../types';

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

      let controller: Type<JsonBaseController<object>>;
      let methodName: OperationMethode<object>;
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
      ) as any;

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
    const lids: (string | number)[] = [];
    for (const item of inputOperationData) {
      if (item.op !== 'add') continue;
      if (!item.ref.lid) continue;
      lids.push(item.ref.lid);
    }

    const result = await this.executeService.run(paramForCall, lids);

    return {
      [KEY_MAIN_OUTPUT_SCHEMA]: result.map((i) => ({
        data: i.data,
        ...(i.meta ? { meta: i.meta } : {}),
      })),
    };
  }
}
