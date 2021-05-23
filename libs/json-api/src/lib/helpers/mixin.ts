import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';


export function mixin(mixinClass: any, name = '') {
  Object.defineProperty(mixinClass, 'name', { value: `${name}-${uuid()}`});
  Injectable()(mixinClass);
  return mixinClass;
}
