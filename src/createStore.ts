import { Auth } from "aws-amplify";
import { printMessage, getUserDataSync, printData } from "./remotehq";
import { context } from "./context";
import { editContext } from "./editContext";
import { sortArray } from "./helpers/ListOperations";
import { storeType } from "./storeType";
import { storedItem } from "./storedItem";
import { ChangeCallbackFunction, IManagedItem, ISchemaStorageArray, ISortParams, IStore, messageLevels, objectNameToNumber, sortDirection } from "./types";
import { ProcessStatusManager } from "./ProcessStatusManager";

const stores: {
    [name: string]: IStore
} = {}

export function createStore(name: string) {
    let dataSchema: ISchemaStorageArray = {};
    const blankStoreType = new storeType("ignore");
    const localStorage = window.localStorage;
    let userID = "";

    function dumpSchema() {
        // printData(dataSchema, messageLevels.verbose);
    }

    function getSchema(): ISchemaStorageArray {
        return dataSchema;
    }

    function getSchemaArray() {
        return Object.values(dataSchema);
    }

    function getSchemaArrayAlpha() {
        const sortParams: ISortParams = { sortField: "name", sortDirection: sortDirection.ascending };

        return sortArray(Object.values(dataSchema), sortParams);
    }

    function createEditContext(name: string): storedItem | undefined {
        storeData("edit-context", name);
        const theContext = itemByKey("edit-context", name);
        return theContext;
    }

    function removeEditContext(context: editContext) {
        context.willDispose();
    }

    function getContext(key: any): context | null {
        const contextType = getStoreTypeByName("edit-context");
        const theContext = contextType?.itemByKey(key) || null;
        return theContext as context | null;
    }

    /**
     * Called when user changes to update store
     * @param newUserID ID of the new user
     */
    function userChanged(newUserID: string) {
        printMessage("Previous user: " + userID + " new user: " + newUserID, messageLevels.debug);
        if (newUserID !== userID) {
            userID = newUserID;
            printMessage("User changed - store updating", messageLevels.debug);

            Object.values(dataSchema).forEach((value) => value.userChanged(newUserID));
        }
    }
    // let contexts: IContextStorageArray = {};
    registerDataType("callback");
    // const stateStoreType = registerDataType("state").local = true;
    const stateStoreType = registerDataType("state");
    registerDataType("edit-context");

    const mainContext = instanceNewItem("edit-context");
    mainContext?.store();

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
    function registerDataType(
        type: string,
        remoteURL?: URL,
        createRemote?: boolean,
        retrieveRemote?: boolean,
        updateRemote?: boolean,
        deleteRemote?: boolean
    ): storeType {
        let theItem = getStoreTypeByName(type, true);

        theItem?.setupRemoteStorage(
            remoteURL,
            createRemote,
            retrieveRemote,
            updateRemote,
            deleteRemote
        );

        return theItem ?? blankStoreType;
    }

    function registerSingleItem(
        type: string,
        storeSesstion: Boolean,
        storeLocal: Boolean,
        maxAgeLocal: number | null,
        remoteURL?: URL,
        createRemote?: boolean,
        retrieveRemote?: boolean,
        updateRemote?: boolean,
        deleteRemote?: boolean
    ): storeType {
        let theItem = getStoreTypeByName(type, true);
        if (theItem) {
            theItem?.setupRemoteStorage(
                remoteURL,
                createRemote,
                retrieveRemote,
                updateRemote,
                deleteRemote
            );
            theItem.singleEntry = true;
            if (storeLocal) {
                theItem?.setupLocalStorage(maxAgeLocal || undefined);
            }

            dataSchema[type] = theItem;
            return theItem;
        }
        return blankStoreType;
    }

    function registerSingleUserItem(
        type: string,
        storeSesstion: Boolean,
        storeLocal: Boolean,
        maxAgeLocal: number | null,
        remoteURL?: URL,
        createRemote?: boolean,
        retrieveRemote?: boolean,
        updateRemote?: boolean,
        deleteRemote?: boolean
    ): storeType {
        let theItem = getStoreTypeByName(type, true);
        if (theItem) {
            theItem.setupRemoteStorage(
                remoteURL,
                createRemote,
                retrieveRemote,
                updateRemote,
                deleteRemote
            );
            theItem.singleEntry = true;
            theItem.userBased = true;
            if (storeLocal) {
                theItem.setupLocalStorage(maxAgeLocal || undefined);
            }

            dataSchema[type] = theItem;
        }
        return theItem ?? blankStoreType;
    }

    /**
     * Instance an item and optionally move the data into it. For creation of instances coming from remote sources.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    function instanceItem(type: string, data?: any): storedItem | null {
        const itemType = getStoreTypeByName(type);
        if (itemType) {
            return itemType.instanceItem(data);
        }
        printMessage("Type: '" + type + "' does not exist", messageLevels.error);
        return null;
    }

    /**
     * Instance an item and optionally move the data into it. This is for creation of instances that do not already exist remotely.
     * @param type Type of item to instance
     * @param data the data object to merge into the item (optional)
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    function instanceNewItem(type: string, data?: any): storedItem | null {
        const itemType = getStoreTypeByName(type);
        if (itemType) {
            const theItem = itemType.instanceNewItem(data);

            if (theItem) {
                const theUser = getUserDataSync?.() as any;
                const regionProperty = itemType.objectRegionProperty;

                const theSelected = getGlobalState("selected")?.getValue() || [];
                const theData: { [id: string]: any; } = {
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
        printMessage("Type: '" + type + "' does not exist", messageLevels.error);
        return null;
    }

    /**
     * Create an instance of an item locally rather than from an existing persisant store.
     * @param type - Type of item to instance
     * @returns storedItem of type. Will be of a subclass if one is assigned to that type
     */
    function init(type: string) {
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
    function registerOnChange(name: string, call: Function) {
        const schemaItem = getStoreTypeByName(name, true);
        schemaItem?.registerOnChange(call);
        return schemaItem;
    }
    function registerOnSave(name: string, call: Function) {
        const schemaItem = getStoreTypeByName(name, true);
        schemaItem?.registerOnSave(call);
        return schemaItem;
    }
    function registerOnDelete(name: string, call: Function) {
        const schemaItem = getStoreTypeByName(name, true);
        schemaItem?.registerOnDelete(call);
        return schemaItem;
    }

    function getStoreTypeByName(name: string, createMissing?: boolean): storeType | null {
        let schemaItem = dataSchema[name] || null;
        if (createMissing && createMissing === true && !schemaItem) {
            schemaItem = new storeType(name);
            dataSchema[name] = schemaItem;
        }
        return schemaItem;
    }

    function clearAllStoreCache() {
        Object.values(dataSchema).forEach((schemaItem) => schemaItem.clearCache());
    }

    function clearStoreCache(name: string) {
        const schemaItem = getStoreTypeByName(name, true);
        schemaItem?.clearCache();
    }

    function removeOnChange(name: string, call: Function) {
        let schemaItem = getStoreTypeByName(name);
        if (schemaItem) {
            schemaItem.removeOnChange(call);
        }
        return schemaItem;
    }
    function removeOnRetrieve(name: string, call: Function) {
        let schemaItem = getStoreTypeByName(name);
        if (schemaItem) {
            schemaItem.removeOnRetrieve(call);
        }
        return schemaItem;
    }
    function removeOnSave(name: string, call: Function) {
        let schemaItem = getStoreTypeByName(name);
        if (schemaItem) {
            schemaItem.removeOnSave(call);
        }
        return schemaItem;
    }
    function removeOnDelete(name: string, call: Function) {
        let schemaItem = getStoreTypeByName(name);
        if (schemaItem) {
            schemaItem.removeOnDelete(call);
        }
        return schemaItem;
    }

    function getAllStoreTypes() {
        return dataSchema;
    }

    function setItem(type: string, items: { [key: string]: any; } | string, data?: any) {
        return storeData(type, items, data);
    }
    /**
     * Put item in the store or update existing
     * @param type Data type of item
     * @param key Primary Key value
     * @param data Data to store
     */
    function storeData(type: string, items: { [key: string]: any; } | string, data?: any) {
        const schemaItem = getStoreTypeByName(type);

        return schemaItem?.storeData(items, data);
    }

    /**
     * Get all items in the colection as an array
     * note that this does not return metadata about item state.
     * and currently does not fetch if not loaded
     * @param type The data type of items to return
     * @returns array
     */
    function getAll(type: string) {
        let theItems: IManagedItem[] = [];
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
    function requestLoad(
        type: string,
        changeCallbackFn?: ChangeCallbackFunction,
        retrieveCallbackFn?: ChangeCallbackFunction
    ): storeType | null {
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
    async function getItem(type: string, key: string) {
        printMessage("getItem " + type + " " + key, messageLevels.debug);
        const schemaItem = getStoreTypeByName(type);
        if (schemaItem) {
            return schemaItem?.getItem(key);
        }
        return null;
    }

    function itemByKey(type: string, key: string) {
        printMessage("itemByKey " + type + " " + key, messageLevels.debug);

        const schemaItem = getStoreTypeByName(type);

        return schemaItem?.itemByKey(key);
    }

    function getPropertyArray(type: string, keys: [string], column: string) {
        return getStoreTypeByName(type)?.getPropertyArray(keys, column);
    }

    async function updateItemNewUser(type: string, key: string) {
        printMessage("updateing for user change: " + type + " " + key, messageLevels.debug);
        const schemaItem = getStoreTypeByName(type);
        return schemaItem?.updateItemNewUser(key);
    }

    // function storeLocal(schemaItem: storeType, data: any, localID: string) {
    //     schemaItem.storeLocal(data,localID);
    // }
    // function doChangeCallbacks (schemaItem: storeType, key: string, data: any)  {
    //     schemaItem.doChangeCallbacks(key,data);
    // }
    async function getAccessToken() {
        const session = await Auth.currentSession();
        if (session.isValid()) {
            const jwtToken = await session.getAccessToken().getJwtToken();
            printData(jwtToken, messageLevels.debug);

            return jwtToken;
        }
        return "";
    }

    function accessTokenSync() {
        for (var key in localStorage) {
            if (key.endsWith(".accessToken")) {
                printMessage("returning", messageLevels.debug);
                return localStorage.getItem(key);
            }
        }
        return null;
    }

    async function fetchDataAuthorised(url: URL, key?: string, queryString?: string | null) {
        if (queryString) {
            url.search = queryString;
            printMessage("URL+: " + url, messageLevels.debug);
        }

        if (userID && userID.length > 0) {
            const accessToken = await getAccessToken();

            printMessage("Fetching Auth: " + url, messageLevels.debug);
            printData(accessToken, messageLevels.debug);
            return fetch(url.toString(), {
                headers: new Headers({
                    Authorization: accessToken,
                }),
            }).then((response) => {
                if (response.ok) {
                    printData(response, messageLevels.debug, "response");

                    return response.json();
                } else {
                    printMessage("Failed to load Auth: " + url, messageLevels.error);
                    printData(response, messageLevels.error, "response");
                    return null;
                }
            });
        } else {
            printMessage("Fetching no Auth: " + url, messageLevels.debug);

            return fetch(url.toString()).then((response) => {
                if (response.ok) {
                    printData(response, messageLevels.debug);
                    return response.json();
                } else {
                    printMessage("Failed to load no Auth: " + url, messageLevels.error);
                    printData(response, messageLevels.error);
                    return null;
                }
            });
        }
    }

    async function sendDataAuthorised(
        url: URL,
        method: string,
        data: string,
        callback: Function,
        key?: string,
        queryString?: string | null
    ) {
        if (queryString) {
            url.search = queryString;
            printMessage("URL+: " + url, messageLevels.debug);
        }
        if (userID && userID.length > 0) {
            const accessToken = await getAccessToken();

            printMessage("Sending Auth: " + method + " " + url, messageLevels.debug);
            // printData(data , messageLevels.verbose, data);
            printData(accessToken, messageLevels.debug);
            return fetch(url.toString(), {
                method: method,
                headers: new Headers({
                    Authorization: accessToken,
                }),
                body: data,
            }).then((response) => {
                if (response.ok) {
                    printData(response, messageLevels.debug, "response");
                    const theCall = function (theResponse: any) {
                        callback(response.json());
                    };
                    theCall(response);
                    //   return response.json();
                } else {
                    printMessage("Failed to load Auth: " + url, messageLevels.error);
                    printData(response, messageLevels.error, "response");
                }
            });
        } else {
            printMessage("Sending no Auth: " + url, messageLevels.debug);

            return fetch(url.toString(), {
                method: method,
                body: data,
            }).then((response) => {
                if (response.ok) {
                    printData(response, messageLevels.debug);
                    return response.json();
                } else {
                    printMessage("Failed to Send no Auth: " + url, messageLevels.error);
                    printData(response, messageLevels.error);
                }
            });
        }
    }

    async function loadTables(endpoint: string) {
        printMessage("load tables", messageLevels.debug);
        registerSingleItem("data-types", false, false, null, new URL(endpoint))
            .registerOnChange(putTablesIntoSchemaItems)
            .requestLoad();
    }

    async function putTablesIntoSchemaItems(type: string, key: string, data: any) {
        printMessage("putTablesIntoSchema", messageLevels.debug);
        printData(data, messageLevels.debug, "data retrieved");
        data.map((element: any) => {
            return registerDataTypeFromFile(element);
        });
        printData(dataSchema, messageLevels.debug);
    }

    function registerDataTypeFromFile(element: any): storeType {
        const available_capabilities = (element.available_capabilities || "").toLowerCase();
        let willLoad = dataSchema[element.type] && dataSchema[element.type].loadRequest;
        printData(element, messageLevels.debug, "element in registerDataTypeFromFile");
        let theItem = getStoreTypeByName(element.type, true);
        if (theItem) {
            theItem.singleEntry = element.single_entry;
            theItem.userBased = element.user_based;
            theItem.objectRegionProperty = element.object_region_property;
            theItem.primaryKeyProperty = element.primary_key_property;
            theItem.displayName = element.display_name;
            if (element.object_type && element.object_type !== undefined) {
                const theNum = objectNameToNumber(element.object_type);
                if (theNum && theNum !== undefined && theNum !== -1) {
                    theItem.objectType = theNum;
                } else {
                    printMessage(theNum + " for " + theItem.name, messageLevels.verbose);
                }
            }

            if (element.rest_endpoint) {
                theItem.setupRemoteStorage(
                    element.rest_endpoint,
                    available_capabilities.includes("c"),
                    available_capabilities.includes("r"),
                    available_capabilities.includes("u"),
                    available_capabilities.includes("d")
                );
                theItem.clientUnwrap = element.client_unwrap;
            }
            if (element.browser_local_storage) {
                theItem.setupLocalStorage(element.maximum_age);
            }
            theItem.session = element.browser_session_storage;
            if (willLoad) {
                printMessage("Will load: " + element.type, messageLevels.debug);
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
    function call(name: string, ...args: any[]) {
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
    async function callAsync(name: string, ...args: any[]) {
        const { managedItemStorage } = dataSchema["callback"];
        if (managedItemStorage) {
            const theFunctionStore = managedItemStorage[name];
            if (theFunctionStore) {
                const theFunction = theFunctionStore.getValue();

                if (theFunction) {
                    return await theFunction(...args);
                }
            }
        }
        return null;
    }

    /**
     * Register a function with the global call table
     * @param name - name of the function
     * @param fn - the function
     */
    function registerCall(name: string, fn: any, awaitMapAvailable?: boolean) {
        // const functionProps = {function: fn, awaitMapAvailable: awaitMapAvailable};
        // setItem("callback", name, functionProps);
        setItem("callback", name, fn);
        printMessage("registerCall: " + name, messageLevels.debug);
        // dumpDataType("callback", messageLevels.debug);
    }

    function registerCalls(calls: { [key: string]: any; }) {
        Object.entries(calls).forEach(([key, value]) => {
            registerCall(key, value);
        });
    }
    /**
     * Remove a function from the global call table
     * @param name - name of the function
     */
    function removeCall(name: string) {
        // const functionProps = {function: fn, awaitMapAvailable: awaitMapAvailable};
        // setItem("callback", name, functionProps);
        setItem("callback", name, null);
        printMessage("removeCall: " + name, messageLevels.debug);
        // dumpDataType("callback", messageLevels.debug);
    }

    function removeCalls(calls: { [key: string]: any; }) {
        Object.keys(calls).forEach((key) => {
            removeCall(key);
        });
    }

    /**
     * Get a state variable from the global state store
     * @param name - name of the state variable
     * @returns the variable item
     */
    function getGlobalState(name: string) {
        return itemByKey("state", name);
    }

    /**
     * set a global state variable
     * @param name - name of the state variable
     * @param value the value to store
     */
    async function setGlobalState(name: { [key: string]: any; } | string, value?: any) {
        if (typeof name === "string" && value === undefined) {
            printMessage("Set " + name + " to undefined", messageLevels.error);
        } else {
            setItem("state", name, value);
        }
    }

    /**
     * Get a state variable's value from the global state store
     * @param name - name of the state variable
     * @returns the variable value
     */
    function getStateValue(name: string) {
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
    function getStateArrayValue(name: string, defaultValue?: []) {
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
    function getStateFirstValue(name: string, defaultValue?: any) {
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
    function registerforStateChanges(fn: any) {
        registerOnChange("state", fn);
    }
    function removeStateChanges(fn: any) {
        removeOnChange("state", fn);
    }
    function dumpDataType(type: string, level: messageLevels) {
        getStoreTypeByName(type)?.dumpData(level);
    }

    function isStoredItem(item: any): boolean {
        if (item) {
            return item instanceof storedItem;
        }
        return false;
    }

    function getPropertyArrayFromItemArray(items: storedItem[], column: string) {
        let theArray: any = [];

        items.forEach((element) => {
            theArray.push(element.getValue(column));
        });

        return theArray;
    }

    function getPropertiesArrayFromItemArray(items: storedItem[], columns: string[]) {
        let theArray: any = [];

        items.forEach((element) => {
            theArray.push(element.getValues(columns));
        });

        return theArray;
    }

    function getPropertyArrayFromItemArrayUnique(items: storedItem[], column: string) {
        let theArray: any = [];

        items.forEach((element) => {
            const theValue = element.getValue(column);
            if (!theArray.includes(theValue)) {
                theArray.push(theValue);
            }
        });

        return theArray;
    }

    function isItemType(item: any, type: string, isLike?: boolean): boolean {
        if (isStoredItem(item)) {
            if (isLike) {
                return (item as storedItem).getTypeName().includes(type);
            } else {
                return (item as storedItem).getTypeName() === type;
            }
        }
        return false;
    }

    // Process status Manager functions
    function itemWillSend(item: storedItem | storeType, message?: string): void {
        processStatusManager.itemWillSend(item, message);
    }
    function typeWillRetrieve(item: storedItem | storeType, message?: string): void {
        processStatusManager.itemWillSend(item, message);
    }

    function itemIsSent(item: storedItem | storeType, message: string): void {
        processStatusManager.itemIsSent(item, message);
    }
    function typeIsRetrieved(item: storedItem | storeType, message: string): void {
        processStatusManager.itemSucceed(item, message);
    }
    function typeRetrieveFailed(item: storedItem | storeType, message: string): void {
        processStatusManager.itemFailed(item, message);
    }

    function itemSendSucceeed(item: storedItem | storeType, message: string): void {
        return processStatusManager.itemSucceed(item, message);
    }

    function itemSendFailed(item: storedItem | storeType, message: string): void {
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

    function registerOnProcessChange(call: Function) {
        processStatusManager.registerOnChange(call);
    }

    function removeOnProcessChange(call: Function) {
        processStatusManager.removeOnChange(call);
    }
    function dumpCompletedActions() {
        processStatusManager.dumpCompletedActions();
    }
    function dumpToDo() {
        processStatusManager.dumpToDo();
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    function isUUID(theString: string) {
        const checkUUID = UUID_REGEX.test(theString);
        return checkUUID;
    }

    function dateStripTimezone(date: Date | null) {
        if (date !== null) {
            const adjustMinutes = date.getTimezoneOffset();
            const theDateMS = date.getTime();
            const theDate = new Date(theDateMS - adjustMinutes * 60000);
            return theDate;
        }
        return null;
    }
    function dateAddTimezone(date: Date | null) {
        if (date !== null) {
            const adjustMinutes = new Date().getTimezoneOffset();
            const theDateMS = date.getTime();
            const theDate = new Date(theDateMS + adjustMinutes * 60000);
            return theDate;
        }
        return null;
    }
    function selectedConsentNumber(): any {
        const theSelected = getGlobalState("selected")?.getValue() || [];
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
    };
}

export function getStore(name: string) {
    return stores[name] || createStore(name)
}

export function addStore(name: string) {
    stores[name] = createStore(name)
    return stores[name]
}

export const {
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
} = addStore('global')

let processStatusManager = new ProcessStatusManager();
processStatusManager.init();