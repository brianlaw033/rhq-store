import {
	actionNames,
	actions,
	messageLevels,
	objectNameToNumber,
	objectNames,
	objects,
} from "./types";
import { getItem, getStoreTypeByName } from "./index";
import { user } from "./classes/user";

let messageLevel = messageLevels.error;

const getUserData = async () => {
	return await getItem("user-profile", "");
};
export const getUserDataSync = () => {
	const theType = getStoreTypeByName?.("user-profile");
	return theType?.itemByKey("");
};

/**
 * Set the level at which messages should print. Any messages up to and including this level will write to the console.
 *
 * @param {any} level - the level to print (from the remoteHQ.messageLevels)
 * @returns {any} - no return value
 */
export const setMessageLevel = function (level: messageLevels) {
	messageLevel = level;
	printMessage("Set Messages to:" + messageLevel, messageLevels.verbose);
};

/**
 * Logs an error and prints to console according to message level
 * @param {error} e - the error object.
 * @returns {any}
 */
export const reportError = function (e: Error | any) {
	printMessage("Error: " + e, messageLevels.error);
	// printMessage("From function: " + process.env.AWS_LAMBDA_FUNCTION_NAME, messageLevels.debug);}
};

/**
 * Print the message to the console if the message level is appropriate at the current message level.
 * @param {any} message - The message to print
 * @param {any} level - The message level (from remoteHQ.messageLevels)
 * @returns {any} - no returned value
 */
export const printMessage = function (message: any, level: messageLevels) {
	let messageHandler = console.log;
	if (level === messageLevels.error) {
		messageHandler = console.error;
	} else if (level === messageLevels.warning) {
		messageHandler = console.warn;
	} else if (level === messageLevels.debug) {
		messageHandler = console.debug;
	}
	if (level <= messageLevel) {
		if (message === undefined) {
			messageHandler("Print: undefined");
		} else {
			const chunkSize = 90;
			const maxLines = 10;
			if (typeof message === "object") {
				message = JSON.stringify(message, typeReplacer);
			}
			if (message.length <= chunkSize) {
				messageHandler("Print: ", message);
				return;
			}
			let line = 1;
			while (message.length > 0 && line <= maxLines) {
				messageHandler(line + ": " + message.substring(0, chunkSize));
				message = message.substring(chunkSize, message.length);
				line = line + 1;
			}
			if (message.length > 0) {
				messageHandler("...");
			}
		}
	}
};

/**
 * Print data to the console if the message level is appropriate at the current message level.
 * @param {any} message - The message to print
 * @param {any} level - The message level (from remoteHQ.messageLevels)
 * @param {any} label - A label to output before the data (otional)
 * @returns {any} - no returned value
 */
export const printData = function (data: any, level: messageLevels, label?: string) {
	if (level <= messageLevel) {
		if (label !== undefined) {
			console.log(label);
		}
		if (data === undefined) {
			console.log("undefined");
		} else {
			console.dir(data);
		}
	}
};
/**
 * Print JSON formatted data to the console if the message level is appropriate at the current message level.
 * @param {any} message - The message to print
 * @param {any} level - The message level (from remoteHQ.messageLevels)
 * @param {any} label - A label to output before the data (otional)
 * @returns {any} - no returned value
 */
export const printDataJSON = function (data: any, level: messageLevels, label?: string) {
	if (level <= messageLevel) {
		if (label !== undefined) {
			console.log(label);
		}
		if (data === undefined) {
			console.log("undefined");
		} else {
			console.log(JSON.stringify(data, typeReplacer));
		}
	}
};

/**
 * Description
 * @param {any} action - the action to be performed (from remoteHQ.actions)
 * @param {any} object - the object involved (from remoteHQ.objects)
 * @param {any} record - the ID idetifying the relevant object
 * @param {any} region - the ID of the region being affected
 * @returns {boolean}  - True if action allowed, false if disallowed
 */
