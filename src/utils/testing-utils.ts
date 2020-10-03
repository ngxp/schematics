import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as fs from 'fs';
import * as path from 'path';

export function runSchematic(schematicName: string, options = {}): Promise<Tree> {
    const sandboxWorkspacePath = path.join(__dirname, '../../sandbox');
    const workspaceTree = createWorkspaceTree(sandboxWorkspacePath);
    const collectionPath = path.join(__dirname, '../collection.json');
    const runner = new SchematicTestRunner('@ngxp/schematics', collectionPath);
    return runner.runSchematicAsync(schematicName, options, workspaceTree).toPromise();
}

function createWorkspaceTree(workspaceDirectory: string): Tree {
    const tree = Tree.empty();

    getWorkspaceFiles(workspaceDirectory)
        .forEach(({ path: filePath, content }) => tree.create(filePath, content))

    return tree;
}

interface File {
    path: string;
    content: Buffer | string;
}

function getWorkspaceFiles(workspaceDirectory: string): File[] {
    return getFilePaths(
        workspaceDirectory,
        fileName => !['dist', 'node_modules'].includes(fileName)
    )
        .map(filePath => toFile(workspaceDirectory, filePath));
}

function getFilePaths(directoryPath: string, filter = (_: string) => true): string[] {
    return fs.readdirSync(directoryPath)
        .filter(filter)
        .flatMap(file => {
            const fullPath = path.join(directoryPath, file);
            return isDirectory(fullPath) ? getFilePaths(fullPath, filter) : fullPath;
        });
}

function isDirectory(filePath: string) {
    return fs.lstatSync(filePath).isDirectory();
}

function toFile(basePath: string, filePath: string): File {
    return {
        path: path.relative(basePath, filePath).replace(/\\/g, '/'),
        content: fs.readFileSync(filePath)
    };
}
