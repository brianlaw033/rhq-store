import { storedItem } from "../storedItem";
import { storeType } from "../storeType";
export declare function classInit(objectType: storeType, data: any, doNotStore?: boolean): storedItem;
export declare function addClass(name: string, classConstructor: typeof storedItem): void;
