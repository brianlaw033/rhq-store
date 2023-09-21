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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUUID = exports.CallbackHandler = exports.storeType = void 0;
const memoizee_1 = __importDefault(require("memoizee"));
const types_1 = require("./types");
const storedItem_1 = require("./storedItem");
const remotehq_1 = require("./remotehq");
const index_1 = require("./index");
const classes_1 = require("./classes");
const ListOperations_1 = require("./helpers/ListOperations");
class storeType {
    constructor(name) {
        this.name = "new";
        this.singleEntry = false;
        this.userBased = false;
        this.create = false;
        this.retrieve = false;
        this.update = false;
        this.delete = false;
        this.requested = false;
        // onChangeCall: Array<Function> = [];
        this.onChangeCallHandler = new CallbackHandler(this.name);
        this.onRetrieveCallHandler = new CallbackHandler(this.name + "/retrieve");
        this.onSaveCallHandler = new CallbackHandler(this.name + "/save");
        this.onDeleteCallHandler = new CallbackHandler(this.name + "/delete");
        this.loadRequest = false;
        this.hasChanges = false;
        this._sendCreatesLock = false;
        this._sendRetrievesLock = false;
        this.latestData = 0;
        this.managedItemStorage = {};
        this.managedItemStoragebyUUID = {};
        this.primaryKey = () => {
            return this.name;
        };
        this.changed = () => {
            // this.doChangeCallbacks("",null);
            this.hasChanges = true;
        };
        this.matchingItems = (0, memoizee_1.default)(this._matchingItems, {
            maxAge: 5000,
            normalizer: (args) => {
                var _a;
                const key = ((_a = (0, remotehq_1.getUser)()) === null || _a === void 0 ? void 0 : _a.displayName()) +
                    this.name +
                    Object.keys(this.managedItemStorage).length +
                    `${JSON.stringify(args)}`;
                return key;
            },
        });
        this.clearCache = () => {
            this.matchingItems.clear();
        };
        this.forEach = (callbackFn) => {
            (0, remotehq_1.printData)(this.managedItemStorage, types_1.messageLevels.debug, "FOR EACH");
            Object.keys(this.managedItemStorage).forEach((key) => {
                callbackFn(this.managedItemStorage[key], key);
                this.doChangeCallbacks(key, this.managedItemStorage[key]);
            });
        };
        this.checkReadAuthority = (region) => {
            // call check authority for thisitem type in this region
            if (this.objectType) {
                // TODO fix this to actually return a boolean after waiting for promise return
                (0, remotehq_1.printMessage)("Checking Read: " + this.objectType, types_1.messageLevels.debug);
                return (0, remotehq_1.checkLoadedAuthority)(types_1.actions.retrieve, this.objectType, null, region);
            }
            return true;
        };
        this.checkUpdateAuthority = (region, defaultValue) => {
            // call check authority for thisitem type in this region
            if (this.objectType) {
                // TODO fix this to actually return a boolean after waiting for promise return
                (0, remotehq_1.printMessage)("Checking Update: " + this.objectType, types_1.messageLevels.debug);
                (0, remotehq_1.printMessage)("Region: " + region, types_1.messageLevels.debug);
                const allowed = (0, remotehq_1.checkLoadedAuthority)(types_1.actions.update, this.objectType, null, region);
                (0, remotehq_1.printMessage)("Allowed in storeType: " + allowed, types_1.messageLevels.debug);
                return allowed;
            }
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            return true;
        };
        this.checkCreateAuthority = (region) => {
            // call check authority for thisitem type in this region
            (0, remotehq_1.printMessage)("Object Type: " + this.objectType, types_1.messageLevels.debug);
            if (this.objectType) {
                // TODO fix this to actually return a boolean after waiting for promise return
                (0, remotehq_1.printMessage)("Checking Create: " + this.objectType, types_1.messageLevels.debug);
                return (0, remotehq_1.checkLoadedAuthority)(types_1.actions.create, this.objectType, null, region);
            }
            return true;
        };
        this.checkDeleteAuthority = (region) => {
            // call check authority for thisitem type in this region
            if (this.objectType) {
                // TODO fix this to actually return a boolean after waiting for promise return
                (0, remotehq_1.printMessage)("Checking Delete: " + this.objectType, types_1.messageLevels.debug);
                return (0, remotehq_1.checkLoadedAuthority)(types_1.actions.delete, this.objectType, null, region);
            }
            return true;
        };
        this.getStorage = () => {
            return this.managedItemStorage;
        };
        this.save = () => __awaiter(this, void 0, void 0, function* () {
            this.doForgets();
            this.sendDeletes();
            this.sendUpdates();
            this.sendCreates();
        });
        this.sendDeletes = () => __awaiter(this, void 0, void 0, function* () {
            const deletes = this.getDeleteList();
            if (this.delete && this.restEndpoint) {
                if (deletes.length > 0) {
                    const deleteIDs = [];
                    deletes.forEach((item) => {
                        const theKeys = { primaryKey: item.primaryKey(), uuid: item.storeUUID };
                        deleteIDs.push(theKeys);
                    });
                    const deleteJSON = JSON.stringify(deleteIDs);
                    (0, index_1.sendDataAuthorised)(this.restEndpoint, "DELETE", deleteJSON, this.receiveDeleteResults);
                }
            }
            else {
                if (deletes.length > 0) {
                    (0, remotehq_1.printMessage)("cannot send deletes for " + this.name, types_1.messageLevels.error);
                }
            }
        });
        this.sendCreates = () => __awaiter(this, void 0, void 0, function* () {
            if (!this._sendCreatesLock) {
                const creates = this.getCreateList();
                if (this.create && this.restEndpoint) {
                    if (creates.length > 0) {
                        this._sendCreatesLock = true;
                        const createIDs = [];
                        creates.forEach((item) => {
                            if (item.shouldSendCreate()) {
                                const theKeys = {
                                    primaryKey: item.primaryKey(),
                                    uuid: item.storeUUID,
                                    item: item,
                                };
                                item.aboutToSend();
                                createIDs.push(theKeys);
                            }
                        });
                        const createJSON = JSON.stringify(createIDs);
                        (0, remotehq_1.printData)(createJSON, types_1.messageLevels.debug, "JSON to send to create");
                        (0, index_1.sendDataAuthorised)(this.restEndpoint, "POST", createJSON, this.receiveCreateResults);
                    }
                    else {
                        this._sendCreatesLock = false;
                    }
                }
                else {
                    if (creates.length > 0) {
                        (0, remotehq_1.printMessage)("cannot send creates for " + this.name, types_1.messageLevels.error);
                    }
                }
            }
            else {
                (0, remotehq_1.printMessage)("Creates already in progress " + this.name, types_1.messageLevels.debug);
                setTimeout(() => {
                    this.sendCreates();
                }, 1000);
            }
        });
        this.sendUpdates = () => __awaiter(this, void 0, void 0, function* () {
            const updates = this.getUpdateList();
            if (this.update && this.restEndpoint) {
                if (updates.length > 0) {
                    const updateIDs = [];
                    updates.forEach((item) => {
                        const theKeys = {
                            primaryKey: item.primaryKey(),
                            uuid: item.storeUUID,
                            item: item,
                        };
                        updateIDs.push(theKeys);
                    });
                    const updateJSON = JSON.stringify(updateIDs);
                    (0, index_1.sendDataAuthorised)(this.restEndpoint, "PUT", updateJSON, this.receiveUpdateResults);
                }
            }
            else {
                if (updates.length > 0) {
                    (0, remotehq_1.printMessage)("cannot send updates for " + this.name, types_1.messageLevels.error);
                    updates.forEach((item) => (0, index_1.itemSendFailed)(item, "Cannot send updates for " + this.name));
                }
            }
        });
        this.receiveDeleteResults = (returned) => __awaiter(this, void 0, void 0, function* () {
            returned.then((result) => {
                (0, remotehq_1.printData)(result, types_1.messageLevels.debug, "Results from Delete");
                result.forEach((element) => {
                    const theKey = element.primaryKey;
                    const theItem = this.managedItemStorage[theKey];
                    theItem._dirty = false;
                    theItem._created = false;
                    theItem._hasData = true;
                    (0, index_1.itemSendSucceeed)(theItem, theItem.displayName() + " deleted");
                    this.onDeleteCallHandler.doEventCallbacks(theKey, theItem);
                    // delete this.managedItemStorage[theKey];
                });
            });
        });
        this.receiveCreateResults = (returned) => __awaiter(this, void 0, void 0, function* () {
            (0, remotehq_1.printMessage)("clearing create lock: " + this.name, types_1.messageLevels.debug);
            this._sendCreatesLock = false;
            returned.then((result) => {
                // const decodedData = JSON.parse(result);
                (0, remotehq_1.printData)(result, types_1.messageLevels.debug, "decodedData from Create");
                result.forEach((element) => {
                    const theKey = element.uuid;
                    if (theKey) {
                        const theItem = this.managedItemStorage[theKey];
                        (0, remotehq_1.printData)(theItem, types_1.messageLevels.debug, "theItem from Create");
                        if (theItem) {
                            if (this.primaryKeyProperty) {
                                theItem[this.primaryKeyProperty] = element.primaryKey;
                                // theItem.setValue(element.primaryKey, this.primaryKeyProperty );
                                this.moveItem(theKey, element.primaryKey, theItem);
                            }
                            (0, remotehq_1.printData)(element, types_1.messageLevels.debug, "element in receiveCreateResults ");
                            for (const [key, value] of Object.entries(element)) {
                                if (key !== "primaryKey" && key !== "uuid") {
                                    theItem.setValue(value, key);
                                }
                            }
                            theItem._dirty = false;
                            theItem._created = false;
                            theItem._hasData = true;
                            theItem.didSend();
                            (0, index_1.itemSendSucceeed)(theItem, theItem.displayName() + " saved");
                            this.onSaveCallHandler.doEventCallbacks(theItem.primaryKey(), theItem);
                        }
                    }
                });
                //    this.dumpData(messageLevels.debug)
            });
        });
        this.receiveUpdateResults = (returned) => __awaiter(this, void 0, void 0, function* () {
            (0, remotehq_1.printData)(returned, types_1.messageLevels.debug, "Results from Update");
            returned.then((result) => {
                // const decodedData = JSON.parse(result);
                (0, remotehq_1.printData)(result, types_1.messageLevels.debug, "decodedData from Create");
                result.forEach((element) => {
                    const theKey = element.primaryKey;
                    if (theKey) {
                        const theItem = this.managedItemStorage[theKey];
                        (0, remotehq_1.printData)(theItem, types_1.messageLevels.debug, "theItem from Update");
                        if (theItem) {
                            // if(this.primaryKeyProperty) {
                            //     (theItem as any)[this.primaryKeyProperty] = element.primaryKey;
                            //     // theItem.setValue(element.primaryKey, this.primaryKeyProperty );
                            //     this.moveItem(theKey,element.primaryKey, theItem);
                            // }
                            for (const [key, value] of Object.entries(element)) {
                                if (key === "new_primary_key") {
                                    if (this.primaryKeyProperty) {
                                        theItem.setValue(value, this.primaryKeyProperty);
                                        (0, remotehq_1.printData)(theItem, types_1.messageLevels.debug, "theItem after setValue");
                                        this.moveItem(theKey, value.toString(), theItem);
                                        (0, remotehq_1.printData)(theItem, types_1.messageLevels.debug, "theItem after move");
                                        (0, remotehq_1.printData)(value, types_1.messageLevels.debug, "setting " + this.primaryKeyProperty);
                                    }
                                }
                                else if (key === "new_uuid") {
                                    theItem.setValue(value, "uuid");
                                }
                                if (key !== "primaryKey" && key !== "uuid") {
                                    theItem.setValue(value, key);
                                }
                            }
                            (0, remotehq_1.printData)(theItem, types_1.messageLevels.debug, "theItem after update");
                            theItem._dirty = false;
                            theItem._created = false;
                            theItem._hasData = true;
                            (0, index_1.itemSendSucceeed)(theItem, theItem.displayName() + " saved");
                            this.onSaveCallHandler.doEventCallbacks(theItem.primaryKey(), theItem);
                        }
                    }
                });
                //    this.dumpData(messageLevels.verbose)
            });
        });
        this.doForgets = () => {
            const theForgets = this.getForgetList();
            theForgets.forEach((value) => {
                delete this.managedItemStorage[value];
            });
        };
        this.getForgetList = () => {
            const theItems = [];
            Object.keys(this.managedItemStorage).forEach((key) => {
                const item = this.managedItemStorage[key];
                if (item.shouldForget() &&
                    (this.objectType !== undefined ||
                        (0, remotehq_1.checkLoadedAuthority)(types_1.actions.delete, this.objectType || types_1.objects.none, item.primaryKey(), item.getRegionISO()))) {
                    theItems.push(key);
                }
            });
            return theItems;
        };
        this.getDeleteList = () => {
            const theItems = [];
            if (this.delete) {
                Object.keys(this.managedItemStorage).forEach((key) => {
                    const item = this.managedItemStorage[key];
                    if (item.shouldSendDelete() &&
                        (this.objectType !== undefined ||
                            (0, remotehq_1.checkLoadedAuthority)(types_1.actions.delete, this.objectType || types_1.objects.none, item.primaryKey(), item.getRegionISO()))) {
                        theItems.push(item);
                        (0, index_1.itemWillSend)(item, "Deleting " + item.displayName());
                    }
                });
            }
            return theItems;
        };
        this.getUpdateList = () => {
            const theItems = [];
            if (this.update) {
                Object.keys(this.managedItemStorage).forEach((key) => {
                    const item = this.managedItemStorage[key];
                    // if(item.shouldSendUpdate() &&  checkAuthority(actions.update, this.objectType || objects.none , item.primaryKey(), item.getRegionISO() )) {
                    if (item.shouldSendUpdate() &&
                        (0, remotehq_1.checkLoadedAuthority)(types_1.actions.update, this.objectType || types_1.objects.none, item.primaryKey(), item.getRegionISO())) {
                        theItems.push(item);
                        (0, index_1.itemWillSend)(item, "Saving " + item.displayName());
                    }
                });
            }
            return theItems;
        };
        this.getCreateList = () => {
            const theItems = [];
            if (this.create) {
                Object.keys(this.managedItemStorage).forEach((key) => {
                    const item = this.managedItemStorage[key];
                    // if(item.shouldSendCreate() &&  checkAuthority(actions.create, this.objectType || objects.none , item.primaryKey(), item.getRegionISO() )) {
                    if (item.shouldSendCreate()) {
                        theItems.push(item);
                        (0, index_1.itemWillSend)(item, "Adding " + item.displayName());
                    }
                });
            }
            return theItems;
        };
        this.name = name;
        this.onChangeCallHandler.name = name;
        this.onRetrieveCallHandler.name = name + "/retrieve";
        this.onSaveCallHandler.name = name + "/save";
        this.onDeleteCallHandler.name = name + "/delete";
    }
    setupRemoteStorage(remoteURL, createRemote, retrieveRemote, updateRemote, deleteRemote) {
        this.restEndpoint = remoteURL;
        this.create = createRemote || false;
        this.retrieve = retrieveRemote || false;
        this.update = updateRemote || false;
        this.delete = deleteRemote || false;
    }
    setupLocalStorage(maximumAge) {
        this.local = true;
        this.localMaxAge = maximumAge;
    }
    registerOnChange(call) {
        this.onChangeCallHandler.registerOnEvent(call);
        return this;
        // this.onChangeCall.push(call);
    }
    registerOnRetrieve(call) {
        this.onRetrieveCallHandler.registerOnEvent(call);
        return this;
    }
    registerOnSave(call) {
        this.onSaveCallHandler.registerOnEvent(call);
        return this;
    }
    registerOnDelete(call) {
        this.onDeleteCallHandler.registerOnEvent(call);
        return this;
    }
    removeOnChange(call) {
        this.onChangeCallHandler.removeOnEvent(call);
    }
    removeOnRetrieve(call) {
        this.onRetrieveCallHandler.removeOnEvent(call);
    }
    removeOnSave(call) {
        this.onSaveCallHandler.removeOnEvent(call);
    }
    removeOnDelete(call) {
        this.onDeleteCallHandler.removeOnEvent(call);
    }
    storeItemByKey(key, data) {
        if (this.primaryKeyProperty) {
            key = data[this.primaryKeyProperty] || key;
        }
        const theData = this.itemByKey(key, true, data);
        this.storeLocal(data, key);
        if (theData) {
            this.insertItemByKey(key, theData);
        }
        const theDate = theData === null || theData === void 0 ? void 0 : theData.getValue("modified_timestamp");
        this.updateLatestModified(theDate);
        setTimeout(() => {
            this.onChangeCallHandler.doEventCallbacks(key, theData);
        });
    }
    updateLatestModified(theNewDate) {
        if (theNewDate && theNewDate !== undefined) {
            if (typeof theNewDate === "string") {
                const theDateNum = Date.parse(theNewDate);
                if (theDateNum > this.latestData) {
                    this.latestData = theDateNum;
                }
            }
            else {
                const theDateNum = theNewDate.valueOf();
                if (theDateNum > this.latestData) {
                    this.latestData = theDateNum;
                }
            }
        }
    }
    storeData(items, data) {
        // printData(items,messageLevels.verbose,"items in storeData");
        if (items === null) {
            (0, remotehq_1.printMessage)("attempting to set null key for " + this.name, types_1.messageLevels.error);
        }
        if (typeof items === "string") {
            this.storeItemByKey(items, data);
        }
        else {
            (0, remotehq_1.printData)(items, types_1.messageLevels.debug, "items in storeData");
            Object.keys(items).forEach((key, i) => {
                const data = items[key];
                this.storeItemByKey(key, data);
            });
        }
    }
    storeLocal(data, localID) {
        var _a;
        if (this.local) {
            const lID = this.localStorageID(localID);
            let storableString;
            if (typeof data === "object") {
                storableString = JSON.stringify(data);
            }
            else if (typeof data === "string") {
                storableString = data;
            }
            else if (data && data.toString) {
                storableString = (data === null || data === void 0 ? void 0 : data.toString()) || "";
            }
            if (storableString) {
                localStorage.setItem(lID, storableString);
                localStorage.setItem(lID + ":modified", new Date().toString());
                if (this.localMaxAge) {
                    const expiresDate = new Date(new Date().valueOf() + ((_a = this.localMaxAge) === null || _a === void 0 ? void 0 : _a.valueOf()));
                    (0, remotehq_1.printData)(expiresDate, types_1.messageLevels.debug, "Expires Date");
                    localStorage.setItem(lID + ":expires", expiresDate.toString());
                }
            }
        }
    }
    localStorageID(localID) {
        if (this.singleEntry) {
            return this.name;
        }
        else {
            return this.name + ":" + localID;
        }
    }
    // all items no matter the user's permissions or level - for debugging etc.
    allMatchingItems(queryParams) {
        const theParsedQueries = (0, storedItem_1.parseQueries)(queryParams.queries || []);
        const theItems = [];
        // printData(theParsedQueries,messageLevels.debug,"PArsed Queries")
        Object.keys(this.managedItemStorage).forEach((key) => {
            // add check is item allowed for user
            const item = this.managedItemStorage[key];
            if (item) {
                // printMessage("Checking Item: "+ key, messageLevels.debug);
                let theReturn = item.matchItem(theParsedQueries, queryParams.searchOrMode);
                if (theReturn) {
                    // printMessage("Passed matchItem "+ key, messageLevels.debug);
                    if (queryParams.stringParams &&
                        queryParams.stringParams.length > 0 &&
                        queryParams.stringToFind &&
                        queryParams.stringToFind.trim().length > 0) {
                        theReturn = theReturn.matchStringInParameters(queryParams.stringParams, queryParams.stringToFind);
                        if (theReturn) {
                            // printData(theReturn, messageLevels.debug, "Returned");
                            theItems.push(theReturn);
                        }
                    }
                    else {
                        // printData(theReturn, messageLevels.debug, "Returned");
                        theItems.push(theReturn);
                    }
                }
            }
        });
        return (0, ListOperations_1.sortItemArray)(theItems, queryParams);
        // return theItems ;
    }
    /**
     * Return an array of stored items matching the query parameters supplied that conform to the current level.
     * @param queryParams
     * @returns
     */
    _matchingItems(queryParams) {
        const theItems = [];
        if (!queryParams || !queryParams.queries || queryParams.queries.length < 1) {
            Object.keys(this.managedItemStorage).forEach((key) => {
                // add check is item allowed for user
                const item = this.managedItemStorage[key];
                if (item && this.checkReadAuthority(item.getRegionISO())) {
                    const inLevel = item.isInLevel();
                    if (inLevel) {
                        theItems.push(item);
                    }
                }
            });
            return (0, ListOperations_1.sortItemArray)(theItems, queryParams);
        }
        const theParsedQueries = (0, storedItem_1.parseQueries)(queryParams.queries || []);
        const theFirstQuery = theParsedQueries[0];
        if ((theFirstQuery.column === "primaryKey" ||
            theFirstQuery.column === this.primaryKeyProperty) &&
            (theFirstQuery.operator === "==" || theFirstQuery.operator === "===")) {
            const item = this.managedItemStorage[theFirstQuery.value];
            if (item && this.checkReadAuthority(item.getRegionISO())) {
                const inLevel = item.isInLevel();
                if (inLevel) {
                    // printMessage("Checking Item: "+ key, messageLevels.debug);
                    let theReturn = item.matchItem(theParsedQueries, queryParams.searchOrMode);
                    if (theReturn) {
                        // printMessage("Passed matchItem "+ key, messageLevels.debug);
                        if (queryParams.stringParams &&
                            queryParams.stringParams.length > 0 &&
                            queryParams.stringToFind &&
                            queryParams.stringToFind.trim().length > 0) {
                            theReturn = theReturn.matchStringInParameters(queryParams.stringParams, queryParams.stringToFind);
                            if (theReturn) {
                                (0, remotehq_1.printData)(theReturn, types_1.messageLevels.debug, "Returned");
                                return [theReturn];
                            }
                        }
                        else {
                            (0, remotehq_1.printData)(theReturn, types_1.messageLevels.debug, " else Returned");
                            return [theReturn];
                        }
                    }
                }
            }
            return [];
        }
        Object.keys(this.managedItemStorage).forEach((key) => {
            // add check is item allowed for user
            const item = this.managedItemStorage[key];
            if (item && this.checkReadAuthority(item.getRegionISO())) {
                const inLevel = item.isInLevel();
                if (inLevel) {
                    // printMessage("Checking Item: "+ key, messageLevels.debug);
                    let theReturn = item.matchItem(theParsedQueries, queryParams.searchOrMode);
                    if (theReturn) {
                        // printMessage("Passed matchItem "+ key, messageLevels.debug);
                        if (queryParams.stringParams &&
                            queryParams.stringParams.length > 0 &&
                            queryParams.stringToFind &&
                            queryParams.stringToFind.trim().length > 0) {
                            theReturn = theReturn.matchStringInParameters(queryParams.stringParams, queryParams.stringToFind);
                            if (theReturn) {
                                (0, remotehq_1.printData)(theReturn, types_1.messageLevels.debug, "Returned");
                                theItems.push(theReturn);
                            }
                        }
                        else {
                            (0, remotehq_1.printData)(theReturn, types_1.messageLevels.debug, " else Returned");
                            theItems.push(theReturn);
                        }
                    }
                }
            }
        });
        const result = (0, ListOperations_1.sortItemArray)(theItems, queryParams);
        return result;
        // return theItems ;
    }
    doChangeCallbacks(key, data) {
        this.onChangeCallHandler.doEventCallbacks(key, data);
    }
    doRetriveCallbacks(key, data) {
        this.onRetrieveCallHandler.doEventCallbacks(key, data);
    }
    userChanged(newUserID) {
        if (this.userBased) {
            (0, remotehq_1.printMessage)("Schema Item: " + this.name, types_1.messageLevels.debug);
            for (const dataKey in this.managedItemStorage) {
                (0, remotehq_1.printData)(dataKey, types_1.messageLevels.debug, "Data Key: ");
                this.updateItemNewUser(dataKey);
            }
        }
    }
    moveItem(from, to, item) {
        let movedItem = item;
        if (!item) {
            movedItem = this.itemByKey(from);
        }
        if (this.managedItemStorage && this.managedItemStorage[from]) {
            delete this.managedItemStorage[from];
        }
        if (movedItem) {
            this.insertItemByKey(to, movedItem);
        }
    }
    updateItemNewUser(key) {
        (0, remotehq_1.printMessage)("updateing for user change: " + this.name + " " + key, types_1.messageLevels.debug);
        const localID = this.localStorageID(key);
        if (this.local) {
            const theLocalData = localStorage.getItem(localID);
            if (theLocalData) {
                localStorage.removeItem(localID);
                localStorage.removeItem("expires:" + localID);
            }
        }
        const theData = this.itemByKey(key);
        if (theData && theData._hasData) {
            theData._hasData = false;
            if (this.restEndpoint && (!theData._hasData || !theData._requested)) {
                (0, remotehq_1.printMessage)("Calling getItem(): " + this.name + " " + key, types_1.messageLevels.debug);
                this.getItem(key);
            }
        }
    }
    itemByKey(key, createMissing, fromData) {
        let theItem = this.managedItemStorage[key];
        if (theItem && theItem !== undefined) {
            theItem.mergeData(fromData);
        }
        else if (!theItem && createMissing === true) {
            theItem = this.instanceItem(fromData);
        }
        return theItem;
    }
    insertItemByKey(key, data) {
        this.managedItemStoragebyUUID[data.getValue("uuid")] = data;
        return (this.managedItemStorage[key] = data);
    }
    getItem(key) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, remotehq_1.printMessage)("getItem " + this.name + " " + key, types_1.messageLevels.debug);
            if (this.userBased && !this.checkReadAuthority()) {
                (0, index_1.typeRetrieveFailed)(this, "No permission to read " + (this.displayName || this.name));
                (0, remotehq_1.printMessage)(this.displayName + " no authority", types_1.messageLevels.verbose);
                return null;
            }
            const localID = this.localStorageID(key);
            // let expires = null;
            const now = new Date();
            (0, remotehq_1.printMessage)("local ID for " + this.name + " : " + localID, types_1.messageLevels.debug);
            const theData = this.itemByKey(key);
            (0, remotehq_1.printData)(theData, types_1.messageLevels.debug, "Data holder for " + this.name);
            if (theData && theData._hasData) {
                // TODO strip private variables
                const returnData = theData;
                if (this.objectType && this.objectRegionProperty) {
                    const regionISO = returnData[this.objectRegionProperty];
                    (0, remotehq_1.printMessage)("Region ISO: " + regionISO, types_1.messageLevels.debug);
                    const allowed = yield (0, remotehq_1.checkAuthority)(types_1.actions.retrieve, this.objectType, regionISO);
                    (0, remotehq_1.printMessage)("Allowed: " + allowed, types_1.messageLevels.debug);
                    if (!allowed) {
                        return null;
                    }
                }
                if (!this.localMaxAge) {
                    return returnData;
                }
                if (!theData._modifiedDate ||
                    theData._modifiedDate.valueOf() + this.localMaxAge > now.valueOf()) {
                    return returnData;
                }
            }
            if (this.local) {
                const theLocalData = localStorage.getItem(localID);
                if (theLocalData) {
                    const thelocalExpiry = localStorage.getItem("expires:" + localID);
                    if (!thelocalExpiry || Number(thelocalExpiry) > now.valueOf()) {
                        const theModified = localStorage.getItem("modified:" + localID);
                        // need to check for nulls
                        const theModifiedDate = new Date(Number(theModified));
                        const theItem = this.instanceItem(theLocalData);
                        theItem._modifiedDate = new Date(theModifiedDate);
                        (0, remotehq_1.printMessage)("got local: " + this.name, types_1.messageLevels.debug);
                        (0, remotehq_1.printMessage)(key, types_1.messageLevels.debug);
                        (0, remotehq_1.printMessage)(theLocalData, types_1.messageLevels.debug);
                        // this.insertItemByKey(theData);
                        this.doChangeCallbacks(key, theLocalData);
                        return theLocalData;
                    }
                }
            }
            const theExisting = this.itemByKey(localID);
            const doesntExist = !theExisting;
            let requested = false;
            if (!doesntExist) {
                if ((theExisting === null || theExisting === void 0 ? void 0 : theExisting._requested) && (theExisting === null || theExisting === void 0 ? void 0 : theExisting._requested) === true) {
                    requested = true;
                }
            }
            if (this.restEndpoint && (doesntExist || !requested) && !this._sendRetrievesLock) {
                this._sendRetrievesLock = true;
                (0, remotehq_1.printMessage)("Fetching from remote", types_1.messageLevels.debug);
                const url = this.restEndpoint;
                let queryString = undefined;
                if (this.keyParameter && key) {
                    queryString = "?" + this.keyParameter + "=" + key;
                }
                (0, remotehq_1.printMessage)("About to fetch: ", types_1.messageLevels.debug);
                (0, remotehq_1.printData)(url, types_1.messageLevels.debug);
                (0, remotehq_1.printMessage)(key, types_1.messageLevels.debug);
                (0, remotehq_1.printMessage)(queryString, types_1.messageLevels.debug);
                let resultData = yield (0, index_1.fetchDataAuthorised)(url, key, queryString !== null && queryString !== void 0 ? queryString : null);
                if (resultData === null) {
                    this._sendRetrievesLock = false;
                    return null;
                }
                const theItem = this.itemByKey(localID);
                if (theItem) {
                    theItem._requested = false;
                }
                (0, remotehq_1.printData)(this, types_1.messageLevels.debug, "schemaItem in getItem");
                this.loaded = true;
                this.loadRequest = false;
                (0, remotehq_1.printMessage)("Unwrap: " + this.clientUnwrap, types_1.messageLevels.debug);
                if (this.clientUnwrap) {
                    (0, remotehq_1.printData)(resultData, types_1.messageLevels.debug, "Before unwrap");
                    const clientUnwrapString = this.clientUnwrap.toString();
                    (0, remotehq_1.printMessage)("unwrapping", types_1.messageLevels.debug);
                    const unwrapList = clientUnwrapString.split(".");
                    unwrapList.forEach((element) => {
                        (0, remotehq_1.printMessage)("Unwarapping by: " + element, types_1.messageLevels.debug);
                        if (element === "0") {
                            resultData = resultData[0];
                        }
                        else {
                            resultData = resultData[element];
                        }
                    });
                }
                (0, remotehq_1.printData)(resultData, types_1.messageLevels.debug, "After unwrap");
                // let jsonParsed = null;
                // try {
                //     jsonParsed = JSON.parse(resultData);
                (0, remotehq_1.printData)(this, types_1.messageLevels.debug, "DataType: ");
                (0, remotehq_1.printData)(this.singleEntry, types_1.messageLevels.debug, "singleEntry: ");
                if (this.singleEntry === true) {
                    (0, remotehq_1.printData)(this.singleEntry, types_1.messageLevels.debug, "singleEntry: ");
                    const theItem = this.instanceItem(resultData);
                    const theDate = theItem === null || theItem === void 0 ? void 0 : theItem.getValue("modified_timestamp");
                    this.updateLatestModified(theDate);
                    this.insertItemByKey(localID, theItem);
                    this.storeLocal(resultData, localID);
                    (0, remotehq_1.printData)(resultData, types_1.messageLevels.debug, "Got Single Item: " + this.name + " " + key);
                }
                else {
                    let keyColumn = this.primaryKeyProperty;
                    (0, remotehq_1.printMessage)("Item Type: " + this.name, types_1.messageLevels.debug);
                    (0, remotehq_1.printMessage)("Key Column: " + keyColumn, types_1.messageLevels.debug);
                    // this.dumpData(messageLevels.debug)
                    if (!keyColumn) {
                        if (isDict(resultData)) {
                            keyColumn = "_dict";
                        }
                        else if (Array.isArray(resultData)) {
                            const item = resultData[0];
                            if (item["iso"]) {
                                keyColumn = "iso";
                            }
                            else if (item["region"]) {
                                keyColumn = "region";
                            }
                        }
                    }
                    if (keyColumn === "_dict") {
                        (0, remotehq_1.printMessage)("Dict: " + this.name, types_1.messageLevels.debug);
                        (0, remotehq_1.printData)(resultData, types_1.messageLevels.debug, "Got Dictionary: " + this.name);
                        // printData(Object.entries(resultData), messageLevels.debug  ,"Entries in read dict: " + this.name) ;
                        Object.entries(resultData).forEach(([key, value]) => {
                            (0, remotehq_1.printMessage)("got: " + this.name, types_1.messageLevels.debug);
                            (0, remotehq_1.printMessage)(key, types_1.messageLevels.debug);
                            // printMessage( value, messageLevels.debug);
                            const theData = this.itemByKey(key, true, value);
                            const theDate = theData === null || theData === void 0 ? void 0 : theData.getValue("modified_timestamp");
                            this.updateLatestModified(theDate);
                            if (theData) {
                                theData.store(key);
                            }
                            this.storeLocal(value, key);
                        });
                    }
                    else {
                        (0, remotehq_1.printData)(resultData, types_1.messageLevels.debug, "Got Array: " + this.name + " with key: " + keyColumn);
                        this.primaryKeyProperty = keyColumn;
                        resultData.forEach((value) => {
                            const key = value[keyColumn || 0];
                            const theData = this.itemByKey(key, true, value);
                            const theDate = theData === null || theData === void 0 ? void 0 : theData.getValue("modified_timestamp");
                            this.updateLatestModified(theDate);
                            this.storeLocal(value, key);
                            (0, remotehq_1.printMessage)("got: " + this.name, types_1.messageLevels.debug);
                            (0, remotehq_1.printMessage)(key, types_1.messageLevels.debug);
                            (0, remotehq_1.printMessage)(value, types_1.messageLevels.debug);
                        });
                    }
                }
                // this.dumpData(messageLevels.none);
                this._sendRetrievesLock = false;
                if (this.name) {
                    (0, index_1.typeIsRetrieved)(this, "Fetched " + this.displayName || this.name);
                }
                this.onRetrieveCallHandler.doEventCallbacks("", null);
                this.doChangeCallbacks(key, resultData);
            }
            else {
                return null;
            }
        });
    }
    dumpData(level) {
        (0, remotehq_1.printData)(this, level, "Storage dump for: " + this.name);
    }
    saveToContext(parentContext) {
        this.doForgets();
        if (parentContext) {
            // this.sendDeletes();
            // this.sendUpdates();
            // this.sendCreates();
        }
    }
    getPropertyArray(keys, column, unique) {
        const theArray = [];
        let theItem = null;
        if (typeof keys === "string") {
            (0, remotehq_1.printData)(keys, types_1.messageLevels.debug, "getPropertyArray keys");
            (0, remotehq_1.printData)(column, types_1.messageLevels.debug, "getPropertyArray column");
            theItem = this.itemByKey(keys);
            (0, remotehq_1.printData)(theItem, types_1.messageLevels.debug, "getPropertyArray item");
            (0, remotehq_1.printData)(theItem.getValue(column), types_1.messageLevels.debug, "getPropertyArray value");
            theArray.push(theItem.getValue(column));
            (0, remotehq_1.printData)(theArray, types_1.messageLevels.debug, "getPropertyArray theArray");
        }
        else {
            if (unique) {
                keys.forEach((element) => {
                    theItem = this.itemByKey(element);
                    if ((0, index_1.isStoredItem)(theItem)) {
                        const theValue = theItem.getValue(column);
                        if (theArray.indexOf(theValue) < 0) {
                            theArray.push(theValue);
                        }
                    }
                });
            }
            else {
                keys.forEach((element) => {
                    theItem = this.itemByKey(element);
                    if ((0, index_1.isStoredItem)(theItem)) {
                        theArray.push(theItem.getValue(column));
                    }
                });
            }
        }
        return theArray;
    }
    /**
     * Return an array of [{parameter: value, parameter: value…}, …] for every item matching the queryParams including ones not in the current level
     * @param queryParams
     * @param parameters - paramter names to extract from the storedItems (uses getValue() so all parameter types work)
     * @param uniqueBy - column to unique by (not yet implemented)
     * @returns [{}]
     */
    getPropertyDictArrayAll(queryParams, parameters, uniqueBy) {
        const theArray = [];
        const theItems = this.allMatchingItems(queryParams);
        Object.keys(theItems).forEach((key) => {
            const theItem = theItems[key];
            const theRow = {};
            parameters.forEach((value) => {
                theRow[value] = theItem.getValue(value);
            });
            theArray.push(theRow);
        });
        return theArray;
    }
    /**
     * Return an array of [{parameter: value, parameter: value…}, …] for every item matching the queryParams in current level
     * @param queryParams
     * @param parameters - paramter names to extract from the storedItems (uses getValue() so all parameter types work)
     * @param uniqueBy - column to unique by (not yet implemented)
     * @returns [{}]
     */
    getPropertyDictArray(queryParams, parameters, uniqueBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const theArray = [];
            const theItems = this.matchingItems(queryParams);
            Object.keys(theItems).forEach((key) => {
                const theItem = theItems[key];
                const theRow = {};
                parameters.forEach((value) => {
                    theRow[value] = theItem.getValue(value);
                });
                theArray.push(theRow);
            });
            return theArray;
        });
    }
    init() {
        const theItem = (0, classes_1.classInit)(this, null);
        theItem._created = true;
        theItem.mounted();
        return theItem;
    }
    isSingleEntry() {
        if (this.singleEntry === null || typeof this.singleEntry === "undefined") {
            this.singleEntry = false;
        }
        return this.singleEntry;
    }
    instanceNewItem(data) {
        const theItem = this.instanceItem(data, true);
        theItem._created = true;
        const defaultValues = theItem.defaultValues();
        theItem.mergeData(defaultValues).mergeData(data);
        if (!this.isSingleEntry() && theItem.storeUUID === "") {
            theItem.assignUUID();
        }
        theItem.mounted();
        // }
        return theItem;
    }
    instanceItem(data, doNotStore) {
        const theItem = (0, classes_1.classInit)(this, data, doNotStore);
        theItem.mounted();
        // const theItem = new storedItem(this, data);
        return theItem;
    }
    /**
     * make a copy of a storedItem to use whilst editing and replace the original if change saved
     * @param theOriginal
     * @returns storedItem - the copy
     */
    editCopy(theOriginal) {
        const theItem = this.instanceItem(theOriginal, true);
        // theItem._wasDirty = theItem._dirty;
        theItem._dirty = false;
        theItem._sourceItem = theOriginal;
        theItem._isEditCopy = true;
        return theItem;
    }
    /**
     * make a copy of a storedItem as a new item
     * @param theOriginal
     * @returns storedItem - the copy
     */
    itemCopy(theOriginal) {
        const theItem = this.instanceItem(theOriginal, true);
        theItem._primaryKey = CreateUUID();
        if (this.primaryKeyProperty) {
            // theItem.setValue(null, this.primaryKeyProperty);
            theItem[this.primaryKeyProperty] = null;
        }
        theItem._dirty = false;
        theItem._created = true;
        theItem._hasData = false;
        theItem._deleted = false;
        theItem._isEditCopy = false;
        (0, remotehq_1.printData)(theOriginal, types_1.messageLevels.debug, "Original");
        (0, remotehq_1.printData)(theItem, types_1.messageLevels.debug, "Copy");
        return theItem;
    }
    /**
     * write the item back to the original stored item
     *
     * @param theItem
     * returns the original item in the store that's now updated or null if not put back
     */
    keepChanges(theItem, callback) {
        if (theItem._isEditCopy) {
            const theOriginal = theItem._sourceItem;
            if (theOriginal && theOriginal !== undefined) {
                const isDirty = theItem._dirty;
                const wasEditCopy = theOriginal === null || theOriginal === void 0 ? void 0 : theOriginal._isEditCopy;
                if (isDirty) {
                    theItem._sourceItem = null;
                    Object.assign(theOriginal, JSON.parse(JSON.stringify(theItem)));
                    if (theItem._multiFileUploader) {
                        theOriginal._multiFileUploader = theItem._multiFileUploader;
                    }
                    theOriginal._isEditCopy = wasEditCopy;
                    theOriginal.storeChanges(callback);
                    this.doChangeCallbacks(theOriginal.primaryKey(), theOriginal);
                }
                return theOriginal;
            }
            return null;
        }
        else {
            theItem.storeChanges(callback);
            return theItem;
        }
    }
    requestLoad(changeCallbackFn, retrieveCallbackFn) {
        (0, remotehq_1.printMessage)("requestLoad " + this.name, types_1.messageLevels.debug);
        if (changeCallbackFn) {
            this.registerOnChange(changeCallbackFn);
        }
        if (retrieveCallbackFn) {
            this.registerOnRetrieve(retrieveCallbackFn);
        }
        if (this.loaded && this.loaded === true) {
            if (changeCallbackFn) {
                changeCallbackFn(this.name);
            }
            if (retrieveCallbackFn) {
                retrieveCallbackFn(this.name);
            }
            return;
        }
        this.loadRequest = true;
        // TODO: if description known and not requested preiously then call a load function.
        (0, index_1.typeWillRetrieve)(this, "Fetching " + (this.displayName || this.name));
        if (this.restEndpoint) {
            this.getItem("");
        }
        this.dumpData(types_1.messageLevels.debug);
    }
}
exports.storeType = storeType;
function isDict(o) {
    const string = JSON.stringify(o);
    return string.startsWith("{") && string.endsWith("}");
}
class CallbackHandler {
    constructor(name) {
        this.name = "";
        this.callList = [];
        this.doEventCallbacks = (key, data) => {
            // printMessage("doChangeCallbacks: " + this.name + " - " + key, messageLevels.debug);
            // printData(this.callList, messageLevels.debug, "in doChangeCallbacks " + this.name);
            if (this.callList && this.callList.length > 0) {
                // if(this.name === "user-profile" ) {
                //     callFunction(this.callList[0], this.name,key,data);
                // } else {
                this.callList.map((element, i) => {
                    const t1 = performance.now();
                    const result = callFunction(element, this.name, key, data);
                    const t2 = performance.now();
                    if (t2 - t1 > 100) {
                        console.log({ element, i, func: this.callList[i], ms: t2 - t1 }, 9999);
                        return result;
                    }
                });
                // }
            }
        };
        this.name = name;
    }
    registerOnEvent(call) {
        // printData(call,messageLevels.debug, "Call register in " +this.name)
        const index = this.callList.indexOf(call);
        if (index < 0) {
            this.callList.push(call);
        }
        // printData(this.callList, messageLevels.debug, "in registerOnChange " + this.name);
    }
    removeOnEvent(call) {
        const index = this.callList.indexOf(call);
        if (index > -1) {
            // printMessage("Removing onChange from: "+ this.name ,messageLevels.debug);
            this.callList.splice(index, 1);
        }
        else {
            (0, remotehq_1.printMessage)("Failed to remove onChange from: " + this.name, types_1.messageLevels.debug);
        }
    }
}
exports.CallbackHandler = CallbackHandler;
function callFunction(theFunction, name, key, data) {
    if (!theFunction) {
        return null;
    }
    // if(name !== "user-profile" && name !== "state"  && name !== "data-types") {
    if (theFunction.constructor.name === "AsyncFunction") {
        theFunction(name, key, data);
    }
    else {
        window.setTimeout(theFunction(name, key, data), 50);
    }
    return null;
}
function CreateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
exports.CreateUUID = CreateUUID;
