import {CompilerOptions} from './compiler-options';
import {createSourceFileGraph} from './transforms';
import {parseSourceFiles} from './transforms';
import {createSymbolDefinitions} from './transforms';
import {resolveSymbolReferences} from './transforms';


export function compile(compilerOptions: CompilerOptions) {
    let sourceFiles = createSourceFileGraph(compilerOptions);
    let ast01 = parseSourceFiles(sourceFiles);
    let ast02 = createSymbolDefinitions(ast01);
    let ast03 = resolveSymbolReferences(ast02);
    return ast03;
}