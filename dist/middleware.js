"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tools_1 = require("graphql-tools");
const applicator_1 = require("./applicator");
const validation_1 = require("./validation");
const fragments_1 = require("./fragments");
const utils_1 = require("./utils");
/**
 *
 * @param schema
 * @param options
 * @param middleware
 *
 * Validates middleware and generates resolvers map for provided middleware.
 * Applies middleware to the current schema and returns the modified one.
 *
 */
function addMiddlewareToSchema(schema, options, middleware) {
    const validMiddleware = validation_1.validateMiddleware(schema, middleware);
    const resolvers = applicator_1.generateResolverFromSchemaAndMiddleware(schema, options, validMiddleware);
    const fragmentReplacements = fragments_1.extractFragmentReplacements(resolvers);
    return { schema: graphql_tools_1.mergeSchemas({
            schemas: [schema],
            resolvers
        }), fragmentReplacements };
}
exports.addMiddlewareToSchema = addMiddlewareToSchema;
/**
 *
 * @param schema
 * @param options
 * @param middlewares
 *
 * Generates middleware from middleware generators and applies middleware to
 * resolvers. Returns generated schema with all provided middleware.
 *
 */
function applyMiddlewareWithOptions(schema, options, ...middlewares) {
    const normalisedMiddlewares = middlewares.map(middleware => {
        if (utils_1.isMiddlewareGenerator(middleware)) {
            return middleware.generate(schema);
        }
        else {
            return middleware;
        }
    });
    const schemaWithMiddlewareAndFragmentReplacements = normalisedMiddlewares.reduceRight(({ schema: currentSchema, fragmentReplacements: currentFragmentReplacements, }, middleware) => {
        const { schema: newSchema, fragmentReplacements: newFragmentReplacements, } = addMiddlewareToSchema(currentSchema, options, middleware);
        return {
            schema: newSchema,
            fragmentReplacements: [
                ...currentFragmentReplacements,
                ...newFragmentReplacements,
            ],
        };
    }, { schema, fragmentReplacements: [] });
    const schemaWithMiddleware = schemaWithMiddlewareAndFragmentReplacements.schema;
    schemaWithMiddleware.schema =
        schemaWithMiddlewareAndFragmentReplacements.schema;
    schemaWithMiddleware.fragmentReplacements =
        schemaWithMiddlewareAndFragmentReplacements.fragmentReplacements;
    return schemaWithMiddleware;
}
// Exposed functions
/**
 *
 * @param schema
 * @param middlewares
 *
 * Apply middleware to resolvers and return generated schema.
 *
 */
function applyMiddleware(schema, ...middlewares) {
    return applyMiddlewareWithOptions(schema, { onlyDeclaredResolvers: false }, ...middlewares);
}
exports.applyMiddleware = applyMiddleware;
/**
 *
 * @param schema
 * @param middlewares
 *
 * Apply middleware to declared resolvers and return new schema.
 *
 */
function applyMiddlewareToDeclaredResolvers(schema, ...middlewares) {
    return applyMiddlewareWithOptions(schema, { onlyDeclaredResolvers: true }, ...middlewares);
}
exports.applyMiddlewareToDeclaredResolvers = applyMiddlewareToDeclaredResolvers;
//# sourceMappingURL=middleware.js.map