import * as memoize from "memoizee";

import {
	ChangeCallbackFunction,
	IManagedItemDict,
	IQueryParams,
	IRelationship,
	ISchemaItem,
	ISortParams,
	actions,
	messageLevels,
	objects,
} from "./types";
import { parseQueries, storedItem } from "./storedItem";
import {
	checkAuthority,
	checkLoadedAuthority,
	getUser,
	printData,
	printMessage,
} from "./remotehq";
import {
	dateAddTimezone,
	fetchDataAuthorised,
	isStoredItem,
	itemIsSent,
	itemSendFailed,
	itemSendSucceeed,
	itemWillSend,
	sendDataAuthorised,
	typeIsRetrieved,
	typeRetrieveFailed,
	typeWillRetrieve,
} from "./index";
import { classInit } from "./classes";
import { context } from "./context";
import { sortItemArray } from "./helpers/ListOperations";

interface IUpdateItem {
	primaryKey: string;
	uuid?: string;
	item?: storedItem;
}

export class storeType implements ISchemaItem {
	name = "new";
	objectType?: objects;
	singleEntry = false;
	userBased = false;
	primaryKeyProperty?: string;
	objectRegionProperty?: string;
	relationships?: Array<IRelationship>;
	session?: boolean;
	local?: boolean;
	localMaxAge?: number;
	restEndpoint?: URL;
	clientUnwrap?: any;
	create = false;
	retrieve = false;
	update = false;
	delete = false;
	keyParameter?: string;
	requested = false;
	// onChangeCall: Array<Function> = [];
	onChangeCallHandler: CallbackHandler = new CallbackHandler(this.name);
	onRetrieveCallHandler: CallbackHandler = new CallbackHandler(this.name + "/retrieve");
	onSaveCallHandler: CallbackHandler = new CallbackHandler(this.name + "/save");
	onDeleteCallHandler: CallbackHandler = new CallbackHandler(this.name + "/delete");
	loadRequest = false;
	loaded?: boolean;
	hasChanges = false;
	displayName?: string;
	_sendCreatesLock = false;
	_sendRetrievesLock = false;
	latestData = 0;

	managedItemStorage: IManagedItemDict = {};
	managedItemStoragebyUUID: IManagedItemDict = {};

	constructor(name: string) {
		this.name = name;
		this.onChangeCallHandler.name = name;
		this.onRetrieveCallHandler.name = name + "/retrieve";
		this.onSaveCallHandler.name = name + "/save";
		this.onDeleteCallHandler.name = name + "/delete";
	}

	primaryKey = (): any => {
		return this.name;
	};

	changed = () => {
		// this.doChangeCallbacks("",null);
		this.hasChanges = true;
	};

	setupRemoteStorage(
		remoteURL?: URL,
		createRemote?: boolean,
		retrieveRemote?: boolean,
		updateRemote?: boolean,
		deleteRemote?: boolean,
	) {
		this.restEndpoint = remoteURL;
		this.create = createRemote || false;
		this.retrieve = retrieveRemote || false;
		this.update = updateRemote || false;
		this.delete = deleteRemote || false;
	}
	setupLocalStorage(maximumAge?: number) {
		this.local = true;
		this.localMaxAge = maximumAge;
	}
	registerOnChange(call: Function) {
		this.onChangeCallHandler.registerOnEvent(call);
		return this;
		// this.onChangeCall.push(call);
	}
	registerOnRetrieve(call: Function) {
		this.onRetrieveCallHandler.registerOnEvent(call);
		return this;
	}
	registerOnSave(call: Function) {
		this.onSaveCallHandler.registerOnEvent(call);
		return this;
	}
	registerOnDelete(call: Function) {
		this.onDeleteCallHandler.registerOnEvent(call);
		return this;
	}
	removeOnChange(call: Function) {
		this.onChangeCallHandler.removeOnEvent(call);
	}
	removeOnRetrieve(call: Function) {
		this.onRetrieveCallHandler.removeOnEvent(call);
	}
	removeOnSave(call: Function) {
		this.onSaveCallHandler.removeOnEvent(call);
	}
	removeOnDelete(call: Function) {
		this.onDeleteCallHandler.removeOnEvent(call);
	}
	storeItemByKey(key: string, data: any) {
		if (this.primaryKeyProperty) {
			key = data[this.primaryKeyProperty] || key;
		}
		const theData = this.itemByKey(key, true, data);

		this.storeLocal(data, key);

		if (theData) {
			this.insertItemByKey(key, theData);
		}

		const theDate = theData?.getValue("modified_timestamp");

		this.updateLatestModified(theDate);
		setTimeout(() => {
			this.onChangeCallHandler.doEventCallbacks(key, theData);
		});
	}
	updateLatestModified(theNewDate: string | Date | undefined) {
		if (theNewDate && theNewDate !== undefined) {
			if (typeof theNewDate === "string") {
				const theDateNum = Date.parse(theNewDate);
				if (theDateNum > this.latestData) {
					this.latestData = theDateNum;
				}
			} else {
				const theDateNum = theNewDate.valueOf();
				if (theDateNum > this.latestData) {
					this.latestData = theDateNum;
				}
			}
		}
	}

