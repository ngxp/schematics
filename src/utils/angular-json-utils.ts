import { Tree } from '@angular-devkit/schematics';
import { readJsonFile } from './file-utils';

export interface AngularJson {
    cli: {
        defaultCollection: string;
    };
}

export function readAngularJson(tree: Tree): AngularJson {
    return readJsonFile(tree, 'angular.json');
}
