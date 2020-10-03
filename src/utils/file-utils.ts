import { Tree } from '@angular-devkit/schematics';
import { Project, SourceFile } from 'ts-morph';

export function readSourceFile(tree: Tree, filePath: string): SourceFile {
    return new Project().createSourceFile(
        filePath,
        readFile(tree, filePath),
        { overwrite: true }
    );
}

export function readJsonFile(tree: Tree, filePath: string): any {
    return JSON.parse(readFile(tree, filePath));
}

export function readFile(tree: Tree, filePath: string): string {
    if (!tree.exists(filePath)) {
        throw new Error(`${filePath} does not exist.`);
    }

    // tslint:disable-next-line: no-non-null-assertion
    return tree.read(filePath)!.toString('utf-8');
}
