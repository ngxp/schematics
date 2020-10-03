import { readAngularJson } from '../utils/angular-json-utils';
import { readFile } from '../utils/file-utils';
import { readPackageJson } from '../utils/package-json-utils';
import { runSchematic } from '../utils/testing-utils';

describe('ng-add', () => {
    it('adds @ngxp/builder as a dev dependency', async () => {
        const tree = await runSchematic('ng-add');

        const packageJson = readPackageJson(tree);
        expect(packageJson.devDependencies['@ngxp/builder']).toBeDefined();
    });

    it('sets the indent_size in .editorconfig to 4', async () => {
        const tree = await runSchematic('ng-add');

        const editorconfig = readFile(tree, '.editorconfig');
        expect(editorconfig).toContain('indent_size = 4')
    });

    it('removes prettier', async () => {
        const tree = await runSchematic('ng-add');

        const packageJson = readPackageJson(tree);
        expect(packageJson.devDependencies.prettier).not.toBeDefined();
        expect(tree.exists('.prettierignore')).toBeFalse();
        expect(tree.exists('.prettierrc')).toBeFalse();
    });

    it('sets @ngxp/schematics as the default collection', async () => {
        const tree = await runSchematic('ng-add');

        const angularJson = readAngularJson(tree);
        expect(angularJson.cli.defaultCollection).toBe('@ngxp/schematics');
    });
});