	storeData(items: { [key: string]: any } | string, data?: any) {
		// printData(items,messageLevels.verbose,"items in storeData");
		if (items === null) {
			printMessage("attempting to set null key for " + this.name, messageLevels.error);
		}
		if (typeof items === "string") {
			this.storeItemByKey(items, data);
		} else {
			printData(items, messageLevels.debug, "items in storeData");
			Object.keys(items).forEach((key, i) => {
				const data = items[key];
				this.storeItemByKey(key, data);
			});
		}
	}

	storeLocal(data: any, localID: string) {
		if (this.local) {
			const lID = this.localStorageID(localID);

			let storableString;
			if (typeof data === "object") {
				storableString = JSON.stringify(data);
			} else if (typeof data === "string") {
				storableString = data;
			} else if (data && data.toString) {
				storableString = data?.toString() || "";
			}
			if (storableString) {
				localStorage.setItem(lID, storableString);
				localStorage.setItem(lID + ":modified", new Date().toString());
				if (this.localMaxAge) {
					const expiresDate = new Date(
						new Date().valueOf() + this.localMaxAge?.valueOf(),
					);
					printData(expiresDate, messageLevels.debug, "Expires Date");
					localStorage.setItem(lID + ":expires", expiresDate.toString());
				}
			}
		}
	}
	localStorageID(localID: string): string {
		if (this.singleEntry) {
			return this.name;
		} else {
			return this.name + ":" + localID;
		}
	}

	// all items no matter the user's permissions or level - for debugging etc.
	allMatchingItems(queryParams: IQueryParams): storedItem[] {
		const theParsedQueries = parseQueries(queryParams.queries || []);

		const theItems: storedItem[] = [];

		// printData(theParsedQueries,messageLevels.debug,"PArsed Queries")
		Object.keys(this.managedItemStorage).forEach((key) => {
			// add check is item allowed for user
			const item = this.managedItemStorage[key];
			if (item) {
				// printMessage("Checking Item: "+ key, messageLevels.debug);
				let theReturn = item.matchItem(theParsedQueries, queryParams.searchOrMode);
				if (theReturn) {
					// printMessage("Passed matchItem "+ key, messageLevels.debug);
					if (
						queryParams.stringParams &&
						queryParams.stringParams.length > 0 &&
						queryParams.stringToFind &&
						queryParams.stringToFind.trim().length > 0
					) {
						theReturn = theReturn.matchStringInParameters(
							queryParams.stringParams,
							queryParams.stringToFind,
						);
						if (theReturn) {
							// printData(theReturn, messageLevels.debug, "Returned");
							theItems.push(theReturn);
						}
					} else {
						// printData(theReturn, messageLevels.debug, "Returned");
						theItems.push(theReturn);
					}
				}
			}
		});
		return sortItemArray(theItems, queryParams);
		// return theItems ;
	}

