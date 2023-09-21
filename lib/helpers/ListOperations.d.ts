import { storedItem } from "../storedItem";
import { IQueryParams, ISortParams } from "../types";
import { EntryList } from "./EntryList";
export interface IStats {
    min?: number;
    max?: number;
    avg?: number;
    total?: number;
    count?: number;
}
export interface IEntry {
    value: any;
    key: any;
    count: number;
    items?: storedItem[];
}
export declare function sortItemArray(theList: storedItem[], queryParams: IQueryParams | ISortParams): storedItem[];
export declare function sortArray(theList: any[], queryParams: IQueryParams | ISortParams): storedItem[];
export declare function listStats(theData: storedItem[], key: string): IStats;
export declare function listValues(theData: storedItem[], key: string, split?: boolean): EntryList;
