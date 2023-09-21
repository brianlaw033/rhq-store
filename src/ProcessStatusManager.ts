import { storedItem } from "./storedItem";
import { CallbackHandler, storeType } from "./storeType";
import { printData } from "./remotehq";
import { messageLevels } from "./types";
import { registerforStateChanges } from ".";

export enum messageCategory {
	none = 0,
	systemHide,
	systemShow,
	userHide,
	userShow,
}

export class statusMessage {
	message = "";
	initialMessage = "";
	item: storedItem | storeType | null = null;
	category: messageCategory = messageCategory.none;
	startTime: Date = new Date();
	updateTime: Date = new Date();
	completed = false;
	retries = 0;
	failed = false;
	failedFatally = false;
	percentComplete = 0;

	constructor(forItem: storedItem | storeType, theMessage: string, category?: messageCategory) {
		this.item = forItem;
		this.message = theMessage;
		this.initialMessage = theMessage;
		this.startTime = new Date();
		this.percentComplete = 0;
		this.category = category || messageCategory.none;
	}

	succeeded(theMessage?: string) {
		this.percentComplete = 100;
		this.completed = true;
		this.failed = false;
		this.failedFatally = false;
		this.updateTime = new Date();
		if (theMessage) {
			this.message = theMessage;
		}
	}

	progress(thePercent?: number, theMessage?: string) {
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

	sendFailed(theMessage?: string) {
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

export class ProcessStatusManager {
	itemsToSend: (storedItem | storeType)[] = [];
	itemsToSendMessages: string[] = [];
	itemsSent: (storedItem | storeType)[] = [];
	itemsSentMessages: string[] = [];
	itemsToSendObject: statusMessage[] = [];
	actionsCompleted: statusMessage[] = [];
	itemsFailed: (storedItem | storeType)[] = [];
	itemsFailedMessages: string[] = [];
	actionsFailed: statusMessage[] = [];
	actionsFailedMessages: string[] = [];
	lastMessage = "";
	totalCount = 0;
	percentComplete = 100;
	doneCount = 0;
	editModeActive = false;
	editModesInUse: string[] = [];
	alertActive = false;
	resetTimeout: NodeJS.Timeout | undefined;
	resetOnCompleteAfter = 3 * 1000;

	onChangeCallHandler = new CallbackHandler("sendStatus");

	init() {
		registerforStateChanges(this.onStateChange);
		window.setInterval(this.doTimedUpdates, 2000);
	}
	doTimedUpdates = () => {
		this.updateAlert();
	};

	onStateChange = (type: string, key: string, data: storedItem) => {
		if (key.startsWith("edit-")) {
			const theIndex = this.editModesInUse.indexOf(key);
			if (data && data.getValue() && data.getValue().length > 0) {
				if (theIndex < 0) {
					this.editModesInUse.push(key);
				}
			} else {
				if (theIndex > -1) {
					this.editModesInUse.splice(theIndex, 1);
				}
			}
			this.editModeActive = this.editModesInUse.length > 0;
		}
		this.updateAlert();
	};

	get canClose(): boolean {
		if (this.sendsInProgress || this.editModeActive) {
			return false;
		}
		return true;
	}

	updateAlert = () => {
		const canClose = this.canClose;
		if (canClose && this.alertActive) {
			this.removeAlert();
		} else if (!canClose && !this.alertActive) {
			this.addAlert();
		}
	};

	addAlert = () => {
		this.alertActive = true;
		window.addEventListener("beforeunload", unloadHandler);
	};

	removeAlert = () => {
		window.removeEventListener("beforeunload", unloadHandler);
		this.alertActive = false;
	};

	itemWillSend = (item: storedItem | storeType, message?: string, category?: messageCategory) => {
		printData(item, messageLevels.debug, "Item Will Send");
		printData(message, messageLevels.debug, "Item Will Send message");
		const itemIndex = this.itemsToSend.indexOf(item);
		if (itemIndex > -1) {
			this.itemsToSendMessages.splice(itemIndex, 1);
			this.itemsToSendMessages[itemIndex] = message || "";
		} else {
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

	itemSucceed = (item: storedItem | storeType, message?: string) => {
		let theItem: statusMessage | null = null;
		const itemIndex = this.itemsToSend.indexOf(item);
		if (itemIndex > -1) {
			theItem = this.itemsToSendObject[itemIndex];
		}
		theItem?.succeeded();
		this.itemIsSent(item, message);
	};

	itemFailed = (item: storedItem | storeType, message?: string) => {
		let theItem: statusMessage | null = null;
		const itemIndex = this.itemsToSend.indexOf(item);
		if (itemIndex > -1) {
			theItem = this.itemsToSendObject[itemIndex];
		}
		theItem?.sendFailed();
		this.itemHasFailed(item, message);
	};

	itemIsSent = (item: storedItem | storeType, message?: string) => {
		this.itemsSent.push(item);
		this.itemsSentMessages.push(message || "");
		const itemIndex = this.itemsToSend.indexOf(item);
		let theItem: statusMessage | null = null;
		if (itemIndex > -1) {
			this.itemsToSend.splice(itemIndex, 1);
			this.itemsToSendMessages.splice(itemIndex, 1);
			theItem = this.itemsToSendObject[itemIndex];
			this.itemsToSendObject.splice(itemIndex, 1);
			this.doneCount += 1;
		}
		if (theItem?.failed) {
			this.actionsFailed.push(theItem);
		}
		if (theItem?.completed) {
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
	itemHasFailed = (item: storedItem | storeType, message?: string) => {
		this.itemsFailed.push(item);
		this.itemsFailedMessages.push(message || "");
		const itemIndex = this.itemsToSend.indexOf(item);
		let theItem: statusMessage | null = null;
		if (itemIndex > -1) {
			this.itemsToSend.splice(itemIndex, 1);
			this.itemsToSendMessages.splice(itemIndex, 1);
			theItem = this.itemsToSendObject[itemIndex];
			this.itemsToSendObject.splice(itemIndex, 1);
			this.doneCount += 1;
		}
		if (theItem?.failed) {
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
		printData(this.itemsSentMessages, messageLevels.warning);
	}
	dumpToDo() {
		printData(this.itemsToSendMessages, messageLevels.warning);
	}
	registerOnChange(call: Function) {
		this.onChangeCallHandler.registerOnEvent(call);
		// this.onChangeCall.push(call);
	}
	removeOnChange(call: Function) {
		this.onChangeCallHandler.removeOnEvent(call);
	}
	resetCount() {
		if (this.percentComplete < 100) {
			clearTimeout(this.resetTimeout);
		} else {
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
const unloadHandler = (event: any) => {
	console.log("UNLOAD:2");
	event.returnValue = "Page is busy"; //"Any text"; //true; //false;
};
