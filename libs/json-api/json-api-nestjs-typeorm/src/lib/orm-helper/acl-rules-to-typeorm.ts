import { Brackets, WhereExpressionBuilder } from 'typeorm';
import { TypeormUtilsService } from '../service';
import { OperandsMapExpression, EXPRESSION } from '../type';

/**
 * Maps ACL operators (with $) to TypeORM operators (without $)
 */
const ACL_TO_TYPEORM_OPERATOR: Record<string, string> = {
  '$eq': 'eq',
  '$ne': 'ne',
  '$gt': 'gt',
  '$gte': 'gte',
  '$lt': 'lt',
  '$lte': 'lte',
  '$in': 'in',
  '$nin': 'nin',
  '$re': 'regexp',
  '$contains': 'contains',
};

/**
 * Extract all relation field names from ACL rulesForQuery
 * @param rules - ACL rules object
 * @param typeormUtils - TypeORM utils service
 * @returns Set of relation field names used in the rules
 */
export function extractRelationsFromRules<E extends object, IdKey extends string>(
  rules: Record<string, unknown>,
  typeormUtils: TypeormUtilsService<E, IdKey>
): Set<string> {
  const relations = new Set<string>();

  const processObject = (obj: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(obj)) {
      // Skip logical operators
      if (key === '$or' || key === '$and' || key === '$not') {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === 'object' && item !== null) {
              processObject(item as Record<string, unknown>);
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          processObject(value as Record<string, unknown>);
        }
        continue;
      }

      // Check if this is a relation field
      // @ts-ignore
      const isRelation = typeormUtils.relationFields.includes(key as any);
      if (isRelation) {
        relations.add(key);
      }
    }
  };

  processObject(rules);
  return relations;
}

/**
 * Converts ACL rulesForQuery (MikroORM-like format) to TypeORM QueryBuilder conditions
 *
 * @param rulesForQuery - MongoDB-like query object from ExtendAbility.getQueryObject()
 * @param typeormUtils - TypeORM utils service for getting aliases and paths
 * @param hasExistingWhere - Whether queryBuilder already has WHERE conditions
 * @returns Callback function for queryBuilder.andWhere() or queryBuilder.where()
 *
 * @example
 * // With existing WHERE
 * const callback = applyAclRulesToQueryBuilder(
 *   { authorId: 123, profile: { isPublic: true } },
 *   typeormUtils,
 *   true
 * );
 * queryBuilder.andWhere(callback);
 *
 * @example
 * // Without existing WHERE
 * const callback = applyAclRulesToQueryBuilder(
 *   { authorId: 123 },
 *   typeormUtils,
 *   false
 * );
 * callback(queryBuilder);
 */
