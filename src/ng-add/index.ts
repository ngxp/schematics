import { JsonObject } from '@angular-devkit/core';
import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { updateJsonInTree, updateWorkspace } from '@nrwl/workspace';
import { NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { isNull, isObject } from 'lodash';
import { collectionName } from '../collection';
import { StyleExt } from '../utils/angular-json-utils';
import { addPackageJsonDependency, installDependencies } from '../utils/package-json-utils';

export default function (): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return chain([
            addPackageJsonDependency('@ngxp/builder', NodeDependencyType.Dev),
            updateEditorconfig(),
            removePrettier(),
            setDefaultCollection(),
            setDefaultStyleExtension('scss'),
            installDependencies(),
        ])(tree, context);
    };
}

function updateEditorconfig(): Rule {
    return (tree: Tree) => {
        const fileBuffer = tree.read('.editorconfig');

        if (isNull(fileBuffer)) {
            return;
        }

        const editorconfig = fileBuffer.toString();
        const updatedEditorconfig = editorconfig.replace(
            /indent_size\s?=\s?\d/,
            'indent_size = 4'
        );

        tree.overwrite('.editorconfig', updatedEditorconfig);
    };
}

function removePrettier(): Rule {
    return chain([
        (tree: Tree) => {
            tree.delete('.prettierignore');
            tree.delete('.prettierrc');
        },
        updateJsonInTree('package.json', json => {
            delete json.devDependencies.prettier;
            return json;
        })
    ]);
}

function setDefaultCollection(): Rule {
    return updateWorkspace(workspace => {
        if (!isObject(workspace.extensions.cli)) {
            workspace.extensions.cli = {};
        }

        (workspace.extensions.cli as JsonObject).defaultCollection = collectionName;
    });
}

function setDefaultStyleExtension(styleExt: StyleExt): Rule {
    return updateWorkspace(workspace => {
        if (!isObject(workspace.extensions.schematics)) {
            workspace.extensions.schematics = {};
        }

        const schematics = workspace.extensions.schematics as JsonObject;
        const componentSchematic = `${collectionName}:component`;
        if (!isObject(schematics[componentSchematic])) {
            schematics[componentSchematic] = {};
        }

        // tslint:disable-next-line: no-non-null-assertion
        (schematics[componentSchematic] as JsonObject).style = styleExt;
    });
}