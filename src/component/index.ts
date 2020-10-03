import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { chain, externalSchematic, Rule, Tree } from '@angular-devkit/schematics';
import { isUndefined, omit } from 'lodash';
import { SourceFile } from 'ts-morph';
import { removeConstructor, removeImplements, removeMethod, removeNamedImport, removePropertyFromDecoratorArg } from '../utils/ast-utils';
import { readSourceFile } from '../utils/file-utils';
import { ComponentSchema } from './schema';

export default function (options: ComponentSchema): Rule {
    if (options.skipStyles) {
        options.inlineStyle = true;
    }

    return chain([
        externalSchematic('@schematics/angular', 'component', omit(options, 'skipStyles')),
        (tree: Tree) => {
            const componentPath = getComponentPath(tree, options.name);

            if (isUndefined(componentPath)) {
                return;
            }

            const componentFile = readSourceFile(tree, componentPath);
            const componentClass = getComponentClass(componentFile);

            if (isUndefined(componentClass)) {
                console.warn(`${componentFile.getBaseName()} does include a Component class`);
                return tree;
            }

            removeNamedImport(componentFile, '@angular/core', 'OnInit');
            removeImplements(componentClass, 'OnInit');
            removeMethod(componentClass, 'ngOnInit');

            removeConstructor(componentClass);

            if (options.skipStyles) {
                removePropertyFromDecoratorArg(componentClass, 'Component', 'styles');
            }

            const formattedComponentFile = componentFile.print()
                .replace('@Component', '\n@Component');

            tree.overwrite(componentPath, formattedComponentFile);

            return tree;
        }
    ]);
}

function getComponentPath(tree: Tree, componentName: string) {
    return tree.actions
        .find(action => action.kind === 'c' && action.path.endsWith(`${dasherize(componentName)}.component.ts`))?.path;
}

function getComponentClass(file: SourceFile) {
    // tslint:disable-next-line: no-non-null-assertion
    return file.getClasses().find(cls => cls.getName()!.endsWith('Component'));
}
