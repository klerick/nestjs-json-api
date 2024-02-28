import { FilterOperand } from 'json-shared-type';

export { FilterOperand };
export const EXPRESSION = 'EXPRESSION';
export const OperandsMapExpression = {
  [FilterOperand.eq]: `= :${EXPRESSION}`,
  [FilterOperand.ne]: `<> :${EXPRESSION}`,
  [FilterOperand.regexp]: `~* :${EXPRESSION}`,
  [FilterOperand.gt]: `> :${EXPRESSION}`,
  [FilterOperand.gte]: `>= :${EXPRESSION}`,
  [FilterOperand.in]: `IN (:...${EXPRESSION})`,
  [FilterOperand.like]: `ILIKE :${EXPRESSION}`,
  [FilterOperand.lt]: `< :${EXPRESSION}`,
  [FilterOperand.lte]: `<= :${EXPRESSION}`,
  [FilterOperand.nin]: `NOT IN (:...${EXPRESSION})`,
  [FilterOperand.some]: `&& :${EXPRESSION}`,
};

export const OperandMapExpressionForNull = {
  [FilterOperand.ne]: 'IS NOT NULL',
  [FilterOperand.eq]: 'IS NULL',
};

export const OperandsMapExpressionForNullRelation = {
  [FilterOperand.ne]: `EXISTS ${EXPRESSION}`,
  [FilterOperand.eq]: `NOT EXISTS ${EXPRESSION}`,
};
