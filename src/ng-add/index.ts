import { JsonObject } from '@angular-devkit/core';
import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { updateWorkspace } from '@nrwl/workspace';
import { addPackageJsonDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import latestVersion from 'latest-version';
import { from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { isObject } from 'util';

export default function (): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return chain([
            addPackageJsonDependencies(),
            installDependencies(),
            setDefaults()
        ])(tree, context);
    };
}

function addPackageJsonDependencies(): Rule {
    return (tree: Tree, _context: SchematicContext): Observable<Tree> => {
        return from(latestVersion('@ngxp/builder')).pipe(
            tap(version => addPackageJsonDependency(tree, {
                name: '@ngxp/builder',
                type: NodeDependencyType.Dev,
                overwrite: false,
                version
            })),
            map(() => tree)
        );
    };
}

function installDependencies(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
        return tree;
    };
}

function setDefaults(): Rule {
    return updateWorkspace(workspace => {
        workspace.extensions.schematics = workspace.extensions.schematics || {};

        if (!isObject(workspace.extensions.cli)) {
            workspace.extensions.cli = {};
        }

        (workspace.extensions.cli as JsonObject).defaultCollection = '@ngxp/schematics';
    });
}