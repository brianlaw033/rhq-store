import { SemanticCOLORS } from "semantic-ui-react/dist/commonjs/generic";
import { CallbackHandler, storeType } from "./storeType";
import { storedItem } from "./storedItem";
import { editContext } from "./editContext";
import { context } from "./context";

export enum actions {
  none = 0,
  create,
  retrieve,
  update,
  delete,
}
export const actionNames = ["none",
  "create",
  "retrieve",
  "update",
  "delete"];

export function actionNameToNumber(theName: string): number {
  const theItemNumber = actionNames.indexOf(theName);
  return theItemNumber;
}
// object IDs for permissions
export enum objects {
  none = 0,
  country,
  state,
  region,
  forest,
  forestBlock,
  consent,
  ortho,
  elevationModel,
  blockBoundary,
  panorama,
  task,
  aoe,
  aof,
  aoc,
  quarry,
  consentedRoad,
  consentedTrack,
  consentedSkid,
  consentedStreamCrossing,
  asBuiltRoad,
  asBuiltTrack,
  asBuiltSkid,
  asBuiltStreamCrossing,
  waterControl,
  forestBlockReport,
  inspectionFeatureEditor,
  dashboard,
  nesForm,
  forestOwnership,
  forestManager,
  nesPFForm,
  admin = 98,
  debug = 99,
}
export const objectNames: string[] = [
  "none",
  "country",
  "state",
  "region",
  "forest",
  "forestBlock",
  "consent",
  "ortho",
  "elevationModel",
  "blockBoundary",
  "panorama",
  "task",
  "aoe",
  "aof",
  "aoc",
  "quarry",
  "consentedRoad",
  "consentedTrack",
  "consentedSkid",
  "consentedStreamCrossing",
  "asBuiltRoad",
  "asBuiltTrack",
  "asBuiltSkid",
  "asBuiltStreamCrossing",
  "waterControl",
  "forestBlockReport",
  "inspectionFeatureEditor",
  "dashboard",
  "nesForm",
  "forestOwnership",
  "forestManager",
  "nesPFForm"
];
objectNames[98] = "admin";
objectNames[99] = "debug";
export enum sortMethod { any = 0, alpha, numeric, date };
export enum sortDirection { ascending = 0, descending };
export interface ISortParams {
  sortField?: string;
  sortDirection?: sortDirection;
  sortMethod?: sortMethod;
  defaultSortValue?: any;
}

export interface IQueryParams {
  queries?: string[];
  searchOrMode?: boolean;
  stringToFind?: string;
  stringParams?: string[];
  sort?: ISortParams;
};


export function objectNameToNumber(theName: string): number {
  const theItemNumber = objectNames.indexOf(theName);
  return theItemNumber;
}

// levels at which the message system will report
export enum messageLevels {
  none = 0,
  error,
  warning,
  verbose,
  debug,
}

export interface IPermissions {
  regions?: any;
  objects?: any;
}
export interface IRelationship {
  to: string;
  localKey: string;
  foreignKey: string;
  many: boolean;
}
export interface IManagedItemDict {
  [key: string]: storedItem;
}

export interface ISchemaItem {
  name: string;
  objectType?: objects;
  singleEntry: boolean;
  userBased: boolean;
  primaryKeyProperty?: string;
  objectRegionProperty?: string;
  relationships?: Array<IRelationship>;
  session?: boolean;
  local?: boolean;
  localMaxAge?: number | null;
  restEndpoint?: URL | null;
  clientUnwrap?: any;
  create: boolean;
  retrieve: boolean;
  update: boolean;
  delete: boolean;
  keyParameter?: string;
  onChangeCallHandler: CallbackHandler;
  // onChangeCall: Array<Function>;
  loadRequest: boolean;
  loaded?: boolean;
  // dataStorage: IDataStorageArray;
  managedItemStorage: IManagedItemDict;
  hasChanges: boolean;
  latestData: Number;
  _sendCreatesLock: boolean;
  _sendRetrievesLock: boolean;
}

