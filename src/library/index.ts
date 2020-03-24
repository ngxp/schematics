import { apply, chain, externalSchematic, MergeStrategy, mergeWith, move, Rule, template, Tree, url } from '@angular-devkit/schematics';
import { NxJson, readJsonInTree, toFileName, updateJsonInTree } from '@nrwl/workspace';
import { isUndefined } from 'lodash';
import { LibrarySchema } from './schema';

export default function (options: LibrarySchema): Rule {
    const name = toFileName(options.name);
    const projectDirectory = options.directory ? `${toFileName(options.directory)}/${name}` : name;
    const projectRoot = `libs/${projectDirectory}`;

    if (isUndefined(options.style)) {
        options.style = 'scss';
    }

    return chain([
        externalSchematic('@nrwl/angular', 'library', options),
        mergeWith(
            apply(url('./files'), [
                template({}),
                move(projectRoot)
            ]),
            MergeStrategy.Error
        ),
        (host: Tree) => {
            const { npmScope } = readJsonInTree<NxJson>(host, 'nx.json');

            return chain([
                updateJsonInTree('tsconfig.json', json => {
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
