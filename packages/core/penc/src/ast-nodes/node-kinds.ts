import {createNodeKinds} from './utils';


/** Array of all node kinds which are patterns. */
export const patternNodeKinds = createNodeKinds(
    'ModulePattern',
);


/** Array of all node kinds which are expressions. */
export const expressionNodeKinds = createNodeKinds(
    'ApplicationExpression',
    'BooleanLiteral',
    'BindingList',
    'FieldExpression',
    'Identifier',
    'ImportExpression',
    'Intrinsic',
    'LambdaExpression',
    'ListExpression',
    'MemberExpression',
    'Module',
    'NotExpression',
    'NullLiteral',
    'NumericLiteral',
    'ParenthesisedExpression',
    'QuantifiedExpression',
    'RecordExpression',
    'SelectionExpression',
    'SequenceExpression',
    'StringLiteral',
);


/** Array of all node kinds. */
export const allNodeKinds = createNodeKinds(
    'Binding',
    ...patternNodeKinds,
    ...expressionNodeKinds,
);