export interface IDataItem {
  type: ISchemaItem;
  key: string;
  modifiedDate: Date;
  fetchedDate?: Date;
  modified?: boolean;
  dirty?: boolean;
  deleted?: boolean;
  hasData: boolean;
  requested?: boolean;
  data?: any;
}

export interface IDataStorageArray {
  [key: string]: IDataItem;
}

export interface ISchemaStorageArray {
  [key: string]: storeType;
}

export interface IContextStorageArray {
  [key: string]: editContext;
}

export interface IManagedItem {
  getType(): storeType | null;
  _primaryKey: any;
  _modifiedDate?: Date;
  _fetchedDate?: Date;
  setValue(value: any, forKey: string): any;
  getValue(forKey?: any): any;
  isDirty(): boolean;
  _requested: boolean;
  _hasData: boolean;
  _deleted: boolean;
  _created: boolean;
  _isEditCopy: boolean;
  _sourceItem?: storedItem | null;
  _serial: number;
}

export interface ImageSupport {
  addFileUpload(theUpload: any, listParameter?: string): void;
  addImageURL(theURL: string, listParameter?: string): void;
  uploadAll(): void;
  removeImage(theURL: string | URL, listParameter?: string): boolean;
  removeImageURL(theURL: string, listParameter?: string): boolean;
  removeImageUUID(theUUID: string, listParameter?: string): boolean;
  getImageURLs(listParameter?: string): URL[];
  takeoverUploads(fileUploader: any): void;
}

export type ChangeCallbackFunction = (
  type: string,
  key?: string,
  data?: any
) => void;

export interface IColorElement {
  name?: SemanticCOLORS;
  code: string;
}
export interface IIndexable<T = string> {
  [key: string]: T;
  [key: number]: T;
}

export interface IComplianceState {
  KEY: string;
  definition: string;
  legendOrder: number;
  color: IColorElement;
}

export interface IPriority extends IComplianceState { }

export interface IParsedQuery {
  column: string;
  operator: string;
  value?: any;
  values?: any[];
}

