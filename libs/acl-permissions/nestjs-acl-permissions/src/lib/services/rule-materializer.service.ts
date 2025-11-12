import { Inject, Injectable, Logger } from '@nestjs/common';
import { AbilityTuple, MongoQuery, RawRuleFrom } from '@casl/ability';
import type { AclInputData, AclModuleOptions } from '../types';
import { ACL_INPUT_VAR, ACL_INPUT_TEMPLATE } from '../types';
import { ACL_MODULE_OPTIONS } from '../constants';


/**
 * Service for materializing ACL rules by interpolating template variables
 *
 * Converts rules with templates like { userId: '${@input.userId}' }
 * into materialized rules with actual values like { userId: 123 }
 *
 * Uses Tagged Template Literals via Function for safe and efficient evaluation
 */
@Injectable()
export class RuleMaterializer {
   readonly logger = new Logger(RuleMaterializer.name);

  // Temporary placeholder to distinguish quotes inside strings from quotes around placeholders
  // Example: {"name":"John"} has quotes inside, but {"name":"${userName}"} has placeholder quotes
  private readonly QUOTE_PLACEHOLDER = '\u0000QUOTE\u0000';
  @Inject(ACL_MODULE_OPTIONS) private readonly options!: AclModuleOptions;

  private get strictMode(): boolean {
    return !this.options ? true : !!this.options.strictInterpolation
  }

  /**
   * Materializes ACL rules by replacing template variables with actual values
   *
   * @param rules - Array of rules with template strings
   * @param context - Variables from getContext()
   * @param helpers - Helper functions from getHelpers()
   * @param input - External input data (available as @input in templates)
   * @returns Materialized rules with interpolated values
   *
   * TODO: Support old/current values in addition to new input
   * For patchOne operations, we need access to both:
   * - @input.* - new values from request
   * - @input.__current.* - old values from database
   * This enables rules like "allow removing only self from array"
   *
   * @example
   * ```typescript
   * const rules = [{ conditions: { userId: '${@input.id}' } }];
   * const context = { currentUserId: 123 };
   * const helpers = {};
   * const input = { id: 456 };
   *
   * const materialized = materializer.materialize(rules, context, helpers, input);
   * // Result: [{ conditions: { userId: 456 } }]
   * ```
   */


