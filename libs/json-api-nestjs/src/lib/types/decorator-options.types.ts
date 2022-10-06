import {MethodName} from './binding.types'
import {ConfigParam} from './module.types';


export type DecoratorOptions = Partial<{
  allowMethod: Array<MethodName>,
} & ConfigParam>
