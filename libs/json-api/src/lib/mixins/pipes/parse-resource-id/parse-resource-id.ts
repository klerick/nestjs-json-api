import { ParseIntPipe } from '@nestjs/common';

import { mixin } from '../../../helpers/mixin';
import {
  PipeTransformMixin,
  Entity,
} from '../../../types';


export function parseResourceIdMixin(entity: Entity): PipeTransformMixin {
  return mixin(ParseIntPipe);
}
