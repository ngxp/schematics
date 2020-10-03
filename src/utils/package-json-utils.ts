import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addPackageJsonDependency as addDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import latestVersion from 'latest-version';
import { from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { readJsonFile } from './file-utils';

export function addPackageJsonDependency(packageName: string, type: NodeDependencyType = NodeDependencyType.Default): Rule {
    return (tree: Tree, _context: SchematicContext): Observable<Tree> => {
        return from(latestVersion(packageName)).pipe(
            tap(version => addDependency(tree, {
                name: packageName,
                type,
                overwrite: false,
                version
            })),
            map(() => tree)
        );
    };
}

export interface PackageJson {
    dependencies: { [key: string]: string };
    devDependencies: { [key: string]: string };
}

export function readPackageJson(tree: Tree): PackageJson {
    return readJsonFile(tree, 'package.json');
}