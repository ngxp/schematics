import { isUndefined } from 'lodash';
import { ClassDeclaration, ObjectLiteralExpression, SourceFile } from 'ts-morph';

export function getClass(sourceFile: SourceFile, className: string): ClassDeclaration {
    // tslint:disable-next-line: no-non-null-assertion
    return sourceFile.getClass(className)!;
}

export function implementsInterface(classDeclaration: ClassDeclaration, interfaceName: string) {
    return classDeclaration.getImplements().some(impl => impl.getText() === interfaceName);
}

export function removeNamedImport(file: SourceFile, moduleSpecifier: string, namedImport: string) {
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

export function removeImplements(cls: ClassDeclaration, implText: string) {
    const implementsIndex = cls.getImplements().findIndex(impl => impl.getText() === implText);

    if (implementsIndex === -1) {
        console.warn(`${cls.getName()} does implement ${implText}`);
        return;
    }

    cls.removeImplements(implementsIndex);
}

export function hasImport(sourceFile: SourceFile, moduleSpecifier: string, namedImport: string) {
    // tslint:disable-next-line: no-non-null-assertion
    return sourceFile
        .getImportDeclaration(moduleSpecifier)!
        .getNamedImports().some(imp => imp.getText() === namedImport);
}

export function removeConstructor(cls: ClassDeclaration) {
    cls.getConstructors().forEach(constructor => constructor.remove());
}

export function removeMethod(cls: ClassDeclaration, methodName: string) {
    const method = cls.getMethod(methodName);

    if (isUndefined(method)) {
        console.warn(`${cls.getName()} does not have a method called ${methodName}`);
        return;
    }

    method.remove();
}

export function hasDecoratorProperty(cls: ClassDeclaration, decoratorName: string, propertyName: string) {
    // tslint:disable-next-line: no-non-null-assertion
    const decoratorArg = cls
        .getDecorator(decoratorName)!
        .getArguments()[0] as ObjectLiteralExpression;
    return !isUndefined(decoratorArg.getProperty(propertyName));
}

export function removePropertyFromDecoratorArg(cls: ClassDeclaration, decoratorName: string, propertyName: string) {
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