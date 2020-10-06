import { chain, externalSchematic, noop, Rule, Tree } from '@angular-devkit/schematics';
import { NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { ArrayLiteralExpression, CallExpression, Expression, ObjectLiteralExpression, PropertyAssignment } from 'ts-morph';
import { readSourceFile } from '../utils/file-utils';
import { addPackageJsonDependency } from '../utils/package-json-utils';
import { NgrxSetupSchema } from './schema';

export default function ({ module, skipComponentStore, skipRouterStore }: NgrxSetupSchema): Rule {
    return chain([
        addPackageJsonDependency('@ngrx/schematics', NodeDependencyType.Dev),
        addPackageJsonDependency('@ngrx/store-devtools', NodeDependencyType.Dev),
        addPackageJsonDependency('@ngrx/store'),
        addPackageJsonDependency('@ngrx/effects'),
        skipRouterStore ? noop : addPackageJsonDependency('@ngrx/router-store'),
        skipComponentStore ? noop : addPackageJsonDependency('@ngrx/component-store'),
        externalSchematic('@ngrx/schematics', 'store', {
            name: 'app',
            module,
            root: true,
            minimal: true
        }),
        externalSchematic('@ngrx/schematics', 'effect', {
            name: 'app',
            module,
            root: true,
            minimal: true,
            api: false,
            creators: true
        }),
        skipRouterStore ? noop : externalSchematic('@ngrx/router-store', 'ng-add', {
            skipPackageJson: true,
            module
        }),

        addPackageJsonDependency('ngrx-store-logger'),
        (tree: Tree) => {
            // tslint:disable-next-line: no-non-null-assertion
            const modulePath = tree.actions.find(a => a.path.endsWith(module!))!.path;
            const moduleFile = readSourceFile(tree, modulePath);

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

            ngrxStoreConfig.addProperty({
                name: 'metaReducers',
                initializer: 'environment.production ? [] : [reducer => storeLogger()(reducer)]'
            })

            // tslint:disable-next-line: no-non-null-assertion
            ngrxStoreConfig.getProperty('metaReducers')!.set({
                initializer: 'environment.production ? [] : [reducer => storeLogger()(reducer)]'
            });

            // tslint:disable-next-line: no-non-null-assertion
            ngrxStoreConfig.getProperty('runtimeChecks')!.set({
                initializer: JSON.stringify({
                    strictStateSerializability: true,
                    strictActionSerializability: true,
                    strictActionWithinNgZone: true,
                    strictActionTypeUniqueness: true
                })
            });

            const formattedModuleFile = moduleFile.print()
                .replace('@NgModule', '\n@NgModule');

            tree.overwrite(modulePath, formattedModuleFile);

            return tree;
        }
    ]);
}
