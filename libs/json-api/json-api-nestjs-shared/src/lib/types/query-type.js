"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Operation = exports.FilterOperandOnlySimple = exports.FilterOperandOnlyInNin = exports.FilterOperand = exports.QueryField = void 0;
var QueryField;
(function (QueryField) {
    QueryField["filter"] = "filter";
    QueryField["sort"] = "sort";
    QueryField["include"] = "include";
    QueryField["page"] = "page";
    QueryField["fields"] = "fields";
})(QueryField || (exports.QueryField = QueryField = {}));
var FilterOperand;
(function (FilterOperand) {
    FilterOperand["eq"] = "eq";
    FilterOperand["gt"] = "gt";
    FilterOperand["gte"] = "gte";
    FilterOperand["like"] = "like";
    FilterOperand["lt"] = "lt";
    FilterOperand["lte"] = "lte";
    FilterOperand["ne"] = "ne";
    FilterOperand["regexp"] = "regexp";
    FilterOperand["in"] = "in";
    FilterOperand["nin"] = "nin";
    FilterOperand["some"] = "some";
})(FilterOperand || (exports.FilterOperand = FilterOperand = {}));
var FilterOperandOnlyInNin;
(function (FilterOperandOnlyInNin) {
    FilterOperandOnlyInNin["in"] = "in";
    FilterOperandOnlyInNin["nin"] = "nin";
})(FilterOperandOnlyInNin || (exports.FilterOperandOnlyInNin = FilterOperandOnlyInNin = {}));
var FilterOperandOnlySimple;
(function (FilterOperandOnlySimple) {
    FilterOperandOnlySimple["eq"] = "eq";
    FilterOperandOnlySimple["gt"] = "gt";
    FilterOperandOnlySimple["gte"] = "gte";
    FilterOperandOnlySimple["like"] = "like";
    FilterOperandOnlySimple["lt"] = "lt";
    FilterOperandOnlySimple["lte"] = "lte";
    FilterOperandOnlySimple["ne"] = "ne";
    FilterOperandOnlySimple["regexp"] = "regexp";
})(FilterOperandOnlySimple || (exports.FilterOperandOnlySimple = FilterOperandOnlySimple = {}));
var Operation;
(function (Operation) {
    Operation["add"] = "add";
    Operation["update"] = "update";
    Operation["remove"] = "remove";
})(Operation || (exports.Operation = Operation = {}));
//# sourceMappingURL=query-type.js.map