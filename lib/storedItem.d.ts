import { IManagedItem, IParsedQuery, ISortParams } from "./types";
import { storeType } from "./storeType";
import { Validation } from "./Forms";
export declare class storedItem implements IManagedItem {
    _type: storeType | null;
    _primaryKey: string;
    _dirty: boolean;
    _requested: boolean;
    _hasData: boolean;
    _notified: boolean;
    _modifiedDate?: Date;
    _value?: any;
    _deleted: boolean;
    _created: boolean;
    _isEditCopy: boolean;
    _sourceItem: storedItem | null;
    _keepCallback: Function | null;
    _sendAttempts: number;
    _serial: number;
    validation?: Validation;
    constructor(type: storeType, data?: any, doNotStore?: boolean);
    toggleEditing(): void;
    isEditing(): boolean;
    setEditing(value: boolean): void;
    zoomOnSelect(): boolean;
    mounted(): void;
    defaultValues(): {
        [id: string]: any;
    };
    displayName(): string;
    get friendlyDisplayName(): string;
    levelName(): string;
    parentOrItemOfType: (type: string) => storedItem | null;
    getType: () => storeType | null;
    getTypeName: () => string;
    get storeUUID(): string;
    assignUUID(): this;
    getUUID(): string;
    checkReadAuthority(regions?: string): boolean;
    checkCreateAuthority(regions?: string): boolean;
    checkUpdateAuthority(regions?: string, defaultValue?: boolean): boolean;
    checkDeleteAuthority(regions?: string): boolean;
    getBoundingBox(): [] | null;
    setPrimaryKey: (value: any) => this;
    primaryKeyStrict: () => any;
    primaryKey: () => any;
    primaryKeySafe: () => any;
    getRegionItem: () => Promise<string | storedItem | null | undefined>;
    getParent(): storedItem | null;
    itemIsParent: (theItem: storedItem) => boolean;
    getRelatedItems: (sourceType: string | string[], relateOn: any, relateTo: string, comparison?: string, all?: boolean, sort?: ISortParams) => storedItem[];
    getRelatedItem: (sourceType: string | string[], relateOn: any, relateTo: string, comparison?: string, all?: boolean) => storedItem | null;
    getRelatedItemStored: (sourceType: string, relateOn: any, relateTo: string, name: string, comparison?: string, all?: boolean) => storedItem | null;
    getRelatedItemStoredCreate(sourceType: string, name: string, localIDField?: string, remoteIDField?: string): any;
    getRegionISO: () => any;
    setValues: (values: {
        [key: string]: any;
    }) => this;
    setValue: (value: any, forKey: string) => any;
    getValues: (keys: string[]) => {
        [key: string]: any;
    };
    getValue: (forKey?: any, defaultValue?: any) => any;
    setSingleValue: (value: any, forKey: string) => any;
    getSingleValue: (forKey?: any) => any;
    isInSelected: () => this | null;
    isInLevel: () => this | null;
    matchStringInParameters: (parameters: string[], findString: string) => storedItem | null;
    singleQuery: (queryParsed: IParsedQuery) => boolean;
    matchItem: (parsedQueries: IParsedQuery[], orMode?: boolean) => storedItem | null;
    matchItemFields: (parsedQueries: IParsedQuery[], fields: string[], orMode?: boolean) => any | null;
    isDirty: () => boolean;
    get changeCount(): number;
    mergeData(value: any): this;
    assignDefaultData: (value: any) => this;
    store(key?: string): storedItem;
    linkedUpdate: () => this;
    delete: () => this;
    shouldSendDelete(): boolean;
    shouldSendUpdate(): boolean;
    shouldSendCreate(): boolean;
    shouldForget(): boolean;
    doChangeCallbacks(key?: string): this;
    select(): this;
    mapClick: (e: any, clickAction?: string) => void;
    mapMouseEnter: (...args: any[]) => void;
    mapMouseLeave: (e: any, hoverAction?: string) => void;
    static omitItems(): string[];
    toJSON(): any;
    isSelected(): boolean;
    isHovered(): boolean;
    /**
     * return a copy of the item to use whilst editing and replace the original if change saved
     *
     * @returns storedItem - the copy
     */
    editCopy(): storedItem | null;
    get isEditCopy(): boolean;
    /**
     * return a copy of the item for use as an identical item but as new
     *
     * @returns storedItem - the copy
     */
    itemCopy(): storedItem | null;
    /**
     * write the item back to the original stored item
     *
     * @param theItem
     * returns the original item in the store that's now updated or null if not put back via callback
     */
    keepChanges(callback?: Function): storedItem | null;
    validForSave: () => boolean | Promise<any>;
    validateBeforeSave: () => boolean | Promise<any>;
    validationErrorForKey: (key: string) => any;
    validationForKey: (key: string) => boolean;
    validationForKeys: (keys: string[]) => boolean;
    /**
     * write the item back to the original stored item
     *
     * @param theItem
     * returns the original item in the store that's now updated or null if not put back via callback
     */
    storeChanges(callback?: Function): storedItem;
    storeEditPrepared(): void;
    willStoreEdit(): boolean;
    willSave(): void;
    aboutToSend(): void;
    didSend(): this;
    getDateFormatted(forKey: any, format: string, defaultValue: string): string;
    get pinColour(): string;
    get activePinColour(): string;
}
export declare function parseQueries(queries: string[]): IParsedQuery[];
export declare function parseQuery(query: string): IParsedQuery;
export declare function stripQuotes(fromStr: string): string;
