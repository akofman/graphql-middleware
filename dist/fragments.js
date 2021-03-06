"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
function extractFragmentReplacements(resolvers) {
    const allFragmentReplacements = [];
    /* Collect fragments. */
    for (const typeName in resolvers) {
        const fieldResolvers = resolvers[typeName];
        for (const fieldName in fieldResolvers) {
            const fieldResolver = fieldResolvers[fieldName];
            if (typeof fieldResolver === 'object' && fieldResolver.fragment) {
                allFragmentReplacements.push({
                    field: fieldName,
                    fragment: fieldResolver.fragment,
                });
            }
            if (typeof fieldResolver === 'object' && fieldResolver.fragments) {
                for (const fragment of fieldResolver.fragments) {
                    allFragmentReplacements.push({
                        field: fieldName,
                        fragment: fragment,
                    });
                }
            }
        }
    }
    /* Filter and map circular dependencies. */
    const fragmentReplacements = allFragmentReplacements
        .filter(fragment => Boolean(fragment))
        .map(fragmentReplacement => {
        const fragment = parseFragmentToInlineFragment(fragmentReplacement.fragment);
        const newSelections = fragment.selectionSet.selections.filter(node => {
            switch (node.kind) {
                case graphql_1.Kind.FIELD: {
                    return node.name.value !== fragmentReplacement.field;
                }
                default: {
                    return true;
                }
            }
        });
        if (newSelections.length === 0) {
            return null;
        }
        const newFragment = Object.assign(Object.assign({}, fragment), { selectionSet: {
                kind: fragment.selectionSet.kind,
                loc: fragment.selectionSet.loc,
                selections: newSelections,
            } });
        const parsedFragment = graphql_1.print(newFragment);
        return {
            field: fragmentReplacement.field,
            fragment: parsedFragment,
        };
    })
        .filter(fr => fr !== null);
    return fragmentReplacements;
    /* Helper functions */
    function parseFragmentToInlineFragment(definitions) {
        if (definitions.trim().startsWith('fragment')) {
            const document = graphql_1.parse(definitions);
            for (const definition of document.definitions) {
                if (definition.kind === graphql_1.Kind.FRAGMENT_DEFINITION) {
                    return {
                        kind: graphql_1.Kind.INLINE_FRAGMENT,
                        typeCondition: definition.typeCondition,
                        selectionSet: definition.selectionSet,
                    };
                }
            }
        }
        const query = graphql_1.parse(`{${definitions}}`)
            .definitions[0];
        for (const selection of query.selectionSet.selections) {
            if (selection.kind === graphql_1.Kind.INLINE_FRAGMENT) {
                return selection;
            }
        }
        throw new Error('Could not parse fragment');
    }
}
exports.extractFragmentReplacements = extractFragmentReplacements;
//# sourceMappingURL=fragments.js.map