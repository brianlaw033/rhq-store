import { IEntry } from "./ListOperations";

interface IEntryListStorage {
    [key: string]: IEntry;
}
export class EntryList {
	entries: IEntryListStorage = {};

    add (value: any, key: any) {
        const theEntry = this.entries[value];
        if(theEntry) {
            theEntry.count += 1;
        } else {
            this.entries[value] = {value: value, key: key || value, count: 1};
        }
    }
    subtract (value: any, key: any) {
        const theEntry = this.entries[value];
        if(theEntry) {
            theEntry.count -= 1;
            if(theEntry.count < 1) {
                delete this.entries[value];
            }
        }
    }
    valueArray() {
        const theArray: any[] = [];
        Object.keys(this.entries).forEach((key) => {
            theArray.push(key);
        })
        return theArray;
    }
    clearAll() {
        this.entries = {};
    }
}