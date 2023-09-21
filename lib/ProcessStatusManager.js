"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessStatusManager = exports.statusMessage = exports.messageCategory = void 0;
const storeType_1 = require("./storeType");
const remotehq_1 = require("./remotehq");
const types_1 = require("./types");
const _1 = require(".");
var messageCategory;
(function (messageCategory) {
    messageCategory[messageCategory["none"] = 0] = "none";
    messageCategory[messageCategory["systemHide"] = 1] = "systemHide";
    messageCategory[messageCategory["systemShow"] = 2] = "systemShow";
    messageCategory[messageCategory["userHide"] = 3] = "userHide";
    messageCategory[messageCategory["userShow"] = 4] = "userShow";
})(messageCategory = exports.messageCategory || (exports.messageCategory = {}));
class statusMessage {
    constructor(forItem, theMessage, category) {
        this.message = "";
        this.initialMessage = "";
        this.item = null;
        this.category = messageCategory.none;
        this.startTime = new Date();
        this.updateTime = new Date();
        this.completed = false;
        this.retries = 0;
        this.failed = false;
        this.failedFatally = false;
        this.percentComplete = 0;
        this.item = forItem;
        this.message = theMessage;
        this.initialMessage = theMessage;
        this.startTime = new Date();
        this.percentComplete = 0;
        this.category = category || messageCategory.none;
    }
    succeeded(theMessage) {
        this.percentComplete = 100;
        this.completed = true;
        this.failed = false;
        this.failedFatally = false;
        this.updateTime = new Date();
        if (theMessage) {
            this.message = theMessage;
        }
    }
    progress(thePercent, theMessage) {
        this.updateTime = new Date();
        if (thePercent) {
            this.percentComplete = thePercent;
            if (thePercent >= 100) {
                this.completed = true;
                this.failed = false;
                this.failedFatally = false;
            }
        }
        if (theMessage) {
            this.message = theMessage;
        }
    }
    sendFailed(theMessage) {
        this.percentComplete = 0;
        this.completed = false;
        this.failed = true;
        this.failedFatally = false;
        this.updateTime = new Date();
        if (theMessage) {
            this.message = theMessage;
        }
    }
}
exports.statusMessage = statusMessage;
class ProcessStatusManager {
    constructor() {
        this.itemsToSend = [];
        this.itemsToSendMessages = [];
        this.itemsSent = [];
        this.itemsSentMessages = [];
        this.itemsToSendObject = [];
        this.actionsCompleted = [];
        this.itemsFailed = [];
        this.itemsFailedMessages = [];
        this.actionsFailed = [];
        this.actionsFailedMessages = [];
        this.lastMessage = "";
        this.totalCount = 0;
        this.percentComplete = 100;
        this.doneCount = 0;
        this.editModeActive = false;
        this.editModesInUse = [];
        this.alertActive = false;
        this.resetOnCompleteAfter = 3 * 1000;
        this.onChangeCallHandler = new storeType_1.CallbackHandler("sendStatus");
        this.doTimedUpdates = () => {
            this.updateAlert();
        };
        this.onStateChange = (type, key, data) => {
            if (key.startsWith("edit-")) {
                const theIndex = this.editModesInUse.indexOf(key);
                if (data && data.getValue() && data.getValue().length > 0) {
                    if (theIndex < 0) {
                        this.editModesInUse.push(key);
                    }
                }
                else {
                    if (theIndex > -1) {
                        this.editModesInUse.splice(theIndex, 1);
                    }
                }
                this.editModeActive = this.editModesInUse.length > 0;
            }
            this.updateAlert();
        };
        this.updateAlert = () => {
            const canClose = this.canClose;
            if (canClose && this.alertActive) {
                this.removeAlert();
            }
            else if (!canClose && !this.alertActive) {
                this.addAlert();
            }
        };
        this.addAlert = () => {
            this.alertActive = true;
            window.addEventListener("beforeunload", unloadHandler);
        };
        this.removeAlert = () => {
            window.removeEventListener("beforeunload", unloadHandler);
            this.alertActive = false;
        };
        this.itemWillSend = (item, message, category) => {
            (0, remotehq_1.printData)(item, types_1.messageLevels.debug, "Item Will Send");
            (0, remotehq_1.printData)(message, types_1.messageLevels.debug, "Item Will Send message");
            const itemIndex = this.itemsToSend.indexOf(item);
            if (itemIndex > -1) {
                this.itemsToSendMessages.splice(itemIndex, 1);
                this.itemsToSendMessages[itemIndex] = message || "";
            }
            else {
                const theItem = new statusMessage(item, message || "", category);
                this.itemsToSend.push(item);
                this.itemsToSendObject.push(theItem);
                this.itemsToSendMessages.push(message || "");
                this.totalCount += 1;
            }
            if (message && message !== "") {
                this.lastMessage = message;
            }
            this.updateAlert();
            this.onChangeCallHandler.doEventCallbacks(item.primaryKey(), item);
        };
        this.itemSucceed = (item, message) => {
            let theItem = null;
            const itemIndex = this.itemsToSend.indexOf(item);
            if (itemIndex > -1) {
                theItem = this.itemsToSendObject[itemIndex];
            }
            theItem === null || theItem === void 0 ? void 0 : theItem.succeeded();
            this.itemIsSent(item, message);
        };
        this.itemFailed = (item, message) => {
            let theItem = null;
            const itemIndex = this.itemsToSend.indexOf(item);
            if (itemIndex > -1) {
                theItem = this.itemsToSendObject[itemIndex];
            }
            theItem === null || theItem === void 0 ? void 0 : theItem.sendFailed();
            this.itemHasFailed(item, message);
        };
        this.itemIsSent = (item, message) => {
            this.itemsSent.push(item);
            this.itemsSentMessages.push(message || "");
            const itemIndex = this.itemsToSend.indexOf(item);
            let theItem = null;
            if (itemIndex > -1) {
                this.itemsToSend.splice(itemIndex, 1);
                this.itemsToSendMessages.splice(itemIndex, 1);
                theItem = this.itemsToSendObject[itemIndex];
                this.itemsToSendObject.splice(itemIndex, 1);
                this.doneCount += 1;
            }
            if (theItem === null || theItem === void 0 ? void 0 : theItem.failed) {
                this.actionsFailed.push(theItem);
            }
            if (theItem === null || theItem === void 0 ? void 0 : theItem.completed) {
                this.actionsCompleted.push(theItem);
            }
            if (message && message !== "") {
                this.lastMessage = message;
            }
            this.percentComplete = Math.round((this.doneCount / this.totalCount) * 100);
            this.updateAlert();
            this.onChangeCallHandler.doEventCallbacks(item.primaryKey(), item);
            this.resetCount();
        };
        this.itemHasFailed = (item, message) => {
            this.itemsFailed.push(item);
            this.itemsFailedMessages.push(message || "");
            const itemIndex = this.itemsToSend.indexOf(item);
            let theItem = null;
            if (itemIndex > -1) {
                this.itemsToSend.splice(itemIndex, 1);
                this.itemsToSendMessages.splice(itemIndex, 1);
                theItem = this.itemsToSendObject[itemIndex];
                this.itemsToSendObject.splice(itemIndex, 1);
                this.doneCount += 1;
            }
            if (theItem === null || theItem === void 0 ? void 0 : theItem.failed) {
                this.actionsFailed.push(theItem);
            }
            if (message && message !== "") {
                this.lastMessage = message;
            }
            this.percentComplete = Math.round((this.doneCount / this.totalCount) * 100);
            this.updateAlert();
            this.onChangeCallHandler.doEventCallbacks(item.primaryKey(), item);
            this.resetCount();
        };
    }
    init() {
        (0, _1.registerforStateChanges)(this.onStateChange);
        window.setInterval(this.doTimedUpdates, 2000);
    }
    get canClose() {
        if (this.sendsInProgress || this.editModeActive) {
            return false;
        }
        return true;
    }
    get sendsInProgress() {
        return this.itemsToSend.length > 0;
    }
    get sendsToGo() {
        return this.itemsToSend.length;
    }
    get lastSentMessage() {
        if (this.itemsSentMessages.length > 0) {
            return this.itemsSentMessages[this.itemsSentMessages.length - 1];
        }
        return "";
    }
    get toSendMessages() {
        return this.itemsToSendObject;
    }
    get completedMessages() {
        // return this.actionsCompleted;
        return [...this.actionsCompleted].reverse();
    }
    get failedMessages() {
        return [...this.actionsFailed].reverse();
    }
    get lastProcessMessage() {
        return this.lastMessage;
    }
    get itemsToSendMessageList() {
        return this.itemsToSendMessages;
    }
    dumpCompletedActions() {
        (0, remotehq_1.printData)(this.itemsSentMessages, types_1.messageLevels.warning);
    }
    dumpToDo() {
        (0, remotehq_1.printData)(this.itemsToSendMessages, types_1.messageLevels.warning);
    }
    registerOnChange(call) {
        this.onChangeCallHandler.registerOnEvent(call);
        // this.onChangeCall.push(call);
    }
    removeOnChange(call) {
        this.onChangeCallHandler.removeOnEvent(call);
    }
    resetCount() {
        if (this.percentComplete < 100) {
            clearTimeout(this.resetTimeout);
        }
        else {
            this.resetTimeout = setTimeout(() => {
                this.doneCount = 0;
                this.totalCount = 0;
                this.percentComplete = 0;
            }, this.resetOnCompleteAfter);
        }
    }
    flushStatusMessages() {
        this.itemsToSendObject = [];
        this.actionsCompleted = [];
        this.actionsFailed = [];
        this.onChangeCallHandler.doEventCallbacks();
    }
}
exports.ProcessStatusManager = ProcessStatusManager;
const unloadHandler = (event) => {
    console.log("UNLOAD:2");
    event.returnValue = "Page is busy"; //"Any text"; //true; //false;
};
