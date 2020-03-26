import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addPackageJsonDependency as addDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import latestVersion from 'latest-version';
import { from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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