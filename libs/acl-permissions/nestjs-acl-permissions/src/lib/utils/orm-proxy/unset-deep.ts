/**
 * Removes a property from an object using dot notation path
 * Similar to lodash.unset()
 *
 * @example
 * const obj = { a: { b: { c: 1 } } };
 * unsetDeep(obj, 'a.b.c');
 * // obj = { a: { b: {} } }
 *
 * @param obj - The object to modify
 * @param path - The path of the property to unset (e.g., 'profile.phone')
 */
export function unsetDeep<T extends object>(obj: T, path: string): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  const keys = path.split('.');

  // Navigate to parent object
  let current: any = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (current[key] === null || current[key] === undefined) {
      // Path doesn't exist, nothing to unset
      return;
    }

    if (typeof current[key] !== 'object') {
      // Path is invalid (trying to access property of primitive)
      return;
    }

    current = current[key];
  }

  // Delete the final property
  const lastKey = keys[keys.length - 1];
  if (current && typeof current === 'object' && lastKey in current) {
    delete current[lastKey];
  }
}