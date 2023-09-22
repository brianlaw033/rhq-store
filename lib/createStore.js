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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalState = exports.removeCalls = exports.removeCall = exports.registerCalls = exports.registerCall = exports.callAsync = exports.call = exports.putTablesIntoSchemaItems = exports.loadTables = exports.sendDataAuthorised = exports.fetchDataAuthorised = exports.accessTokenSync = exports.getAccessToken = exports.updateItemNewUser = exports.getPropertyArray = exports.itemByKey = exports.getItem = exports.requestLoad = exports.getAll = exports.storeData = exports.setItem = exports.getAllStoreTypes = exports.removeOnDelete = exports.removeOnSave = exports.removeOnRetrieve = exports.removeOnChange = exports.clearStoreCache = exports.clearAllStoreCache = exports.getStoreTypeByName = exports.registerOnDelete = exports.registerOnSave = exports.registerOnChange = exports.save = exports.init = exports.instanceNewItem = exports.instanceItem = exports.registerSingleUserItem = exports.registerSingleItem = exports.registerDataType = exports.userChanged = exports.getContext = exports.removeEditContext = exports.createEditContext = exports.getSchemaArrayAlpha = exports.getSchemaArray = exports.getSchema = exports.dumpSchema = exports.addStore = exports.getStore = exports.createStore = void 0;
exports.initializeProcessStatusManager = exports.selectedConsentNumber = exports.dateAddTimezone = exports.dateStripTimezone = exports.isUUID = exports.dumpToDo = exports.dumpCompletedActions = exports.removeOnProcessChange = exports.registerOnProcessChange = exports.failedMessages = exports.completedMessages = exports.toSendMessages = exports.flushStatusMessages = exports.processPercentComplete = exports.lastProcessMessage = exports.itemsToSendMessageList = exports.lastSentMessage = exports.sendsToGo = exports.sendsInProgress = exports.itemSendFailed = exports.itemSendSucceeed = exports.typeRetrieveFailed = exports.typeIsRetrieved = exports.itemIsSent = exports.typeWillRetrieve = exports.itemWillSend = exports.isItemType = exports.getPropertyArrayFromItemArrayUnique = exports.getPropertiesArrayFromItemArray = exports.getPropertyArrayFromItemArray = exports.isStoredItem = exports.dumpDataType = exports.removeStateChanges = exports.registerforStateChanges = exports.getStateFirstValue = exports.getStateArrayValue = exports.getStateValue = exports.setGlobalState = void 0;
const aws_amplify_1 = require("aws-amplify");
const remotehq_1 = require("./remotehq");
const ListOperations_1 = require("./helpers/ListOperations");
const storeType_1 = require("./storeType");
const storedItem_1 = require("./storedItem");
const types_1 = require("./types");
const ProcessStatusManager_1 = require("./ProcessStatusManager");
const stores = {};
const createStore = (name) => {
    let dataSchema = {};
    const blankStoreType = new storeType_1.storeType("ignore");
    const localStorage = window.localStorage;
    let userID = "";
    let processStatusManager = new ProcessStatusManager_1.ProcessStatusManager();
    function dumpSchema() {
        // printData(dataSchema, messageLevels.verbose);
    }
    function getSchema() {
        return dataSchema;
    }
    function getSchemaArray() {
        return Object.values(dataSchema);
    }
    function getSchemaArrayAlpha() {
        const sortParams = { sortField: "name", sortDirection: types_1.sortDirection.ascending };
        return (0, ListOperations_1.sortArray)(Object.values(dataSchema), sortParams);
    }
    function createEditContext(name) {
        storeData("edit-context", name);
        const theContext = itemByKey("edit-context", name);
        return theContext;
    }
    function removeEditContext(context) {
        context.willDispose();
    }
    function getContext(key) {
        const contextType = getStoreTypeByName("edit-context");
        const theContext = (contextType === null || contextType === void 0 ? void 0 : contextType.itemByKey(key)) || null;
        return theContext;
    }
    /**
     * Called when user changes to update store
     * @param newUserID ID of the new user
     */
    function userChanged(newUserID) {
        (0, remotehq_1.printMessage)("Previous user: " + userID + " new user: " + newUserID, types_1.messageLevels.debug);
        if (newUserID !== userID) {
            userID = newUserID;
            (0, remotehq_1.printMessage)("User changed - store updating", types_1.messageLevels.debug);
            Object.values(dataSchema).forEach((value) => value.userChanged(newUserID));
        }
    }
    // let contexts: IContextStorageArray = {};
    registerDataType("callback");
    // const stateStoreType = registerDataType("state").local = true;
    const stateStoreType = registerDataType("state");
    registerDataType("edit-context");
    const mainContext = instanceNewItem("edit-context");
    mainContext === null || mainContext === void 0 ? void 0 : mainContext.store();
    // // contexts["main", ]
    /**
     * Register a data type for the store to manage
     * @param type Data Type of item to manage
     * @param remoteURL URL of REST API for the item
     * @param createRemote Flag to enable REST Create calls
     * @param retrieveRemote Flag to enable REST retrieve calls
     * @param updateRemote Flag to enable REST update calls
     * @param deleteRemote Flag to enable REST delete calls
     * @returns
     */
    function registerDataType(type, remoteURL, createRemote, retrieveRemote, updateRemote, deleteRemote) {
        let theItem = getStoreTypeByName(type, true);
        theItem === null || theItem === void 0 ? void 0 : theItem.setupRemoteStorage(remoteURL, createRemote, retrieveRemote, updateRemote, deleteRemote);
        return theItem !== null && theItem !== void 0 ? theItem : blankStoreType;
    }
    function registerSingleItem(type, storeSesstion, storeLocal, maxAgeLocal, remoteURL, createRemote, retrieveRemote, updateRemote, deleteRemote) {
        let theItem = getStoreTypeByName(type, true);
        if (theItem) {
            theItem === null || theItem === void 0 ? void 0 : theItem.setupRemoteStorage(remoteURL, createRemote, retrieveRemote, updateRemote, deleteRemote);
            theItem.singleEntry = true;
            if (storeLocal) {
                theItem === null || theItem === void 0 ? void 0 : theItem.setupLocalStorage(maxAgeLocal || undefined);
            }
            dataSchema[type] = theItem;
            return theItem;
        }
        return blankStoreType;
    }
    function registerSingleUserItem(type, storeSesstion, storeLocal, maxAgeLocal, remoteURL, createRemote, retrieveRemote, updateRemote, deleteRemote) {
        let theItem = getStoreTypeByName(type, true);
        if (theItem) {
            theItem.setupRemoteStorage(remoteURL, createRemote, retrieveRemote, updateRemote, deleteRemote);
            theItem.singleEntry = true;
            theItem.userBased = true;
            if (storeLocal) {
                theItem.setupLocalStorage(maxAgeLocal || undefined);
            }
            dataSchema[type] = theItem;
        }
        return theItem !== null && theItem !== void 0 ? theItem : blankStoreType;
    }
    /**
     * Instance an item and optionally move the data into it. For creation of instances coming from remote sources.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    function instanceItem(type, data) {
        const itemType = getStoreTypeByName(type);
        if (itemType) {
            return itemType.instanceItem(data);
        }
        (0, remotehq_1.printMessage)("Type: '" + type + "' does not exist", types_1.messageLevels.error);
        return null;
    }
    /**
     * Instance an item and optionally move the data into it. This is for creation of instances that do not already exist remotely.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    function instanceNewItem(type, data) {
        var _a;
        const itemType = getStoreTypeByName(type);
        if (itemType) {
            const theItem = itemType.instanceNewItem(data);
            if (theItem) {
                const theUser = remotehq_1.getUserDataSync === null || remotehq_1.getUserDataSync === void 0 ? void 0 : (0, remotehq_1.getUserDataSync)();
                const regionProperty = itemType.objectRegionProperty;
                const theSelected = ((_a = getGlobalState("selected")) === null || _a === void 0 ? void 0 : _a.getValue()) || [];
                const theData = {
                    uuid: theItem._primaryKey,
                    created_date: new Date(),
                };
                if (theUser) {
                    theData["created_by"] = theUser.getValue("user_id") || theUser.getValue("email");
                }
                if (theSelected.length > 0) {
                    const consentNumber = selectedConsentNumber();
                    theData["consent_number"] = consentNumber;
                    if (regionProperty) {
                        theData[regionProperty] = theSelected[0].getRegionISO();
                    }
                }
                theItem.mergeData(theData);
                return theItem;
            }
        }
        (0, remotehq_1.printMessage)("Type: '" + type + "' does not exist", types_1.messageLevels.error);
        return null;
    }
    /**
     * Create an instance of an item locally rather than from an existing persisant store.
     * @param type - Type of item to instance
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    function init(type) {
        const itemType = getStoreTypeByName(type);
        if (itemType) {
            return itemType.init();
        }
        return null;
    }
    function save() {
        Object.values(dataSchema).forEach((value) => {
            // console.log({ value });
            value.save();
        });
    }
    /**
     * Register a callback to be called if items of type are changed or loaded from API.
     *
     * @param name Data type to watch
     * @param call callback function - called with (type, key, data) parameters
     */
    function registerOnChange(name, call) {
        const schemaItem = getStoreTypeByName(name, true);
        schemaItem === null || schemaItem === void 0 ? void 0 : schemaItem.registerOnChange(call);
        return schemaItem;
    }
    function registerOnSave(name, call) {
        const schemaItem = getStoreTypeByName(name, true);
        schemaItem === null || schemaItem === void 0 ? void 0 : schemaItem.registerOnSave(call);
        return schemaItem;
    }
    function registerOnDelete(name, call) {
        const schemaItem = getStoreTypeByName(name, true);
        schemaItem === null || schemaItem === void 0 ? void 0 : schemaItem.registerOnDelete(call);
        return schemaItem;
    }
    function getStoreTypeByName(name, createMissing) {
        let schemaItem = dataSchema[name] || null;
        if (createMissing && createMissing === true && !schemaItem) {
            schemaItem = new storeType_1.storeType(name);
            dataSchema[name] = schemaItem;
        }
        return schemaItem;
    }
    function clearAllStoreCache() {
        Object.values(dataSchema).forEach((schemaItem) => schemaItem.clearCache());
    }
    function clearStoreCache(name) {
        const schemaItem = getStoreTypeByName(name, true);
        schemaItem === null || schemaItem === void 0 ? void 0 : schemaItem.clearCache();
    }
    function removeOnChange(name, call) {
        let schemaItem = getStoreTypeByName(name);
        if (schemaItem) {
            schemaItem.removeOnChange(call);
        }
        return schemaItem;
    }
    function removeOnRetrieve(name, call) {
        let schemaItem = getStoreTypeByName(name);
        if (schemaItem) {
            schemaItem.removeOnRetrieve(call);
        }
        return schemaItem;
    }
    function removeOnSave(name, call) {
        let schemaItem = getStoreTypeByName(name);
        if (schemaItem) {
            schemaItem.removeOnSave(call);
        }
        return schemaItem;
    }
    function removeOnDelete(name, call) {
        let schemaItem = getStoreTypeByName(name);
        if (schemaItem) {
            schemaItem.removeOnDelete(call);
        }
        return schemaItem;
    }
    function getAllStoreTypes() {
        return dataSchema;
    }
    function setItem(type, items, data) {
        return storeData(type, items, data);
    }
    /**
     * Put item in the store or update existing
     * @param type Data type of item
     * @param key Primary Key value
     * @param data Data to store
     */
    function storeData(type, items, data) {
        const schemaItem = getStoreTypeByName(type);
        return schemaItem === null || schemaItem === void 0 ? void 0 : schemaItem.storeData(items, data);
    }
    /**
     * Get all items in the colection as an array
     * note that this does not return metadata about item state.
     * and currently does not fetch if not loaded
     * @param type The data type of items to return
     * @returns array
     */
    function getAll(type) {
        let theItems = [];
        Object.values(dataSchema[type].managedItemStorage).forEach((value) => {
            theItems.push(value);
        });
        return theItems;
    }
    /**
     * Request the loading of a data type. If already loaded then do not request but call the callback )if supplied)
     * otherwise set the request flag and add the callback to the onChange list.
     * @param type - the Data type to request
     * @param changeCallbackFn - the function to call when is loaded
     * @param retrieveCallbackFn - the function to call when all data is loaded
     */
    function requestLoad(type, changeCallbackFn, retrieveCallbackFn) {
        const schemaItem = getStoreTypeByName(type, true);
        if (schemaItem) {
            schemaItem.requestLoad(changeCallbackFn, retrieveCallbackFn);
        }
        return schemaItem;
    }
    /**
     * Get an item from the store by primary key - or a single item if type is a single item
     * @param type The data type of the item required
     * @param key The primary key of he individual item
     * @returns
     */
    function getItem(type, key) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, remotehq_1.printMessage)("getItem " + type + " " + key, types_1.messageLevels.debug);
            const schemaItem = getStoreTypeByName(type);
            if (schemaItem) {
                return schemaItem === null || schemaItem === void 0 ? void 0 : schemaItem.getItem(key);
            }
            return null;
        });
    }
    function itemByKey(type, key) {
        (0, remotehq_1.printMessage)("itemByKey " + type + " " + key, types_1.messageLevels.debug);
        const schemaItem = getStoreTypeByName(type);
        return schemaItem === null || schemaItem === void 0 ? void 0 : schemaItem.itemByKey(key);
    }
    function getPropertyArray(type, keys, column) {
        var _a;
        return (_a = getStoreTypeByName(type)) === null || _a === void 0 ? void 0 : _a.getPropertyArray(keys, column);
    }
    function updateItemNewUser(type, key) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, remotehq_1.printMessage)("updateing for user change: " + type + " " + key, types_1.messageLevels.debug);
            const schemaItem = getStoreTypeByName(type);
            return schemaItem === null || schemaItem === void 0 ? void 0 : schemaItem.updateItemNewUser(key);
        });
    }
    // function storeLocal(schemaItem: storeType, data: any, localID: string) {
    //     schemaItem.storeLocal(data,localID);
    // }
    // function doChangeCallbacks (schemaItem: storeType, key: string, data: any)  {
    //     schemaItem.doChangeCallbacks(key,data);
    // }
    function getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield aws_amplify_1.Auth.currentSession();
            if (session.isValid()) {
                const jwtToken = yield session.getAccessToken().getJwtToken();
                (0, remotehq_1.printData)(jwtToken, types_1.messageLevels.debug);
                return jwtToken;
            }
            return "";
        });
    }
    function accessTokenSync() {
        for (var key in localStorage) {
            if (key.endsWith(".accessToken")) {
                (0, remotehq_1.printMessage)("returning", types_1.messageLevels.debug);
                return localStorage.getItem(key);
            }
        }
        return null;
    }
    function fetchDataAuthorised(url, key, queryString) {
        return __awaiter(this, void 0, void 0, function* () {
            if (queryString) {
                url.search = queryString;
                (0, remotehq_1.printMessage)("URL+: " + url, types_1.messageLevels.debug);
            }
            if (userID && userID.length > 0) {
                const accessToken = yield getAccessToken();
                (0, remotehq_1.printMessage)("Fetching Auth: " + url, types_1.messageLevels.debug);
                (0, remotehq_1.printData)(accessToken, types_1.messageLevels.debug);
                return fetch(url.toString(), {
                    headers: new Headers({
                        Authorization: accessToken,
                    }),
                }).then((response) => {
                    if (response.ok) {
                        (0, remotehq_1.printData)(response, types_1.messageLevels.debug, "response");
                        return response.json();
                    }
                    else {
                        (0, remotehq_1.printMessage)("Failed to load Auth: " + url, types_1.messageLevels.error);
                        (0, remotehq_1.printData)(response, types_1.messageLevels.error, "response");
                        return null;
                    }
                });
            }
            else {
                (0, remotehq_1.printMessage)("Fetching no Auth: " + url, types_1.messageLevels.debug);
                return fetch(url.toString()).then((response) => {
                    if (response.ok) {
                        (0, remotehq_1.printData)(response, types_1.messageLevels.debug);
                        return response.json();
                    }
                    else {
                        (0, remotehq_1.printMessage)("Failed to load no Auth: " + url, types_1.messageLevels.error);
                        (0, remotehq_1.printData)(response, types_1.messageLevels.error);
                        return null;
                    }
                });
            }
        });
    }
    function sendDataAuthorised(url, method, data, callback, key, queryString) {
        return __awaiter(this, void 0, void 0, function* () {
            if (queryString) {
                url.search = queryString;
                (0, remotehq_1.printMessage)("URL+: " + url, types_1.messageLevels.debug);
            }
            if (userID && userID.length > 0) {
                const accessToken = yield getAccessToken();
                (0, remotehq_1.printMessage)("Sending Auth: " + method + " " + url, types_1.messageLevels.debug);
                // printData(data , messageLevels.verbose, data);
                (0, remotehq_1.printData)(accessToken, types_1.messageLevels.debug);
                return fetch(url.toString(), {
                    method: method,
                    headers: new Headers({
                        Authorization: accessToken,
                    }),
                    body: data,
                }).then((response) => {
                    if (response.ok) {
                        (0, remotehq_1.printData)(response, types_1.messageLevels.debug, "response");
                        const theCall = function (theResponse) {
                            callback(response.json());
                        };
                        theCall(response);
                        //   return response.json();
                    }
                    else {
                        (0, remotehq_1.printMessage)("Failed to load Auth: " + url, types_1.messageLevels.error);
                        (0, remotehq_1.printData)(response, types_1.messageLevels.error, "response");
                    }
                });
            }
            else {
                (0, remotehq_1.printMessage)("Sending no Auth: " + url, types_1.messageLevels.debug);
                return fetch(url.toString(), {
                    method: method,
                    body: data,
                }).then((response) => {
                    if (response.ok) {
                        (0, remotehq_1.printData)(response, types_1.messageLevels.debug);
                        return response.json();
                    }
                    else {
                        (0, remotehq_1.printMessage)("Failed to Send no Auth: " + url, types_1.messageLevels.error);
                        (0, remotehq_1.printData)(response, types_1.messageLevels.error);
                    }
                });
            }
        });
    }
    function loadTables(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, remotehq_1.printMessage)("load tables", types_1.messageLevels.debug);
            registerSingleItem("data-types", false, false, null, new URL(endpoint))
                .registerOnChange(putTablesIntoSchemaItems)
                .requestLoad();
        });
    }
    function putTablesIntoSchemaItems(type, key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, remotehq_1.printMessage)("putTablesIntoSchema", types_1.messageLevels.debug);
            (0, remotehq_1.printData)(data, types_1.messageLevels.debug, "data retrieved");
            data.map((element) => {
                return registerDataTypeFromFile(element);
            });
            (0, remotehq_1.printData)(dataSchema, types_1.messageLevels.debug);
        });
    }
    function registerDataTypeFromFile(element) {
        const available_capabilities = (element.available_capabilities || "").toLowerCase();
        let willLoad = dataSchema[element.type] && dataSchema[element.type].loadRequest;
        (0, remotehq_1.printData)(element, types_1.messageLevels.debug, "element in registerDataTypeFromFile");
        let theItem = getStoreTypeByName(element.type, true);
        if (theItem) {
            theItem.singleEntry = element.single_entry;
            theItem.userBased = element.user_based;
            theItem.objectRegionProperty = element.object_region_property;
            theItem.primaryKeyProperty = element.primary_key_property;
            theItem.displayName = element.display_name;
            if (element.object_type && element.object_type !== undefined) {
                const theNum = (0, types_1.objectNameToNumber)(element.object_type);
                if (theNum && theNum !== undefined && theNum !== -1) {
                    theItem.objectType = theNum;
                }
                else {
                    (0, remotehq_1.printMessage)(theNum + " for " + theItem.name, types_1.messageLevels.verbose);
                }
            }
            if (element.rest_endpoint) {
                theItem.setupRemoteStorage(element.rest_endpoint, available_capabilities.includes("c"), available_capabilities.includes("r"), available_capabilities.includes("u"), available_capabilities.includes("d"));
                theItem.clientUnwrap = element.client_unwrap;
            }
            if (element.browser_local_storage) {
                theItem.setupLocalStorage(element.maximum_age);
            }
            theItem.session = element.browser_session_storage;
            if (willLoad) {
                (0, remotehq_1.printMessage)("Will load: " + element.type, types_1.messageLevels.debug);
                getItem(element.type, "");
            }
            return theItem;
        }
        return blankStoreType;
    }
    /**
     * call a function from the global call table
     * @param name - the name of the function
     * @param args - the arguments to the function
     * @returns
     */
    function call(name, ...args) {
        const { managedItemStorage } = dataSchema["callback"];
        if (managedItemStorage) {
            const theFunctionStore = managedItemStorage[name];
            if (theFunctionStore) {
                const theFunction = theFunctionStore.getValue();
                if (theFunction) {
                    return theFunction(...args);
                }
            }
        }
        return null;
    }
    /**
     * call a function from the global call table
     * @param name - the name of the function
     * @param args - the arguments to the function
     * @returns
     */
    function callAsync(name, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { managedItemStorage } = dataSchema["callback"];
            if (managedItemStorage) {
                const theFunctionStore = managedItemStorage[name];
                if (theFunctionStore) {
                    const theFunction = theFunctionStore.getValue();
                    if (theFunction) {
                        return yield theFunction(...args);
                    }
                }
            }
            return null;
        });
    }
    /**
     * Register a function with the global call table
     * @param name - name of the function
     * @param fn - the function
     */
    function registerCall(name, fn, awaitMapAvailable) {
        // const functionProps = {function: fn, awaitMapAvailable: awaitMapAvailable};
        // setItem("callback", name, functionProps);
        setItem("callback", name, fn);
        (0, remotehq_1.printMessage)("registerCall: " + name, types_1.messageLevels.debug);
        // dumpDataType("callback", messageLevels.debug);
    }
    function registerCalls(calls) {
        Object.entries(calls).forEach(([key, value]) => {
            registerCall(key, value);
        });
    }
    /**
     * Remove a function from the global call table
     * @param name - name of the function
     */
    function removeCall(name) {
        // const functionProps = {function: fn, awaitMapAvailable: awaitMapAvailable};
        // setItem("callback", name, functionProps);
        setItem("callback", name, null);
        (0, remotehq_1.printMessage)("removeCall: " + name, types_1.messageLevels.debug);
        // dumpDataType("callback", messageLevels.debug);
    }
    function removeCalls(calls) {
        Object.keys(calls).forEach((key) => {
            removeCall(key);
        });
    }
    /**
     * Get a state variable from the global state store
     * @param name - name of the state variable
     * @returns the variable item
     */
    function getGlobalState(name) {
        return itemByKey("state", name);
    }
    /**
     * set a global state variable
     * @param name - name of the state variable
     * @param value the value to store
     */
    function setGlobalState(name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof name === "string" && value === undefined) {
                (0, remotehq_1.printMessage)("Set " + name + " to undefined", types_1.messageLevels.error);
            }
            else {
                setItem("state", name, value);
            }
        });
    }
    /**
     * Get a state variable's value from the global state store
     * @param name - name of the state variable
     * @returns the variable value
     */
    function getStateValue(name) {
        const theItem = getGlobalState(name);
        if (!theItem) {
            return null;
        }
        return theItem.getValue();
    }
    /**
     * Get a state variable's value array from store
     * @param name - name of the state variable
     * @param defaultValue - default to return if variable doesnt exist
     * @returns the variable value
     */
    function getStateArrayValue(name, defaultValue) {
        const theItem = getGlobalState(name);
        if (!theItem) {
            return defaultValue || [];
        }
        const theValue = theItem.getValue();
        if (!theValue) {
            return defaultValue || [];
        }
        if (!Array.isArray(theValue)) {
            return [theValue];
        }
        return theValue;
    }
    /**
     * Get a state variable's value from store, taking the first element if there is an array
     * @param name - name of the state variable
     * @param defaultValue - default to return if variable doesnt exist
     * @returns the variable value
     */
    function getStateFirstValue(name, defaultValue) {
        const theItem = getGlobalState(name);
        if (!theItem) {
            return defaultValue || null;
        }
        const theValue = theItem.getValue();
        if (!theValue) {
            return defaultValue || null;
        }
        if (!Array.isArray(theValue) && theValue.length > 0) {
            return theValue[0];
        }
        return theValue || null;
    }
    /**
     * register a callback function for state change events.
     * @param fn
     */
    function registerforStateChanges(fn) {
        registerOnChange("state", fn);
    }
    function removeStateChanges(fn) {
        removeOnChange("state", fn);
    }
    function dumpDataType(type, level) {
        var _a;
        (_a = getStoreTypeByName(type)) === null || _a === void 0 ? void 0 : _a.dumpData(level);
    }
    function isStoredItem(item) {
        if (item) {
            return item instanceof storedItem_1.storedItem;
        }
        return false;
    }
    function getPropertyArrayFromItemArray(items, column) {
        let theArray = [];
        items.forEach((element) => {
            theArray.push(element.getValue(column));
        });
        return theArray;
    }
    function getPropertiesArrayFromItemArray(items, columns) {
        let theArray = [];
        items.forEach((element) => {
            theArray.push(element.getValues(columns));
        });
        return theArray;
    }
    function getPropertyArrayFromItemArrayUnique(items, column) {
        let theArray = [];
        items.forEach((element) => {
            const theValue = element.getValue(column);
            if (!theArray.includes(theValue)) {
                theArray.push(theValue);
            }
        });
        return theArray;
    }
    function isItemType(item, type, isLike) {
        if (isStoredItem(item)) {
            if (isLike) {
                return item.getTypeName().includes(type);
            }
            else {
                return item.getTypeName() === type;
            }
        }
        return false;
    }
    // Process status Manager functions
    function itemWillSend(item, message) {
        processStatusManager.itemWillSend(item, message);
    }
    function typeWillRetrieve(item, message) {
        processStatusManager.itemWillSend(item, message);
    }
    function itemIsSent(item, message) {
        processStatusManager.itemIsSent(item, message);
    }
    function typeIsRetrieved(item, message) {
        processStatusManager.itemSucceed(item, message);
    }
    function typeRetrieveFailed(item, message) {
        processStatusManager.itemFailed(item, message);
    }
    function itemSendSucceeed(item, message) {
        return processStatusManager.itemSucceed(item, message);
    }
    function itemSendFailed(item, message) {
        return processStatusManager.itemFailed(item, message);
    }
    function sendsInProgress() {
        return processStatusManager.sendsInProgress;
    }
    function sendsToGo() {
        return processStatusManager.sendsToGo;
    }
    function lastSentMessage() {
        return processStatusManager.sendsToGo;
    }
    function itemsToSendMessageList() {
        return processStatusManager.itemsToSendMessageList;
    }
    function lastProcessMessage() {
        return processStatusManager.lastProcessMessage;
    }
    function processPercentComplete() {
        return processStatusManager.percentComplete;
    }
    function flushStatusMessages() {
        return processStatusManager.flushStatusMessages();
    }
    function toSendMessages() {
        return processStatusManager.toSendMessages;
    }
    function completedMessages() {
        return processStatusManager.completedMessages;
    }
    function failedMessages() {
        return processStatusManager.failedMessages;
    }
    function registerOnProcessChange(call) {
        processStatusManager.registerOnChange(call);
    }
    function removeOnProcessChange(call) {
        processStatusManager.removeOnChange(call);
    }
    function dumpCompletedActions() {
        processStatusManager.dumpCompletedActions();
    }
    function dumpToDo() {
        processStatusManager.dumpToDo();
    }
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    function isUUID(theString) {
        const checkUUID = UUID_REGEX.test(theString);
        return checkUUID;
    }
    function dateStripTimezone(date) {
        if (date !== null) {
            const adjustMinutes = date.getTimezoneOffset();
            const theDateMS = date.getTime();
            const theDate = new Date(theDateMS - adjustMinutes * 60000);
            return theDate;
        }
        return null;
    }
    function dateAddTimezone(date) {
        if (date !== null) {
            const adjustMinutes = new Date().getTimezoneOffset();
            const theDateMS = date.getTime();
            const theDate = new Date(theDateMS + adjustMinutes * 60000);
            return theDate;
        }
        return null;
    }
    function selectedConsentNumber() {
        var _a;
        const theSelected = ((_a = getGlobalState("selected")) === null || _a === void 0 ? void 0 : _a.getValue()) || [];
        if (theSelected.length > 0) {
            let consentNumber = theSelected[0].getValue("consent_number");
            if (consentNumber) {
                return consentNumber;
            }
            let theForestBlock = theSelected[0].parentOrItemOfType("forest-blocks");
            if (theForestBlock) {
                return theForestBlock.getValue("consent_number");
            }
        }
        return null;
    }
    function initializeProcessStatusManager() {
        processStatusManager.init();
    }
    return {
        name,
        dumpSchema,
        getSchema,
        getSchemaArray,
        getSchemaArrayAlpha,
        createEditContext,
        removeEditContext,
        getContext,
        userChanged,
        registerDataType,
        registerSingleItem,
        registerSingleUserItem,
        instanceItem,
        instanceNewItem,
        init,
        save,
        registerOnChange,
        registerOnSave,
        registerOnDelete,
        getStoreTypeByName,
        clearAllStoreCache,
        clearStoreCache,
        removeOnChange,
        removeOnRetrieve,
        removeOnSave,
        removeOnDelete,
        getAllStoreTypes,
        setItem,
        storeData,
        getAll,
        requestLoad,
        getItem,
        itemByKey,
        getPropertyArray,
        updateItemNewUser,
        getAccessToken,
        accessTokenSync,
        fetchDataAuthorised,
        sendDataAuthorised,
        loadTables,
        putTablesIntoSchemaItems,
        call,
        callAsync,
        registerCall,
        registerCalls,
        removeCall,
        removeCalls,
        getGlobalState,
        setGlobalState,
        getStateValue,
        getStateArrayValue,
        getStateFirstValue,
        registerforStateChanges,
        removeStateChanges,
        dumpDataType,
        isStoredItem,
        getPropertyArrayFromItemArray,
        getPropertiesArrayFromItemArray,
        getPropertyArrayFromItemArrayUnique,
        isItemType,
        itemWillSend,
        typeWillRetrieve,
        itemIsSent,
        typeIsRetrieved,
        typeRetrieveFailed,
        itemSendSucceeed,
        itemSendFailed,
        sendsInProgress,
        sendsToGo,
        lastSentMessage,
        itemsToSendMessageList,
        lastProcessMessage,
        processPercentComplete,
        flushStatusMessages,
        toSendMessages,
        completedMessages,
        failedMessages,
        registerOnProcessChange,
        removeOnProcessChange,
        dumpCompletedActions,
        dumpToDo,
        isUUID,
        dateStripTimezone,
        dateAddTimezone,
        selectedConsentNumber,
        initializeProcessStatusManager,
    };
};
exports.createStore = createStore;
function getStore(name) {
    return stores[name] || (0, exports.createStore)(name);
}
exports.getStore = getStore;
function addStore(name) {
    stores[name] = (0, exports.createStore)(name);
    return stores[name];
}
exports.addStore = addStore;
_a = addStore('global'), exports.dumpSchema = _a.dumpSchema, exports.getSchema = _a.getSchema, exports.getSchemaArray = _a.getSchemaArray, exports.getSchemaArrayAlpha = _a.getSchemaArrayAlpha, exports.createEditContext = _a.createEditContext, exports.removeEditContext = _a.removeEditContext, exports.getContext = _a.getContext, exports.userChanged = _a.userChanged, exports.registerDataType = _a.registerDataType, exports.registerSingleItem = _a.registerSingleItem, exports.registerSingleUserItem = _a.registerSingleUserItem, exports.instanceItem = _a.instanceItem, exports.instanceNewItem = _a.instanceNewItem, exports.init = _a.init, exports.save = _a.save, exports.registerOnChange = _a.registerOnChange, exports.registerOnSave = _a.registerOnSave, exports.registerOnDelete = _a.registerOnDelete, exports.getStoreTypeByName = _a.getStoreTypeByName, exports.clearAllStoreCache = _a.clearAllStoreCache, exports.clearStoreCache = _a.clearStoreCache, exports.removeOnChange = _a.removeOnChange, exports.removeOnRetrieve = _a.removeOnRetrieve, exports.removeOnSave = _a.removeOnSave, exports.removeOnDelete = _a.removeOnDelete, exports.getAllStoreTypes = _a.getAllStoreTypes, exports.setItem = _a.setItem, exports.storeData = _a.storeData, exports.getAll = _a.getAll, exports.requestLoad = _a.requestLoad, exports.getItem = _a.getItem, exports.itemByKey = _a.itemByKey, exports.getPropertyArray = _a.getPropertyArray, exports.updateItemNewUser = _a.updateItemNewUser, exports.getAccessToken = _a.getAccessToken, exports.accessTokenSync = _a.accessTokenSync, exports.fetchDataAuthorised = _a.fetchDataAuthorised, exports.sendDataAuthorised = _a.sendDataAuthorised, exports.loadTables = _a.loadTables, exports.putTablesIntoSchemaItems = _a.putTablesIntoSchemaItems, exports.call = _a.call, exports.callAsync = _a.callAsync, exports.registerCall = _a.registerCall, exports.registerCalls = _a.registerCalls, exports.removeCall = _a.removeCall, exports.removeCalls = _a.removeCalls, exports.getGlobalState = _a.getGlobalState, exports.setGlobalState = _a.setGlobalState, exports.getStateValue = _a.getStateValue, exports.getStateArrayValue = _a.getStateArrayValue, exports.getStateFirstValue = _a.getStateFirstValue, exports.registerforStateChanges = _a.registerforStateChanges, exports.removeStateChanges = _a.removeStateChanges, exports.dumpDataType = _a.dumpDataType, exports.isStoredItem = _a.isStoredItem, exports.getPropertyArrayFromItemArray = _a.getPropertyArrayFromItemArray, exports.getPropertiesArrayFromItemArray = _a.getPropertiesArrayFromItemArray, exports.getPropertyArrayFromItemArrayUnique = _a.getPropertyArrayFromItemArrayUnique, exports.isItemType = _a.isItemType, exports.itemWillSend = _a.itemWillSend, exports.typeWillRetrieve = _a.typeWillRetrieve, exports.itemIsSent = _a.itemIsSent, exports.typeIsRetrieved = _a.typeIsRetrieved, exports.typeRetrieveFailed = _a.typeRetrieveFailed, exports.itemSendSucceeed = _a.itemSendSucceeed, exports.itemSendFailed = _a.itemSendFailed, exports.sendsInProgress = _a.sendsInProgress, exports.sendsToGo = _a.sendsToGo, exports.lastSentMessage = _a.lastSentMessage, exports.itemsToSendMessageList = _a.itemsToSendMessageList, exports.lastProcessMessage = _a.lastProcessMessage, exports.processPercentComplete = _a.processPercentComplete, exports.flushStatusMessages = _a.flushStatusMessages, exports.toSendMessages = _a.toSendMessages, exports.completedMessages = _a.completedMessages, exports.failedMessages = _a.failedMessages, exports.registerOnProcessChange = _a.registerOnProcessChange, exports.removeOnProcessChange = _a.removeOnProcessChange, exports.dumpCompletedActions = _a.dumpCompletedActions, exports.dumpToDo = _a.dumpToDo, exports.isUUID = _a.isUUID, exports.dateStripTimezone = _a.dateStripTimezone, exports.dateAddTimezone = _a.dateAddTimezone, exports.selectedConsentNumber = _a.selectedConsentNumber, exports.initializeProcessStatusManager = _a.initializeProcessStatusManager;
(0, exports.initializeProcessStatusManager)();