export interface IStore { name: string; dumpSchema: () => void; getSchema: () => ISchemaStorageArray; getSchemaArray: () => storeType[]; getSchemaArrayAlpha: () => storedItem[]; createEditContext: (name: string) => storedItem | undefined; removeEditContext: (context: editContext) => void; getContext: (key: any) => context | null; userChanged: (newUserID: string) => void; registerDataType: (type: string, remoteURL?: URL, createRemote?: boolean, retrieveRemote?: boolean, updateRemote?: boolean, deleteRemote?: boolean) => storeType; registerSingleItem: (type: string, storeSesstion: Boolean, storeLocal: Boolean, maxAgeLocal: number | null, remoteURL?: URL, createRemote?: boolean, retrieveRemote?: boolean, updateRemote?: boolean, deleteRemote?: boolean) => storeType; registerSingleUserItem: (type: string, storeSesstion: Boolean, storeLocal: Boolean, maxAgeLocal: number | null, remoteURL?: URL, createRemote?: boolean, retrieveRemote?: boolean, updateRemote?: boolean, deleteRemote?: boolean) => storeType; instanceItem: (type: string, data?: any) => storedItem | null; instanceNewItem: (type: string, data?: any) => storedItem | null; init: (type: string) => storedItem | null; save: () => void; registerOnChange: (name: string, call: Function) => storeType | null; registerOnSave: (name: string, call: Function) => storeType | null; registerOnDelete: (name: string, call: Function) => storeType | null; getStoreTypeByName: (name: string, createMissing?: boolean) => storeType | null; clearAllStoreCache: () => void; clearStoreCache: (name: string) => void; removeOnChange: (name: string, call: Function) => storeType | null; removeOnRetrieve: (name: string, call: Function) => storeType | null; removeOnSave: (name: string, call: Function) => storeType | null; removeOnDelete: (name: string, call: Function) => storeType | null; getAllStoreTypes: () => ISchemaStorageArray; setItem: (type: string, items: string | { [key: string]: any; }, data?: any) => void | undefined; storeData: (type: string, items: string | { [key: string]: any; }, data?: any) => void | undefined; getAll: (type: string) => IManagedItem[]; requestLoad: (type: string, changeCallbackFn?: ChangeCallbackFunction, retrieveCallbackFn?: ChangeCallbackFunction) => storeType | null; getItem: (type: string, key: string) => Promise<string | storedItem | null | undefined>; itemByKey: (type: string, key: string) => storedItem | undefined; getPropertyArray: (type: string, keys: [string], column: string) => any; updateItemNewUser: (type: string, key: string) => Promise<void | undefined>; getAccessToken: () => Promise<string>; accessTokenSync: () => string | null; fetchDataAuthorised: (url: URL, key?: string, queryString?: string | null) => Promise<any>; sendDataAuthorised: (url: URL, method: string, data: string, callback: Function, key?: string, queryString?: string | null) => Promise<any>; loadTables: (endpoint: string) => Promise<void>; putTablesIntoSchemaItems: (type: string, key: string, data: any) => Promise<void>; call: (name: string, ...args: any[]) => any; callAsync: (name: string, ...args: any[]) => Promise<any>; registerCall: (name: string, fn: any, awaitMapAvailable?: boolean) => void; registerCalls: (calls: { [key: string]: any; }) => void; removeCall: (name: string) => void; removeCalls: (calls: { [key: string]: any; }) => void; getGlobalState: (name: string) => storedItem | undefined; setGlobalState: (name: string | { [key: string]: any; }, value?: any) => Promise<void>; getStateValue: (name: string) => any; getStateArrayValue: (name: string, defaultValue?: []) => any[]; getStateFirstValue: (name: string, defaultValue?: any) => any; registerforStateChanges: (fn: any) => void; removeStateChanges: (fn: any) => void; dumpDataType: (type: string, level: messageLevels) => void; isStoredItem: (item: any) => boolean; getPropertyArrayFromItemArray: (items: storedItem[], column: string) => any; getPropertiesArrayFromItemArray: (items: storedItem[], columns: string[]) => any; getPropertyArrayFromItemArrayUnique: (items: storedItem[], column: string) => any; isItemType: (item: any, type: string, isLike?: boolean) => boolean; itemWillSend: (item: storedItem | storeType, message?: string) => void; typeWillRetrieve: (item: storedItem | storeType, message?: string) => void; itemIsSent: (item: storedItem | storeType, message: string) => void; typeIsRetrieved: (item: storedItem | storeType, message: string) => void; typeRetrieveFailed: (item: storedItem | storeType, message: string) => void; itemSendSucceeed: (item: storedItem | storeType, message: string) => void; itemSendFailed: (item: storedItem | storeType, message: string) => void; sendsInProgress: () => boolean; sendsToGo: () => number; lastSentMessage: () => number; itemsToSendMessageList: () => string[]; lastProcessMessage: () => string; processPercentComplete: () => number; flushStatusMessages: () => void; toSendMessages: () => import("/Users/brianlaw/Documents/rhq-store/src/ProcessStatusManager").statusMessage[]; completedMessages: () => import("/Users/brianlaw/Documents/rhq-store/src/ProcessStatusManager").statusMessage[]; failedMessages: () => import("/Users/brianlaw/Documents/rhq-store/src/ProcessStatusManager").statusMessage[]; registerOnProcessChange: (call: Function) => void; removeOnProcessChange: (call: Function) => void; dumpCompletedActions: () => void; dumpToDo: () => void; isUUID: (theString: string) => boolean; dateStripTimezone: (date: Date | null) => Date | null; dateAddTimezone: (date: Date | null) => Date | null; selectedConsentNumber: () => any; initializeProcessStatusManager: () => void;}

export interface IStores {
  [name: string]: IStore
}