  materialize<
    A extends AbilityTuple = AbilityTuple,
    C extends MongoQuery = MongoQuery
  >(
    rules: RawRuleFrom<A, C>[],
    context: Record<string, any>,
    helpers: Record<string, Function>,
    input?: AclInputData,
  ): RawRuleFrom<A, C>[] {

    // In strict mode, wrap input in Proxy to catch undefined property access
    const inputData = input || {};
    const wrappedInput = this.strictMode
      ? this.createStrictProxy(inputData, ACL_INPUT_VAR)
      : inputData;

    // Build scope with context, helpers, and input (without @)
    const scope = {
      ...context,
      ...helpers,
      [ACL_INPUT_VAR]: wrappedInput, // 'input' not '@input'
    };

    try {

      // Convert rules to JSON string
      let jsonStr = JSON.stringify(rules, (k, v) => k === 'subject' && typeof v === 'function' ? v.name : v);

      // Replace @input with input (@ is not valid in JS variable names)
      jsonStr = jsonStr.replaceAll(
        ACL_INPUT_TEMPLATE,
        ACL_INPUT_VAR,
      );

      // Replace \" with ' inside ${...} template expressions
      // JSON.stringify escapes quotes as \" but inside template expressions we need '
      // Example: ${checkStatus(user.status, \"active\")} → ${checkStatus(user.status, 'active')}
      jsonStr = jsonStr.replace(/\$\{([^}]+)\}/g, (match, expr) => {
        const fixedExpr = expr.replace(/\\"/g, "'");
        return `\${${fixedExpr}}`;
      });

      // Replace remaining \" with placeholder (outside of ${...})
      // This helps distinguish quotes around placeholders from quotes inside string values
      jsonStr = jsonStr.replace(/\\"/g, this.QUOTE_PLACEHOLDER);

      // Escape backticks for template literal
      jsonStr = this.escapeForTemplateLiteral(jsonStr);
      this.logger.debug(`JSON template prepared: ${jsonStr.substring(0, 200)}...`);

      // Evaluate using tagged template
      const result = this.evaluateTaggedTemplate(jsonStr, scope);

      // Parse back to object
      const materialized = JSON.parse(result) as RawRuleFrom<A, C>[];

      this.logger.debug(
        `Materialized ${rules.length} rule(s) successfully`,
      );

      return materialized;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.handleError(errorMessage, scope);
      throw error; // Re-throw after logging
    }
  }

  /**
   * Escapes special characters for use in template literal
   */
  private escapeForTemplateLiteral(str: string): string {
    return (
      str
        // Escape backticks only
        // Don't escape $ because we WANT ${...} to work as template expressions
        .replace(/`/g, '\\`')
    );
  }

  /**
   * Evaluates JSON template using Tagged Template Literals
   *
   * Uses a tagged function that correctly formats different types:
   * - strings → wrapped in quotes
   * - arrays → JSON.stringify
   * - numbers/booleans → as-is
   */
  private evaluateTaggedTemplate(
    jsonTemplate: string,
    scope: Record<string, any>,
  ): string {
    const scopeKeys = Object.keys(scope);
    const scopeValues = Object.values(scope);

    // Tagged template function that handles type formatting
    const taggedFunc = this.createTaggedFunction();

    // Create function: taggedFunc`${userId}${groupIds}...`
    // Example: new Function('tag', 'userId', 'groupIds', 'return tag`...${userId}...${groupIds}...`')
    const functionBody = `return tag\`${jsonTemplate}\`;`;

    // Debug logging
    if (functionBody.length > 500) {
      this.logger.debug(`Function body (first 500 chars): ${functionBody.substring(0, 500)}`);
    } else {
      this.logger.debug(`Function body: ${functionBody}`);
    }

    const evalFn = new Function(
      'tag',
      ...scopeKeys,
      functionBody,
    );

    // Execute with tagged function and scope values
    const result = evalFn(taggedFunc, ...scopeValues);

    return result;
  }

  /**
   * Creates tagged template function that formats placeholders by type
   *
   * IMPORTANT: Values are already inside JSON string quotes from stringify
   * We need to REMOVE the quotes and insert raw JSON values
   */
  private createTaggedFunction(): (
    literals: TemplateStringsArray,
    ...placeholders: any[]
  ) => string {
    return (literals: TemplateStringsArray, ...placeholders: any[]) => {
      let result = '';
      const placeholdersLength = placeholders.length;

      for (let i = 0; i < placeholdersLength; i++) {
        let literal = literals[i];

        // Restore placeholder back to \"
        literal = literal.replace(
          new RegExp(this.QUOTE_PLACEHOLDER, 'g'),
          '\\"',
        );

        // Check if literal ends with opening quote: "
        // If so, we need to remove it and the closing quote from next literal
        const endsWithQuote = literal.endsWith('"');
        if (endsWithQuote) {
          literal = literal.slice(0, -1); // Remove trailing "
        }

        result += literal;

        const value = placeholders[i];

        // Format value based on type
        if (value === null) {
          result += 'null';
        } else if (value === undefined) {
          result += 'null'; // JSON doesn't have undefined
        } else if (typeof value === 'string') {
          // Escape quotes and special characters for JSON string
          const escaped = value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          result += `"${escaped}"`;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          result += String(value);
        } else if (Array.isArray(value)) {
          result += JSON.stringify(value);
        } else if (value instanceof Date) {
          result += `"${value.toISOString()}"`;
        } else if (typeof value === 'object') {
          result += JSON.stringify(value);
        } else {
          // Fallback
          result += JSON.stringify(value);
        }

        // Handle closing quote if we removed opening quote
        if (endsWithQuote && i + 1 < literals.length) {
          const nextLiteral = literals[i + 1];
          if (nextLiteral.startsWith('"')) {
            // Skip the closing quote
            literals = Object.assign([], literals, {
              [i + 1]: nextLiteral.slice(1),
            }) as any;
          }
        }
      }

      // Add final literal (restore placeholder here too)
      let finalLiteral = literals[literals.length - 1];
      finalLiteral = finalLiteral.replace(
        new RegExp(this.QUOTE_PLACEHOLDER, 'g'),
        '\\"',
      );
      result += finalLiteral;

      return result;
    };
  }

  /**
   * Creates strict Proxy that throws error on undefined property access
   * Used in strict mode to catch template errors early
   */
  private createStrictProxy<T extends Record<string, any>>(
    obj: T,
    name: string,
  ): T {
    return new Proxy(obj, {
      get: (target, prop: string | symbol) => {
        // Allow symbol properties (like Symbol.toStringTag, Symbol.iterator, etc.)
        if (typeof prop === 'symbol') {
          return target[prop as any];
        }

        // Check if property exists
        if (!(prop in target)) {
          throw new ReferenceError(
            `Property '${name}.${String(prop)}' is not defined in strict mode`,
          );
        }

        const value = target[prop];

        // If value is an object, wrap it in Proxy too (for nested access)
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return this.createStrictProxy(value, `${name}.${String(prop)}`);
        }

        return value;
      },
    });
  }

  /**
   * Handles interpolation errors based on strict mode
   */
  private handleError(
    errorMessage: string,
    scope: Record<string, any>,
  ): void {
    const scopeInfo = `Available variables: ${Object.keys(scope).join(', ')}`;
    const fullMessage = `Failed to materialize rules: ${errorMessage}. ${scopeInfo}`;

    if (this.strictMode) {
      this.logger.error(fullMessage);
    } else {
      this.logger.warn(fullMessage);
    }
  }
}
