import { readPackageJson } from '../utils/package-json-utils';
import { runSchematic } from '../utils/testing-utils';

describe('ngrx-setup', () => {
    describe('install-dependencies', () => {
        it('adds @ngrx/store, effects, compontent-store and router-store as a dependency', async () => {
            const tree = await runSchematic('ngrx-setup-install-dependencies');

            const { dependencies } = readPackageJson(tree);
            expect(dependencies['@ngrx/store']).toBeDefined();
            expect(dependencies['@ngrx/effects']).toBeDefined();
            expect(dependencies['@ngrx/component-store']).toBeDefined();
            expect(dependencies['@ngrx/router-store']).toBeDefined();
        });

        it('adds ngrx-store-logger as a dependency', async () => {
            const tree = await runSchematic('ngrx-setup-install-dependencies');

            const { dependencies } = readPackageJson(tree);
            expect(dependencies['ngrx-store-logger']).toBeDefined();
        });

        it('adds @ngrx/schematics and store-devtools as a dev dependency', async () => {
            const tree = await runSchematic('ngrx-setup-install-dependencies');

            const { devDependencies } = readPackageJson(tree);
            expect(devDependencies['@ngrx/schematics']).toBeDefined();
            expect(devDependencies['@ngrx/store-devtools']).toBeDefined();
        });

        describe('skipComponentStore', () => {
            it('does not add @ngrx/component-store as a dependency', async () => {
                const tree = await runSchematic('ngrx-setup-install-dependencies', {
                    skipComponentStore: true
                });

                const { dependencies } = readPackageJson(tree);
                expect(dependencies['@ngrx/component-store']).not.toBeDefined();
            });
        });

        describe('skipRouterStore', () => {
            it('does not add @ngrx/router-store as a dependency', async () => {
                const tree = await runSchematic('ngrx-setup-install-dependencies', {
                    skipRouterStore: true
                });

                const { dependencies } = readPackageJson(tree);
                expect(dependencies['@ngrx/router-store']).not.toBeDefined();
            });
        });

        describe('skipStoreLogger', () => {
            it('does not add ngrx-store-logger as a dependency', async () => {
                const tree = await runSchematic('ngrx-setup-install-dependencies', {
                    skipStoreLogger: true
                });

                const { dependencies } = readPackageJson(tree);
                expect(dependencies['ngrx-store-logger']).not.toBeDefined();
            });
        });
    });

    describe('apply-configuration', () => {
        const moduleName = 'AppModule';
        const moduleTsFilePath = 'apps/sandbox/src/app/app.module.ts';

        it('adds an import for StoreModule to the module', async () => {
            const tree = await runSchematic('ngrx-setup-apply-configuration');

            const moduleFile = readSourceFile(tree, moduleTsFilePath);
            const moduleClass = getClass(moduleFile, moduleName);
        });

    });
});
