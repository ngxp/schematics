import { apply, chain, externalSchematic, MergeStrategy, mergeWith, move, Rule, template, Tree, url } from '@angular-devkit/schematics';
import { NxJson, readJsonInTree, toFileName, updateJsonInTree } from '@nrwl/workspace';
import { LibrarySchema } from './schema';

export default function (options: LibrarySchema): Rule {
    const name = toFileName(options.name);
    const projectDirectory = options.directory ? `${toFileName(options.directory)}/${name}` : name;
    const projectSrcPath = `libs/${projectDirectory}/src`;

    return chain([
        externalSchematic('@nrwl/angular', 'library', options),
        mergeWith(
            apply(url('./files'), [
                template({}),
                move(projectSrcPath)
            ]),
            MergeStrategy.Error
        ),
        (host: Tree) => {
            const { npmScope } = readJsonInTree<NxJson>(host, 'nx.json');

            return chain([
                updateJsonInTree('tsconfig.base.json', json => {
                    json.compilerOptions.paths[`@${npmScope}/${projectDirectory}/testing`] = [
                        `libs/${projectDirectory}/src/testing/index.ts`
                    ];
                    return json;
                }),
                updateJsonInTree('tslint.json', json => {
                    json.rules['nx-enforce-module-boundaries'][1].allow.push(
                        `@${npmScope}/${projectDirectory}/testing`
                    );
                    return json;
                })
            ])
        }
    ]);
}
