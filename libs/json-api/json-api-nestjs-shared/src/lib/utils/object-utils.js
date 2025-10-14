"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntityName = exports.ObjectTyped = void 0;
exports.isObject = isObject;
exports.isString = isString;
exports.createEntityInstance = createEntityInstance;
const change_case_commonjs_1 = require("change-case-commonjs");
exports.ObjectTyped = {
    keys: Object.keys,
    values: Object.values,
    entries: Object.entries,
    fromEntries: Object.fromEntries,
};
function isObject(item) {
    return typeof item === 'object' && !Array.isArray(item) && item !== null;
}
function isString(value) {
    return typeof value === 'string' || value instanceof String;
}
function createEntityInstance(name) {
    const entityName = (0, change_case_commonjs_1.pascalCase)(name);
    return Function('return new class ' + entityName + '{}')();
}
const getEntityName = (entity) => {
    if (entity === null)
        throw new Error('Entity is null');
    if (typeof entity === 'string') {
        return entity;
    }
    if (typeof entity === 'object' && 'name' in entity) {
        return `${entity['name']}`;
    }
    if (typeof entity === 'object' &&
        'constructor' in entity &&
        'name' in entity.constructor) {
        return entity['constructor']['name'];
    }
    if (typeof entity === 'function' &&
        'constructor' in entity.prototype &&
        'name' in entity.prototype.constructor) {
        return entity.prototype.constructor.name;
    }
    throw new Error('Entity is not object');
};
exports.getEntityName = getEntityName;
//# sourceMappingURL=object-utils.js.map