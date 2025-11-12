import { FactoryProvider } from '@nestjs/common';
import {
  AbilityTuple,
  fieldPatternMatcher,
  MongoQuery,
  mongoQueryMatcher,
  PureAbility,
  RawRuleFrom,
} from '@casl/ability';
import { rulesToQuery } from '@casl/ability/extra';
import { RuleMaterializer } from '../services';

import { AclInputData, AclRule, ACL_INPUT_TEMPLATE } from '../types';
import { ModuleRef } from '@nestjs/core';
import { Query, QueryOne } from '@klerick/json-api-nestjs';
import { QueryField } from '@klerick/json-api-nestjs-shared';

export type AbilityFactory = (
  subject: string,
  action: string,
  rules: AclRule[],
  context: Record<string, unknown>,
  helpers: Record<string, (...args: unknown[]) => unknown>
) => ExtendAbility;

export const ABILITY_FACTORY = Symbol('ABILITY_FACTORY');
export const AbilityFactoryProvider: FactoryProvider = {
  provide: ABILITY_FACTORY,
  useFactory: function AbilityFactory(moduleRef: ModuleRef) {
    return function createEmptyAbility<
      A extends AbilityTuple = AbilityTuple,
      C extends MongoQuery = MongoQuery
    >(
      subject: string,
      action: string,
      rules: RawRuleFrom<A, C>[],
      context: Record<string, unknown>,
      helpers: Record<string, (...args: unknown[]) => unknown>
    ) {
      return new ExtendAbility(
        moduleRef.get(RuleMaterializer),
        subject,
        action,
        rules,
        context,
        helpers
      );
    };
  },
  inject: [ModuleRef],
};

export class ExtendAbility<
  A extends AbilityTuple = AbilityTuple,
  C extends MongoQuery = MongoQuery
