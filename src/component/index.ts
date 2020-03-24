import { chain, externalSchematic, Rule, Tree } from '@angular-devkit/schematics';
import { isUndefined, omit } from 'lodash';
import { ClassDeclaration, ObjectLiteralExpression, Project, SourceFile } from 'ts-morph';
import { ComponentSchema } from './schema';

export default function (options: ComponentSchema): Rule {
    if (options.skipStyles) {
        options.inlineStyle = true;
    }

    return chain([
        externalSchematic('@schematics/angular', 'component', omit(options, 'skipStyles')),
        (tree: Tree) => {
            const componentPath = getComponentPath(tree);

            if (isUndefined(componentPath)) {
                return tree;
            }

            const componentFile = getComponentFile(tree, componentPath);

            removeNamedImport(componentFile, '@angular/core', 'OnInit');

            const componentClass = getComponentClass(componentFile);

            if (isUndefined(componentClass)) {
                console.warn(`${componentFile.getBaseName()} does include a Component class`);
                return tree;
            }

            removeImplements(componentClass, 'OnInit');
            removeConstructor(componentClass);
            removeMethod(componentClass, 'ngOnInit');

            if (options.skipStyles) {
                removePropertyFromDecoratorArg(componentClass, 'Component', 'styles');
            }

            const formattedComponentFile = componentFile.print()
                .replace('@Component', '\n@Component');

            tree.overwrite(componentPath, formattedComponentFile)
        }
    ]);
}

function getComponentPath(tree: Tree) {
    return tree.actions
        .find(action => action.kind === 'c' && action.path.endsWith('.component.ts'))
        ?.path;
}

function getComponentFile(tree: Tree, componentPath: string) {
    const sourceText = tree.read(componentPath)!.toString('utf-8');
    const project = new Project();
    return project.createSourceFile(componentPath, sourceText);
}

function getComponentClass(file: SourceFile) {
    return file.getClasses().find(cls => cls.getName()!.endsWith('Component'));
}

function removeNamedImport(file: SourceFile, moduleSpecifier: string, namedImport: string) {
    const importDeclaration = file.getImportDeclaration(moduleSpecifier);

    if (isUndefined(importDeclaration)) {
        console.warn(`${file.getBaseName()} does not import from ${moduleSpecifier}`);
        return;
    }

    const importSpecifier = importDeclaration.getNamedImports()
        .find(specifier => specifier.getName() === namedImport);

    if (isUndefined(importSpecifier)) {
        console.warn(`${file.getBaseName()} does not import ${namedImport} from ${moduleSpecifier}`);
        return;
    }

    importSpecifier.remove();
}

function removeImplements(cls: ClassDeclaration, implText: string) {
    const implementsIndex = cls.getImplements().findIndex(impl => impl.getText() === implText);

    if (implementsIndex === -1) {
        console.warn(`${cls.getName()} does implement ${implText}`);
        return;
    }

    cls.removeImplements(implementsIndex);
}

function removeConstructor(cls: ClassDeclaration) {
    cls.getConstructors().forEach(constructor => constructor.remove());
}

function removeMethod(cls: ClassDeclaration, methodName: string) {
    const method = cls.getMethod(methodName);

    if (isUndefined(method)) {
        console.warn(`${cls.getName()} does not have a method called ${methodName}`);
        return;
    }

    method.remove();
}

function removePropertyFromDecoratorArg(cls: ClassDeclaration, decoratorName: string, propertyName: string) {
    const decorator = cls.getDecorator(decoratorName);

    if (isUndefined(decorator)) {
        console.warn(`${cls.getName()} does not have a decorator called ${decoratorName}`);
        return;
    }

    const decoratorArg = decorator.getArguments()[0];

    if (isUndefined(decoratorArg)) {
        console.warn(`The decorator ${decoratorName} has no arguments`);
        return;
    }

    if (!(decoratorArg instanceof ObjectLiteralExpression)) {
        console.warn(`The first argument of the ${decoratorName} decorator is not a object literal`);
        return;
    }

    removeProperty(decoratorArg, propertyName);
}

function removeProperty(obj: ObjectLiteralExpression, propertyName: string) {
    const property = obj.getProperty(propertyName)

    if (isUndefined(property)) {
        console.warn(`The object has no property called ${propertyName}`);
        return;
    }

    property.remove()
}