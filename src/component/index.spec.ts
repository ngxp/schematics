import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { getClass, hasDecoratorProperty, hasImport, implementsInterface } from '../utils/ast-utils';
import { readSourceFile } from '../utils/file-utils';
import { runSchematic, sandboxProject } from '../utils/testing-utils';
import { ComponentSchema } from './schema';

describe('component', () => {
    const name = 'TestComponent';
    const componentName = `${name}Component`;
    const componentFileName = dasherize(name);
    const componentPath = `apps/sandbox/src/app/${componentFileName}/`;
    const componentHtmlFilePath = `${componentPath}${componentFileName}.component.html`;
    const componentSpecFilePath = `${componentPath}${componentFileName}.component.spec.ts`;
    const componentTsFilePath = `${componentPath}${componentFileName}.component.ts`;
    const componentCssFilePath = `${componentPath}${componentFileName}.component.css`;

    const options: ComponentSchema = {
        name,
        project: sandboxProject
    };

    it('creates a component', async () => {
        const tree = await runSchematic('component', options);
        console.log(componentTsFilePath);
        expect(tree.exists(componentHtmlFilePath)).toBeTrue();
        expect(tree.exists(componentSpecFilePath)).toBeTrue();
        expect(tree.exists(componentTsFilePath)).toBeTrue();
        expect(tree.exists(componentCssFilePath)).toBeTrue();
    });

    it('removes the NgOnInit lifecycle hook', async () => {
        const tree = await runSchematic('component', options);

        const componentFile = readSourceFile(tree, componentTsFilePath);
        const componentClass = getClass(componentFile, componentName);

        expect(hasImport(componentFile, '@angular/core', 'OnInit')).toBeFalse();
        expect(implementsInterface(componentClass, 'OnInit')).toBeFalse();
        expect(componentClass.getMethod('ngOnInit')).toBeUndefined();
    });

    it('removes the constructor', async () => {
        const tree = await runSchematic('component', options);

        const componentFile = readSourceFile(tree, componentTsFilePath);
        const componentClass = getClass(componentFile, componentName);

        expect(componentClass.getConstructors().length).toBe(0);
    });

    describe('skipStyles', () => {
        it('removes the styles and styleUrls Component decorator properties', async () => {
            const tree = await runSchematic('component', {
                ...options,
                skipStyles: true
            });

            const componentFile = readSourceFile(tree, componentTsFilePath);
            const componentClass = getClass(componentFile, componentName);

            expect(hasDecoratorProperty(componentClass, 'Component', 'styles')).toBeFalse();
            expect(hasDecoratorProperty(componentClass, 'Component', 'styleUrls')).toBeFalse();
        });

        it('does not generate a stylesheet file', async () => {
            const tree = await runSchematic('component', {
                ...options,
                skipStyles: true
            });

            expect(tree.exists(componentCssFilePath)).toBeFalse();
        });
    });
});
