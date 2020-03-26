export interface NgrxSchema {
    name?: string;
    module: string;
    directory?: string;
    root?: boolean;
    facade?: boolean;
    skipImport?: boolean;
    onlyAddFiles?: boolean;
    minimal?: boolean;
    onlyEmptyRoot?: boolean;
    skipFormat?: boolean;
    skipPackageJson?: boolean;
    syntax?: 'classes' | 'creators';
    useDataPersistence?: boolean;
    barrels?: boolean;
}
