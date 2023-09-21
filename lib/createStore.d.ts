import { context } from "./context";
import { editContext } from "./editContext";
import { storeType } from "./storeType";
import { storedItem } from "./storedItem";
import { ChangeCallbackFunction, IManagedItem, ISchemaStorageArray, IStore, messageLevels } from "./types";
export declare const dumpSchema: () => void, getSchema: () => ISchemaStorageArray, getSchemaArray: () => storeType[], getSchemaArrayAlpha: () => storedItem[], createEditContext: (name: string) => storedItem | undefined, removeEditContext: (context: editContext) => void, getContext: (key: any) => context | null, userChanged: (newUserID: string) => void, registerDataType: (type: string, remoteURL?: URL | undefined, createRemote?: boolean | undefined, retrieveRemote?: boolean | undefined, updateRemote?: boolean | undefined, deleteRemote?: boolean | undefined) => storeType, registerSingleItem: (type: string, storeSesstion: Boolean, storeLocal: Boolean, maxAgeLocal: number | null, remoteURL?: URL | undefined, createRemote?: boolean | undefined, retrieveRemote?: boolean | undefined, updateRemote?: boolean | undefined, deleteRemote?: boolean | undefined) => storeType, registerSingleUserItem: (type: string, storeSesstion: Boolean, storeLocal: Boolean, maxAgeLocal: number | null, remoteURL?: URL | undefined, createRemote?: boolean | undefined, retrieveRemote?: boolean | undefined, updateRemote?: boolean | undefined, deleteRemote?: boolean | undefined) => storeType, instanceItem: (type: string, data?: any) => storedItem | null, instanceNewItem: (type: string, data?: any) => storedItem | null, init: (type: string) => storedItem | null, save: () => void, registerOnChange: (name: string, call: Function) => storeType | null, registerOnSave: (name: string, call: Function) => storeType | null, registerOnDelete: (name: string, call: Function) => storeType | null, getStoreTypeByName: (name: string, createMissing?: boolean | undefined) => storeType | null, clearAllStoreCache: () => void, clearStoreCache: (name: string) => void, removeOnChange: (name: string, call: Function) => storeType | null, removeOnRetrieve: (name: string, call: Function) => storeType | null, removeOnSave: (name: string, call: Function) => storeType | null, removeOnDelete: (name: string, call: Function) => storeType | null, getAllStoreTypes: () => ISchemaStorageArray, setItem: (type: string, items: string | {
    [key: string]: any;
}, data?: any) => void | undefined, storeData: (type: string, items: string | {
    [key: string]: any;
}, data?: any) => void | undefined, getAll: (type: string) => IManagedItem[], requestLoad: (type: string, changeCallbackFn?: ChangeCallbackFunction | undefined, retrieveCallbackFn?: ChangeCallbackFunction | undefined) => storeType | null, getItem: (type: string, key: string) => Promise<string | storedItem | null | undefined>, itemByKey: (type: string, key: string) => storedItem | undefined, getPropertyArray: (type: string, keys: [string], column: string) => any, updateItemNewUser: (type: string, key: string) => Promise<void | undefined>, getAccessToken: () => Promise<string>, accessTokenSync: () => string | null, fetchDataAuthorised: (url: URL, key?: string | undefined, queryString?: string | null | undefined) => Promise<any>, sendDataAuthorised: (url: URL, method: string, data: string, callback: Function, key?: string | undefined, queryString?: string | null | undefined) => Promise<any>, loadTables: (endpoint: string) => Promise<void>, putTablesIntoSchemaItems: (type: string, key: string, data: any) => Promise<void>, call: (name: string, ...args: any[]) => any, callAsync: (name: string, ...args: any[]) => Promise<any>, registerCall: (name: string, fn: any, awaitMapAvailable?: boolean | undefined) => void, registerCalls: (calls: {
    [key: string]: any;
}) => void, removeCall: (name: string) => void, removeCalls: (calls: {
    [key: string]: any;
}) => void, getGlobalState: (name: string) => storedItem | undefined, setGlobalState: (name: string | {
    [key: string]: any;
}, value?: any) => Promise<void>, getStateValue: (name: string) => any, getStateArrayValue: (name: string, defaultValue?: [] | undefined) => any[], getStateFirstValue: (name: string, defaultValue?: any) => any, registerforStateChanges: (fn: any) => void, removeStateChanges: (fn: any) => void, dumpDataType: (type: string, level: messageLevels) => void, isStoredItem: (item: any) => boolean, getPropertyArrayFromItemArray: (items: storedItem[], column: string) => any, getPropertiesArrayFromItemArray: (items: storedItem[], columns: string[]) => any, getPropertyArrayFromItemArrayUnique: (items: storedItem[], column: string) => any, isItemType: (item: any, type: string, isLike?: boolean | undefined) => boolean, itemWillSend: (item: storedItem | storeType, message?: string | undefined) => void, typeWillRetrieve: (item: storedItem | storeType, message?: string | undefined) => void, itemIsSent: (item: storedItem | storeType, message: string) => void, typeIsRetrieved: (item: storedItem | storeType, message: string) => void, typeRetrieveFailed: (item: storedItem | storeType, message: string) => void, itemSendSucceeed: (item: storedItem | storeType, message: string) => void, itemSendFailed: (item: storedItem | storeType, message: string) => void, sendsInProgress: () => boolean, sendsToGo: () => number, lastSentMessage: () => number, itemsToSendMessageList: () => string[], lastProcessMessage: () => string, processPercentComplete: () => number, flushStatusMessages: () => void, toSendMessages: () => import("./ProcessStatusManager").statusMessage[], completedMessages: () => import("./ProcessStatusManager").statusMessage[], failedMessages: () => import("./ProcessStatusManager").statusMessage[], registerOnProcessChange: (call: Function) => void, removeOnProcessChange: (call: Function) => void, dumpCompletedActions: () => void, dumpToDo: () => void, isUUID: (theString: string) => boolean, dateStripTimezone: (date: Date | null) => Date | null, dateAddTimezone: (date: Date | null) => Date | null, selectedConsentNumber: () => any;
export declare function createStore(name: string): {
    name: string;
    dumpSchema: () => void;
    getSchema: () => ISchemaStorageArray;
    getSchemaArray: () => storeType[];
    getSchemaArrayAlpha: () => storedItem[];
    createEditContext: (name: string) => storedItem | undefined;
    removeEditContext: (context: editContext) => void;
    getContext: (key: any) => context | null;
    userChanged: (newUserID: string) => void;
    registerDataType: (type: string, remoteURL?: URL, createRemote?: boolean, retrieveRemote?: boolean, updateRemote?: boolean, deleteRemote?: boolean) => storeType;
    registerSingleItem: (type: string, storeSesstion: Boolean, storeLocal: Boolean, maxAgeLocal: number | null, remoteURL?: URL, createRemote?: boolean, retrieveRemote?: boolean, updateRemote?: boolean, deleteRemote?: boolean) => storeType;
    registerSingleUserItem: (type: string, storeSesstion: Boolean, storeLocal: Boolean, maxAgeLocal: number | null, remoteURL?: URL, createRemote?: boolean, retrieveRemote?: boolean, updateRemote?: boolean, deleteRemote?: boolean) => storeType;
    instanceItem: (type: string, data?: any) => storedItem | null;
    instanceNewItem: (type: string, data?: any) => storedItem | null;
    init: (type: string) => storedItem | null;
    save: () => void;
    registerOnChange: (name: string, call: Function) => storeType | null;
    registerOnSave: (name: string, call: Function) => storeType | null;
    registerOnDelete: (name: string, call: Function) => storeType | null;
    getStoreTypeByName: (name: string, createMissing?: boolean) => storeType | null;
    clearAllStoreCache: () => void;
    clearStoreCache: (name: string) => void;
    removeOnChange: (name: string, call: Function) => storeType | null;
    removeOnRetrieve: (name: string, call: Function) => storeType | null;
    removeOnSave: (name: string, call: Function) => storeType | null;
    removeOnDelete: (name: string, call: Function) => storeType | null;
    getAllStoreTypes: () => ISchemaStorageArray;
    setItem: (type: string, items: string | {
        [key: string]: any;
    }, data?: any) => void | undefined;
    storeData: (type: string, items: string | {
        [key: string]: any;
    }, data?: any) => void | undefined;
    getAll: (type: string) => IManagedItem[];
    requestLoad: (type: string, changeCallbackFn?: ChangeCallbackFunction, retrieveCallbackFn?: ChangeCallbackFunction) => storeType | null;
    getItem: (type: string, key: string) => Promise<string | storedItem | null | undefined>;
    itemByKey: (type: string, key: string) => storedItem | undefined;
    getPropertyArray: (type: string, keys: [string], column: string) => any;
    updateItemNewUser: (type: string, key: string) => Promise<void | undefined>;
    getAccessToken: () => Promise<string>;
    accessTokenSync: () => string | null;
    fetchDataAuthorised: (url: URL, key?: string, queryString?: string | null) => Promise<any>;
    sendDataAuthorised: (url: URL, method: string, data: string, callback: Function, key?: string, queryString?: string | null) => Promise<any>;
    loadTables: (endpoint: string) => Promise<void>;
    putTablesIntoSchemaItems: (type: string, key: string, data: any) => Promise<void>;
    call: (name: string, ...args: any[]) => any;
    callAsync: (name: string, ...args: any[]) => Promise<any>;
    registerCall: (name: string, fn: any, awaitMapAvailable?: boolean) => void;
    registerCalls: (calls: {
        [key: string]: any;
    }) => void;
    removeCall: (name: string) => void;
    removeCalls: (calls: {
        [key: string]: any;
    }) => void;
    getGlobalState: (name: string) => storedItem | undefined;
    setGlobalState: (name: string | {
        [key: string]: any;
    }, value?: any) => Promise<void>;
    getStateValue: (name: string) => any;
    getStateArrayValue: (name: string, defaultValue?: []) => any[];
    getStateFirstValue: (name: string, defaultValue?: any) => any;
    registerforStateChanges: (fn: any) => void;
    removeStateChanges: (fn: any) => void;
    dumpDataType: (type: string, level: messageLevels) => void;
    isStoredItem: (item: any) => boolean;
    getPropertyArrayFromItemArray: (items: storedItem[], column: string) => any;
    getPropertiesArrayFromItemArray: (items: storedItem[], columns: string[]) => any;
    getPropertyArrayFromItemArrayUnique: (items: storedItem[], column: string) => any;
    isItemType: (item: any, type: string, isLike?: boolean) => boolean;
    itemWillSend: (item: storedItem | storeType, message?: string) => void;
    typeWillRetrieve: (item: storedItem | storeType, message?: string) => void;
    itemIsSent: (item: storedItem | storeType, message: string) => void;
    typeIsRetrieved: (item: storedItem | storeType, message: string) => void;
    typeRetrieveFailed: (item: storedItem | storeType, message: string) => void;
    itemSendSucceeed: (item: storedItem | storeType, message: string) => void;
    itemSendFailed: (item: storedItem | storeType, message: string) => void;
    sendsInProgress: () => boolean;
    sendsToGo: () => number;
    lastSentMessage: () => number;
    itemsToSendMessageList: () => string[];
    lastProcessMessage: () => string;
    processPercentComplete: () => number;
    flushStatusMessages: () => void;
    toSendMessages: () => import("./ProcessStatusManager").statusMessage[];
    completedMessages: () => import("./ProcessStatusManager").statusMessage[];
    failedMessages: () => import("./ProcessStatusManager").statusMessage[];
    registerOnProcessChange: (call: Function) => void;
    removeOnProcessChange: (call: Function) => void;
    dumpCompletedActions: () => void;
    dumpToDo: () => void;
    isUUID: (theString: string) => boolean;
    dateStripTimezone: (date: Date | null) => Date | null;
    dateAddTimezone: (date: Date | null) => Date | null;
    selectedConsentNumber: () => any;
};
export declare function getStore(name: string): IStore;
export declare function addStore(name: string): IStore;
