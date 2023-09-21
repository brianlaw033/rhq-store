/// <reference types="node" />
import { storedItem } from "./storedItem";
import { CallbackHandler, storeType } from "./storeType";
export declare enum messageCategory {
    none = 0,
    systemHide = 1,
    systemShow = 2,
    userHide = 3,
    userShow = 4
}
export declare class statusMessage {
    message: string;
    initialMessage: string;
    item: storedItem | storeType | null;
    category: messageCategory;
    startTime: Date;
    updateTime: Date;
    completed: boolean;
    retries: number;
    failed: boolean;
    failedFatally: boolean;
    percentComplete: number;
    constructor(forItem: storedItem | storeType, theMessage: string, category?: messageCategory);
    succeeded(theMessage?: string): void;
    progress(thePercent?: number, theMessage?: string): void;
    sendFailed(theMessage?: string): void;
}
export declare class ProcessStatusManager {
    itemsToSend: (storedItem | storeType)[];
    itemsToSendMessages: string[];
    itemsSent: (storedItem | storeType)[];
    itemsSentMessages: string[];
    itemsToSendObject: statusMessage[];
    actionsCompleted: statusMessage[];
    itemsFailed: (storedItem | storeType)[];
    itemsFailedMessages: string[];
    actionsFailed: statusMessage[];
    actionsFailedMessages: string[];
    lastMessage: string;
    totalCount: number;
    percentComplete: number;
    doneCount: number;
    editModeActive: boolean;
    editModesInUse: string[];
    alertActive: boolean;
    resetTimeout: NodeJS.Timeout | undefined;
    resetOnCompleteAfter: number;
    onChangeCallHandler: CallbackHandler;
    init(): void;
    doTimedUpdates: () => void;
    onStateChange: (type: string, key: string, data: storedItem) => void;
    get canClose(): boolean;
    updateAlert: () => void;
    addAlert: () => void;
    removeAlert: () => void;
    itemWillSend: (item: storedItem | storeType, message?: string, category?: messageCategory) => void;
    itemSucceed: (item: storedItem | storeType, message?: string) => void;
    itemFailed: (item: storedItem | storeType, message?: string) => void;
    itemIsSent: (item: storedItem | storeType, message?: string) => void;
    itemHasFailed: (item: storedItem | storeType, message?: string) => void;
    get sendsInProgress(): boolean;
    get sendsToGo(): number;
    get lastSentMessage(): string;
    get toSendMessages(): statusMessage[];
    get completedMessages(): statusMessage[];
    get failedMessages(): statusMessage[];
    get lastProcessMessage(): string;
    get itemsToSendMessageList(): string[];
    dumpCompletedActions(): void;
    dumpToDo(): void;
    registerOnChange(call: Function): void;
    removeOnChange(call: Function): void;
    resetCount(): void;
    flushStatusMessages(): void;
}
