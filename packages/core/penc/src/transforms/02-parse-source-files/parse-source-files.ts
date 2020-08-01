import * as fs from 'fs';
import {Module, Program, SourceFile} from '../../ast-nodes';
import {isExtension, mapMap} from '../../utils';
import {SourceFileGraph} from '../01-create-source-file-graph';
import {parse as parseExtension} from './extension-grammar';
import {parse as parsePenSource} from './pen-grammar';


export function parseSourceFiles(sourceFileGraph: SourceFileGraph): Program {
    let sourceFiles = mapMap(sourceFileGraph.sourceFiles, (sourceFile): SourceFile => {
        let sourceText = fs.readFileSync(sourceFile.path, 'utf8');
        let module: Module;
        if (!isExtension(sourceFile.path)) {
            module = parsePenSource(sourceText, {sourceFile});
        }
        else {
            let {exportedNames} = parseExtension(sourceText);
            module = {
                kind: 'Module',
                bindings: exportedNames.map(name => ({
                    kind: 'SimpleBinding',
                    name,
                    value: {
                        kind: 'ExtensionExpression',
                        extensionPath: sourceFile.path,
                        bindingName: name,
                        meta: {},
                    },
                    exported: true,
                    meta: {},
                })),
                meta: {},
            };
        }
        return {
            kind: 'SourceFile',
            path: sourceFile.path,
            module,
            meta: {},
        };
    });
    return {
        kind: 'Program',
        sourceFiles,
        mainPath: sourceFileGraph.mainPath,
        meta: {},
    };
}
