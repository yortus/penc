import {Node, Program} from '../../ast-nodes';
import {SymbolTable} from '../../symbol-table';
import {assert, makeNodeMapper, mapMap} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function createSymbolDefinitions(program: Program) {
    const symbolTable = new SymbolTable();
    const rootScope = symbolTable.getRootScope();
    let currentScope = rootScope;
    let mapNode = makeNodeMapper<Node, Node<Metadata>>();
    let result = mapNode(program, rec => ({

        // Attach the symbol table to the Program node.
        Program: prg => {
            let prgᐟ = {...prg, sourceFiles: mapMap(prg.sourceFiles, rec), meta: {rootScope, symbolTable}};
            return prgᐟ;
        },

        // Attach a scope to each Module node. Also generate a symbol for the module itself.
        Module: mod => {
            let scope = currentScope = symbolTable.createChildScope(currentScope, 'module');
            let modᐟ = {...mod, bindings: mod.bindings.map(rec), meta: {scope}};
            currentScope = scope.parent;
            return modᐟ;
        },

        // Attach a scope to each ExtensionFile node, and define a symbol for the file and for each of its exports.
        ExtensionFile: ext => {
            let scope = currentScope = symbolTable.createChildScope(currentScope, 'extension');
            ext.exportedNames.forEach(name => symbolTable.create(name, scope));
            let extᐟ = {...ext, meta: {scope}};
            currentScope = scope.parent;
            return extᐟ;
        },

        // Attach a symbol to each VariablePattern and ModulePatternName node.
        VariablePattern: pat => {
            let symbol = symbolTable.create(pat.name, currentScope);
            let patternᐟ = {...pat, meta: {symbolId: symbol.id}};
            return patternᐟ;
        },
        ModulePatternName: name => {
            let symbol = symbolTable.create(name.alias || name.name, currentScope);
            let nameᐟ = {...name, meta: {symbolId: symbol.id}};
            return nameᐟ;
        },
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === rootScope);

    // All done.
    return result;
}