> extends PureAbility<A, C> {
  private _hasFields: undefined | boolean = undefined;
  private _hasConditions: undefined | boolean = undefined;

  constructor(
    private ruleMaterializer: RuleMaterializer,
    private currentSubject: string,
    private currentAction: string,
    private allRules: RawRuleFrom<A, C>[],

    private readonly context: Record<string, unknown>,
    private readonly helpers: Record<string, (...args: unknown[]) => unknown>
  ) {
    const { withoutInput } = ExtendAbility.splitRulesByInput(allRules);

    const materialized = ruleMaterializer.materialize(
      withoutInput,
      context,
      helpers,
      undefined // NO @input
    );

    super(materialized, {
      conditionsMatcher: mongoQueryMatcher,
      fieldMatcher: fieldPatternMatcher,
    });
  }

  updateWithInput(input: AclInputData) {
    const materialized = this.ruleMaterializer.materialize(
      this.allRules,
      this.context,
      this.helpers,
      input
    );

    this.update(materialized);
  }

  get hasConditions(): boolean {
    if (this._hasConditions === undefined) {
      this.hasConditionsAndFields();
    }
    return this._hasConditions as boolean;
  }

  get hasFields(): boolean {
    if (this._hasFields === undefined) {
      this.hasConditionsAndFields();
    }
    return this._hasFields as boolean;
  }

  get action(): string {
    return this.currentAction;
  }

  get subject(): string {
    return this.currentSubject;
  }

  hasConditionsAndFields(): boolean {
    const rules = this.allRules;
    for (let i = 0; i < rules.length; i++) {
      if (rules[i].conditions !== undefined) {
        this._hasConditions = true;
      }
      if (rules[i].fields !== undefined) {
        this._hasFields = true;
      }
      if (this._hasConditions === true && this._hasFields === true)
        return false;
    }

    // Set false if not found
    if (this._hasConditions === undefined) {
      this._hasConditions = false;
    }
    if (this._hasFields === undefined) {
      this._hasFields = false;
    }

    return true;
  }

  getQueryObject<
    E extends object,
    IdKey extends string,
    Q extends QueryOne<E, IdKey> | Query<E, IdKey>
  >(): {
    fields?: Q[QueryField.fields];
    include?: Q[QueryField.include];
    rulesForQuery?: Record<string, unknown>;
  } {
    const fieldMap = new Map<string, Set<string>>();
    const includeSet = new Set<string>();

    const rulesForQuery = rulesToQuery(
      this,
      this.currentAction,
      this.currentSubject as any,
      (rule) => {
        const { conditions, inverted } = rule;

        if (!conditions) return {};

        const transformed = this.processConditionsForQuery(
          conditions,
          fieldMap,
          includeSet
        );

        return inverted ? { $not: transformed } : transformed;
      }
    ) as Record<string, unknown>;

    // Build fields as object (not array)
    let fields: Query<E, IdKey>['fields'] | undefined = undefined;
    let include: Query<E, IdKey>['include'] | undefined = undefined;

    if (fieldMap.size > 0) {
      fields = {} as any;
      Array.from(fieldMap.entries()).forEach(([key, valueSet]) => {
        (fields as any)[key] = Array.from(valueSet);
      });
    }

    if (includeSet.size > 0) {
      include = Array.from(includeSet) as any;
    }

    return {
      ...(fields && { fields }),
      ...(include && { include }),
      // Return undefined if rulesForQuery is null or empty object
      ...(rulesForQuery &&
        !this.isEmptyQuery(rulesForQuery) && {
          rulesForQuery,
        }),
    };
  }

  /**
   * Process conditions recursively: extract fields, transform structure, transform operators for MikroORM
   */
  private processConditionsForQuery(
    conditions: Record<string, unknown>,
    fieldMap: Map<string, Set<string>>,
    includeSet: Set<string>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [fieldPath, value] of Object.entries(conditions)) {
      // MongoDB operators at top level ($or, $and, $nor, etc.)
      if (fieldPath.startsWith('$')) {
        // Transform $nor → $not: { $or: [...] }
        if (fieldPath === '$nor' && Array.isArray(value)) {
          result['$not'] = {
            $or: value.map((subCondition) =>
              this.processConditionsForQuery(subCondition, fieldMap, includeSet)
            ),
          };
          continue;
        }

        // For $or/$and, recursively process
        if ((fieldPath === '$or' || fieldPath === '$and') && Array.isArray(value)) {
          result[fieldPath] = value.map((subCondition) =>
            this.processConditionsForQuery(subCondition, fieldMap, includeSet)
          );
          continue;
        }

        // Keep other operators as is
        result[fieldPath] = value;
        continue;
      }

      // Parse field path
      const [firstPart, secondPart] = fieldPath.split('.');

      if (!secondPart) {
        // Target entity field: 'authorId'
        const targetSet = fieldMap.get('target') || new Set();
        targetSet.add(firstPart);
        fieldMap.set('target', targetSet);

        // Transform operators in field values
        result[firstPart] = this.transformOperatorsInValue(value);
      } else {
        // Relation field: 'profile.name'
        const relationSet = fieldMap.get(firstPart) || new Set();
        relationSet.add(secondPart);
        fieldMap.set(firstPart, relationSet);
        includeSet.add(firstPart);

        // Transform: 'profile.name' → { profile: { name: value } }
        // Merge multiple fields from same relation
        if (!result[firstPart]) {
          result[firstPart] = {};
        }
        (result[firstPart] as Record<string, unknown>)[secondPart] =
          this.transformOperatorsInValue(value);
      }
    }

    return result;
  }

  /**
   * Transform CASL operators to MikroORM operators in field values
   * $regex → $re, $all → $contains
   */
  private transformOperatorsInValue(value: unknown): unknown {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transformOperatorsInValue(item));
    }

    const result: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      // Transform $regex → $re
      if (key === '$regex') {
        result['$re'] = val;
        continue;
      }

      // Transform $all → $contains
      if (key === '$all') {
        result['$contains'] = val;
        continue;
      }

      // Recursively process other values
      result[key] = this.transformOperatorsInValue(val);
    }

    return result;
  }

  /**
   * Check if MongoDB query is empty
   */
  private isEmptyQuery(query: Record<string, unknown>): boolean {
    const keys = Object.keys(query);

    if (keys.length === 0) return true;

    // Check for {$or: [{}]} or {$and: [{}]} patterns
    if (keys.length === 1 && (keys[0] === '$or' || keys[0] === '$and')) {
      const value = query[keys[0]];
      if (Array.isArray(value)) {
        return value.every(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            Object.keys(item).length === 0
        );
      }
    }

    return false;
  }

  /**
   * Splits rules into those with @input templates and without
   * Rules with @input will be materialized lazily
   */
  private static splitRulesByInput<
    A extends AbilityTuple = AbilityTuple,
    C extends MongoQuery = MongoQuery
  >(
    rules: RawRuleFrom<A, C>[]
  ): {
    withoutInput: RawRuleFrom<A, C>[];
    withInput: RawRuleFrom<A, C>[];
  } {
    const withoutInput: RawRuleFrom<A, C>[] = [];
    const withInput: RawRuleFrom<A, C>[] = [];

    for (const rule of rules) {
      const jsonStr = JSON.stringify(rule);

      if (jsonStr.includes(ACL_INPUT_TEMPLATE)) {
        withInput.push(rule);
      } else {
        withoutInput.push(rule);
      }
    }

    return { withoutInput, withInput };
  }
}
