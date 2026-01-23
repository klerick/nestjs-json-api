import { MethodName } from '../../types';

export const JSON_API_RESPONSE_FROM = 'JSON_API_RESPONSE_FROM';

export interface StatusMapping {
  fromStatus: number;
  toStatus: number;
}

// { [targetMethod: string]: { [sourceMethod: string]: StatusMapping[] } }
export type SourceMethodStatuses = { [K in MethodName]?: StatusMapping[] };
export type JsonApiResponseFromMeta = { [targetMethod: string]: SourceMethodStatuses };

/**
 * Decorator to copy response schema from another JSON API method
 * @param sourceMethod - name of the source method (e.g., 'getOne', 'getAll')
 * @param fromStatus - HTTP status code to copy from source method
 * @param toStatus - HTTP status code to apply to target method (defaults to fromStatus)
 */
export function JsonApiResponseFrom(
  sourceMethod: MethodName,
  fromStatus: number,
  toStatus?: number
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const targetMethod = String(propertyKey);
    const existingMeta: JsonApiResponseFromMeta =
      Reflect.getMetadata(JSON_API_RESPONSE_FROM, target.constructor) || {};

    if (!existingMeta[targetMethod]) {
      existingMeta[targetMethod] = {};
    }

    if (!existingMeta[targetMethod][sourceMethod]) {
      existingMeta[targetMethod][sourceMethod] = [];
    }
    const currentSourceArray = existingMeta[targetMethod][sourceMethod];

    const mapping: StatusMapping = {
      fromStatus,
      toStatus: toStatus ?? fromStatus,
    };

    const exists = currentSourceArray.some(
      (m) =>
        m.fromStatus === mapping.fromStatus && m.toStatus === mapping.toStatus
    );

    if (!exists) {
      currentSourceArray.push(mapping);
    }

    Reflect.defineMetadata(
      JSON_API_RESPONSE_FROM,
      existingMeta,
      target.constructor
    );

    return descriptor;
  };
}
