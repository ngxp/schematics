import { chain, externalSchematic, Rule } from '@angular-devkit/schematics';
import { NgrxSchema } from './schema';

export default function (options: NgrxSchema): Rule {
    return chain([externalSchematic('@nrwl/angular', 'ngrx', options)]);
}
