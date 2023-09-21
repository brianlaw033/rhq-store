import { storedItem } from "../storedItem";
export declare class user extends storedItem {
    _regionPermissions: {
        [name: string]: number[];
    } | null;
    _objectPermissions: {
        [name: number]: number[];
    } | null;
    _regionAllPermissions: number[] | null;
    _objectAllPermissions: number[] | null;
    get isDisabled(): boolean;
    get permissionsObject(): any;
    get regionPermissions(): any;
    get objectPermissions(): any;
    get regionPermissionsDecoded(): {
        [name: string]: number[];
    };
    get regionAllPermissions(): number[] | null;
    get objectAllPermissions(): number[] | null;
    get objectPermissionsDecoded(): {
        [name: number]: number[];
    };
}
