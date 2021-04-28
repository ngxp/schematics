import { isUndefined } from 'lodash';
import { ClassDeclaration, ObjectLiteralExpression, SourceFile } from 'ts-morph';

export function getClass(sourceFile: SourceFile, className: string): ClassDeclaration {
    // tslint:disable-next-line: no-non-null-assertion
    return sourceFile.getClassOrThrow(className);
}

export function getDecoratorProperty(cls: ClassDeclaration, decoratorName: string, propertyName: string) {
    const decoratorArg = cls
        .getDecoratorOrThrow(decoratorName)
        .getArguments()[0] as ObjectLiteralExpression;
    return !isUndefined(decoratorArg.getProperty(propertyName));
}

export function hasDecoratorProperty(cls: ClassDeclaration, decoratorName: string, propertyName: string) {
    const decoratorArg = cls
        .getDecoratorOrThrow(decoratorName)
        .getArguments()[0] as ObjectLiteralExpression;
    return !isUndefined(decoratorArg.getProperty(propertyName));
}

// export function decoratorContains(cls: ClassDeclaration, decoratorName: string, searchString: string)

export function hasImport(sourceFile: SourceFile, moduleSpecifier: string, namedImport: string) {
    return sourceFile
        .getImportDeclarationOrThrow(moduleSpecifier)
        .getNamedImports().some(imp => imp.getText() === namedImport);
}

export function implementsInterface(classDeclaration: ClassDeclaration, interfaceName: string) {
    return classDeclaration.getImplements()
        .some(impl => impl.getText() === interfaceName);
}
