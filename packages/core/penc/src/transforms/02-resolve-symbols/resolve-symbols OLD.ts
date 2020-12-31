import {allNodeKinds, Identifier} from '../../ast-nodes';
import {mapNode} from '../../ast-nodes';
import {AST, validateAST} from '../../representations';
import {assert, mapObj} from '../../utils';
import {createSymbolTable, Scope} from './symbol-table';


// TODO: jsdoc...
// - resolves all identifiers and member lookups
// - outputs the program as a single module (ie flat list of bindings)
// - all Identifiers refer to binding names in the single module
// - output contains *no* MemberExpressions (well it could actually, via extensions)
export function resolveSymbols(ast: AST): AST {
    validateAST(ast, inputNodeKinds);

    const {createScope, define, allSymbols, getSurroundingScope, lookup} = createSymbolTable();

    // STEP 1: Traverse the AST, creating a scope for each module, and a symbol for each binding name/value pair.
    const rootScope = createScope();
    let env: Scope | undefined;
    mapNode(ast.module, rec => ({ // NB: top-level return value isn't needed, since everything has a symbol by then.
        Module: module => {
            // Create a scope for the module, or use `rootScope` if this is _the_ top-level module.
            env = env ? createScope(env) : rootScope;

            // Create a symbol for each local name in the module.
            let bindings = {} as Record<string, Identifier>;
            for (const [name, expr] of Object.entries(module.bindings)) {
                const {globalName} = define(env, name, rec(expr));
                bindings[name] = {kind: 'Identifier', name: globalName};
            }

            // Pop back out to the surrounding scope before returning.
            env = getSurroundingScope(env);
            return {kind: 'Module', bindings};
        },
    }));

    // STEP 2: Resolve all Identifier nodes (except MemberExpression#member - that is resolved in STEP 3)
    for (let symbol of Object.values(allSymbols)) {
        if (symbol.value.kind === 'Module') continue;

        const newValue = mapNode(symbol.value, rec => ({
            Identifier: ({name}): Identifier => {
                const {globalName} = lookup(symbol.scope, name);
                return {kind: 'Identifier', name: globalName};
            },
            MemberExpression: mem => {
                const memᐟ = {...mem, module: rec(mem.module)};
                return memᐟ;
            },
            Module: mod => mod, // TODO: explain why skip modules - they are already processed in STEP 1 (all binding vals are Ids whose names are globalNames)
        }));
        Object.assign(symbol, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // STEP 3: Resolve all MemberExpression nodes
    for (let symbol of Object.values(allSymbols)) {
        const newValue = mapNode(symbol.value, rec => ({
            MemberExpression: ({module, member}): Identifier => {
                let lhs = module;
                while (true) {
                    if (lhs.kind === 'Identifier') {
                        lhs = allSymbols[lhs.name].value;
                    }
                    else if (lhs.kind === 'MemberExpression') {
                        lhs = rec(lhs);
                    }
                    else {
                        break;
                    }
                }
                // Lookup the name in the lhs Module. This lookup is different to an Identifier lookup, in that the name
                // must be local in the lhs Module, whereas Identifier lookups also look through the outer scope chain.
                assert(lhs.kind === 'Module');
                const id = lhs.bindings[member.name];
                if (!id) throw new Error(`'${member.name}' is not defined`); // TODO: improve diagnostic message eg line+col
                assert(id.kind === 'Identifier');
                return {...id};
            },
        }));
        Object.assign(symbol, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // TODO: add the special 'start' symbol
    allSymbols['start'] = {
        globalName: 'start',
        value: {kind: 'Identifier', name: lookup(rootScope, 'start').globalName},
        scope: rootScope,
    };

    ast = {
        module: {
            kind: 'Module',
            bindings: mapObj(allSymbols, symbol => symbol.value),
        },
    };
    validateAST(ast, outputNodeKinds);
    return ast;
}


/** List of node kinds that may be present in the input AST. */
const inputNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'ImportExpression',
    'ModulePattern',
    'ParenthesisedExpression',
);


/** List of node kinds that may be present in the output AST. */
const outputNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'ImportExpression',
    'MemberExpression', // TODO: but this _could_ still be present given extensions, right? Then input===output kinds
    'ModulePattern',
    'ParenthesisedExpression',
);