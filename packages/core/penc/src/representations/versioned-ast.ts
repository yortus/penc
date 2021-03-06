import type {AbsPath} from '../utils';

// TODO next:
// - [x] two versions of Module with different `bindings` types (RAW=Array<Binding>, N1=Record<string, Expression>)
// - [x] WONTFIX (no need) Module --> File (for RAW files), Namespace (for nested modules)
// - [x] clarify Module/Namespace/Binding terminology
// - [x] support LetExpressions
// - [x] new AST version 300 - after resolution transform, no: LetExpression, GenericExpression
// - [ ] impl/doc necessary extra rules for v300/post-resolution:
//       - intrinsic generics: cannot take generics as arg(s)    TODO: what would it take to lift this restriction?
// - [ ] simplify special handling/synthesis of 'start' and 'ENTRYPOINT' ids
// - [ ] different node for resolved Identifiers?
// - [ ] Module: support extra type parameter to constrain the type of the bindings (default = Expression)
// - [ ] more AST versions? Rename versions?
// TODO: versions...
// - 100 = as written in the source code; all bindings are BindingLists
// - 200 = no Binding, ImportExpression, ParenthesisedExpression; all bindings are BindingMaps
// - TODO: resolved? flat?
export type Version = 100 | 200 | 300 | 400;


export interface AST<V extends Version = Version> {
    version: V;
    // TODO: jsdoc... special optional 'start' binding? Not doing that now, adding LetExpr syntax instead...
    start: {
        100: Module<V>; // for a single source file (for V100, each source file is in a separate AST)
        200: {
            kind: 'MemberExpression';
            module: {
                kind: 'MemberExpression';
                module: Module<V, Module<V>>; // TODO: doc... one binding per source file, vals are source file asts
                member: string; // TODO: doc... always moduleName of `main` source file (Expected to define `start`)
            };
            member: 'start';
        };
        300: LetExpression<V>;
        400: LetExpression<V>;
    }[V];
}


/** Union of all possible node types that may occur in a PEN AST. */
export type Node<V extends Version = Version> =
    | Expression<V>
    | Pattern<V>
    | Binding<V>
;


/** Union of all node types that represent PEN expressions. */
export type Expression<V extends Version = Version> =
    | BooleanLiteral
    | CodeExpression<V>
    | FieldExpression<V>
    | Identifier
    | ImportExpression<V>
    | InstantiationExpression<V>
    | Intrinsic
    | GenericExpression<V>
    | GenericParameter
    | LetExpression<V>
    | ListExpression<V>
    | MemberExpression<V>
    | Module<V>
    | NotExpression<V>
    | NullLiteral
    | NumericLiteral
    | ParenthesisedExpression<V>
    | QuantifiedExpression<V>
    | RecordExpression<V>
    | SelectionExpression<V>
    | SequenceExpression<V>
    | StringAbstract // TODO: rename
    | StringUniversal // TODO: rename
;


export type Subexpression<V extends Version = Version> = {
    100: Expression<V>;
    200: Expression<V>;
    300: Expression<V>; // TODO: try removing LetExpr from V300 subexpr?
    400: Identifier | GenericParameter;
}[V];


/** Union of all node types that bind names to expressions. */
export type Pattern<V extends Version = Version> =
    | ModulePattern<V>
;


export type Binding<V extends Version> = {
    100: {
        kind: 'Binding';
        left: Identifier | Pattern<V>;
        right: Expression<V>;
    };
    200: never;
    300: never;
    400: never;
}[V];


export interface BooleanLiteral {
    kind: 'BooleanLiteral';
    value: boolean;
}


export interface CodeExpression<V extends Version> {
    kind: 'CodeExpression';
    expression: Subexpression<V>;
}


export interface FieldExpression<V extends Version> {
    kind: 'FieldExpression';
    name: Subexpression<V>;
    value: Subexpression<V>;
}


export interface Identifier {
    kind: 'Identifier';
    name: string;
}


export type ImportExpression<V extends Version> = {
    100: {
        kind: 'ImportExpression';
        moduleSpecifier: string;
    };
    200: never;
    300: never;
    400: never;
}[V];


export interface InstantiationExpression<V extends Version> {
    kind: 'InstantiationExpression';
    generic: Subexpression<V>;
    argument: Subexpression<V>;
}


export interface Intrinsic {
    kind: 'Intrinsic';
    name: string;
    path: AbsPath;
}


export type GenericExpression<V extends Version> = {
    100: {
        kind: 'GenericExpression';
        param: Identifier | Pattern<V>;
        body: Subexpression<V>;
    };
    200: {
        kind: 'GenericExpression';
        param: string;
        body: LetExpression<V>;
    };
    300: {
        kind: 'GenericExpression';
        param: string;
        body: LetExpression<V>;
    };
    400: {
        kind: 'GenericExpression';
        param: string;
        body: LetExpression<V>;
    };
}[V];


export interface GenericParameter {
    kind: 'GenericParameter';
    name: string;
}


export interface LetExpression<V extends Version> {
    kind: 'LetExpression';
    expression: {
        100: Expression<V>;
        200: Expression<V>;
        300: Expression<V>;
        400: Identifier | GenericParameter;
    }[V];
    bindings: {
        100: BindingList<V>;
        200: BindingMap<V>;
        300: BindingMap<V>;
        400: BindingMap<V>;
    }[V];
}


export interface ListExpression<V extends Version> {
    kind: 'ListExpression';
    elements: Array<Subexpression<V>>;
}


export interface MemberExpression<V extends Version> {
    kind: 'MemberExpression';
    module: Subexpression<V>;
    member: string;
}


export interface Module<V extends Version, Value extends Expression<V> = Expression<V>> {
    kind: 'Module';
    bindings: {
        100: BindingList<V>;
        200: BindingMap<V, Value>;
        300: BindingMap<V, Identifier>;
        400: BindingMap<V, Identifier>;
    }[V];
}


export type ModulePattern<V extends Version> = {
    100: {
        kind: 'ModulePattern';
        names: Array<{
            name: string;
            alias?: string;
        }>;
    };
    200: never;
    300: never;
    400: never;
}[V];


export interface NotExpression<V extends Version> {
    kind: 'NotExpression';
    expression: Subexpression<V>;
}


export interface NullLiteral {
    kind: 'NullLiteral';
    value: null;
}


export interface NumericLiteral {
    kind: 'NumericLiteral';
    value: number;
}


export type ParenthesisedExpression<V extends Version> = {
    100: {
        kind: 'ParenthesisedExpression';
        expression: Subexpression<V>;
    };
    200: never;
    300: never;
    400: never;
}[V];


export interface QuantifiedExpression<V extends Version> {
    kind: 'QuantifiedExpression';
    expression: Subexpression<V>;
    quantifier: '?' | '*';
}


export interface RecordExpression<V extends Version> {
    kind: 'RecordExpression';
    fields: Array<{
        name: string;
        value: Subexpression<V>;
    }>;
}


export interface SelectionExpression<V extends Version> {
    kind: 'SelectionExpression';
    expressions: Array<Subexpression<V>>;
}


export interface SequenceExpression<V extends Version> {
    kind: 'SequenceExpression';
    expressions: Array<Subexpression<V>>;
}


export interface StringAbstract {
    kind: 'StringAbstract';
    value: string;
}


export interface StringUniversal {
    kind: 'StringUniversal';
    value: string;
}


export type BindingList<V extends Version> = Array<Binding<V>>;
export type BindingMap<V extends Version, Value extends Expression<V> = Expression<V>> = Record<string, Value>;
