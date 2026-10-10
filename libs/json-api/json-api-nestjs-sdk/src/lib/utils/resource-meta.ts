/**
 * A JSON:API document carries meta in two distinct places, and both used to be
 * dropped on the way out of the SDK.
 *
 * `data[i].meta` belongs to one resource (JSON:API 1.1 §7.2) and differs from
 * row to row; the document's own `meta` describes the response as a whole.
 * Neither is part of the entity, so neither may land among its attributes: an
 * entity is free to have an attribute of its own called `meta`, and whatever
 * the SDK adds would travel back to the server on the next write.
 *
 * They are therefore kept beside the entity, on non-enumerable symbol
 * properties -- invisible to `Object.keys`, to spreads and to `JSON.stringify`,
 * the same way `EntityArray` hides its `pageProps`. The cost is that a copy
 * (`{ ...entity }`) leaves them behind, so read them off the object the SDK
 * handed back rather than off a clone of it.
 *
 * Document meta attaches to the container where there is one -- the
 * `EntityArray` of a list -- and to the entity itself where there is not, which
 * is every single-resource response.
 */
const RESOURCE_META = Symbol('json-api-resource-meta');
const DOCUMENT_META = Symbol('json-api-document-meta');

/** The shape assumed when the caller names none. */
export type ResourceMeta = Record<string, unknown>;

function attachMeta<T>(target: T, key: symbol, meta: unknown): T {
  if (meta === undefined || target === null || typeof target !== 'object') {
    return target;
  }

  Object.defineProperty(target, key, {
    value: meta,
    enumerable: false,
    writable: false,
    // Configurable so a later parse of the same object can replace it rather
    // than throwing.
    configurable: true,
  });

  return target;
}

function readMeta<M extends object>(
  target: unknown,
  key: symbol
): M | undefined {
  if (
    target === null ||
    (typeof target !== 'object' && typeof target !== 'function')
  ) {
    return undefined;
  }

  return Reflect.get(target as object, key) as M | undefined;
}

export function setResourceMeta<T>(target: T, meta: unknown): T {
  return attachMeta(target, RESOURCE_META, meta);
}

/**
 * The `meta` of the resource object this entity was parsed from, or undefined
 * when the server sent none -- and for any object the SDK did not produce.
 */
export function getResourceMeta<M extends object = ResourceMeta>(
  target: unknown
): M | undefined {
  return readMeta<M>(target, RESOURCE_META);
}

export function setDocumentMeta<T>(target: T, meta: unknown): T {
  return attachMeta(target, DOCUMENT_META, meta);
}

/**
 * The `meta` of the document the entity or list was parsed from. For a list it
 * reads off the returned `EntityArray`; for a single resource, off the entity.
 */
export function getDocumentMeta<M extends object = ResourceMeta>(
  target: unknown
): M | undefined {
  return readMeta<M>(target, DOCUMENT_META);
}
