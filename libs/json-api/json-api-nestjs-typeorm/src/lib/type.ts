import { FilterOperand } from '@klerick/json-api-nestjs-shared';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export type TypeOrmParam = {
  useSoftDelete?: boolean;
  runInTransaction?: <Func extends (...args: any) => any>(
    isolationLevel: IsolationLevel,
    fn: Func
  ) => ReturnType<Func>;
};

export const EXPRESSION = 'EXPRESSION';
export const OperandsMapExpression = {
  [FilterOperand.eq]: `= :${EXPRESSION}`,
  [FilterOperand.ne]: `<> :${EXPRESSION}`,
  [FilterOperand.regexp]: `~* :${EXPRESSION}`,
  [FilterOperand.gt]: `> :${EXPRESSION}`,
  [FilterOperand.gte]: `>= :${EXPRESSION}`,
  [FilterOperand.in]: `IN (:...${EXPRESSION})`,
  [FilterOperand.like]: `LIKE :${EXPRESSION}`,
  [FilterOperand.lt]: `< :${EXPRESSION}`,
  [FilterOperand.lte]: `<= :${EXPRESSION}`,
  [FilterOperand.nin]: `NOT IN (:...${EXPRESSION})`,
  [FilterOperand.some]: `&& :${EXPRESSION}`,
  ilike: `ILIKE :${EXPRESSION}`,
  contains: `@> :${EXPRESSION}`, // PostgreSQL array contains operator
};

export const OperandMapExpressionForNull = {
  [FilterOperand.ne]: 'IS NOT NULL',
  [FilterOperand.eq]: 'IS NULL',
};

export const OperandsMapExpressionForNullRelation = {
  [FilterOperand.ne]: `EXISTS ${EXPRESSION}`,
  [FilterOperand.eq]: `NOT EXISTS ${EXPRESSION}`,
};
