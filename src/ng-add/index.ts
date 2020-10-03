import { JsonObject } from '@angular-devkit/core';
import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { updateJsonInTree, updateWorkspace } from '@nrwl/workspace';
import { NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { isNull, isObject } from 'lodash';
import { addPackageJsonDependency } from '../utils/package-json-utils';

export default function (): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return chain([
            addPackageJsonDependency('@ngxp/builder', NodeDependencyType.Dev),
            updateEditorconfig(),
            removePrettier(),
            setDefaultCollection(),
            installDependencies(),
        ])(tree, context);
    };
}

function installDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
        return tree;
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
        workspace.extensions.schematics = workspace.extensions.schematics || {};

        if (!isObject(workspace.extensions.cli)) {
            workspace.extensions.cli = {};
        }

        (workspace.extensions.cli as JsonObject).defaultCollection = '@ngxp/schematics';
    });
}