export function applyAclRulesToQueryBuilder<E extends object, IdKey extends string>(
  rulesForQuery: Record<string, unknown>,
  typeormUtils: TypeormUtilsService<E, IdKey>,
): Brackets {
  let paramCounter = 0;
  const getParamName = (): string => {
    paramCounter++;
    return `aclParam_${paramCounter}`;
  };

  /**
   * Recursively process rules and apply to query builder
   */
  const processRules = (
    qb: WhereExpressionBuilder,
    rules: Record<string, unknown>,
    isFirstCondition = true
  ): void => {
    for (const [key, value] of Object.entries(rules)) {
      // Handle logical operators
      if (key === '$and' && Array.isArray(value)) {
        qb.andWhere(
          new Brackets((subQb) => {
            for (const condition of value) {
              processRules(subQb, condition as Record<string, unknown>, false);
            }
          })
        );
        continue;
      }

      if (key === '$or' && Array.isArray(value)) {
        // Build OR conditions as a single WHERE clause with manual parentheses
        const orConditions: string[] = [];
        const orParams: Record<string, unknown> = {};

        value.forEach((condition) => {
          const cond = condition as Record<string, unknown>;

          Object.entries(cond).forEach(([field, val]) => {
            // Check if this is a relation field
            // @ts-ignore
            const isRelation = typeormUtils.relationFields.includes(field as any);

            if (isRelation && typeof val === 'object' && val !== null && !Array.isArray(val)) {
              // Handle relation fields: { user: { id: { $eq: 3 } } }
              const relationAlias = typeormUtils.getAliasForRelation(field as any);

              for (const [nestedKey, nestedValue] of Object.entries(val as Record<string, unknown>)) {
                const fieldPath = `${relationAlias}.${nestedKey}`;

                if (nestedValue === null || typeof nestedValue !== 'object' || Array.isArray(nestedValue)) {
                  const paramName = getParamName();
                  orConditions.push(`${fieldPath} = :${paramName}`);
                  orParams[paramName] = nestedValue;
                } else {
                  // Handle operators in nested field
                  const operators = nestedValue as Record<string, unknown>;
                  const [aclOperator, operatorValue] = Object.entries(operators)[0];
                  const typeormOperator = ACL_TO_TYPEORM_OPERATOR[aclOperator];

                  if (typeormOperator) {
                    const sqlTemplate = OperandsMapExpression[typeormOperator as keyof typeof OperandsMapExpression];
                    if (sqlTemplate) {
                      const paramName = getParamName();
                      const sqlExpression = sqlTemplate.replace(EXPRESSION, paramName);
                      orConditions.push(`${fieldPath} ${sqlExpression}`);
                      orParams[paramName] = operatorValue;
                    }
                  }
                }
              }
            } else {
              // Handle entity fields
              const fieldPath = `${typeormUtils.currentAlias}.${field}`;

              if (val === null || typeof val !== 'object' || Array.isArray(val)) {
                const paramName = getParamName();
                orConditions.push(`${fieldPath} = :${paramName}`);
                orParams[paramName] = val;
              } else {
                // Handle operators
                const operators = val as Record<string, unknown>;
                const [aclOperator, operatorValue] = Object.entries(operators)[0];
                const typeormOperator = ACL_TO_TYPEORM_OPERATOR[aclOperator];

                if (typeormOperator) {
                  const sqlTemplate = OperandsMapExpression[typeormOperator as keyof typeof OperandsMapExpression];
                  if (sqlTemplate) {
                    const paramName = getParamName();
                    const sqlExpression = sqlTemplate.replace(EXPRESSION, paramName);
                    orConditions.push(`${fieldPath} ${sqlExpression}`);
                    orParams[paramName] = operatorValue;
                  }
                }
              }
            }
          });
        });

        if (orConditions.length > 0) {
          // Wrap in parentheses and join with OR
          const orClause = `(${orConditions.join(' OR ')})`;
          const whereMethod = isFirstCondition ? 'where' : 'andWhere';
          qb[whereMethod](orClause, orParams);
          isFirstCondition = false;
        }

        continue;
      }

      if (key === '$not') {
        // Build NOT conditions - collect all conditions and wrap in NOT (...)
        const notConditions: string[] = [];
        const notParams: Record<string, unknown> = {};

        const notRules = value as Record<string, unknown>;

        for (const [notKey, notValue] of Object.entries(notRules)) {
          // Check if this is a relation field
          // @ts-ignore
          const isRelation = typeormUtils.relationFields.includes(notKey as any);

          if (isRelation && typeof notValue === 'object' && notValue !== null && !Array.isArray(notValue)) {
            // Handle relation fields
            const relationAlias = typeormUtils.getAliasForRelation(notKey as any);

            for (const [nestedKey, nestedValue] of Object.entries(notValue as Record<string, unknown>)) {
              const fieldPath = `${relationAlias}.${nestedKey}`;

              if (nestedValue === null || typeof nestedValue !== 'object' || Array.isArray(nestedValue)) {
                const paramName = getParamName();
                notConditions.push(`${fieldPath} = :${paramName}`);
                notParams[paramName] = nestedValue;
              } else {
                // Handle operators
                const operators = nestedValue as Record<string, unknown>;
                const [aclOperator, operatorValue] = Object.entries(operators)[0];
                const typeormOperator = ACL_TO_TYPEORM_OPERATOR[aclOperator];

                if (typeormOperator) {
                  const sqlTemplate = OperandsMapExpression[typeormOperator as keyof typeof OperandsMapExpression];
                  if (sqlTemplate) {
                    const paramName = getParamName();
                    const sqlExpression = sqlTemplate.replace(EXPRESSION, paramName);
                    notConditions.push(`${fieldPath} ${sqlExpression}`);
                    notParams[paramName] = operatorValue;
                  }
                }
              }
            }
          } else {
            // Handle entity fields
            const fieldPath = `${typeormUtils.currentAlias}.${notKey}`;

            if (notValue === null || typeof notValue !== 'object' || Array.isArray(notValue)) {
              const paramName = getParamName();
              notConditions.push(`${fieldPath} = :${paramName}`);
              notParams[paramName] = notValue;
            } else {
              // Handle operators
              const operators = notValue as Record<string, unknown>;
              const [aclOperator, operatorValue] = Object.entries(operators)[0];
              const typeormOperator = ACL_TO_TYPEORM_OPERATOR[aclOperator];

              if (typeormOperator) {
                const sqlTemplate = OperandsMapExpression[typeormOperator as keyof typeof OperandsMapExpression];
                if (sqlTemplate) {
                  const paramName = getParamName();
                  const sqlExpression = sqlTemplate.replace(EXPRESSION, paramName);
                  notConditions.push(`${fieldPath} ${sqlExpression}`);
                  notParams[paramName] = operatorValue;
                }
              }
            }
          }
        }

        if (notConditions.length > 0) {
          // Wrap in NOT (...)
          const notClause = `NOT (${notConditions.join(' AND ')})`;
          qb.andWhere(notClause, notParams);
        }

        continue;
      }

      // Check if this is a relation field
      // @ts-ignore
      const isRelation = typeormUtils.relationFields.includes(key as any);

      if (isRelation && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle relation fields: { profile: { isPublic: true } }
        const relationAlias = typeormUtils.getAliasForRelation(key as any);

        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          processFieldCondition(
            qb,
            `${relationAlias}.${nestedKey}`,
            nestedValue,
            isFirstCondition && Object.keys(rules).indexOf(key) === 0
          );
          isFirstCondition = false;
        }
      } else {
        // Handle entity fields: { authorId: 123, status: { $in: [...] } }
        const fieldPath = `${typeormUtils.currentAlias}.${key}`;
        processFieldCondition(qb, fieldPath, value, isFirstCondition);
        isFirstCondition = false;
      }
    }
  };

  /**
   * Process a single field condition (with or without operators)
   */
  const processFieldCondition = (
    qb: WhereExpressionBuilder,
    fieldPath: string,
    value: unknown,
    isFirst: boolean
  ): void => {
    const whereMethod = isFirst ? 'where' : 'andWhere';

    // Primitive value - direct equality
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      const paramName = getParamName();
      qb[whereMethod](`${fieldPath} = :${paramName}`, { [paramName]: value });
      return;
    }

    // Object with operators: { $in: [...], $gt: 10, etc. }
    const operators = value as Record<string, unknown>;

    for (const [aclOperator, operatorValue] of Object.entries(operators)) {
      const paramName = getParamName();

      // Convert ACL operator ($eq) to TypeORM operator (eq)
      const typeormOperator = ACL_TO_TYPEORM_OPERATOR[aclOperator];

      if (!typeormOperator) {
        console.warn(`[ACL] Unknown operator "${aclOperator}" in rulesForQuery`);
        continue;
      }

      // Get SQL expression template from OperandsMapExpression
      const sqlTemplate = OperandsMapExpression[typeormOperator as keyof typeof OperandsMapExpression];

      if (!sqlTemplate) {
        console.warn(`[ACL] No SQL template for operator "${typeormOperator}"`);
        continue;
      }

      // Replace EXPRESSION placeholder with paramName
      const sqlExpression = sqlTemplate.replace(EXPRESSION, paramName);

      // Apply condition to query builder
      qb[whereMethod](`${fieldPath} ${sqlExpression}`, { [paramName]: operatorValue });
    }
  };

  // Return callback function
  // if (hasExistingWhere) {
  //   // If there's existing WHERE, wrap in Brackets to isolate ACL conditions
  //   return (qb: WhereExpressionBuilder) => {
  //     qb.andWhere(
  //
  //     );
  //   };
  // } else {
  //   // If no existing WHERE, process rules directly
  //   return (qb: WhereExpressionBuilder) => {
  //     processRules(qb, rulesForQuery, true);
  //   };
  // }
  return new Brackets((subQb) => {
    // Inside Brackets, MUST use TRUE - first condition needs .where()
    processRules(subQb, rulesForQuery, true);
  });
}
