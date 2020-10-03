import { Tree } from '@angular-devkit/schematics';
import { readJsonFile } from './file-utils';

export type StyleExt = | 'css' | 'scss' | 'sass' | 'less' | 'styl';

export interface AngularJson {
    projects: {
        [key: string]: {
            schematics: {
                [key: string]: {
                    style: StyleExt
                }
            }
        }
    }
    cli: {
        defaultCollection: string;
    }
    schematics: {
        [key: string]: {
            [key: string]: any
        }
    }
}

export function readAngularJson(tree: Tree): AngularJson {
    return readJsonFile(tree, 'angular.json');
}
