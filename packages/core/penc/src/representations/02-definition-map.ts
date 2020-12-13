import {allNodeKinds, Expression} from '../ast-nodes';


// TODO: jsdoc...
export interface Definition {
    readonly definitionId: string; // TODO: doc... can be used as an identifier; unique across program
    readonly localName: string;
    readonly value: Expression;
}


// TODO: doc that Modules/Bindings are still present in this form and why, and that Identifier nodes are present only as
//   lhs of Binding nodes inside modules
/** A PEN program expressed as a map from definition IDs to `Definition` AST nodes. */
export interface DefinitionMap {
    // TODO: doc... keyed by defnId, special 'start' defnId is entry point
    readonly definitions: Record<string, Definition>;
}


/** List of node kinds that may be present in a DefinitionMap program representation. */
export const definitionMapNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'ImportExpression',
    'MemberExpression',
    'ModulePattern',
    'ParenthesisedExpression',
);