export declare enum QueryField {
    filter = "filter",
    sort = "sort",
    include = "include",
    page = "page",
    fields = "fields"
}
export declare enum FilterOperand {
    eq = "eq",
    gt = "gt",
    gte = "gte",
    like = "like",
    lt = "lt",
    lte = "lte",
    ne = "ne",
    regexp = "regexp",
    in = "in",
    nin = "nin",
    some = "some"
}
export declare enum FilterOperandOnlyInNin {
    in = "in",
    nin = "nin"
}
export declare enum FilterOperandOnlySimple {
    eq = "eq",
    gt = "gt",
    gte = "gte",
    like = "like",
    lt = "lt",
    lte = "lte",
    ne = "ne",
    regexp = "regexp"
}
export declare enum Operation {
    add = "add",
    update = "update",
    remove = "remove"
}
