import { chain, externalSchematic, noop, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { ArrayLiteralExpression, CallExpression, Expression, ObjectLiteralExpression, PropertyAssignment, SourceFile } from 'ts-morph';
import { formatSourceFile } from '../utils/ast-utils';
import { readSourceFile } from '../utils/file-utils';
import { addPackageJsonDependency, installDependencies as install } from '../utils/package-json-utils';
import { NgrxSetupSchema } from './schema';

export default function (options: NgrxSetupSchema): Rule {
    return (_tree: Tree, context: SchematicContext) => {
        const installDependenciesTask = context.addTask(new RunSchematicTask('ngrx-setup-install-dependencies', options));
        context.addTask(new RunSchematicTask('ngrx-setup-apply-configuration', options), [installDependenciesTask]);
    };
}

export function installDependencies({ skipComponentStore, skipRouterStore, skipStoreLogger }: NgrxSetupSchema): Rule {
    return chain([
        addPackageJsonDependency('@ngrx/store'),
        addPackageJsonDependency('@ngrx/effects'),
        addPackageJsonDependency('@ngrx/schematics', NodeDependencyType.Dev),
        addPackageJsonDependency('@ngrx/store-devtools', NodeDependencyType.Dev),
        skipComponentStore ? noop : addPackageJsonDependency('@ngrx/component-store'),
        skipRouterStore ? noop : addPackageJsonDependency('@ngrx/router-store'),
        skipStoreLogger ? noop : addPackageJsonDependency('ngrx-store-logger'),
        install()
    ]);
}

export function applyConfiguration({ module, skipRouterStore, skipStoreLogger }: NgrxSetupSchema): Rule {
    return chain([
        externalSchematic('@ngrx/schematics', 'store', {
            name: 'app',
            module,
            root: true,
            minimal: true
        }),
        configureStore(module),
        externalSchematic('@ngrx/schematics', 'effect', {
            name: 'app',
            module,
            root: true,
            minimal: true,
            api: false,
            creators: true
        }),
        skipRouterStore ? noop : addPackageJsonDependency('@ngrx/router-store'),
        skipRouterStore ? noop : externalSchematic('@ngrx/router-store', 'ng-add', {
            skipPackageJson: true,
            module
        }),
        skipStoreLogger ? noop : configureStoreLogger(module)
    ]);
}

function configureStore(module: string | undefined) {
    return updateModuleFile(module, moduleFile => {
        addStoreConfigProperty(
            moduleFile,
            'runtimeChecks',
            `{
                strictStateSerializability: true,
                strictActionSerializability: true,
                strictActionWithinNgZone: true,
                strictActionTypeUniqueness: true
            }`
        );
    });
}

function configureStoreLogger(module: string | undefined) {
    return updateModuleFile(module, moduleFile => {
        moduleFile.addImportDeclaration({
            moduleSpecifier: 'ngrx-store-logger',
            namedImports: ['storeLogger']
        });

        addStoreConfigProperty(
            moduleFile,
            'metaReducers',
            'environment.production ? [] : [reducer => storeLogger()(reducer)]'
        );
    });
}

function addStoreConfigProperty(moduleFile: SourceFile, property: string, valueInitializer: string) {
    getStoreConfig(moduleFile).addPropertyAssignment({
        name: property,
        initializer: valueInitializer
    });
}

function getStoreConfig(moduleFile: SourceFile) {
    const moduleImports = getModuleImports(moduleFile);
    const forRootCall = ((moduleImports.getInitializer() as ArrayLiteralExpression)
        .getElements()
        .filter(element => Expression.isCallExpression(element))
        .find((callExpression: CallExpression) => callExpression.getExpression().getText() === 'StoreModule.forRoot') as CallExpression);

    if (forRootCall.getArguments().length === 1) {
        forRootCall.addArgument('{}');
    }

    return forRootCall.getArguments()[1] as ObjectLiteralExpression;
}

function getModuleImports(moduleFile: SourceFile) {
    // tslint:disable-next-line: no-non-null-assertion
    return (getModuleClass(moduleFile)
        .getDecoratorOrThrow('NgModule').getArguments()[0] as ObjectLiteralExpression)
        .getPropertyOrThrow('imports') as PropertyAssignment;
}

function getModuleClass(sourceFile: SourceFile) {
    // tslint:disable-next-line: no-non-null-assertion
    return sourceFile.getClasses()
        .find(cls => cls.getNameOrThrow().endsWith('Module'))!;
}

type ModuleFileUpdater = (moduleFile: SourceFile) => void;

function updateModuleFile(moduleFilePath: string | undefined, update: ModuleFileUpdater) {
    return (tree: Tree) => {
        // tslint:disable-next-line: no-non-null-assertion
        const modulePath = tree.actions.find(a => a.path.endsWith(moduleFilePath!))!.path;
        const moduleFile = readSourceFile(tree, modulePath);

        update(moduleFile);

        formatSourceFile(moduleFile);

        tree.overwrite(modulePath, moduleFile.getFullText());

        return tree;
    };
}
