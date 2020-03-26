import { Tree } from '@angular-devkit/schematics';
import { Project } from 'ts-morph';

export function getFile(tree: Tree, componentPath: string) {
    // tslint:disable-next-line: no-non-null-assertion
    const sourceText = tree.read(componentPath)!.toString('utf-8');
    const project = new Project();
    return project.createSourceFile(componentPath, sourceText, {
        overwrite: true
    });
}