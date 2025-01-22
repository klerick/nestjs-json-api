import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { EntityTarget, ObjectLiteral } from '../../types';
import { ResultGetField } from '../mixin/types';

export type TypeOrmParam = {
  useSoftDelete?: boolean;
  runInTransaction?: <Func extends (...args: any) => any>(
    isolationLevel: IsolationLevel,
    fn: Func
  ) => ReturnType<Func>;
};
