import { IEntry } from "./ListOperations";
interface IEntryListStorage {
    [key: string]: IEntry;
}
export declare class EntryList {
    entries: IEntryListStorage;
    add(value: any, key: any): void;
    subtract(value: any, key: any): void;
    valueArray(): any[];
    clearAll(): void;
}
export {};
