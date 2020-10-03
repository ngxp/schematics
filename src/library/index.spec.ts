import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { readJsonFile } from '../utils/file-utils';
import { runSchematic, sandboxNpmScope } from '../utils/testing-utils';
import { LibrarySchema } from './schema';

describe('library', () => {
    const name = 'TestLibrary';
    const libraryDirectoryName = dasherize(name);
    const libraryModuleName = `${sandboxNpmScope}/${libraryDirectoryName}`;
    const libraryRootPath = `libs/${libraryDirectoryName}/`;
    const librarySrcPath = `${libraryRootPath}src/`;

    const options: LibrarySchema = {
        name
    };

    it('adds boilerplate files for test data and mocks', async () => {
        const tree = await runSchematic('library', options);

        expect(tree.exists(`${librarySrcPath}testing/index.ts`)).toBeTrue();
        expect(tree.exists(`${librarySrcPath}testing/data/index.ts`)).toBeTrue();
    });

    it('adds a path mapping for @…/…/testing to tsconfig.base.json', async () => {
        const tree = await runSchematic('library', options);

        const tsconfig = readJsonFile(tree, 'tsconfig.base.json');
        expect(tsconfig.compilerOptions.paths[`${libraryModuleName}/testing`]).toEqual(
            [`${librarySrcPath}testing/index.ts`]
        );
    });

    it('adds an exception for @…/…/testing to tslint.json', async () => {
        const tree = await runSchematic('library', options);

        const tslintJson = readJsonFile(tree, 'tslint.json');
        expect(tslintJson.rules['nx-enforce-module-boundaries'][1].allow).toContain(`${libraryModuleName}/testing`);
    });
});
