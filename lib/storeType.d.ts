import memoize from "memoizee";
import { ChangeCallbackFunction, IManagedItemDict, IQueryParams, IRelationship, ISchemaItem, messageLevels, objects } from "./types";
import { storedItem } from "./storedItem";
import { context } from "./context";
export declare class storeType implements ISchemaItem {
    name: string;
    objectType?: objects;
    singleEntry: boolean;
    userBased: boolean;
    primaryKeyProperty?: string;
    objectRegionProperty?: string;
    relationships?: Array<IRelationship>;
    session?: boolean;
    local?: boolean;
    localMaxAge?: number;
    restEndpoint?: URL;
    clientUnwrap?: any;
    create: boolean;
    retrieve: boolean;
    update: boolean;
    delete: boolean;
    keyParameter?: string;
    requested: boolean;
    onChangeCallHandler: CallbackHandler;
    onRetrieveCallHandler: CallbackHandler;
    onSaveCallHandler: CallbackHandler;
    onDeleteCallHandler: CallbackHandler;
    loadRequest: boolean;
    loaded?: boolean;
    hasChanges: boolean;
    displayName?: string;
    _sendCreatesLock: boolean;
    _sendRetrievesLock: boolean;
    latestData: number;
    managedItemStorage: IManagedItemDict;
    managedItemStoragebyUUID: IManagedItemDict;
    constructor(name: string);
    primaryKey: () => any;
    changed: () => void;
    setupRemoteStorage(remoteURL?: URL, createRemote?: boolean, retrieveRemote?: boolean, updateRemote?: boolean, deleteRemote?: boolean): void;
    setupLocalStorage(maximumAge?: number): void;
    registerOnChange(call: Function): this;
    registerOnRetrieve(call: Function): this;
    registerOnSave(call: Function): this;
    registerOnDelete(call: Function): this;
    removeOnChange(call: Function): void;
    removeOnRetrieve(call: Function): void;
    removeOnSave(call: Function): void;
    removeOnDelete(call: Function): void;
    storeItemByKey(key: string, data: any): void;
    updateLatestModified(theNewDate: string | Date | undefined): void;
    storeData(items: {
        [key: string]: any;
    } | string, data?: any): void;
    storeLocal(data: any, localID: string): void;
    localStorageID(localID: string): string;
    allMatchingItems(queryParams: IQueryParams): storedItem[];
    /**
     * Return an array of stored items matching the query parameters supplied that conform to the current level.
     * @param queryParams
     * @returns
     */
    _matchingItems(queryParams: IQueryParams): storedItem[];
    matchingItems: ((queryParams: IQueryParams) => storedItem[]) & memoize.Memoized<(queryParams: IQueryParams) => storedItem[]>;
    clearCache: () => void;
    forEach: (callbackFn: Function) => void;
    checkReadAuthority: (region?: string) => boolean;
    checkUpdateAuthority: (region?: string, defaultValue?: boolean) => boolean;
    checkCreateAuthority: (region?: string) => boolean;
    checkDeleteAuthority: (region?: string) => boolean;
    doChangeCallbacks(key: string, data: any): void;
    doRetriveCallbacks(key: string, data: any): void;
    userChanged(newUserID: string): void;
    moveItem(from: string, to: string, item?: storedItem): void;
    updateItemNewUser(key: string): void;
    itemByKey(key: string, createMissing?: boolean, fromData?: any): storedItem | undefined;
    insertItemByKey(key: string, data: storedItem): storedItem;
    getItem(key: string): Promise<string | storedItem | null | undefined>;
    getStorage: () => IManagedItemDict;
    dumpData(level: messageLevels): void;
    save: () => Promise<void>;
    saveToContext(parentContext: context | null): void;
    sendDeletes: () => Promise<void>;
    sendCreates: () => Promise<void>;
    sendUpdates: () => Promise<void>;
    receiveDeleteResults: (returned: Promise<any>) => Promise<void>;
    receiveCreateResults: (returned: Promise<any>) => Promise<void>;
    receiveUpdateResults: (returned: Promise<any>) => Promise<void>;
    doForgets: () => void;
    getForgetList: () => string[];
    getDeleteList: () => storedItem[];
    getUpdateList: () => storedItem[];
    getCreateList: () => storedItem[];
    getPropertyArray(keys: [string] | string, column: string, unique?: boolean): any;
    /**
     * Return an array of [{parameter: value, parameter: value…}, …] for every item matching the queryParams including ones not in the current level
     * @param queryParams
     * @param parameters - paramter names to extract from the storedItems (uses getValue() so all parameter types work)
     * @param uniqueBy - column to unique by (not yet implemented)
     * @returns [{}]
     */
    getPropertyDictArrayAll(queryParams: IQueryParams, parameters: string[], uniqueBy?: string): any;
    /**
     * Return an array of [{parameter: value, parameter: value…}, …] for every item matching the queryParams in current level
     * @param queryParams
     * @param parameters - paramter names to extract from the storedItems (uses getValue() so all parameter types work)
     * @param uniqueBy - column to unique by (not yet implemented)
     * @returns [{}]
     */
    getPropertyDictArray(queryParams: IQueryParams, parameters: string[], uniqueBy?: string): Promise<any>;
    init(): storedItem;
    isSingleEntry(): boolean;
    instanceNewItem(data?: any): storedItem;
    instanceItem(data?: any, doNotStore?: boolean): storedItem;
    /**
     * make a copy of a storedItem to use whilst editing and replace the original if change saved
     * @param theOriginal
     * @returns storedItem - the copy
     */
    editCopy(theOriginal: storedItem): storedItem;
    /**
     * make a copy of a storedItem as a new item
     * @param theOriginal
     * @returns storedItem - the copy
     */
    itemCopy(theOriginal: storedItem): storedItem;
    /**
     * write the item back to the original stored item
     *
     * @param theItem
     * returns the original item in the store that's now updated or null if not put back
     */
    keepChanges(theItem: storedItem, callback?: Function): storedItem | null;
    requestLoad(changeCallbackFn?: ChangeCallbackFunction, retrieveCallbackFn?: ChangeCallbackFunction): void;
}
export declare class CallbackHandler {
    name: string;
    callList: Array<Function>;
    constructor(name: string);
    registerOnEvent(call: Function): void;
    removeOnEvent(call: Function): void;
    doEventCallbacks: (key?: string, data?: any) => void;
}
export declare function CreateUUID(): string;