export const checkAuthority = async function (
	action: actions,
	object: objects,
	record?: any,
	region?: string,
) {
	// printMessage("Getting authority for: " + userUUID(), messageLevels.debug);
	printMessage("To do: " + action, messageLevels.debug);
	printMessage("To : " + object, messageLevels.debug);
	printMessage("With Record ID : " + record, messageLevels.debug);
	printMessage("In region : " + region, messageLevels.debug);

	let theUser = null;

	theUser = (await getUserData()) as any;
	if (theUser) {
		return checkAuthorityForUser(theUser, action, object, record, region);
	}
	return false;
};
export const checkLoadedAuthority = function (
	action: actions,
	object: objects,
	record?: any,
	region?: string,
) {
	// printMessage("Getting authority for: " + userUUID(), messageLevels.verbose);
	printMessage("To do: " + action, messageLevels.debug);
	printMessage("To : " + object, messageLevels.debug);
	printMessage("With Record ID : " + record, messageLevels.debug);
	printMessage("In region : " + region, messageLevels.debug);

	let theUser = null;
	theUser = getUserDataSync() as any;
	if (theUser) {
		return checkAuthorityForUser(theUser, action, object, record, region);
	}
	return false;
};
export const checkAuthorityForUser = function (
	user: user,
	action: actions,
	object: objects,
	record?: any,
	region?: string,
) {
	// printMessage("Getting authority for: " + userUUID(), messageLevels.debug);
	printMessage("To do: " + action, messageLevels.debug);

	printMessage("With Record ID : " + record, messageLevels.debug);
	printMessage("In region : " + region, messageLevels.debug);
	if (typeof object === "string") {
		if (objectNameToNumber(object) < 0) {
			printMessage("To : " + object, messageLevels.verbose);
		}
		object = objectNameToNumber(object);
	}
	const theUser = user as user;
	const objectName = objectNames[object];
	const actionName = actionNames[action];

	// var theRegions = {};
	const theRegionPermissions = user.regionPermissionsDecoded;
	const theObjectPermissions = user.objectPermissionsDecoded;

	const theRegionAllPermissions = user.regionAllPermissions;
	const theObjectAllPermissions = user.objectAllPermissions;

	let allowed = false;
	// var isLoggedIn = isLoggedIn();
	// let disabled = false;
	let reason = "";

	// overrides
	if (object === objects.forestManager) {
		if (region === "NZ-MBH") {
			reason = "forest Mmanager not shown in Marlborough";
			return false;
		} else {
			reason = "Forest manager publically visible in most regions";
			return true;
		}
	}
	if (theUser) {
		// this.printData(theUser, messageLevels.debug,"The user : " );
		if (!theUser.isDisabled) {
			printMessage("User not disabled", messageLevels.debug);
			// const theUserPermissions = theUser.getValue("permissions");
		} else {
			reason = "User access disabled";
			return false;
		}
		let regionAllowed = false;
		let objectAllowed = false;
		if (region && region !== "") {
			if (theRegionPermissions[region]) {
				printData(theRegionPermissions[region], messageLevels.debug, "region permisssions");
				if (theRegionPermissions[region]) {
					if (theRegionPermissions[region].indexOf(action) > -1) {
						printData(region + " has " + actionName, messageLevels.debug);
						regionAllowed = true;
					}
				} else if (
					theRegionAllPermissions &&
					theRegionAllPermissions.indexOf(action) > -1
				) {
					printData("all regions has " + actionName, messageLevels.debug);
					regionAllowed = true;
				}
			}
			if (!regionAllowed) {
				reason += "User has no permission to " + actionName + " in " + region + ". ";
			}
		} else {
			regionAllowed = true;
			printMessage("No region specified so allowed", messageLevels.debug);
		}

		if (object > -1) {
			if (theObjectPermissions[object]) {
				if (theObjectPermissions[object].indexOf(action) > -1) {
					printData(objectName + " has " + actionName, messageLevels.debug);
					objectAllowed = true;
				}
			} else if (theObjectAllPermissions && theObjectAllPermissions.indexOf(action) > -1) {
				printData("all objects has " + actionName, messageLevels.debug);
				objectAllowed = true;
			}

			if (!objectAllowed) {
				reason += "User has no permission to " + actionName + " " + objectName;
				printMessage("Reason : " + reason, messageLevels.debug);
			}
		}

		allowed = regionAllowed && objectAllowed;
		if (!allowed) {
			printMessage("Allowed : " + allowed, messageLevels.debug);
			printData(reason, messageLevels.debug, "Reason");

			printData(objectName, messageLevels.debug, "objectString : ");
		} else {
			// if(reason !== lastReason) {
			// 	printMessage("Allowed : " + allowed, messageLevels.debug);
			// 	printMessage("Reason : " + reason, messageLevels.debug);
			// 	lastReason = reason;
			// }
		}
	} else {
		reason = "Error: no user data available";
		printMessage("Allowed : " + allowed, messageLevels.debug);
		printMessage("Reason : " + reason, messageLevels.debug);
	}
	return allowed;
};

export const getUser = () => getUserDataSync();

function typeReplacer(key: any, value: any) {
	// Filtering out properties

	if (key === "_type") {
		return "-> " + value.name;
	}
	return value;
}
