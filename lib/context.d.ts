import { storedItem } from "./storedItem";
import { messageLevels } from "./types";
import { storeType } from "./storeType";
export declare class context extends storedItem {
    editCopyOf(theOriginal: storedItem): storedItem | null;
    save(): void;
    cancel(): void;
    willDispose(): void;
    /**
     * Instance an item and optionally move the data into it. For creation of instances coming from remote sources.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    instanceItem(type: string, data?: any): storedItem | null;
    /**
     * Instance an item and optionally move the data into it. This is for creation of instances that do not already exist remotely.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    instanceNewItem(type: string, data?: any): storedItem | null;
    /**
     * Create an instance of an item locally rather than from an existing persisant store.
     * @param type - Type of item to instance
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    init(type: string): storedItem | null;
    setItem(type: string, items: {
        [key: string]: any;
    } | string, data?: any): void;
    /**
     * Put item in the store or update existing
     * @param type Data type of item
     * @param items
     * @param key Primary Key value
     * @param data Data to store
     */
    storeData(type: string, items: {
        [key: string]: any;
    } | string, data?: any): void;
    /**
     * Get all items in the colection as an array
     * note that this does not return metadata about item state.
     * and currently does not fetch if not loaded
     * @param type The data type of items to return
     * @returns array
     */
    getAll(type: string): import("./types").IManagedItem[];
    /**
     * Get an item from the store by primary key - or a single item if type is a single item
     * @param type The data type of the item required
     * @param key The primary key of he individual item
     * @returns
     */
    getItem(type: string, key: string): Promise<void>;
    itemByKey(type: string, key: string): storedItem | undefined;
    getPropertyArray(type: string, keys: [string], column: string): any;
    dumpDataType(type: string, level: messageLevels): void;
    getPropertyArrayFromItemArray(items: storedItem[], column: string): void;
    getPropertyArrayFromItemArrayUnique(items: storedItem[], column: string): any;
    getStoreTypeByName(name: string, createMissing?: boolean): storeType | null;
}
