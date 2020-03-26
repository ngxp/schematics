import { chain, externalSchematic, Rule } from '@angular-devkit/schematics';
import { readWorkspaceJson, updateJsonInTree } from '@nrwl/workspace';
import { isUndefined } from 'lodash';
import * as path from 'path';
import { ArrayLiteralExpression, CallExpression, Expression, ObjectLiteralExpression, PropertyAssignment } from 'ts-morph';
import { NgrxSchema } from '../ngrx/schema';
import { getFile } from '../utils/file-utils';
import { addPackageJsonDependency } from '../utils/package-json-utils';
import { NgrxSetupSchema } from './schema';

export default function (options: NgrxSetupSchema): Rule {
    return chain([
        (tree, context) => {
            if (isUndefined(options.module)) {
                const workspace = readWorkspaceJson();
                const appSourceRoot = workspace.projects[workspace.defaultProject].sourceRoot;
                options.module = path.join(appSourceRoot, 'app/app.module.ts');
            }

            const ngrxSchematicOptions: NgrxSchema = {
                module: options.module,
                skipFormat: options.skipFormat,
                skipPackageJson: options.skipPackageJson,
                root: true,
                name: 'root',
                facade: false
            };

            return externalSchematic('@nrwl/angular', 'ngrx', ngrxSchematicOptions)(tree, context);
        },
        updateJsonInTree('package.json', json => {
            delete json.dependencies['@ngrx/entity'];
            return json;
        }),
        addPackageJsonDependency('ngrx-store-logger'),
        tree => {
            // tslint:disable-next-line: no-non-null-assertion
            const modulePath = options.module!;
            const moduleFile = getFile(tree, modulePath);

            moduleFile.addImportDeclaration({
                moduleSpecifier: 'ngrx-store-logger',
                namedImports: ['storeLogger']
            });

            // tslint:disable-next-line: no-non-null-assertion
            const moduleImports = (moduleFile.getClass('AppModule')!.getDecorator('NgModule')!.getArguments()[0]! as ObjectLiteralExpression)
                .getProperty('imports')! as PropertyAssignment;


            // tslint:disable-next-line: no-non-null-assertion
            const arg0 = (moduleImports.getInitializer() as ArrayLiteralExpression)
                .getElements()
                .filter(element => Expression.isCallExpression(element))
                .find((callExpression: CallExpression) => callExpression.getExpression().getText() === 'StoreModule.forRoot')! as CallExpression;


            const ngrxStoreConfig = arg0.getArguments()[1] as ObjectLiteralExpression;

            // tslint:disable-next-line: no-non-null-assertion
            ngrxStoreConfig.getProperty('metaReducers')!.set({
                initializer: 'environment.production ? [] : [reducer => storeLogger()(reducer)]'
            });

            // tslint:disable-next-line: no-non-null-assertion
            ngrxStoreConfig.getProperty('runtimeChecks')!.set({
                initializer: `{
                    strictActionSerializability: true,
                    strictActionWithinNgZone: true,
                    strictStateSerializability: true
                }`
            })


            const formattedModuleFile = moduleFile.print()
                .replace('@NgModule', '\n@NgModule');

            tree.overwrite(modulePath, formattedModuleFile);
        }
    ]);
}
