import {allNodeKinds, Definition} from '../abstract-syntax-trees';


/** A PEN program expressed as a map from definition IDs to `Definition` AST nodes. */
export interface DefinitionMap {
    readonly definitionsById: Record<string, Definition>;
    readonly startDefinitionId: string;
}


/** List of node kinds that may be present in a DefinitionMap program representation. */
export const definitionMapKinds = allNodeKinds.without(
    'Binding',
    'Identifier',
    'Module',
    'MemberExpression',
    'ModuleExpression',
    'ModulePattern',
    'SourceFile',
);