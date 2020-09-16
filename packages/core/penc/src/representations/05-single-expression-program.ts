import {allNodeKinds, Expression} from '../abstract-syntax-trees';


/**
 * TODO: jsdoc...
 */
export interface SingleExpressionProgram {
    readonly kind: 'SingleExpressionProgram';
    readonly startName: string;
    readonly subexpressions: Record<string, Expression>;
}


/** List of node kinds that may be present in a ?Program AST. */
export const singleExpressionNodeKinds = allNodeKinds.without(
    'AbstractSyntaxTree',
    'GlobalBinding',
    'LocalBinding',
    'LocalMultiBinding',
    'LocalReferenceExpression',
    'Module',
    'ParenthesisedExpression',
);
