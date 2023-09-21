"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editContext = void 0;
const __1 = require("..");
const storedItem_1 = require("../storedItem");
class editContext extends storedItem_1.storedItem {
    // TODO is changed / saved tracking.
    editCopyOf(theOriginal) {
        return theOriginal.editCopy();
    }
    save() {
        // TODO find the local changes and write back to the main store and then save main store
        (0, __1.save)();
    }
    cancel() {
        // TODO clear out all changed items.
    }
    willDispose() {
    }
    /**
     * Instance an item and optionally move the data into it. For creation of instances coming from remote sources.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    instanceItem(type, data) {
        return this.instanceItem(type, data);
    }
    /**
     * Instance an item and optionally move the data into it. This is for creation of instances that do not already exist remotely.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    instanceNewItem(type, data) {
        return (0, __1.instanceNewItem)(type, data);
    }
    /**
     * Create an instance of an item locally rather than from an existing persisant store.
     * @param type - Type of item to instance
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    init(type) {
        return (0, __1.init)(type);
    }
    setItem(type, items, data) {
        (0, __1.setItem)(type, items, data);
    }
    /**
     * Put item in the store or update existing
     * @param type Data type of item
     * @param items
     * @param key Primary Key value
     * @param data Data to store
     */
    storeData(type, items, data) {
        (0, __1.storeData)(type, items, data);
    }
    /**
     * Get all items in the colection as an array
     * note that this does not return metadata about item state.
     * and currently does not fetch if not loaded
     * @param type The data type of items to return
     * @returns array
     */
    getAll(type) {
        return (0, __1.getAll)(type);
    }
    /**
     * Get an item from the store by primary key - or a single item if type is a single item
     * @param type The data type of the item required
     * @param key The primary key of he individual item
     * @returns
     */
    getItem(type, key) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, __1.getItem)(type, key);
        });
    }
    itemByKey(type, key) {
        return (0, __1.itemByKey)(type, key);
    }
    getPropertyArray(type, keys, column) {
        return (0, __1.getPropertyArray)(type, keys, column);
    }
    dumpDataType(type, level) {
        (0, __1.dumpDataType)(type, level);
    }
    getPropertyArrayFromItemArray(items, column) {
        (0, __1.getPropertyArrayFromItemArray)(items, column);
    }
    getPropertyArrayFromItemArrayUnique(items, column) {
        return (0, __1.getPropertyArrayFromItemArrayUnique)(items, column);
    }
}
exports.editContext = editContext;