	/**
	 * Return an array of stored items matching the query parameters supplied that conform to the current level.
	 * @param queryParams
	 * @returns
	 */
	_matchingItems(queryParams: IQueryParams): storedItem[] {
		const theItems: storedItem[] = [];
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
			return sortItemArray(theItems, queryParams);
		}
		const theParsedQueries = parseQueries(queryParams.queries || []);
		const theFirstQuery = theParsedQueries[0];
		if (
			(theFirstQuery.column === "primaryKey" ||
				theFirstQuery.column === this.primaryKeyProperty) &&
			(theFirstQuery.operator === "==" || theFirstQuery.operator === "===")
		) {
			const item = this.managedItemStorage[theFirstQuery.value];
			if (item && this.checkReadAuthority(item.getRegionISO())) {
				const inLevel = item.isInLevel();
				if (inLevel) {
					// printMessage("Checking Item: "+ key, messageLevels.debug);
					let theReturn = item.matchItem(theParsedQueries, queryParams.searchOrMode);
					if (theReturn) {
						// printMessage("Passed matchItem "+ key, messageLevels.debug);
						if (
							queryParams.stringParams &&
							queryParams.stringParams.length > 0 &&
							queryParams.stringToFind &&
							queryParams.stringToFind.trim().length > 0
						) {
							theReturn = theReturn.matchStringInParameters(
								queryParams.stringParams,
								queryParams.stringToFind,
							);
							if (theReturn) {
								printData(theReturn, messageLevels.debug, "Returned");
								return [theReturn];
							}
						} else {
							printData(theReturn, messageLevels.debug, " else Returned");
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
						if (
							queryParams.stringParams &&
							queryParams.stringParams.length > 0 &&
							queryParams.stringToFind &&
							queryParams.stringToFind.trim().length > 0
						) {
							theReturn = theReturn.matchStringInParameters(
								queryParams.stringParams,
								queryParams.stringToFind,
							);
							if (theReturn) {
								printData(theReturn, messageLevels.debug, "Returned");
								theItems.push(theReturn);
							}
						} else {
							printData(theReturn, messageLevels.debug, " else Returned");
							theItems.push(theReturn);
						}
					}
				}
			}
		});

