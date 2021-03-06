"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const utils_1 = require("./utils");
// Applicator
function wrapResolverInMiddleware(resolver, middleware) {
    return (parent, args, ctx, info) => middleware((_parent = parent, _args = args, _ctx = ctx, _info = info) => resolver(_parent, _args, _ctx, _info), parent, args, ctx, info);
}
function applyMiddlewareToField(field, options, middleware) {
    if (utils_1.isMiddlewareWithFragment(middleware) &&
        field.resolve &&
        field.resolve !== graphql_1.defaultFieldResolver) {
        return Object.assign(Object.assign({}, field), { fragment: middleware.fragment, fragments: middleware.fragments, resolve: wrapResolverInMiddleware(field.resolve, middleware.resolve) });
    }
    else if (utils_1.isMiddlewareWithFragment(middleware) && field.subscribe) {
        return Object.assign(Object.assign({}, field), { fragment: middleware.fragment, fragments: middleware.fragments, subscribe: wrapResolverInMiddleware(field.subscribe, middleware.resolve) });
    }
    else if (utils_1.isMiddlewareResolver(middleware) &&
        field.resolve &&
        field.resolve !== graphql_1.defaultFieldResolver) {
        return Object.assign(Object.assign({}, field), { resolve: wrapResolverInMiddleware(field.resolve, middleware) });
    }
    else if (utils_1.isMiddlewareResolver(middleware) && field.subscribe) {
        return Object.assign(Object.assign({}, field), { subscribe: wrapResolverInMiddleware(field.subscribe, middleware) });
    }
    else if (utils_1.isMiddlewareWithFragment(middleware) &&
        !options.onlyDeclaredResolvers) {
        return Object.assign(Object.assign({}, field), { fragment: middleware.fragment, fragments: middleware.fragments, resolve: wrapResolverInMiddleware(graphql_1.defaultFieldResolver, middleware.resolve) });
    }
    else if (utils_1.isMiddlewareResolver(middleware) &&
        !options.onlyDeclaredResolvers) {
        return Object.assign(Object.assign({}, field), { resolve: wrapResolverInMiddleware(graphql_1.defaultFieldResolver, middleware) });
    }
    else {
        return Object.assign(Object.assign({}, field), { resolve: graphql_1.defaultFieldResolver });
    }
}
function applyMiddlewareToType(type, options, middleware) {
    const fieldMap = type.getFields();
    if (utils_1.isMiddlewareFunction(middleware)) {
        const resolvers = Object.keys(fieldMap).reduce((resolvers, fieldName) => (Object.assign(Object.assign({}, resolvers), { [fieldName]: applyMiddlewareToField(fieldMap[fieldName], options, middleware) })), {});
        return resolvers;
    }
    else {
        const resolvers = Object.keys(middleware).reduce((resolvers, field) => (Object.assign(Object.assign({}, resolvers), { [field]: applyMiddlewareToField(fieldMap[field], options, middleware[field]) })), {});
        return resolvers;
    }
}
function applyMiddlewareToSchema(schema, options, middleware) {
    const typeMap = schema.getTypeMap();
    const resolvers = Object.keys(typeMap)
        .filter(type => utils_1.isGraphQLObjectType(typeMap[type]) &&
        !graphql_1.isIntrospectionType(typeMap[type]))
        .reduce((resolvers, type) => (Object.assign(Object.assign({}, resolvers), { [type]: applyMiddlewareToType(typeMap[type], options, middleware) })), {});
    return resolvers;
}
// Generator
function generateResolverFromSchemaAndMiddleware(schema, options, middleware) {
    if (utils_1.isMiddlewareFunction(middleware)) {
        return applyMiddlewareToSchema(schema, options, middleware);
    }
    else {
        const typeMap = schema.getTypeMap();
        const resolvers = Object.keys(middleware).reduce((resolvers, type) => (Object.assign(Object.assign({}, resolvers), { [type]: applyMiddlewareToType(typeMap[type], options, middleware[type]) })), {});
        return resolvers;
    }
}
exports.generateResolverFromSchemaAndMiddleware = generateResolverFromSchemaAndMiddleware;
//# sourceMappingURL=applicator.js.map