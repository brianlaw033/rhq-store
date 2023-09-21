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
exports.stripQuotes = exports.parseQuery = exports.parseQueries = exports.storedItem = void 0;
const moment_1 = __importDefault(require("moment"));
const types_1 = require("./types");
const storeType_1 = require("./storeType");
const remotehq_1 = require("./remotehq");
const _1 = require(".");
const helpers_1 = require("./helpers");
class storedItem {
    constructor(type, data, doNotStore) {
        this._type = null;
        this._primaryKey = "";
        this._dirty = false;
        this._requested = false;
        this._hasData = false;
        this._notified = true;
        this._deleted = false;
        this._created = false;
        this._isEditCopy = false;
        this._sourceItem = null;
        this._keepCallback = null;
        this._sendAttempts = 0;
        this._serial = 0;
        this.parentOrItemOfType = (type) => {
            var _a;
            if (((_a = this.getType()) === null || _a === void 0 ? void 0 : _a.name) === "type") {
                return this;
            }
            const parent = this.getParent();
            if (parent) {
                return parent.parentOrItemOfType(type);
            }
            return null;
        };
        this.getType = () => {
            return this._type;
        };
        this.getTypeName = () => {
            if (this._type) {
                return this._type.name;
            }
            return "";
        };
        // public getBoundingBox = (): [] | null => {
        //     const parent = this.getParent();
        //     if (parent) {
        //         return parent.getBoundingBox();
        //     }
        //     return null;
        // };
        this.setPrimaryKey = (value) => {
            var _a;
            if (this._type && ((_a = this._type) === null || _a === void 0 ? void 0 : _a.primaryKeyProperty)) {
                this[this._type.primaryKeyProperty] = value;
            }
            return this;
        };
        this.primaryKeyStrict = () => {
            var _a;
            if (this._type && ((_a = this._type) === null || _a === void 0 ? void 0 : _a.primaryKeyProperty)) {
                return this[this._type.primaryKeyProperty];
            }
            return null;
        };
        this.primaryKey = () => {
            var _a;
            if (this._type && ((_a = this._type) === null || _a === void 0 ? void 0 : _a.primaryKeyProperty)) {
                return this[this._type.primaryKeyProperty];
            }
            else if (this._primaryKey) {
                return this._primaryKey;
            }
            return null;
        };
        this.primaryKeySafe = () => {
            var _a;
            if (this.primaryKey() && this.primaryKey() !== undefined) {
                return this.primaryKey();
            }
            if (this._primaryKey && this._primaryKey !== undefined) {
                return this._primaryKey;
            }
            if (this.id && this.id !== undefined) {
                return this.id;
            }
            if (this.name && this.name !== undefined) {
                return this.name;
            }
            return (((_a = this._type) === null || _a === void 0 ? void 0 : _a.name) || "zz") + Math.random();
        };
        this.getRegionItem = () => __awaiter(this, void 0, void 0, function* () {
            const theISO = this.getRegionISO();
            if (theISO && theISO.length > 0) {
                const theRegion = yield (0, _1.getItem)("boundaries", theISO);
                return theRegion;
            }
            else {
                return null;
            }
        });
        this.itemIsParent = (theItem) => {
            if (theItem === this) {
                return true;
            }
            return false;
        };
        this.getRelatedItems = (sourceType, relateOn, relateTo, comparison, all, sort) => {
            let sourceList = [];
            let data = [];
            if (typeof sourceType === "string") {
                sourceList = [sourceType];
            }
            else {
                sourceList = sourceType;
            }
            sourceList.forEach((source) => {
                const dataSource = (0, _1.requestLoad)(source);
                // if(source === "forest-monitoring-reports") return [];
                if (dataSource) {
                    let theResult = [];
                    const theQuery = [[relateTo, comparison || "==", relateOn].join(" ")];
                    const searchParams = { queries: theQuery, sort: sort };
                    if (all) {
                        theResult = dataSource === null || dataSource === void 0 ? void 0 : dataSource.allMatchingItems(searchParams);
                    }
                    else {
                        theResult = dataSource === null || dataSource === void 0 ? void 0 : dataSource.matchingItems(searchParams);
                    }
                    if (theResult) {
                        data = [...data, ...theResult];
                    }
                }
            });
            return data || [];
        };
        this.getRelatedItem = (sourceType, relateOn, relateTo, comparison, all) => {
            let sourceList = [];
            if (Array.isArray(sourceType)) {
                sourceList = sourceType;
            }
            else {
                sourceList = [sourceType];
            }
            let theResult = [];
            let endResult = null;
            sourceList.forEach((source) => {
                theResult = this.getRelatedItems(source, relateOn, relateTo, comparison, all);
                if (theResult && theResult.length > 0) {
                    endResult = theResult[0];
                    return;
                }
            });
            if (endResult) {
                return endResult;
            }
            return null;
        };
        this.getRelatedItemStored = (sourceType, relateOn, relateTo, name, comparison, all) => {
            let theItem = this.getValue("_" + name + "Item");
            if (!theItem) {
                theItem = this.getRelatedItem(sourceType, relateOn, relateTo, comparison, all);
            }
            return theItem;
        };
        this.getRegionISO = () => {
            var _a;
            if (this._type && ((_a = this._type) === null || _a === void 0 ? void 0 : _a.objectRegionProperty)) {
                return this[this._type.objectRegionProperty];
            }
            return null;
        };
        // set multiple values from key: value Dictionary
        this.setValues = (values) => {
            Object.keys(values).forEach((key) => {
                this.setValue(values[key], key);
            });
            return this;
        };
        this.setValue = (value, forKey) => {
            if (!forKey) {
                return this.setSingleValue(value, forKey);
            }
            const keyArray = forKey.split(".");
            const thisKey = keyArray.pop() || "";
            if (keyArray.length === 0) {
                this.setSingleValue(value, thisKey);
            }
            else {
                let theValue = this.getValue(keyArray.join("."));
                if ((0, _1.isStoredItem)(theValue)) {
                    theValue = theValue.setValue(value, thisKey);
                }
            }
            return this;
        };
        this.getValues = (keys) => {
            const theResults = {};
            keys.forEach((keyName) => {
                theResults[keyName] = this.getValue(keyName);
            });
            return theResults;
        };
        this.getValue = (forKey, defaultValue) => {
            if (forKey) {
                const keyArray = forKey.split(".");
                const thisKey = keyArray.shift();
                const theValue = this.getSingleValue(thisKey);
                if (keyArray.length < 1) {
                    return theValue;
                }
                if ((0, _1.isStoredItem)(theValue)) {
                    return theValue.getValue(keyArray.join("."));
                }
                else if (theValue && theValue.then === "function") {
                    return theValue.getValue(keyArray.join("."));
                }
                else {
                    if (keyArray > 0) {
                        return theValue[keyArray[0]];
                    }
                    return theValue;
                }
            }
            else {
                const theValue = this.getSingleValue(forKey);
                if (theValue || defaultValue === undefined) {
                    return theValue;
                }
                return defaultValue;
            }
        };
        this.setSingleValue = (value, forKey) => {
            return setSingleValue(this, value, forKey);
        };
        this.getSingleValue = (forKey) => {
            return getSingleValue(this, forKey);
        };
        this.isInSelected = () => {
            var _a;
            const selected = (_a = (0, _1.getGlobalState)("selected")) === null || _a === void 0 ? void 0 : _a.getValue();
            const isSelected = !selected || selected.length < 1;
            if (!isSelected) {
                for (let i = 0; i < selected.length; i++) {
                    if (this.itemIsParent(selected[i])) {
                        return this;
                    }
                }
            }
            else {
                return this;
            }
            return null;
        };
        this.isInLevel = () => {
            var _a;
            const regions = (_a = (0, _1.getGlobalState)("regions")) === null || _a === void 0 ? void 0 : _a.getValue();
            if (!regions) {
                return this;
            }
            const theRegion = this.getRegionISO();
            if (!theRegion) {
                return this;
            }
            if (regions[0] === "NZ" || regions[0] === "NZL") {
                return this;
            }
            let regionArray = [];
            if (typeof theRegion === "string") {
                regionArray.push(theRegion);
            }
            else {
                regionArray = theRegion;
                (0, remotehq_1.printData)(theRegion, types_1.messageLevels.debug, "theRegion");
            }
            const output = regions.filter((obj) => regionArray.indexOf(obj) !== -1);
            if (output.length > 0) {
                return this;
            }
            return null;
        };
        this.matchStringInParameters = (parameters, findString) => {
            return matchStringInParameters(this, parameters, findString);
        };
        this.singleQuery = (queryParsed) => {
            return singleQuery(this, queryParsed);
        };
        this.matchItem = (parsedQueries, orMode) => {
            if (this._deleted) {
                return null;
            }
            let isPassed = true;
            parsedQueries.forEach((value) => {
                const thisResult = this.singleQuery(value);
                if (orMode || false) {
                    isPassed = isPassed || thisResult;
                }
                else {
                    isPassed = isPassed && thisResult;
                }
            });
            if (isPassed) {
                return this;
            }
            return null;
        };
        this.matchItemFields = (parsedQueries, fields, orMode) => {
            if (this.matchItem(parsedQueries, orMode)) {
                const theReturnObject = {};
                fields.forEach((value) => {
                    theReturnObject[value] = this.getValue(value);
                });
                return theReturnObject;
            }
            return null;
        };
        this.isDirty = () => {
            return this._dirty === true;
        };
        this.assignDefaultData = (value) => {
            if (typeof value === "number" ||
                typeof value === "string" ||
                typeof value === "boolean" ||
                typeof value === "function") {
                this._value = value;
            }
            else if (Array.isArray(value)) {
                this._value = value;
            }
            else {
                Object.assign(this, value);
                if (typeof value === "object" && value["deleted"]) {
                    this._deleted = value["deleted"];
                }
            }
            this._notified = false;
            return this;
        };
        this.linkedUpdate = () => {
            if (this._type) {
                if (this.primaryKey() && this.primaryKey() !== "") {
                    this.doChangeCallbacks();
                }
            }
            return this;
        };
        this.delete = () => {
            var _a;
            this._dirty = true;
            this._serial += 1;
            this._deleted = true;
            // eslint-disable-next-line
            (_a = this._type) === null || _a === void 0 ? void 0 : _a.changed();
            return this;
        };
        this.mapClick = (e, clickAction) => {
            // call("mapIsLoading");
            (0, remotehq_1.printMessage)("mapClick in: " + this.getTypeName() + " - " + this.primaryKey(), types_1.messageLevels.debug);
            (0, _1.call)("setLevelByItem", this);
        };
        this.mapMouseEnter = (0, helpers_1.throttle)((e, hoverAction) => {
            (0, remotehq_1.printMessage)("mapClick in: " + this.getTypeName() + " - " + this.primaryKey(), types_1.messageLevels.debug);
            (0, _1.call)("setRolloverByItem", this);
        }, 300);
        this.mapMouseLeave = (e, hoverAction) => {
            (0, remotehq_1.printMessage)("mapClick in: " + this.getTypeName() + " - " + this.primaryKey(), types_1.messageLevels.debug);
            (0, _1.call)("setRolloverByItem", null);
        };
        // validate items by overriding in sub classes
        // call to enable save buttons
        this.validForSave = () => {
            return true;
        };
        this.validateBeforeSave = () => {
            return true;
        };
        // call to get error for form component
        this.validationErrorForKey = (key) => {
            return null;
        };
        this.validationForKey = (key) => {
            const theError = this.validationErrorForKey(key);
            return theError === null || theError === false;
        };
        this.validationForKeys = (keys) => {
            let isValid = true;
            keys.forEach((key) => {
                isValid = this.validationForKey(key) && isValid;
            });
            return isValid;
        };
        this._type = type;
        if (data) {
            this.mergeData(data);
            if (!doNotStore) {
                this.store();
            }
        }
    }
    toggleEditing() {
        this.setEditing(!this.isEditing());
    }
    isEditing() {
        return this.getValue("_isEditing") || false;
    }
    setEditing(value) {
        this.setValue(value, "_isEditing");
        (0, _1.call)("setEditControl", value ? this.getValue("_isEditing") : null);
    }
    zoomOnSelect() {
        return true;
    }
    mounted() {
        // do setup here
    }
    defaultValues() {
        return { created_date: (0, moment_1.default)() };
    }
    displayName() {
        return this.friendlyDisplayName + " " + this.primaryKey();
    }
    get friendlyDisplayName() {
        var _a;
        return ((_a = this.getType()) === null || _a === void 0 ? void 0 : _a.displayName) || this.getTypeName();
    }
    levelName() {
        const parent = this.getParent();
        if (parent) {
            return parent.levelName();
        }
        return this.getTypeName();
    }
    get storeUUID() {
        return this._primaryKey;
    }
    assignUUID() {
        var _a;
        if (this._primaryKey === "") {
            this._primaryKey = (0, storeType_1.CreateUUID)();
            if (((_a = this._type) === null || _a === void 0 ? void 0 : _a.primaryKeyProperty) === "uuid") {
                // TODO: confirm doesnt break anything
                const theUUID = this.getValue("uuid");
                if (!theUUID || theUUID === null || theUUID === undefined) {
                    this.uuid = this._primaryKey;
                }
            }
        }
        return this;
    }
    getUUID() {
        return this._primaryKey;
    }
    checkReadAuthority(regions) {
        var _a;
        const theRegions = regions;
        if (!regions) {
            regions = this.getRegionISO();
        }
        // ToDo - get object type and get authority to read it in current region
        return ((_a = this._type) === null || _a === void 0 ? void 0 : _a.checkReadAuthority(theRegions)) || true;
    }
    checkCreateAuthority(regions) {
        var _a;
        const theRegions = regions;
        if (!regions) {
            regions = this.getRegionISO();
        }
        // ToDo - get object type and get authority to read it in current region
        return ((_a = this._type) === null || _a === void 0 ? void 0 : _a.checkCreateAuthority(theRegions)) || true;
    }
    checkUpdateAuthority(regions, defaultValue) {
        var _a;
        let theRegions = regions;
        if (!regions) {
            theRegions = this.getRegionISO();
        }
        if (!this._type || this._type === undefined) {
            return defaultValue || false;
        }
        // ToDo - get object type and get authority to read it in current region
        const allowed = (_a = this._type) === null || _a === void 0 ? void 0 : _a.checkUpdateAuthority(theRegions, defaultValue);
        (0, remotehq_1.printData)(allowed, types_1.messageLevels.debug, "allowed in storedItem");
        return allowed;
    }
    checkDeleteAuthority(regions) {
        var _a;
        const theRegions = regions;
        if (!regions) {
            regions = this.getRegionISO();
        }
        // ToDo - get object type and get authority to read it in current region
        return ((_a = this._type) === null || _a === void 0 ? void 0 : _a.checkDeleteAuthority(theRegions)) || true;
    }
    getBoundingBox() {
        const theBoundingBox = this.getValue("mapbox_bounding_box");
        if (theBoundingBox) {
            return this.getValue("mapbox_bounding_box");
        }
        const parent = this.getParent();
        if (parent) {
            return parent.getBoundingBox();
        }
        return null;
    }
    getParent() {
        return null;
    }
    getRelatedItemStoredCreate(sourceType, name, localIDField, remoteIDField) {
        let theItem = this.getValue(name);
        if (!theItem) {
            theItem = (0, _1.instanceNewItem)(sourceType);
            if (theItem) {
                this.setValue(theItem, "_" + name + "Item");
                if (localIDField) {
                    this.setValue(theItem.getValue(remoteIDField || "_primaryKey"), localIDField);
                }
            }
        }
        return theItem;
    }
    get changeCount() {
        return this._serial;
    }
    mergeData(value) {
        const oldKey = this.primaryKey();
        this._hasData = true;
        // this._modifiedDate =  new Date(),
        // this._fetchedDate = new Date(),
        this._requested = false;
        if (typeof value === "number" ||
            typeof value === "string" ||
            typeof value === "boolean" ||
            typeof value === "function") {
            this._value = value;
        }
        else if (Array.isArray(value)) {
            this._value = value;
        }
        else if (value === null) {
            if (this._value) {
                this._value = null;
            }
        }
        else {
            if (value && value !== undefined) {
                Object.assign(this, JSON.parse(JSON.stringify(value)));
            }
            if (typeof value === "object" && value["deleted"]) {
                this._deleted = value["deleted"];
            }
        }
        const newKey = this.primaryKey();
        if (oldKey !== newKey && this._type) {
            this._type.moveItem(oldKey, newKey);
        }
        this._notified = false;
        if (this.getTypeName() === "state") {
            if (this._primaryKey === null && value === undefined) {
                (0, remotehq_1.printData)(value, types_1.messageLevels.error, "Set " + this.getTypeName() + " : " + this.primaryKey());
            }
        }
        return this;
    }
    store(key) {
        if (this._type) {
            if (this.primaryKey() && this.primaryKey() !== "") {
                this._type.managedItemStorage[this.primaryKey()] = this;
                this.doChangeCallbacks(this.primaryKey());
            }
            else if (key !== undefined) {
                this._type.managedItemStorage[key] = this;
                this.doChangeCallbacks(key);
            }
            else {
                // if((!this._primaryKey || this._primaryKey === '') && !this._type.isSingleEntry() ) {
                //     this._primaryKey = CreateUUID();
                // }
                this._type.managedItemStorage[this._primaryKey] = this;
            }
            this._type.managedItemStoragebyUUID[this.getValue("uuid")] = this;
        }
        return this;
    }
    shouldSendDelete() {
        if (this._deleted && !this._created && this._dirty) {
            return true;
        }
        return false;
    }
    shouldSendUpdate() {
        if (this._deleted) {
            return false;
        }
        if (this._created === true) {
            return false;
        }
        if (!this.isDirty()) {
            return false;
        }
        if (!this.shouldSendCreate() && this.isDirty()) {
            return true;
        }
        return false;
    }
    shouldSendCreate() {
        if (this._deleted) {
            return false;
        }
        if (this._created === false) {
            return false;
        }
        if (this._created && !this._deleted && this.isDirty()) {
            return true;
        }
        return false;
    }
    shouldForget() {
        if (this._deleted && this._created) {
            return true;
        }
        return false;
    }
    doChangeCallbacks(key) {
        var _a;
        const primaryKey = this.primaryKey();
        // eslint-disable-next-line
        (_a = this._type) === null || _a === void 0 ? void 0 : _a.doChangeCallbacks(key || primaryKey, this);
        this._notified = true;
        return this;
    }
    select() {
        (0, _1.call)("setLevelByItem", this);
        return this;
    }
    static omitItems() {
        return omitList();
    }
    toJSON() {
        return omit(this, storedItem.omitItems());
    }
    isSelected() {
        var _a;
        const selectedItems = (_a = (0, _1.getGlobalState)("selected")) === null || _a === void 0 ? void 0 : _a.getValue();
        if (!selectedItems) {
            return false;
        }
        if (selectedItems.includes(this)) {
            return true;
        }
        return false;
    }
    isHovered() {
        var _a;
        const hoveredItems = (_a = (0, _1.getGlobalState)("hovers")) === null || _a === void 0 ? void 0 : _a.getValue();
        if (!hoveredItems) {
            return false;
        }
        if (hoveredItems.includes(this)) {
            return true;
        }
        return false;
    }
    /**
     * return a copy of the item to use whilst editing and replace the original if change saved
     *
     * @returns storedItem - the copy
     */
    editCopy() {
        var _a;
        if (this._type) {
            return (_a = this._type) === null || _a === void 0 ? void 0 : _a.editCopy(this);
        }
        return null;
    }
    get isEditCopy() {
        return this._isEditCopy;
    }
    /**
     * return a copy of the item for use as an identical item but as new
     *
     * @returns storedItem - the copy
     */
    itemCopy() {
        var _a;
        if (this._type) {
            return (_a = this._type) === null || _a === void 0 ? void 0 : _a.itemCopy(this);
        }
        return null;
    }
    /**
     * write the item back to the original stored item
     *
     * @param theItem
     * returns the original item in the store that's now updated or null if not put back via callback
     */
    keepChanges(callback) {
        if (this._isEditCopy) {
            const theOriginal = this._sourceItem;
            if (theOriginal && theOriginal !== undefined) {
                const isDirty = this._dirty;
                const wasEditCopy = theOriginal === null || theOriginal === void 0 ? void 0 : theOriginal._isEditCopy;
                const wasSourceItem = theOriginal === null || theOriginal === void 0 ? void 0 : theOriginal._sourceItem;
                if (isDirty) {
                    Object.assign(theOriginal, JSON.parse(JSON.stringify(this)));
                    if (this._multiFileUploader) {
                        theOriginal._multiFileUploader = this._multiFileUploader;
                    }
                    theOriginal._isEditCopy = wasEditCopy;
                    theOriginal._sourceItem = wasSourceItem;
                    // MultiFileUploader: null
                    theOriginal._created = this._created;
                    theOriginal._deleted = this._deleted;
                    theOriginal._dirty = isDirty;
                    theOriginal._serial = this._serial;
                    // theOriginal._hasData: true
                    // theOriginal._modifiedDate: undefined
                    // theOriginal._notified: false
                    theOriginal._primaryKey = this._primaryKey;
                    theOriginal.storeChanges(callback);
                    this.doChangeCallbacks(theOriginal.primaryKey());
                }
                return theOriginal;
            }
            return null;
        }
        else {
            this.storeChanges(callback);
            return this;
        }
    }
    /**
     * write the item back to the original stored item
     *
     * @param theItem
     * returns the original item in the store that's now updated or null if not put back via callback
     */
    storeChanges(callback) {
        (0, remotehq_1.printMessage)("storeChanges", types_1.messageLevels.debug);
        const isDone = this.willStoreEdit();
        if (callback) {
            (0, remotehq_1.printData)(callback, types_1.messageLevels.debug, "SetCallback in storeChanges");
            this._keepCallback = callback;
        }
        if (isDone) {
            this.storeEditPrepared();
        }
        if (this._isEditCopy) {
            return this._sourceItem || this;
        }
        return this;
    }
    storeEditPrepared() {
        this.store();
        if (this._keepCallback) {
            // if(this._type) {
            //   this._keepCallback(this._type?.keepChanges(this));
            // }
            this._keepCallback(this);
        }
    }
    willStoreEdit() {
        return true;
    }
    willSave() { }
    aboutToSend() {
        this._sendAttempts += 1;
    }
    didSend() {
        this._sendAttempts = 0;
        return this;
    }
    getDateFormatted(forKey, format, defaultValue) {
        const theDateValue = this.getValue(forKey);
        if (!theDateValue || theDateValue === undefined) {
            return defaultValue;
        }
        const theFormattedValue = (0, moment_1.default)(theDateValue).format(format || "DD MMMM yyyy");
        return theFormattedValue;
    }
    get pinColour() {
        return "#eedddd";
    }
    get activePinColour() {
        return "#285eed";
    }
}
exports.storedItem = storedItem;
function omitList() {
    return [
        "_serial",
        "_type",
        "_primaryKey",
        "_dirty",
        "_requested",
        "_hasData",
        "_notified",
        "_modifiedDate",
        "_value",
        "_deleted",
        "_created",
        "_isEditCopy",
        "_sourceItem",
        "_keepCallback",
        "_fileRef",
        "_stageHandler",
        "_MultiFileUploader",
        "_sendAttempts",
    ];
}
const omit = (originalObject, keysToOmit) => {
    const clonedObject = Object.assign({}, originalObject);
    for (const path of keysToOmit) {
        delete clonedObject[path];
    }
    return clonedObject;
};
function parseQueries(queries) {
    const theParsedQueries = [];
    if (queries) {
        queries.forEach((value) => {
            const queryParsed = parseQuery(value);
            theParsedQueries.push(queryParsed);
        });
    }
    return theParsedQueries;
}
exports.parseQueries = parseQueries;
function parseQuery(query) {
    let theString = query.trim();
    let theIndex = theString.indexOf(" ");
    const theColumn = theString.split(" ", 1)[0].trim();
    theString = theString.substring(theIndex).trim();
    theIndex = theString.indexOf(" ");
    const theOperator = theString.split(" ", 1)[0].trim().toLowerCase();
    theString = theString.substring(theIndex).trim();
    let theValue = theString;
    if (theValue.startsWith("[")) {
        theValue = theValue.substr(1, theValue.length - 2);
        const theValues = theValue.split(",");
        theValues.forEach((item, index) => (theValues[index] = stripQuotes(item)));
        return { column: theColumn, operator: theOperator, values: theValues };
    }
    else {
        if (theValue !== "NULL") {
            theValue = stripQuotes(theValue);
        }
        return { column: theColumn, operator: theOperator, value: theValue };
    }
}
exports.parseQuery = parseQuery;
function stripQuotes(fromStr) {
    let theResult = fromStr;
    if (fromStr.startsWith('"') || fromStr.startsWith("'")) {
        theResult = fromStr.substr(1, fromStr.length - 2);
    }
    return theResult.trim();
}
exports.stripQuotes = stripQuotes;
function matchStringInParameters(theItem, parameters, findString) {
    if (findString.length === 0) {
        return theItem;
    }
    findString = findString.trim().toLowerCase();
    if (findString.length === 0) {
        return theItem;
    }
    let stringToCompare = "";
    parameters.forEach((element) => {
        const theValue = theItem.getValue(element);
        if (theValue) {
            stringToCompare = stringToCompare.concat(" ", theValue.toString());
        }
    });
    stringToCompare = stringToCompare.toLowerCase();
    const findStringItems = findString.split(" ");
    let found = true;
    findStringItems.forEach((element) => {
        element = element.trim();
        const foundThis = stringToCompare.indexOf(element) > -1;
        found = found && foundThis;
    });
    if (found) {
        return theItem;
    }
    return null;
}
function singleQuery(theItem, queryParsed) {
    // const queryParsed = parseQuery(query);
    const { column, operator } = queryParsed;
    const value = queryParsed.value || "";
    const values = queryParsed.values;
    let thisResult = false;
    const theFieldData = theItem.getValue(column);
    let theStoredDate = new Date();
    let theCompareDate = theStoredDate;
    let theStartDate = theStoredDate;
    let theEndDate = theStoredDate;
    switch (operator.toLowerCase()) {
        case "not":
            if (value === "NULL") {
                thisResult = theFieldData !== null;
            }
            else {
                thisResult = theFieldData !== value;
            }
            break;
        case "is":
            if (value === "NULL") {
                thisResult = theFieldData === null;
            }
            else {
                thisResult = theFieldData === value;
            }
            break;
        case "===":
            thisResult = theFieldData === value;
            break;
        case "==":
            // eslint-disable-next-line
            thisResult = theFieldData == value;
            break;
        case "!==":
            thisResult = theFieldData !== value;
            break;
        case "!=":
            // eslint-disable-next-line
            thisResult = theFieldData != value;
            break;
        case ">":
            thisResult = theFieldData > value;
            break;
        case "<":
            thisResult = theFieldData < value;
            break;
        case ">=":
        case ">==":
            thisResult = theFieldData >= value;
            break;
        case "<=":
        case "<==":
            thisResult = theFieldData <= value;
            break;
        case "after":
            theStoredDate = new Date(theFieldData);
            theCompareDate = new Date(value);
            thisResult = theStoredDate > theCompareDate;
            break;
        case "before":
            theStoredDate = new Date(theFieldData);
            theCompareDate = new Date(value);
            thisResult = theStoredDate < theCompareDate;
            break;
        case "onorafter":
            theStoredDate = new Date(theFieldData);
            theCompareDate = new Date(value);
            thisResult = theStoredDate >= theCompareDate;
            break;
        case "onorbefore":
            theStoredDate = new Date(theFieldData);
            theCompareDate = new Date(value);
            thisResult = theStoredDate <= theCompareDate;
            break;
        case "between":
            theStoredDate = new Date(theFieldData);
            thisResult = theFieldData <= value;
            if (values && values.length > 1) {
                theStartDate = new Date(values[0]);
                theEndDate = new Date(values[1]);
                // values.splice(values.indexOf('null'), 1, null);
                thisResult = theStoredDate >= theStartDate && theStoredDate <= theEndDate;
            }
            else {
                theStartDate = new Date(value);
                thisResult = theStoredDate >= theStartDate;
            }
            break;
        case "in":
            if (values) {
                // values.splice(values.indexOf('null'), 1, null)
                thisResult = values.includes(theFieldData);
            }
            else {
                if (Array.isArray(value)) {
                    thisResult = value.includes(theFieldData);
                }
                else if (typeof value === "string") {
                    thisResult = value.split(",").includes(theFieldData);
                }
                else {
                    thisResult = theFieldData === value;
                }
            }
            break;
        case "contains":
            if (Array.isArray(theFieldData)) {
                thisResult = theFieldData.includes(value);
            }
            else if (typeof theFieldData === "string") {
                const theFieldItems = theFieldData.split(",");
                const results = theFieldItems.map((element) => {
                    return element.trim().toLowerCase();
                });
                thisResult = results.includes(value.toLowerCase());
            }
            else {
                thisResult = theFieldData === value;
            }
            break;
        case "any":
            let theItemArray;
            if (Array.isArray(theFieldData)) {
                theItemArray = theFieldData;
            }
            if (typeof theFieldData === "string") {
                const theFieldItems = theFieldData.split(",");
                theItemArray = theFieldItems.map((element) => {
                    return element.trim().toLowerCase();
                });
            }
            if (Array.isArray(theItemArray)) {
                const isIn = (element) => value.toLowerCase().includes(element);
                thisResult = theItemArray.some(isIn);
                // printData(value,messageLevels.verbose,"value");
                // printData(theItemArray,messageLevels.verbose,"theItemArray");
                // printData(thisResult,messageLevels.verbose,"thisResult");
            }
            else {
                thisResult = theFieldData === value;
            }
            break;
    }
    return thisResult;
}
function setSingleValue(theItem, value, forKey) {
    const theObj = theItem;
    if (value === undefined) {
        (0, remotehq_1.printData)(theItem, types_1.messageLevels.debug);
        (0, remotehq_1.printData)(value, types_1.messageLevels.debug, "Value:");
        (0, remotehq_1.printData)(forKey, types_1.messageLevels.debug, "for Key:");
    }
    let thisKey = forKey;
    const parameters = [];
    let oldValue = theObj[thisKey];
    const isHiddenValue = thisKey.startsWith("_");
    let isChanged = false;
    if (thisKey) {
        if (thisKey.includes("(")) {
            const theParts = thisKey.split("(");
            (0, remotehq_1.printData)(theParts, types_1.messageLevels.debug, "parts in getSingleValue");
            for (let i = 1; i < theParts.length; i++) {
                let theParam = theParts[i].trim();
                if (theParam && (theParam === null || theParam === void 0 ? void 0 : theParam.endsWith(")"))) {
                    theParam = theParam.split(")")[0];
                }
                parameters.push(theParam);
            }
            if (parameters && parameters.length > 0) {
                theObj[thisKey](parameters, value);
            }
            else {
                theObj[thisKey](value);
            }
            isChanged = true;
        }
        else if (thisKey.includes("[")) {
            const theParts = thisKey.split("[");
            (0, remotehq_1.printData)(theParts, types_1.messageLevels.debug, "parts in setSingleValue [ ");
            if (theParts.length > 0) {
                thisKey = theParts[0];
                for (let i = 1; i < theParts.length; i++) {
                    let theParam = theParts[i].trim();
                    // if(theParam && theParam?.endsWith("]")) {
                    theParam = theParam.split("]")[0];
                    // }
                    parameters.push(theParam);
                    isChanged = true;
                }
            }
            if (parameters && parameters.length > 0) {
                // printData(theObj, messageLevels.verbose, "theObj in getSingleValue");
                (0, remotehq_1.printData)(thisKey, types_1.messageLevels.debug, "thisKey in setSingleValue");
                (0, remotehq_1.printData)(parameters, types_1.messageLevels.debug, "parameters in setSingleValue");
                if (theObj && !theObj[thisKey]) {
                    theObj[thisKey] = [];
                }
                (0, remotehq_1.printData)(theObj[thisKey], types_1.messageLevels.debug, "theObj[thisKey] in setSingleValue");
                const keyIndex = theObj[thisKey].indexOf(parameters[0]);
                if (value === true || value === "true" || value === 1) {
                    if (keyIndex < 0) {
                        theObj[thisKey].push(parameters[0]);
                    }
                }
                else if (value === false || value === "false" || value === 0) {
                    if (keyIndex > -1) {
                        theObj[thisKey].splice(keyIndex, 1);
                    }
                }
                // theObj[thisKey][parameters[0]] = value;
            }
            else {
                theObj[thisKey](value);
            }
            (0, remotehq_1.printData)(theObj[thisKey], types_1.messageLevels.debug, "theObj[thisKey] in setSingleValue");
        }
        else if (thisKey.includes("{")) {
            const theParts = thisKey.split("{");
            if (theParts.length > 0) {
                thisKey = theParts[0];
                if (theParts.length > 1) {
                    for (let i = 1; i < theParts.length; i++) {
                        let theParam = theParts[i].trim();
                        if (theParam && (theParam === null || theParam === void 0 ? void 0 : theParam.endsWith("}"))) {
                            theParam = theParam.split("}")[0];
                        }
                        parameters.push(theParam);
                    }
                }
            }
            if (parameters && parameters.length > 0) {
                (0, remotehq_1.printData)(parameters, types_1.messageLevels.debug, "parameters in setSingleValue");
                // printData(theObj, messageLevels.verbose, "theObj in getSingleValue");
                (0, remotehq_1.printData)(thisKey, types_1.messageLevels.debug, "thisKey in setSingleValue");
                (0, remotehq_1.printData)(parameters[0], types_1.messageLevels.debug, "parameters[0] in setSingleValue");
                if (theObj && !theObj[thisKey]) {
                    theObj[thisKey] = {};
                }
                (0, remotehq_1.printData)(theObj[thisKey], types_1.messageLevels.debug, "theObj[thisKey] in setSingleValue");
                if (parameters.length === 1) {
                    theObj[thisKey][parameters[0]] = value;
                }
                else {
                    let i = 0;
                    let element = theObj[thisKey];
                    while (i < parameters.length - 1) {
                        (0, remotehq_1.printData)(element, types_1.messageLevels.debug, "element in setSingleValue");
                        (0, remotehq_1.printData)(parameters[i], types_1.messageLevels.debug, "parameters[i] in setSingleValue");
                        if (!element[parameters[i]]) {
                            element[parameters[i]] = {};
                        }
                        element = element[parameters[i]];
                        (0, remotehq_1.printData)(element, types_1.messageLevels.debug, "element " + i + " in setSingleValue");
                        i++;
                    }
                    oldValue = element[parameters[i]];
                    element[parameters[i]] = value;
                }
                (0, remotehq_1.printData)(theObj[thisKey], types_1.messageLevels.debug, "theObj[thisKey] in setSingleValue");
            }
        }
        else {
            if (value !== oldValue) {
                theObj[thisKey] = value;
                isChanged = true;
            }
        }
        if (isChanged) {
            if (!isHiddenValue) {
                theObj._serial += 1;
                theObj._dirty = true;
                theItem._notified = false;
            }
            if (theItem._type && thisKey === theItem._type.primaryKeyProperty) {
                theItem._primaryKey = value;
                // ToDo: move item in Storage to new index
            }
            if (theItem._type &&
                theItem._type.primaryKeyProperty &&
                thisKey === theItem._type.primaryKeyProperty) {
                theItem._type.moveItem(oldValue, value);
            }
            if (!isHiddenValue && theItem._type) {
                theItem._type.changed();
            }
        }
    }
    return theItem;
}
function getSingleValue(theItem, forKey) {
    const theObj = theItem;
    let thisKey = forKey;
    const parameters = [];
    if (thisKey) {
        if (thisKey.includes("(")) {
            const theParts = thisKey.split("(");
            (0, remotehq_1.printData)(theParts, types_1.messageLevels.debug, "parts in getSingleValue");
            if (theParts.length > 0) {
                thisKey = theParts[0];
                if (theParts.length > 1) {
                    for (let i = 1; i < theParts.length; i++) {
                        let theParam = theParts[i].trim();
                        if (theParam && (theParam === null || theParam === void 0 ? void 0 : theParam.endsWith(")"))) {
                            theParam = theParam.split(")")[0];
                        }
                        parameters.push(theParam);
                    }
                }
            }
        }
        else if (thisKey.includes("[")) {
            const theParts = thisKey.split("[");
            (0, remotehq_1.printData)(theParts, types_1.messageLevels.debug, "parts in getSingleValue");
            if (theParts.length > 0) {
                thisKey = theParts[0];
                if (theParts.length > 1) {
                    for (let i = 1; i < theParts.length; i++) {
                        let theParam = theParts[i].trim();
                        if (theParam && (theParam === null || theParam === void 0 ? void 0 : theParam.endsWith("]"))) {
                            theParam = theParam.split("]")[0];
                        }
                        parameters.push(theParam);
                    }
                }
            }
            (0, remotehq_1.printData)(thisKey, types_1.messageLevels.debug, "thisKey in getSingleValue");
            if (!theItem[thisKey] || !parameters || !parameters[0]) {
                return false;
            }
            (0, remotehq_1.printData)(parameters, types_1.messageLevels.debug, "parameters in getSingleValue");
            // if(!parameters || !(theItem as any)[thisKey][parameters[0]] ) {
            //   return false;
            // }
            (0, remotehq_1.printData)(theItem[thisKey], types_1.messageLevels.debug, "(theItem as any)[thisKey] in getSingleValue");
            return theItem[thisKey].indexOf(parameters[0]) > -1;
        }
        else if (thisKey.includes("{")) {
            const theParts = thisKey.split("{");
            if (theParts.length > 0) {
                thisKey = theParts[0];
                if (theParts.length > 1) {
                    for (let i = 1; i < theParts.length; i++) {
                        let theParam = theParts[i].trim();
                        if (theParam && (theParam === null || theParam === void 0 ? void 0 : theParam.endsWith("}"))) {
                            theParam = theParam.split("}")[0];
                        }
                        parameters.push(theParam);
                    }
                }
            }
            if (parameters && parameters.length > 0) {
                (0, remotehq_1.printData)(parameters, types_1.messageLevels.debug, "parameters in setSingleValue");
                // printData(theObj, messageLevels.verbose, "theObj in getSingleValue");
                (0, remotehq_1.printData)(thisKey, types_1.messageLevels.debug, "thisKey in setSingleValue");
                (0, remotehq_1.printData)(parameters[0], types_1.messageLevels.debug, "parameters[0] in setSingleValue");
                if (theObj && !theObj[thisKey]) {
                    theObj[thisKey] = {};
                }
                (0, remotehq_1.printData)(theObj[thisKey], types_1.messageLevels.debug, "theObj[thisKey] in setSingleValue");
                if (parameters.length === 1) {
                    return theObj[thisKey][parameters[0]];
                }
                else {
                    let i = 0;
                    let element = theObj[thisKey];
                    while (i < parameters.length - 1) {
                        (0, remotehq_1.printData)(element, types_1.messageLevels.debug, "element in setSingleValue");
                        (0, remotehq_1.printData)(parameters[i], types_1.messageLevels.debug, "parameters[i] in setSingleValue");
                        if (!element[parameters[i]]) {
                            element[parameters[i]] = {};
                        }
                        element = element[parameters[i]];
                        (0, remotehq_1.printData)(element, types_1.messageLevels.debug, "element " + i + " in setSingleValue");
                        i++;
                    }
                    return element[parameters[i]];
                }
                return theItem[thisKey][parameters[0]];
            }
        }
        let theValue = theItem[thisKey];
        if (typeof theValue === "function") {
            // printData(thisKey, messageLevels.debug, "thisKey in getSingleValue")
            if (parameters && parameters.length > 0) {
                (0, remotehq_1.printData)(parameters, types_1.messageLevels.debug, "parameters in getSingleValue");
                theValue = theItem[thisKey](parameters);
            }
            else {
                // printData(thisKey, messageLevels.debug, "no parameters in getSingleValue")
                theValue = theItem[thisKey]();
            }
            // printData(theValue, messageLevels.debug, "theValue in getSingleValue - function");
            return theValue;
            // return (this as any)[forKey]();
        }
        return theItem[forKey];
    }
    else {
        return theItem._value;
    }
}