		const result = sortItemArray(theItems, queryParams);
		return result;
		// return theItems ;
	}

	matchingItems = memoize(this._matchingItems, {
		maxAge: 5000,
		normalizer: (args) => {
			const key =
				getUser()?.displayName() +
				this.name +
				Object.keys(this.managedItemStorage).length +
				`${JSON.stringify(args)}`;
			return key;
		},
	});

	clearCache = () => {
		this.matchingItems.clear();
	};

	forEach = (callbackFn: Function): void => {
		printData(this.managedItemStorage, messageLevels.debug, "FOR EACH");
		Object.keys(this.managedItemStorage).forEach((key) => {
			callbackFn(this.managedItemStorage[key], key);
			this.doChangeCallbacks(key, this.managedItemStorage[key]);
		});
	};

	checkReadAuthority = (region?: string): boolean => {
		// call check authority for thisitem type in this region
		if (this.objectType) {
			// TODO fix this to actually return a boolean after waiting for promise return
			printMessage("Checking Read: " + this.objectType, messageLevels.debug);
			return checkLoadedAuthority(actions.retrieve, this.objectType, null, region);
		}
		return true;
	};
	checkUpdateAuthority = (region?: string, defaultValue?: boolean): boolean => {
		// call check authority for thisitem type in this region
		if (this.objectType) {
			// TODO fix this to actually return a boolean after waiting for promise return
			printMessage("Checking Update: " + this.objectType, messageLevels.debug);
			printMessage("Region: " + region, messageLevels.debug);
			const allowed = checkLoadedAuthority(actions.update, this.objectType, null, region);
			printMessage("Allowed in storeType: " + allowed, messageLevels.debug);
			return allowed;
		}
		if (defaultValue !== undefined) {
			return defaultValue;
		}
		return true;
	};

	checkCreateAuthority = (region?: string): boolean => {
		// call check authority for thisitem type in this region
		printMessage("Object Type: " + this.objectType, messageLevels.debug);
		if (this.objectType) {
			// TODO fix this to actually return a boolean after waiting for promise return
			printMessage("Checking Create: " + this.objectType, messageLevels.debug);
			return checkLoadedAuthority(actions.create, this.objectType, null, region);
		}
		return true;
	};

	checkDeleteAuthority = (region?: string): boolean => {
		// call check authority for thisitem type in this region
		if (this.objectType) {
			// TODO fix this to actually return a boolean after waiting for promise return
			printMessage("Checking Delete: " + this.objectType, messageLevels.debug);
			return checkLoadedAuthority(actions.delete, this.objectType, null, region);
		}
		return true;
	};

	doChangeCallbacks(key: string, data: any) {
		this.onChangeCallHandler.doEventCallbacks(key, data);
	}
	doRetriveCallbacks(key: string, data: any) {
		this.onRetrieveCallHandler.doEventCallbacks(key, data);
	}
	userChanged(newUserID: string) {
		if (this.userBased) {
			printMessage("Schema Item: " + this.name, messageLevels.debug);
			for (const dataKey in this.managedItemStorage) {
				printData(dataKey, messageLevels.debug, "Data Key: ");

				this.updateItemNewUser(dataKey);
			}
		}
	}
	moveItem(from: string, to: string, item?: storedItem) {
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

	updateItemNewUser(key: string) {
		printMessage("updateing for user change: " + this.name + " " + key, messageLevels.debug);

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
				printMessage("Calling getItem(): " + this.name + " " + key, messageLevels.debug);
				this.getItem(key);
			}
		}
	}

	itemByKey(key: string, createMissing?: boolean, fromData?: any): storedItem | undefined {
		let theItem = this.managedItemStorage[key];

		if (theItem && theItem !== undefined) {
			theItem.mergeData(fromData);
		} else if (!theItem && createMissing === true) {
			theItem = this.instanceItem(fromData);
		}
		return theItem;
	}

	insertItemByKey(key: string, data: storedItem) {
		this.managedItemStoragebyUUID[data.getValue("uuid")] = data;
		return (this.managedItemStorage[key] = data);
	}

	async getItem(key: string) {
		printMessage("getItem " + this.name + " " + key, messageLevels.debug);
		if (this.userBased && !this.checkReadAuthority()) {
			typeRetrieveFailed(this, "No permission to read " + (this.displayName || this.name));
			printMessage(this.displayName + " no authority", messageLevels.verbose);
			return null;
		}
		const localID = this.localStorageID(key);
		// let expires = null;

		const now: Date = new Date();

		printMessage("local ID for " + this.name + " : " + localID, messageLevels.debug);
		const theData = this.itemByKey(key);

		printData(theData, messageLevels.debug, "Data holder for " + this.name);
		if (theData && theData._hasData) {
			// TODO strip private variables
			const returnData = theData;
			if (this.objectType && this.objectRegionProperty) {
				const regionISO = (returnData as any)[this.objectRegionProperty];
				printMessage("Region ISO: " + regionISO, messageLevels.debug);
				const allowed = await checkAuthority(actions.retrieve, this.objectType, regionISO);
				printMessage("Allowed: " + allowed, messageLevels.debug);
				if (!allowed) {
					return null;
				}
			}
			if (!this.localMaxAge) {
				return returnData;
			}
			if (
				!theData._modifiedDate ||
				theData._modifiedDate.valueOf() + this.localMaxAge > now.valueOf()
			) {
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
					const theModifiedDate: Date = new Date(Number(theModified));
					const theItem = this.instanceItem(theLocalData);

					theItem._modifiedDate = new Date(theModifiedDate);

					printMessage("got local: " + this.name, messageLevels.debug);
					printMessage(key, messageLevels.debug);
					printMessage(theLocalData, messageLevels.debug);

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
			if (theExisting?._requested && theExisting?._requested === true) {
				requested = true;
			}
		}
		if (this.restEndpoint && (doesntExist || !requested) && !this._sendRetrievesLock) {
			this._sendRetrievesLock = true;
			printMessage("Fetching from remote", messageLevels.debug);
			const url = this.restEndpoint;
			let queryString: undefined | string = undefined;
			if (this.keyParameter && key) {
				queryString = "?" + this.keyParameter + "=" + key;
			}
			printMessage("About to fetch: ", messageLevels.debug);
			printData(url, messageLevels.debug);
			printMessage(key, messageLevels.debug);
			printMessage(queryString, messageLevels.debug);
			let resultData = await fetchDataAuthorised(url, key, queryString ?? null);
			if (resultData === null) {
				this._sendRetrievesLock = false;
				return null;
			}
			const theItem = this.itemByKey(localID);
			if (theItem) {
				theItem._requested = false;
			}
			printData(this, messageLevels.debug, "schemaItem in getItem");

			this.loaded = true;
			this.loadRequest = false;
			printMessage("Unwrap: " + this.clientUnwrap, messageLevels.debug);
			if (this.clientUnwrap) {
				printData(resultData, messageLevels.debug, "Before unwrap");
				const clientUnwrapString = this.clientUnwrap.toString();
				printMessage("unwrapping", messageLevels.debug);
				const unwrapList = clientUnwrapString.split(".");
				unwrapList.forEach((element: string) => {
					printMessage("Unwarapping by: " + element, messageLevels.debug);
					if (element === "0") {
						resultData = resultData[0];
					} else {
						resultData = resultData[element];
					}
				});
			}

			printData(resultData, messageLevels.debug, "After unwrap");
			// let jsonParsed = null;
			// try {

			//     jsonParsed = JSON.parse(resultData);
			printData(this, messageLevels.debug, "DataType: ");
			printData(this.singleEntry, messageLevels.debug, "singleEntry: ");
			if (this.singleEntry === true) {
				printData(this.singleEntry, messageLevels.debug, "singleEntry: ");
				const theItem = this.instanceItem(resultData);
				const theDate = theItem?.getValue("modified_timestamp");

				this.updateLatestModified(theDate);
				this.insertItemByKey(localID, theItem);

				this.storeLocal(resultData, localID);

				printData(
					resultData,
					messageLevels.debug,
					"Got Single Item: " + this.name + " " + key,
				);
			} else {
				let keyColumn = this.primaryKeyProperty;
				printMessage("Item Type: " + this.name, messageLevels.debug);
				printMessage("Key Column: " + keyColumn, messageLevels.debug);
				// this.dumpData(messageLevels.debug)
				if (!keyColumn) {
					if (isDict(resultData)) {
						keyColumn = "_dict";
					} else if (Array.isArray(resultData)) {
						const item = resultData[0];
						if (item["iso"]) {
							keyColumn = "iso";
						} else if (item["region"]) {
							keyColumn = "region";
						}
					}
				}
				if (keyColumn === "_dict") {
					printMessage("Dict: " + this.name, messageLevels.debug);
					printData(resultData, messageLevels.debug, "Got Dictionary: " + this.name);
					// printData(Object.entries(resultData), messageLevels.debug  ,"Entries in read dict: " + this.name) ;
					Object.entries(resultData).forEach(([key, value]) => {
						printMessage("got: " + this.name, messageLevels.debug);
						printMessage(key, messageLevels.debug);
						// printMessage( value, messageLevels.debug);
						const theData = this.itemByKey(key, true, value);
						const theDate = theData?.getValue("modified_timestamp");

						this.updateLatestModified(theDate);
						if (theData) {
							theData.store(key);
						}

						this.storeLocal(value, key);
					});
				} else {
					printData(
						resultData,
						messageLevels.debug,
						"Got Array: " + this.name + " with key: " + keyColumn,
					);
					this.primaryKeyProperty = keyColumn;
					resultData.forEach((value: any) => {
						const key = value[keyColumn || 0];

						const theData = this.itemByKey(key, true, value);
						const theDate = theData?.getValue("modified_timestamp");

						this.updateLatestModified(theDate);
						this.storeLocal(value, key);
						printMessage("got: " + this.name, messageLevels.debug);
						printMessage(key, messageLevels.debug);
						printMessage(value, messageLevels.debug);
					});
				}
			}
			// this.dumpData(messageLevels.none);
			this._sendRetrievesLock = false;
			if (this.name) {
				typeIsRetrieved(this, "Fetched " + this.displayName || this.name);
			}
			this.onRetrieveCallHandler.doEventCallbacks("", null);
			this.doChangeCallbacks(key, resultData);
		} else {
			return null;
		}
	}

	getStorage = () => {
		return this.managedItemStorage;
	};

	dumpData(level: messageLevels) {
		printData(this, level, "Storage dump for: " + this.name);
	}

	save = async () => {
		this.doForgets();
		this.sendDeletes();
		this.sendUpdates();
		this.sendCreates();
	};

	saveToContext(parentContext: context | null) {
		this.doForgets();
		if (parentContext) {
			// this.sendDeletes();
			// this.sendUpdates();
			// this.sendCreates();
		}
	}

	sendDeletes = async () => {
		const deletes = this.getDeleteList();
		if (this.delete && this.restEndpoint) {
			if (deletes.length > 0) {
				const deleteIDs: IUpdateItem[] = [];
				deletes.forEach((item) => {
					const theKeys = { primaryKey: item.primaryKey(), uuid: item.storeUUID };
					deleteIDs.push(theKeys);
				});
				const deleteJSON = JSON.stringify(deleteIDs);
				sendDataAuthorised(
					this.restEndpoint,
					"DELETE",
					deleteJSON,
					this.receiveDeleteResults,
				);
			}
		} else {
			if (deletes.length > 0) {
				printMessage("cannot send deletes for " + this.name, messageLevels.error);
			}
		}
	};

	sendCreates = async () => {
		if (!this._sendCreatesLock) {
			const creates = this.getCreateList();
			if (this.create && this.restEndpoint) {
				if (creates.length > 0) {
					this._sendCreatesLock = true;
					const createIDs: IUpdateItem[] = [];

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
					printData(createJSON, messageLevels.debug, "JSON to send to create");
					sendDataAuthorised(
						this.restEndpoint,
						"POST",
						createJSON,
						this.receiveCreateResults,
					);
				} else {
					this._sendCreatesLock = false;
				}
			} else {
				if (creates.length > 0) {
					printMessage("cannot send creates for " + this.name, messageLevels.error);
				}
			}
		} else {
			printMessage("Creates already in progress " + this.name, messageLevels.debug);
			setTimeout(() => {
				this.sendCreates();
			}, 1000);
		}
	};
	sendUpdates = async () => {
		const updates = this.getUpdateList();
		if (this.update && this.restEndpoint) {
			if (updates.length > 0) {
				const updateIDs: IUpdateItem[] = [];
				updates.forEach((item) => {
					const theKeys = {
						primaryKey: item.primaryKey(),
						uuid: item.storeUUID,
						item: item,
					};
					updateIDs.push(theKeys);
				});
				const updateJSON = JSON.stringify(updateIDs);
				sendDataAuthorised(this.restEndpoint, "PUT", updateJSON, this.receiveUpdateResults);
			}
		} else {
			if (updates.length > 0) {
				printMessage("cannot send updates for " + this.name, messageLevels.error);
				updates.forEach((item) =>
					itemSendFailed(item, "Cannot send updates for " + this.name),
				);
			}
		}
	};
	receiveDeleteResults = async (returned: Promise<any>) => {
		returned.then((result) => {
			printData(result, messageLevels.debug, "Results from Delete");
			result.forEach((element: any) => {
				const theKey = element.primaryKey;
				const theItem = this.managedItemStorage[theKey];
				theItem._dirty = false;
				theItem._created = false;
				theItem._hasData = true;
				itemSendSucceeed(theItem, theItem.displayName() + " deleted");
				this.onDeleteCallHandler.doEventCallbacks(theKey, theItem);
				// delete this.managedItemStorage[theKey];
			});
		});
	};
	receiveCreateResults = async (returned: Promise<any>) => {
		printMessage("clearing create lock: " + this.name, messageLevels.debug);
		this._sendCreatesLock = false;
		returned.then((result) => {
			// const decodedData = JSON.parse(result);
			printData(result, messageLevels.debug, "decodedData from Create");

			result.forEach((element: any) => {
				const theKey = element.uuid;
				if (theKey) {
					const theItem = this.managedItemStorage[theKey];
					printData(theItem, messageLevels.debug, "theItem from Create");
					if (theItem) {
						if (this.primaryKeyProperty) {
							(theItem as any)[this.primaryKeyProperty] = element.primaryKey;

							// theItem.setValue(element.primaryKey, this.primaryKeyProperty );
							this.moveItem(theKey, element.primaryKey, theItem);
						}
						printData(element, messageLevels.debug, "element in receiveCreateResults ");
						for (const [key, value] of Object.entries(element)) {
							if (key !== "primaryKey" && key !== "uuid") {
								theItem.setValue(value, key);
							}
						}

						theItem._dirty = false;
						theItem._created = false;
						theItem._hasData = true;
						theItem.didSend();
						itemSendSucceeed(theItem, theItem.displayName() + " saved");
						this.onSaveCallHandler.doEventCallbacks(theItem.primaryKey(), theItem);
					}
				}
			});

			//    this.dumpData(messageLevels.debug)
		});
	};

	receiveUpdateResults = async (returned: Promise<any>) => {
		printData(returned, messageLevels.debug, "Results from Update");
		returned.then((result) => {
			// const decodedData = JSON.parse(result);
			printData(result, messageLevels.debug, "decodedData from Create");

			result.forEach((element: any) => {
				const theKey = element.primaryKey;
				if (theKey) {
					const theItem = this.managedItemStorage[theKey];
					printData(theItem, messageLevels.debug, "theItem from Update");
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
									printData(
										theItem,
										messageLevels.debug,
										"theItem after setValue",
									);
									this.moveItem(theKey, (value as any).toString(), theItem);
									printData(theItem, messageLevels.debug, "theItem after move");
									printData(
										value,
										messageLevels.debug,
										"setting " + this.primaryKeyProperty,
									);
								}
							} else if (key === "new_uuid") {
								theItem.setValue(value, "uuid");
							}
							if (key !== "primaryKey" && key !== "uuid") {
								theItem.setValue(value, key);
							}
						}
						printData(theItem, messageLevels.debug, "theItem after update");
						theItem._dirty = false;
						theItem._created = false;
						theItem._hasData = true;

						itemSendSucceeed(theItem, theItem.displayName() + " saved");
						this.onSaveCallHandler.doEventCallbacks(theItem.primaryKey(), theItem);
					}
				}
			});
			//    this.dumpData(messageLevels.verbose)
		});
	};

	doForgets = () => {
		const theForgets = this.getForgetList();
		theForgets.forEach((value) => {
			delete this.managedItemStorage[value];
		});
	};

	getForgetList = (): string[] => {
		const theItems: any[] = [];

		Object.keys(this.managedItemStorage).forEach((key) => {
			const item = this.managedItemStorage[key];
			if (
				item.shouldForget() &&
				(this.objectType !== undefined ||
					checkLoadedAuthority(
						actions.delete,
						this.objectType || objects.none,
						item.primaryKey(),
						item.getRegionISO(),
					))
			) {
				theItems.push(key);
			}
		});
		return theItems;
	};

	getDeleteList = (): storedItem[] => {
		const theItems: storedItem[] = [];
		if (this.delete) {
			Object.keys(this.managedItemStorage).forEach((key) => {
				const item = this.managedItemStorage[key];
				if (
					item.shouldSendDelete() &&
					(this.objectType !== undefined ||
						checkLoadedAuthority(
							actions.delete,
							this.objectType || objects.none,
							item.primaryKey(),
							item.getRegionISO(),
						))
				) {
					theItems.push(item);
					itemWillSend(item, "Deleting " + item.displayName());
				}
			});
		}
		return theItems;
	};

	getUpdateList = (): storedItem[] => {
		const theItems: storedItem[] = [];
		if (this.update) {
			Object.keys(this.managedItemStorage).forEach((key) => {
				const item = this.managedItemStorage[key];
				// if(item.shouldSendUpdate() &&  checkAuthority(actions.update, this.objectType || objects.none , item.primaryKey(), item.getRegionISO() )) {
				if (
					item.shouldSendUpdate() &&
					checkLoadedAuthority(
						actions.update,
						this.objectType || objects.none,
						item.primaryKey(),
						item.getRegionISO(),
					)
				) {
					theItems.push(item);
					itemWillSend(item, "Saving " + item.displayName());
				}
			});
		}
		return theItems;
	};
	getCreateList = (): storedItem[] => {
		const theItems: storedItem[] = [];
		if (this.create) {
			Object.keys(this.managedItemStorage).forEach((key) => {
				const item = this.managedItemStorage[key];
				// if(item.shouldSendCreate() &&  checkAuthority(actions.create, this.objectType || objects.none , item.primaryKey(), item.getRegionISO() )) {
				if (item.shouldSendCreate()) {
					theItems.push(item);
					itemWillSend(item, "Adding " + item.displayName());
				}
			});
		}
		return theItems;
	};

	getPropertyArray(keys: [string] | string, column: string, unique?: boolean) {
		const theArray: any = [];
		let theItem: any = null;
		if (typeof keys === "string") {
			printData(keys, messageLevels.debug, "getPropertyArray keys");
			printData(column, messageLevels.debug, "getPropertyArray column");
			theItem = this.itemByKey(keys) as any;
			printData(theItem, messageLevels.debug, "getPropertyArray item");
			printData(theItem.getValue(column), messageLevels.debug, "getPropertyArray value");
			theArray.push(theItem.getValue(column));
			printData(theArray, messageLevels.debug, "getPropertyArray theArray");
		} else {
			if (unique) {
				keys.forEach((element) => {
					theItem = this.itemByKey(element) as any;
					if (isStoredItem(theItem)) {
						const theValue = theItem.getValue(column);
						if (theArray.indexOf(theValue) < 0) {
							theArray.push(theValue);
						}
					}
				});
			} else {
				keys.forEach((element) => {
					theItem = this.itemByKey(element) as any;
					if (isStoredItem(theItem)) {
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
	getPropertyDictArrayAll(queryParams: IQueryParams, parameters: string[], uniqueBy?: string) {
		const theArray: any = [];
		const theItems = this.allMatchingItems(queryParams);
		Object.keys(theItems).forEach((key: any) => {
			const theItem = theItems[key];
			const theRow: any = {};
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
	async getPropertyDictArray(queryParams: IQueryParams, parameters: string[], uniqueBy?: string) {
		const theArray: any = [];
		const theItems = this.matchingItems(queryParams);
		Object.keys(theItems).forEach((key: any) => {
			const theItem = theItems[key];
			const theRow: any = {};
			parameters.forEach((value) => {
				theRow[value] = theItem.getValue(value);
			});
			theArray.push(theRow);
		});
		return theArray;
	}

	init(): storedItem {
		const theItem = classInit(this, null);
		theItem._created = true;
		theItem.mounted();
		return theItem;
	}
	isSingleEntry(): boolean {
		if (this.singleEntry === null || typeof this.singleEntry === "undefined") {
			this.singleEntry = false;
		}
		return this.singleEntry;
	}
	instanceNewItem(data?: any) {
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
	instanceItem(data?: any, doNotStore?: boolean): storedItem {
		const theItem = classInit(this, data, doNotStore);
		theItem.mounted();
		// const theItem = new storedItem(this, data);
		return theItem;
	}
	/**
	 * make a copy of a storedItem to use whilst editing and replace the original if change saved
	 * @param theOriginal
	 * @returns storedItem - the copy
	 */
	editCopy(theOriginal: storedItem) {
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
	itemCopy(theOriginal: storedItem) {
		const theItem = this.instanceItem(theOriginal, true);
		theItem._primaryKey = CreateUUID();

		if (this.primaryKeyProperty) {
			// theItem.setValue(null, this.primaryKeyProperty);
			(theItem as any)[this.primaryKeyProperty] = null;
		}
		theItem._dirty = false;
		theItem._created = true;
		theItem._hasData = false;
		theItem._deleted = false;
		theItem._isEditCopy = false;

		printData(theOriginal, messageLevels.debug, "Original");
		printData(theItem, messageLevels.debug, "Copy");
		return theItem;
	}
	/**
	 * write the item back to the original stored item
	 *
	 * @param theItem
	 * returns the original item in the store that's now updated or null if not put back
	 */
	keepChanges(theItem: storedItem, callback?: Function): storedItem | null {
		if (theItem._isEditCopy) {
			const theOriginal = theItem._sourceItem;
			if (theOriginal && theOriginal !== undefined) {
				const isDirty = theItem._dirty;
				const wasEditCopy = theOriginal?._isEditCopy;
				if (isDirty) {
					theItem._sourceItem = null;
					Object.assign(theOriginal, JSON.parse(JSON.stringify(theItem)));
					if ((theItem as any)._multiFileUploader) {
						(theOriginal as any)._multiFileUploader = (
							theItem as any
						)._multiFileUploader;
					}
					theOriginal._isEditCopy = wasEditCopy;
					theOriginal.storeChanges(callback);
					this.doChangeCallbacks(theOriginal.primaryKey(), theOriginal);
				}
				return theOriginal;
			}
			return null;
		} else {
			theItem.storeChanges(callback);
			return theItem;
		}
	}

	requestLoad(
		changeCallbackFn?: ChangeCallbackFunction,
		retrieveCallbackFn?: ChangeCallbackFunction,
	) {
		printMessage("requestLoad " + this.name, messageLevels.debug);
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
		typeWillRetrieve(this, "Fetching " + (this.displayName || this.name));
		if (this.restEndpoint) {
			this.getItem("");
		}
		this.dumpData(messageLevels.debug);
	}
}

function isDict(o: any) {
	const string = JSON.stringify(o);
	return string.startsWith("{") && string.endsWith("}");
}

export class CallbackHandler {
	name = "";
	callList: Array<Function> = [];

	constructor(name: string) {
		this.name = name;
	}
	registerOnEvent(call: Function) {
		// printData(call,messageLevels.debug, "Call register in " +this.name)
		const index = this.callList.indexOf(call);
		if (index < 0) {
			this.callList.push(call);
		}
		// printData(this.callList, messageLevels.debug, "in registerOnChange " + this.name);
	}
	removeOnEvent(call: Function) {
		const index = this.callList.indexOf(call);
		if (index > -1) {
			// printMessage("Removing onChange from: "+ this.name ,messageLevels.debug);
			this.callList.splice(index, 1);
		} else {
			printMessage("Failed to remove onChange from: " + this.name, messageLevels.debug);
		}
	}
	doEventCallbacks = (key?: string, data?: any) => {
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
}
function callFunction(theFunction: Function, name: string, key: any, data: any) {
	if (!theFunction) {
		return null;
	}
	// if(name !== "user-profile" && name !== "state"  && name !== "data-types") {
	if (theFunction.constructor.name === "AsyncFunction") {
		theFunction(name, key, data);
	} else {
		window.setTimeout(theFunction(name, key, data), 50);
	}
	return null;
}
export function CreateUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c == "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
