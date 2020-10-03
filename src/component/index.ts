import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { chain, externalSchematic, Rule, Tree } from '@angular-devkit/schematics';
import { isUndefined, omit } from 'lodash';
import { ClassDeclaration, SourceFile } from 'ts-morph';
import { removeConstructor, removeImplements, removeMethod, removeNamedImport, removePropertyFromDecoratorArg } from '../utils/ast-utils';
import { readSourceFile } from '../utils/file-utils';
import { ComponentSchema } from './schema';

export default function (options: ComponentSchema): Rule {
    if (options.skipStyles) {
        options.inlineStyle = true;
    }

    return chain([
        externalSchematic('@schematics/angular', 'component', omit(options, 'skipStyles')),
        removeNgOnInit(options),
        removeComponentConstructor(options),
        removeStyles(options)
    ]);
}

function removeNgOnInit({ name }: ComponentSchema) {
    return updateComponentFile(
        name,
        (componentClass, componentFile) => {
            removeNamedImport(componentFile, '@angular/core', 'OnInit');
            removeImplements(componentClass, 'OnInit');
            removeMethod(componentClass, 'ngOnInit');
        }
    );
}

function removeComponentConstructor({ name }: ComponentSchema) {
    return updateComponentFile(
        name,
        (componentClass) => removeConstructor(componentClass)
    );
}

function removeStyles({ name, skipStyles }: ComponentSchema) {
    if (!skipStyles) {
        return (tree: Tree) => tree;
    }

    return updateComponentFile(
        name,
        (componentClass) => removePropertyFromDecoratorArg(componentClass, 'Component', 'styles')
    );
}

type ComponentFileUpdater = (componentClass: ClassDeclaration, componentFile: SourceFile, tree: Tree) => void;

function updateComponentFile(componentName: string, update: ComponentFileUpdater) {
    return (tree: Tree) => {
        const componentPath = getComponentPath(tree, componentName);

        if (isUndefined(componentPath)) {
            return;
        }

        const componentFile = readSourceFile(tree, componentPath);
        const componentClass = getComponentClass(componentFile);

        if (isUndefined(componentClass)) {
            console.warn(`${componentFile.getBaseName()} does include a Component class`);
            return tree;
        }

        update(componentClass, componentFile, tree);

        const formattedComponentFile = componentFile.print()
            .replace('@Component', '\n@Component');

        tree.overwrite(componentPath, formattedComponentFile);

        return tree;
    }
}

function getComponentPath(tree: Tree, componentName: string) {
    return tree.actions
        .find(action => action.kind === 'c' && action.path.endsWith(`${dasherize(componentName)}.component.ts`))?.path;
}

function getComponentClass(file: SourceFile) {
    // tslint:disable-next-line: no-non-null-assertion
    return file.getClasses().find(cls => cls.getName()!.endsWith('Component'));
}
