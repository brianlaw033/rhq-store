import { dumpDataType, getAll, getItem, getPropertyArray, getPropertyArrayFromItemArray, getPropertyArrayFromItemArrayUnique, init, instanceNewItem, itemByKey, putTablesIntoSchemaItems, save, setItem, storeData, getContext, instanceItem } from ".";
import { context } from "./context";
import { storedItem } from "./storedItem";
import { messageLevels, ISchemaStorageArray } from "./types";
import { storeType } from "./storeType";

export class editContext extends context {
    // TODO is changed / saved tracking.
    _parentContext: context | null = getContext("main");;

    dataSchema: ISchemaStorageArray = {};

    editCopyOf(theOriginal: storedItem) {
        return theOriginal.editCopy();
    }

    save() {
        // TODO find the local changes and write back to the main store and then save main store
        
        Object.values(this.dataSchema).forEach((value) => {
            value.saveToContext(this._parentContext);
        });

        this._parentContext?.save();
    
    }
    cancel () {
        // TODO clear out all changed items.
        this.dataSchema = {};
    }
    
    willDispose() {
        this.dataSchema = {};
    }
    /**
     * Instance an item and optionally move the data into it. For creation of instances coming from remote sources.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    instanceItem(type: string, data?: any): storedItem | null {
        

        return instanceItem(type, data);
    }

    /**
     * Instance an item and optionally move the data into it. This is for creation of instances that do not already exist remotely.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    instanceNewItem(type: string, data?: any): storedItem | null {
        
        return instanceNewItem(type, data);
    }

    /**
     * Create an instance of an item locally rather than from an existing persisant store.
     * @param type - Type of item to instance
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    init(type: string) {
        return init(type);
    }


    setItem(type: string, items: { [key: string]: any } | string, data?: any) {
        setItem(type, items, data);
    }

    /**
     * Put item in the store or update existing
     * @param type Data type of item
     * @param items
     * @param key Primary Key value
     * @param data Data to store
     */
    storeData(type: string, items: { [key: string]: any } | string, data?: any) {
        storeData(type, items, data);
    }

    /**
     * Get all items in the colection as an array
     * note that this does not return metadata about item state.
     * and currently does not fetch if not loaded
     * @param type The data type of items to return
     * @returns array
     */
    getAll(type: string) {
        return getAll(type);
    }

    /**
     * Get an item from the store by primary key - or a single item if type is a single item
     * @param type The data type of the item required
     * @param key The primary key of he individual item
     * @returns
     */
    async getItem(type: string, key: string) {
        getItem(type, key);
    }

    itemByKey(type: string, key: string) {
        return itemByKey(type, key);
    }

    getPropertyArray(type: string, keys: [string], column: string) {
        return getPropertyArray(type, keys, column);
    }
    dumpDataType(type: string, level: messageLevels) {
        dumpDataType(type, level);
    }


    getPropertyArrayFromItemArray(items: storedItem[], column: string) {
        getPropertyArrayFromItemArray(items, column)
    }
    getPropertyArrayFromItemArrayUnique(items: storedItem[], column: string) {
        
        return getPropertyArrayFromItemArrayUnique(items, column);
    }
    getStoreTypeByName(name: string, createMissing?: boolean): storeType | null {
        return this._parentContext?.getStoreTypeByName(name, createMissing) || null;
    }
}

