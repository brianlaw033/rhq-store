import * as moment from "moment";

import { IManagedItem, IParsedQuery, ISortParams, messageLevels } from "./types";
import { CreateUUID, storeType } from "./storeType";
import { printData, printMessage } from "./remotehq";
import { call, getGlobalState, getItem, instanceNewItem, isStoredItem, requestLoad } from ".";
import { throttle } from "./helpers";
import { Validation } from "./Forms";

export class storedItem implements IManagedItem {
	_type: storeType | null = null;
	_primaryKey = "";
	_dirty = false;
	_requested = false;
	_hasData = false;
	_notified = true;
	_modifiedDate?: Date;
	_value?: any;
	_deleted = false;
	_created = false;
	_isEditCopy = false;
	_sourceItem: storedItem | null = null;
	_keepCallback: Function | null = null;
	_sendAttempts = 0;
	_serial = 0;
	validation?: Validation;

	constructor(type: storeType, data?: any, doNotStore?: boolean) {
		this._type = type;

		if (data) {
			this.mergeData(data);
			if (!doNotStore) {
				this.store();
			}
		}
	}

	toggleEditing(): void {
		this.setEditing(!this.isEditing());
	}

	isEditing(): boolean {
		return this.getValue("_isEditing") || false;
	}

	setEditing(value: boolean) {
		this.setValue(value, "_isEditing");
		call("setEditControl", value ? this.getValue("_isEditing") : null);
	}
	zoomOnSelect() {
		return true;
	}
	mounted() {
		// do setup here
	}
	defaultValues(): { [id: string]: any } {
		return { created_date: moment() };
	}
	displayName(): string {
		return this.friendlyDisplayName + " " + this.primaryKey();
	}
	get friendlyDisplayName() {
		return this.getType()?.displayName || this.getTypeName();
	}
	levelName(): string {
		const parent = this.getParent();
		if (parent) {
			return parent.levelName();
		}
		return this.getTypeName();
	}
	parentOrItemOfType = (type: string): storedItem | null => {
		if (this.getType()?.name === "type") {
			return this;
		}
		const parent = this.getParent();
		if (parent) {
			return parent.parentOrItemOfType(type);
		}
		return null;
	};
	getType = (): storeType | null => {
		return this._type;
	};
	getTypeName = (): string => {
		if (this._type) {
			return this._type.name;
		}
		return "";
	};
	get storeUUID() {
		return this._primaryKey;
	}
	assignUUID() {
		if (this._primaryKey === "") {
			this._primaryKey = CreateUUID();
			if (this._type?.primaryKeyProperty === "uuid") {
				// TODO: confirm doesnt break anything
				const theUUID = this.getValue("uuid");
				if (!theUUID || theUUID === null || theUUID === undefined) {
					(this as unknown as any).uuid = this._primaryKey;
				}
			}
		}
		return this;
	}
	getUUID() {
		return this._primaryKey;
	}
	checkReadAuthority(regions?: string): boolean {
		const theRegions = regions;
		if (!regions) {
			regions = this.getRegionISO();
		}
		// ToDo - get object type and get authority to read it in current region
		return this._type?.checkReadAuthority(theRegions) || true;
	}
	checkCreateAuthority(regions?: string): boolean {
		const theRegions = regions;
		if (!regions) {
			regions = this.getRegionISO();
		}
		// ToDo - get object type and get authority to read it in current region
		return this._type?.checkCreateAuthority(theRegions) || true;
	}
	checkUpdateAuthority(regions?: string, defaultValue?: boolean): boolean {
		let theRegions = regions;
		if (!regions) {
			theRegions = this.getRegionISO();
		}
		if (!this._type || this._type === undefined) {
			return defaultValue || false;
		}
		// ToDo - get object type and get authority to read it in current region
		const allowed = this._type?.checkUpdateAuthority(theRegions, defaultValue);
		printData(allowed, messageLevels.debug, "allowed in storedItem");
		return allowed;
	}
	checkDeleteAuthority(regions?: string): boolean {
		const theRegions = regions;
		if (!regions) {
			regions = this.getRegionISO();
		}
		// ToDo - get object type and get authority to read it in current region
		return this._type?.checkDeleteAuthority(theRegions) || true;
	}
	getBoundingBox(): [] | null {
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
	// public getBoundingBox = (): [] | null => {
	//     const parent = this.getParent();
	//     if (parent) {
	//         return parent.getBoundingBox();
	//     }
	//     return null;
	// };
	setPrimaryKey = (value: any) => {
		if (this._type && this._type?.primaryKeyProperty) {
			(this as any)[this._type.primaryKeyProperty] = value;
		}
		return this;
	};
	primaryKeyStrict = (): any => {
		if (this._type && this._type?.primaryKeyProperty) {
			return (this as any)[this._type.primaryKeyProperty];
		}
		return null;
	};
	primaryKey = (): any => {
		if (this._type && this._type?.primaryKeyProperty) {
			return (this as any)[this._type.primaryKeyProperty];
		} else if (this._primaryKey) {
			return this._primaryKey;
		}
		return null;
	};
	primaryKeySafe = () => {
		if (this.primaryKey() && this.primaryKey() !== undefined) {
			return this.primaryKey();
		}
		if (this._primaryKey && this._primaryKey !== undefined) {
			return this._primaryKey;
		}
		if ((this as any).id && (this as any).id !== undefined) {
			return (this as any).id;
		}
		if ((this as any).name && (this as any).name !== undefined) {
			return (this as any).name;
		}
		return (this._type?.name || "zz") + Math.random();
	};
	getRegionItem = async () => {
		const theISO = this.getRegionISO();
		if (theISO && theISO.length > 0) {
			const theRegion = await getItem("boundaries", theISO);
			return theRegion;
		} else {
			return null;
		}
	};

	getParent(): storedItem | null {
		return null;
	}

	itemIsParent = (theItem: storedItem): boolean => {
		if (theItem === this) {
			return true;
		}
		return false;
	};

	getRelatedItems = (
		sourceType: string | string[],
		relateOn: any,
		relateTo: string,
		comparison?: string,
		all?: boolean,
		sort?: ISortParams,
	): storedItem[] => {
		let sourceList: string[] = [];
		let data: storedItem[] = [];
		if (typeof sourceType === "string") {
			sourceList = [sourceType];
		} else {
			sourceList = sourceType;
		}
		sourceList.forEach((source) => {
			const dataSource = requestLoad(source);
			// if(source === "forest-monitoring-reports") return [];
			if (dataSource) {
				let theResult: storedItem[] = [];
				const theQuery = [[relateTo, comparison || "==", relateOn].join(" ")];
				const searchParams = { queries: theQuery, sort: sort };
				if (all) {
					theResult = dataSource?.allMatchingItems(searchParams);
				} else {
					theResult = dataSource?.matchingItems(searchParams);
				}
				if (theResult) {
					data = [...data, ...theResult];
				}
			}
		});
		return data || [];
	};

	getRelatedItem = (
		sourceType: string | string[],
		relateOn: any,
		relateTo: string,
		comparison?: string,
		all?: boolean,
	): storedItem | null => {
		let sourceList: string[] = [];
		if (Array.isArray(sourceType)) {
			sourceList = sourceType;
		} else {
			sourceList = [sourceType];
		}
		let theResult: storedItem[] | null = [];
		let endResult: storedItem | null = null;
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

	getRelatedItemStored = (
		sourceType: string,
		relateOn: any,
		relateTo: string,
		name: string,
		comparison?: string,
		all?: boolean,
	): storedItem | null => {
		let theItem: storedItem | null = (this as any).getValue("_" + name + "Item");
		if (!theItem) {
			theItem = this.getRelatedItem(sourceType, relateOn, relateTo, comparison, all);
		}
		return theItem;
	};

	getRelatedItemStoredCreate(
		sourceType: string,
		name: string,
		localIDField?: string,
		remoteIDField?: string,
	) {
		let theItem = this.getValue(name);

		if (!theItem) {
			theItem = instanceNewItem(sourceType);

			if (theItem) {
				(this as any).setValue(theItem, "_" + name + "Item");
				if (localIDField) {
					this.setValue(theItem.getValue(remoteIDField || "_primaryKey"), localIDField);
				}
			}
		}
		return theItem;
	}

	getRegionISO = () => {
		if (this._type && this._type?.objectRegionProperty) {
			return (this as any)[this._type.objectRegionProperty];
		}
		return null;
	};

	// set multiple values from key: value Dictionary
	setValues = (values: { [key: string]: any }) => {
		Object.keys(values).forEach((key) => {
			this.setValue(values[key], key);
		});
		return this;
	};

	setValue = (value: any, forKey: string): any => {
		if (!forKey) {
			return this.setSingleValue(value, forKey);
		}
		const keyArray = forKey.split(".");
		const thisKey = keyArray.pop() || "";

		if (keyArray.length === 0) {
			this.setSingleValue(value, thisKey);
		} else {
			let theValue = this.getValue(keyArray.join("."));

			if (isStoredItem(theValue)) {
				theValue = theValue.setValue(value, thisKey);
			}
		}
		return this;
	};

	getValues = (keys: string[]): { [key: string]: any } => {
		const theResults: { [key: string]: any } = {};
		keys.forEach((keyName) => {
			theResults[keyName] = this.getValue(keyName);
		});
		return theResults;
	};

	getValue = (forKey?: any, defaultValue?: any): any => {
		if (forKey) {
			const keyArray = forKey.split(".");
			const thisKey = keyArray.shift();

			const theValue = this.getSingleValue(thisKey);

			if (keyArray.length < 1) {
				return theValue;
			}

			if (isStoredItem(theValue)) {
				return theValue.getValue(keyArray.join("."));
			} else if (theValue && theValue.then === "function") {
				return theValue.getValue(keyArray.join("."));
			} else {
				if (keyArray > 0) {
					return theValue[keyArray[0]];
				}
				return theValue;
			}
		} else {
			const theValue: any | null | undefined = this.getSingleValue(forKey);
			if (theValue || defaultValue === undefined) {
				return theValue;
			}
			return defaultValue;
		}
	};

	setSingleValue = (value: any, forKey: string): any => {
		return setSingleValue(this, value, forKey);
	};

	getSingleValue = (forKey?: any): any => {
		return getSingleValue(this, forKey);
	};

	isInSelected = () => {
		const selected = getGlobalState("selected")?.getValue();
		const isSelected = !selected || selected.length < 1;

		if (!isSelected) {
			for (let i = 0; i < selected.length; i++) {
				if (this.itemIsParent(selected[i])) {
					return this;
				}
			}
		} else {
			return this;
		}

		return null;
	};

	isInLevel = () => {
		const regions = getGlobalState("regions")?.getValue();
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
		let regionArray: string[] = [];
		if (typeof theRegion === "string") {
			regionArray.push(theRegion);
		} else {
			regionArray = theRegion;
			printData(theRegion, messageLevels.debug, "theRegion");
		}
		const output = regions.filter((obj: string) => regionArray.indexOf(obj) !== -1);

		if (output.length > 0) {
			return this;
		}
		return null;
	};

	matchStringInParameters = (parameters: string[], findString: string): storedItem | null => {
		return matchStringInParameters(this, parameters, findString);
	};

	singleQuery = (queryParsed: IParsedQuery): boolean => {
		return singleQuery(this, queryParsed);
	};

	matchItem = (parsedQueries: IParsedQuery[], orMode?: boolean): storedItem | null => {
		if (this._deleted) {
			return null;
		}
		let isPassed = true;

		parsedQueries.forEach((value) => {
			const thisResult = this.singleQuery(value);

			if (orMode || false) {
				isPassed = isPassed || thisResult;
			} else {
				isPassed = isPassed && thisResult;
			}
		});
		if (isPassed) {
			return this;
		}
		return null;
	};

	matchItemFields = (
		parsedQueries: IParsedQuery[],
		fields: string[],
		orMode?: boolean,
	): any | null => {
		if (this.matchItem(parsedQueries, orMode)) {
			const theReturnObject = {};
			fields.forEach((value) => {
				(theReturnObject as any)[value] = this.getValue(value);
			});
			return theReturnObject;
		}
		return null;
	};

	isDirty = (): boolean => {
		return this._dirty === true;
	};
	get changeCount(): number {
		return this._serial;
	}

	mergeData(value: any) {
		const oldKey = this.primaryKey();
		this._hasData = true;
		// this._modifiedDate =  new Date(),
		// this._fetchedDate = new Date(),
		this._requested = false;

		if (
			typeof value === "number" ||
			typeof value === "string" ||
			typeof value === "boolean" ||
			typeof value === "function"
		) {
			this._value = value;
		} else if (Array.isArray(value)) {
			this._value = value;
		} else if (value === null) {
			if (this._value) {
				this._value = null;
			}
		} else {
			if (value && value !== undefined) {
				Object.assign(this, JSON.parse(JSON.stringify(value)));
			}

			if (typeof value === "object" && (value as any)["deleted"]) {
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
				printData(
					value,
					messageLevels.error,
					"Set " + this.getTypeName() + " : " + this.primaryKey(),
				);
			}
		}
		return this;
	}
	assignDefaultData = (value: any) => {
		if (
			typeof value === "number" ||
			typeof value === "string" ||
			typeof value === "boolean" ||
			typeof value === "function"
		) {
			this._value = value;
		} else if (Array.isArray(value)) {
			this._value = value;
		} else {
			Object.assign(this, value);
			if (typeof value === "object" && (value as any)["deleted"]) {
				this._deleted = value["deleted"];
			}
		}

		this._notified = false;
		return this;
	};

	store(key?: string): storedItem {
		if (this._type) {
			if (this.primaryKey() && this.primaryKey() !== "") {
				this._type.managedItemStorage[this.primaryKey()] = this;
				this.doChangeCallbacks(this.primaryKey());
			} else if (key !== undefined) {
				this._type.managedItemStorage[key] = this;
				this.doChangeCallbacks(key);
			} else {
				// if((!this._primaryKey || this._primaryKey === '') && !this._type.isSingleEntry() ) {
				//     this._primaryKey = CreateUUID();
				// }
				this._type.managedItemStorage[this._primaryKey] = this;
			}
			this._type.managedItemStoragebyUUID[this.getValue("uuid")] = this;
		}
		return this;
	}

	linkedUpdate = () => {
		if (this._type) {
			if (this.primaryKey() && this.primaryKey() !== "") {
				this.doChangeCallbacks();
			}
		}
		return this;
	};

	delete = () => {
		this._dirty = true;
		this._serial += 1;
		this._deleted = true;
		// eslint-disable-next-line
		this._type?.changed();
		return this;
	};
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
	doChangeCallbacks(key?: string) {
		const primaryKey = this.primaryKey();
		// eslint-disable-next-line
		this._type?.doChangeCallbacks(key || primaryKey, this);
		this._notified = true;
		return this;
	}

	select() {
		call("setLevelByItem", this);
		return this;
	}

	mapClick = (e: any, clickAction?: string): void => {
		// call("mapIsLoading");
		printMessage(
			"mapClick in: " + this.getTypeName() + " - " + this.primaryKey(),
			messageLevels.debug,
		);
		call("setLevelByItem", this);
	};
	mapMouseEnter = throttle((e: any, hoverAction?: string): void => {
		printMessage(
			"mapClick in: " + this.getTypeName() + " - " + this.primaryKey(),
			messageLevels.debug,
		);
		call("setRolloverByItem", this);
	}, 300);
	mapMouseLeave = (e: any, hoverAction?: string): void => {
		printMessage(
			"mapClick in: " + this.getTypeName() + " - " + this.primaryKey(),
			messageLevels.debug,
		);
		call("setRolloverByItem", null);
	};
	public static omitItems(): string[] {
		return omitList();
	}
	toJSON() {
		return omit(this, storedItem.omitItems());
	}

	isSelected() {
		const selectedItems = getGlobalState("selected")?.getValue();
		if (!selectedItems) {
			return false;
		}
		if (selectedItems.includes(this)) {
			return true;
		}
		return false;
	}
	isHovered() {
		const hoveredItems = getGlobalState("hovers")?.getValue();
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
	editCopy(): storedItem | null {
		if (this._type) {
			return this._type?.editCopy(this);
		}
		return null;
	}

	get isEditCopy(): boolean {
		return this._isEditCopy;
	}

	/**
	 * return a copy of the item for use as an identical item but as new
	 *
	 * @returns storedItem - the copy
	 */
	itemCopy(): storedItem | null {
		if (this._type) {
			return this._type?.itemCopy(this);
		}
		return null;
	}
	/**
	 * write the item back to the original stored item
	 *
	 * @param theItem
	 * returns the original item in the store that's now updated or null if not put back via callback
	 */
	keepChanges(callback?: Function): storedItem | null {
		if (this._isEditCopy) {
			const theOriginal = this._sourceItem;
			if (theOriginal && theOriginal !== undefined) {
				const isDirty = this._dirty;
				const wasEditCopy = theOriginal?._isEditCopy;
				const wasSourceItem = theOriginal?._sourceItem;
				if (isDirty) {
					Object.assign(theOriginal, JSON.parse(JSON.stringify(this)));
					if ((this as any)._multiFileUploader) {
						(theOriginal as any)._multiFileUploader = (this as any)._multiFileUploader;
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
		} else {
			this.storeChanges(callback);
			return this;
		}
	}

	// validate items by overriding in sub classes
	// call to enable save buttons

	validForSave = (): boolean | Promise<any> => {
		return true;
	};

	validateBeforeSave = (): boolean | Promise<any> => {
		return true;
	};

	// call to get error for form component
	validationErrorForKey = (key: string): any => {
		return null;
	};

	validationForKey = (key: string): boolean => {
		const theError = this.validationErrorForKey(key);

		return theError === null || theError === false;
	};

	validationForKeys = (keys: string[]): boolean => {
		let isValid = true;

		keys.forEach((key) => {
			isValid = this.validationForKey(key) && isValid;
		});
		return isValid;
	};

	/**
	 * write the item back to the original stored item
	 *
	 * @param theItem
	 * returns the original item in the store that's now updated or null if not put back via callback
	 */
	storeChanges(callback?: Function): storedItem {
		printMessage("storeChanges", messageLevels.debug);

		const isDone = this.willStoreEdit();
		if (callback) {
			printData(callback, messageLevels.debug, "SetCallback in storeChanges");
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

	willStoreEdit(): boolean {
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

	getDateFormatted(forKey: any, format: string, defaultValue: string) {
		const theDateValue = this.getValue(forKey);
		if (!theDateValue || theDateValue === undefined) {
			return defaultValue;
		}
		const theFormattedValue = moment(theDateValue).format(format || "DD MMMM yyyy");
		return theFormattedValue;
	}
	get pinColour(): string {
		return "#eedddd";
	}

	get activePinColour(): string {
		return "#285eed";
	}
}

function omitList(): string[] {
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

const omit = (originalObject: any, keysToOmit: string[]) => {
	const clonedObject = { ...originalObject };

	for (const path of keysToOmit) {
		delete clonedObject[path];
	}

	return clonedObject;
};

export function parseQueries(queries: string[]): IParsedQuery[] {
	const theParsedQueries: IParsedQuery[] = [];
	if (queries) {
		queries.forEach((value: string) => {
			const queryParsed = parseQuery(value);
			theParsedQueries.push(queryParsed);
		});
	}

	return theParsedQueries;
}

export function parseQuery(query: string): IParsedQuery {
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
	} else {
		if (theValue !== "NULL") {
			theValue = stripQuotes(theValue);
		}

		return { column: theColumn, operator: theOperator, value: theValue };
	}
}

export function stripQuotes(fromStr: string): string {
	let theResult = fromStr;
	if (fromStr.startsWith('"') || fromStr.startsWith("'")) {
		theResult = fromStr.substr(1, fromStr.length - 2);
	}
	return theResult.trim();
}
function matchStringInParameters(
	theItem: storedItem,
	parameters: string[],
	findString: string,
): storedItem | null {
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

function singleQuery(theItem: storedItem, queryParsed: IParsedQuery): boolean {
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
			} else {
				thisResult = theFieldData !== value;
			}

			break;
		case "is":
			if (value === "NULL") {
				thisResult = theFieldData === null;
			} else {
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
			} else {
				theStartDate = new Date(value);
				thisResult = theStoredDate >= theStartDate;
			}
			break;
		case "in":
			if (values) {
				// values.splice(values.indexOf('null'), 1, null)
				thisResult = values.includes(theFieldData);
			} else {
				if (Array.isArray(value)) {
					thisResult = value.includes(theFieldData);
				} else if (typeof value === "string") {
					thisResult = value.split(",").includes(theFieldData);
				} else {
					thisResult = theFieldData === value;
				}
			}
			break;
		case "contains":
			if (Array.isArray(theFieldData)) {
				thisResult = theFieldData.includes(value);
			} else if (typeof theFieldData === "string") {
				const theFieldItems = theFieldData.split(",");
				const results = theFieldItems.map((element) => {
					return element.trim().toLowerCase();
				});

				thisResult = results.includes(value.toLowerCase());
			} else {
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
				const isIn = (element: string | number) => value.toLowerCase().includes(element);

				thisResult = theItemArray.some(isIn);
				// printData(value,messageLevels.verbose,"value");
				// printData(theItemArray,messageLevels.verbose,"theItemArray");
				// printData(thisResult,messageLevels.verbose,"thisResult");
			} else {
				thisResult = theFieldData === value;
			}
			break;
	}
	return thisResult;
}

function setSingleValue(theItem: storedItem, value: any, forKey: string): any {
	const theObj: any = theItem;
	if (value === undefined) {
		printData(theItem, messageLevels.debug);
		printData(value, messageLevels.debug, "Value:");
		printData(forKey, messageLevels.debug, "for Key:");
	}

	let thisKey = forKey;
	const parameters: string[] = [];
	let oldValue = theObj[thisKey];
	const isHiddenValue = thisKey.startsWith("_");
	let isChanged = false;
	if (thisKey) {
		if (thisKey.includes("(")) {
			const theParts = thisKey.split("(");
			printData(theParts, messageLevels.debug, "parts in getSingleValue");
			for (let i = 1; i < theParts.length; i++) {
				let theParam = (theParts[i] as string).trim();
				if (theParam && theParam?.endsWith(")")) {
					theParam = theParam.split(")")[0];
				}
				parameters.push(theParam);
			}
			if (parameters && parameters.length > 0) {
				theObj[thisKey](parameters, value);
			} else {
				theObj[thisKey](value);
			}
			isChanged = true;
		} else if (thisKey.includes("[")) {
			const theParts = thisKey.split("[");
			printData(theParts, messageLevels.debug, "parts in setSingleValue [ ");
			if (theParts.length > 0) {
				thisKey = theParts[0];
				for (let i = 1; i < theParts.length; i++) {
					let theParam = (theParts[i] as string).trim();
					// if(theParam && theParam?.endsWith("]")) {
					theParam = theParam.split("]")[0];

					// }
					parameters.push(theParam);
					isChanged = true;
				}
			}
			if (parameters && parameters.length > 0) {
				// printData(theObj, messageLevels.verbose, "theObj in getSingleValue");
				printData(thisKey, messageLevels.debug, "thisKey in setSingleValue");
				printData(parameters, messageLevels.debug, "parameters in setSingleValue");

				if (theObj && !theObj[thisKey]) {
					theObj[thisKey] = [];
				}
				printData(
					theObj[thisKey],
					messageLevels.debug,
					"theObj[thisKey] in setSingleValue",
				);
				const keyIndex = theObj[thisKey].indexOf(parameters[0]);
				if (value === true || value === "true" || value === 1) {
					if (keyIndex < 0) {
						theObj[thisKey].push(parameters[0]);
					}
				} else if (value === false || value === "false" || value === 0) {
					if (keyIndex > -1) {
						theObj[thisKey].splice(keyIndex, 1);
					}
				}
				// theObj[thisKey][parameters[0]] = value;
			} else {
				theObj[thisKey](value);
			}
			printData(theObj[thisKey], messageLevels.debug, "theObj[thisKey] in setSingleValue");
		} else if (thisKey.includes("{")) {
			const theParts = thisKey.split("{");

			if (theParts.length > 0) {
				thisKey = theParts[0];
				if (theParts.length > 1) {
					for (let i = 1; i < theParts.length; i++) {
						let theParam = (theParts[i] as string).trim();
						if (theParam && theParam?.endsWith("}")) {
							theParam = theParam.split("}")[0];
						}
						parameters.push(theParam);
					}
				}
			}
			if (parameters && parameters.length > 0) {
				printData(parameters, messageLevels.debug, "parameters in setSingleValue");
				// printData(theObj, messageLevels.verbose, "theObj in getSingleValue");
				printData(thisKey, messageLevels.debug, "thisKey in setSingleValue");
				printData(parameters[0], messageLevels.debug, "parameters[0] in setSingleValue");

				if (theObj && !theObj[thisKey]) {
					theObj[thisKey] = {};
				}
				printData(
					theObj[thisKey],
					messageLevels.debug,
					"theObj[thisKey] in setSingleValue",
				);
				if (parameters.length === 1) {
					theObj[thisKey][parameters[0]] = value;
				} else {
					let i = 0;
					let element = theObj[thisKey];

					while (i < parameters.length - 1) {
						printData(element, messageLevels.debug, "element in setSingleValue");
						printData(
							parameters[i],
							messageLevels.debug,
							"parameters[i] in setSingleValue",
						);
						if (!element[parameters[i]]) {
							element[parameters[i]] = {};
						}
						element = element[parameters[i]];
						printData(
							element,
							messageLevels.debug,
							"element " + i + " in setSingleValue",
						);
						i++;
					}
					oldValue = element[parameters[i]];
					element[parameters[i]] = value;
				}
				printData(
					theObj[thisKey],
					messageLevels.debug,
					"theObj[thisKey] in setSingleValue",
				);
			}
		} else {
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
			if (
				theItem._type &&
				theItem._type.primaryKeyProperty &&
				thisKey === theItem._type.primaryKeyProperty
			) {
				theItem._type.moveItem(oldValue, value);
			}
			if (!isHiddenValue && theItem._type) {
				theItem._type.changed();
			}
		}
	}

	return theItem;
}

function getSingleValue(theItem: storedItem, forKey?: any): any {
	const theObj: any = theItem;
	let thisKey = forKey;
	const parameters: string[] = [];
	if (thisKey) {
		if (thisKey.includes("(")) {
			const theParts = thisKey.split("(");
			printData(theParts, messageLevels.debug, "parts in getSingleValue");
			if (theParts.length > 0) {
				thisKey = theParts[0];
				if (theParts.length > 1) {
					for (let i = 1; i < theParts.length; i++) {
						let theParam = (theParts[i] as string).trim();
						if (theParam && theParam?.endsWith(")")) {
							theParam = theParam.split(")")[0];
						}
						parameters.push(theParam);
					}
				}
			}
		} else if (thisKey.includes("[")) {
			const theParts = thisKey.split("[");
			printData(theParts, messageLevels.debug, "parts in getSingleValue");
			if (theParts.length > 0) {
				thisKey = theParts[0];
				if (theParts.length > 1) {
					for (let i = 1; i < theParts.length; i++) {
						let theParam = (theParts[i] as string).trim();
						if (theParam && theParam?.endsWith("]")) {
							theParam = theParam.split("]")[0];
						}
						parameters.push(theParam);
					}
				}
			}

			printData(thisKey, messageLevels.debug, "thisKey in getSingleValue");
			if (!(theItem as any)[thisKey] || !parameters || !parameters[0]) {
				return false;
			}
			printData(parameters, messageLevels.debug, "parameters in getSingleValue");
			// if(!parameters || !(theItem as any)[thisKey][parameters[0]] ) {
			//   return false;
			// }
			printData(
				(theItem as any)[thisKey],
				messageLevels.debug,
				"(theItem as any)[thisKey] in getSingleValue",
			);
			return (theItem as any)[thisKey].indexOf(parameters[0]) > -1;
		} else if (thisKey.includes("{")) {
			const theParts = thisKey.split("{");

			if (theParts.length > 0) {
				thisKey = theParts[0];
				if (theParts.length > 1) {
					for (let i = 1; i < theParts.length; i++) {
						let theParam = (theParts[i] as string).trim();
						if (theParam && theParam?.endsWith("}")) {
							theParam = theParam.split("}")[0];
						}
						parameters.push(theParam);
					}
				}
			}
			if (parameters && parameters.length > 0) {
				printData(parameters, messageLevels.debug, "parameters in setSingleValue");
				// printData(theObj, messageLevels.verbose, "theObj in getSingleValue");
				printData(thisKey, messageLevels.debug, "thisKey in setSingleValue");
				printData(parameters[0], messageLevels.debug, "parameters[0] in setSingleValue");

				if (theObj && !theObj[thisKey]) {
					theObj[thisKey] = {};
				}
				printData(
					theObj[thisKey],
					messageLevels.debug,
					"theObj[thisKey] in setSingleValue",
				);
				if (parameters.length === 1) {
					return theObj[thisKey][parameters[0]];
				} else {
					let i = 0;
					let element = theObj[thisKey];

					while (i < parameters.length - 1) {
						printData(element, messageLevels.debug, "element in setSingleValue");
						printData(
							parameters[i],
							messageLevels.debug,
							"parameters[i] in setSingleValue",
						);
						if (!element[parameters[i]]) {
							element[parameters[i]] = {};
						}
						element = element[parameters[i]];
						printData(
							element,
							messageLevels.debug,
							"element " + i + " in setSingleValue",
						);
						i++;
					}
					return element[parameters[i]];
				}
				return (theItem as any)[thisKey][parameters[0]];
			}
		}
		let theValue = (theItem as any)[thisKey];

		if (typeof theValue === "function") {
			// printData(thisKey, messageLevels.debug, "thisKey in getSingleValue")

			if (parameters && parameters.length > 0) {
				printData(parameters, messageLevels.debug, "parameters in getSingleValue");
				theValue = (theItem as any)[thisKey](parameters);
			} else {
				// printData(thisKey, messageLevels.debug, "no parameters in getSingleValue")
				theValue = (theItem as any)[thisKey]();
			}

			// printData(theValue, messageLevels.debug, "theValue in getSingleValue - function");
			return theValue;
			// return (this as any)[forKey]();
		}
		return (theItem as any)[forKey];
	} else {
		return theItem._value;
	}
}
