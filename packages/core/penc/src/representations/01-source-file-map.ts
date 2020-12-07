import {allNodeKinds, BindingList} from '../abstract-syntax-trees';


// TODO: revise outdated jsdoc...
/** A PEN program expressed as a mapping from absolute paths to `SourceFile` AST nodes. */
export interface SourceFileMap {
    readonly sourceFilesByPath: Record<string, BindingList>;
    readonly startPath: string;
}


/** List of node kinds that may be present in a SourceFileMap program representation. */
export const sourceFileMapKinds = allNodeKinds.without(
    'Definition',
    'Module',
    'Reference',
);
