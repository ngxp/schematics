import { readPackageJson } from '../utils/package-json-utils';
import { runSchematic } from '../utils/testing-utils';

describe('ngrx-setup', () => {
    it('adds ngrx as a dependency', async () => {
        const tree = await runSchematic('ngrx-setup');

        const packageJson = readPackageJson(tree);
        expect(packageJson.dependencies['@ngrx/store']).toBeDefined();
        expect(packageJson.dependencies['@ngrx/effects']).toBeDefined();
        expect(packageJson.dependencies['@ngrx/router-store']).toBeDefined();
        expect(packageJson.devDependencies['@ngrx/schematics']).toBeDefined();
        expect(packageJson.devDependencies['@ngrx/store-devtools']).toBeDefined();
    });
});
