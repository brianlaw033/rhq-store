"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryList = void 0;
class EntryList {
    constructor() {
        this.entries = {};
    }
    add(value, key) {
        const theEntry = this.entries[value];
        if (theEntry) {
            theEntry.count += 1;
        }
        else {
            this.entries[value] = { value: value, key: key || value, count: 1 };
        }
    }
    subtract(value, key) {
        const theEntry = this.entries[value];
        if (theEntry) {
            theEntry.count -= 1;
            if (theEntry.count < 1) {
                delete this.entries[value];
            }
        }
    }
    valueArray() {
        const theArray = [];
        Object.keys(this.entries).forEach((key) => {
            theArray.push(key);
        });
        return theArray;
    }
    clearAll() {
        this.entries = {};
    }
}
exports.EntryList = EntryList;
