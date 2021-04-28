import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { readSourceFile } from '../utils/file-utils';
import { getClass, hasDecoratorProperty, hasImport, implementsInterface } from '../utils/testing-ast-utils';
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

        expect(tree.exists(componentHtmlFilePath)).toBeTrue();
        expect(tree.exists(componentSpecFilePath)).toBeTrue();
        expect(tree.exists(componentTsFilePath)).toBeTrue();
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

    it('removes the styles and styleUrls Component decorator properties', async () => {
        const tree = await runSchematic('component', options);

        const componentFile = readSourceFile(tree, componentTsFilePath);
        const componentClass = getClass(componentFile, componentName);

        expect(hasDecoratorProperty(componentClass, 'Component', 'styles')).toBeFalse();
        expect(hasDecoratorProperty(componentClass, 'Component', 'styleUrls')).toBeFalse();
    });

    it('does not generate a stylesheet file', async () => {
        const tree = await runSchematic('component', options);

        expect(tree.exists(componentCssFilePath)).toBeFalse();
    });

    describe('skipStyles: false', () => {
        it('generates a stylesheet file', async () => {
            const tree = await runSchematic('component', {
                ...options,
                skipStyles: false
            });

            const componentFile = readSourceFile(tree, componentTsFilePath);
            const componentClass = getClass(componentFile, componentName);

            expect(tree.exists(componentCssFilePath)).toBeTrue();
            expect(hasDecoratorProperty(componentClass, 'Component', 'styles')).toBeFalse();
            expect(hasDecoratorProperty(componentClass, 'Component', 'styleUrls')).toBeTrue();
        });
    });

    describe('skipStyles: false, inlineStyle: true', () => {
        it('adds the styles Component decorator property', async () => {
            const tree = await runSchematic('component', {
                ...options,
                skipStyles: false,
                inlineStyle: true
            });

            const componentFile = readSourceFile(tree, componentTsFilePath);
            const componentClass = getClass(componentFile, componentName);

            expect(tree.exists(componentCssFilePath)).toBeFalse();
            expect(hasDecoratorProperty(componentClass, 'Component', 'styles')).toBeTrue();
            expect(hasDecoratorProperty(componentClass, 'Component', 'styleUrls')).toBeFalse();
        });
    });
});
