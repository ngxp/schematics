import { Tree } from '@angular-devkit/schematics/src/tree/interface';
import { NxJson } from '@nrwl/workspace';
import { readJsonFile } from './file-utils';

export function getNpmScope(tree: Tree) {
    return readNxJson(tree).npmScope;
}

function readNxJson(tree: Tree): NxJson {
    return readJsonFile(tree, 'nx.json');
}