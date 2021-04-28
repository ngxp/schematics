export interface ComponentSchema {
    path?: string;
    project?: string;
    name: string;
    inlineStyle?: boolean;
    inlineTemplate?: boolean;
    viewEncapsulation?: 'Emulated' | 'Native' | 'None' | 'ShadowDom';
    changeDetection?: 'Default' | 'OnPush';
    prefix?: string;
    style?: 'css' | 'scss' | 'sass' | 'less' | 'styl';
    type?: string;
    skipStyles?: boolean;
    skipTests?: boolean;
    flat?: boolean;
    skipImport?: boolean;
    selector?: string;
    skipSelector?: boolean;
    module?: string;
    export?: boolean;
    lintFix?: boolean;
}
