import { apply, chain, externalSchematic, MergeStrategy, mergeWith, move, Rule, template, Tree, url } from '@angular-devkit/schematics';
import { toFileName, updateJsonInTree } from '@nrwl/workspace';
import { getNpmScope } from '../utils/nx-json-utils';
import { LibrarySchema } from './schema';

export default function (options: LibrarySchema): Rule {
    const name = toFileName(options.name);
    const projectDirectory = options.directory ? `${toFileName(options.directory)}/${name}` : name;
    const projectSrcPath = `libs/${projectDirectory}/src`;

    return chain([
        externalSchematic('@nrwl/angular', 'library', options),
        addTestingFiles(projectSrcPath),
        addTestingPathMappingToTsConfig(projectDirectory),
        addEnforceModuleBoundariesExceptionToTslint(projectDirectory)
    ]);
}

function addTestingFiles(projectSrcPath: string) {
    return mergeWith(
        apply(url('./files'), [
            template({}),
            move(projectSrcPath)
        ]),
        MergeStrategy.Error
    );
}

function addTestingPathMappingToTsConfig(projectDirectory: string) {
    return updateJsonFile(
        'tsconfig.base.json',
        (json, tree) => json.compilerOptions.paths[getLibraryTestingModuleName(tree, projectDirectory)] = [
            `libs/${projectDirectory}/src/testing/index.ts`
        ]
    );
}

function addEnforceModuleBoundariesExceptionToTslint(projectDirectory: string) {
    return updateJsonFile(
        'tslint.json',
        (json, tree) => json.rules['nx-enforce-module-boundaries'][1].allow.push(
            getLibraryTestingModuleName(tree, projectDirectory)
        )
    );
}

type JsonFileUpdater = (json: any, tree: Tree) => void;

function updateJsonFile(filePath: string, update: JsonFileUpdater) {
    return (tree: Tree) => {
        return updateJsonInTree(filePath, json => {
            update(json, tree);
            return json;
        });
    }
}

const getLibraryTestingModuleName = (tree: Tree, projectDirectory: string) => `@${getNpmScope(tree)}/${projectDirectory}/testing`;