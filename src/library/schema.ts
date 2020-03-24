export interface LibrarySchema {
    name: string;
    directory?: string;
    publishable?: boolean;
    prefix?: string;
    skipFormat?: boolean;
    simpleModuleName?: boolean;
    skipPackageJson?: boolean;
    skipTsConfig?: boolean;
    style?: string;
    routing?: boolean;
    lazy?: boolean;
    parentModule?: string;
    tags?: string;
    unitTestRunner?: "karma" | "jest" | "none";
}
