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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.checkAuthorityForUser = exports.checkLoadedAuthority = exports.checkAuthority = exports.printDataJSON = exports.printData = exports.printMessage = exports.reportError = exports.setMessageLevel = exports.getUserDataSync = void 0;
const types_1 = require("./types");
const index_1 = require("./index");
let messageLevel = types_1.messageLevels.error;
const getUserData = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, index_1.getItem)("user-profile", "");
});
const getUserDataSync = () => {
    const theType = index_1.getStoreTypeByName === null || index_1.getStoreTypeByName === void 0 ? void 0 : (0, index_1.getStoreTypeByName)("user-profile");
    return theType === null || theType === void 0 ? void 0 : theType.itemByKey("");
};
exports.getUserDataSync = getUserDataSync;
/**
 * Set the level at which messages should print. Any messages up to and including this level will write to the console.
 *
 * @param {any} level - the level to print (from the remoteHQ.messageLevels)
 * @returns {any} - no return value
 */
const setMessageLevel = function (level) {
    messageLevel = level;
    (0, exports.printMessage)("Set Messages to:" + messageLevel, types_1.messageLevels.verbose);
};
exports.setMessageLevel = setMessageLevel;
/**
 * Logs an error and prints to console according to message level
 * @param {error} e - the error object.
 * @returns {any}
 */
const reportError = function (e) {
    (0, exports.printMessage)("Error: " + e, types_1.messageLevels.error);
    // printMessage("From function: " + process.env.AWS_LAMBDA_FUNCTION_NAME, messageLevels.debug);}
};
exports.reportError = reportError;
/**
 * Print the message to the console if the message level is appropriate at the current message level.
 * @param {any} message - The message to print
 * @param {any} level - The message level (from remoteHQ.messageLevels)
 * @returns {any} - no returned value
 */
const printMessage = function (message, level) {
    let messageHandler = console.log;
    if (level === types_1.messageLevels.error) {
        messageHandler = console.error;
    }
    else if (level === types_1.messageLevels.warning) {
        messageHandler = console.warn;
    }
    else if (level === types_1.messageLevels.debug) {
        messageHandler = console.debug;
    }
    if (level <= messageLevel) {
        if (message === undefined) {
            messageHandler("Print: undefined");
        }
        else {
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
exports.printMessage = printMessage;
/**
 * Print data to the console if the message level is appropriate at the current message level.
 * @param {any} message - The message to print
 * @param {any} level - The message level (from remoteHQ.messageLevels)
 * @param {any} label - A label to output before the data (otional)
 * @returns {any} - no returned value
 */
const printData = function (data, level, label) {
    if (level <= messageLevel) {
        if (label !== undefined) {
            console.log(label);
        }
        if (data === undefined) {
            console.log("undefined");
        }
        else {
            console.dir(data);
        }
    }
};
exports.printData = printData;
/**
 * Print JSON formatted data to the console if the message level is appropriate at the current message level.
 * @param {any} message - The message to print
 * @param {any} level - The message level (from remoteHQ.messageLevels)
 * @param {any} label - A label to output before the data (otional)
 * @returns {any} - no returned value
 */
const printDataJSON = function (data, level, label) {
    if (level <= messageLevel) {
        if (label !== undefined) {
            console.log(label);
        }
        if (data === undefined) {
            console.log("undefined");
        }
        else {
            console.log(JSON.stringify(data, typeReplacer));
        }
    }
};
exports.printDataJSON = printDataJSON;
/**
 * Description
 * @param {any} action - the action to be performed (from remoteHQ.actions)
 * @param {any} object - the object involved (from remoteHQ.objects)
 * @param {any} record - the ID idetifying the relevant object
 * @param {any} region - the ID of the region being affected
 * @returns {boolean}  - True if action allowed, false if disallowed
 */
const checkAuthority = function (action, object, record, region) {
    return __awaiter(this, void 0, void 0, function* () {
        // printMessage("Getting authority for: " + userUUID(), messageLevels.debug);
        (0, exports.printMessage)("To do: " + action, types_1.messageLevels.debug);
        (0, exports.printMessage)("To : " + object, types_1.messageLevels.debug);
        (0, exports.printMessage)("With Record ID : " + record, types_1.messageLevels.debug);
        (0, exports.printMessage)("In region : " + region, types_1.messageLevels.debug);
        let theUser = null;
        theUser = (yield getUserData());
        if (theUser) {
            return (0, exports.checkAuthorityForUser)(theUser, action, object, record, region);
        }
        return false;
    });
};
exports.checkAuthority = checkAuthority;
const checkLoadedAuthority = function (action, object, record, region) {
    // printMessage("Getting authority for: " + userUUID(), messageLevels.verbose);
    (0, exports.printMessage)("To do: " + action, types_1.messageLevels.debug);
    (0, exports.printMessage)("To : " + object, types_1.messageLevels.debug);
    (0, exports.printMessage)("With Record ID : " + record, types_1.messageLevels.debug);
    (0, exports.printMessage)("In region : " + region, types_1.messageLevels.debug);
    let theUser = null;
    theUser = (0, exports.getUserDataSync)();
    if (theUser) {
        return (0, exports.checkAuthorityForUser)(theUser, action, object, record, region);
    }
    return false;
};
exports.checkLoadedAuthority = checkLoadedAuthority;
const checkAuthorityForUser = function (user, action, object, record, region) {
    // printMessage("Getting authority for: " + userUUID(), messageLevels.debug);
    (0, exports.printMessage)("To do: " + action, types_1.messageLevels.debug);
    (0, exports.printMessage)("With Record ID : " + record, types_1.messageLevels.debug);
    (0, exports.printMessage)("In region : " + region, types_1.messageLevels.debug);
    if (typeof object === "string") {
        if ((0, types_1.objectNameToNumber)(object) < 0) {
            (0, exports.printMessage)("To : " + object, types_1.messageLevels.verbose);
        }
        object = (0, types_1.objectNameToNumber)(object);
    }
    const theUser = user;
    const objectName = types_1.objectNames[object];
    const actionName = types_1.actionNames[action];
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
    if (object === types_1.objects.forestManager) {
        if (region === "NZ-MBH") {
            reason = "forest Mmanager not shown in Marlborough";
            return false;
        }
        else {
            reason = "Forest manager publically visible in most regions";
            return true;
        }
    }
    if (theUser) {
        // this.printData(theUser, messageLevels.debug,"The user : " );
        if (!theUser.isDisabled) {
            (0, exports.printMessage)("User not disabled", types_1.messageLevels.debug);
            // const theUserPermissions = theUser.getValue("permissions");
        }
        else {
            reason = "User access disabled";
            return false;
        }
        let regionAllowed = false;
        let objectAllowed = false;
        if (region && region !== "") {
            if (theRegionPermissions[region]) {
                (0, exports.printData)(theRegionPermissions[region], types_1.messageLevels.debug, "region permisssions");
                if (theRegionPermissions[region]) {
                    if (theRegionPermissions[region].indexOf(action) > -1) {
                        (0, exports.printData)(region + " has " + actionName, types_1.messageLevels.debug);
                        regionAllowed = true;
                    }
                }
                else if (theRegionAllPermissions &&
                    theRegionAllPermissions.indexOf(action) > -1) {
                    (0, exports.printData)("all regions has " + actionName, types_1.messageLevels.debug);
                    regionAllowed = true;
                }
            }
            if (!regionAllowed) {
                reason += "User has no permission to " + actionName + " in " + region + ". ";
            }
        }
        else {
            regionAllowed = true;
            (0, exports.printMessage)("No region specified so allowed", types_1.messageLevels.debug);
        }
        if (object > -1) {
            if (theObjectPermissions[object]) {
                if (theObjectPermissions[object].indexOf(action) > -1) {
                    (0, exports.printData)(objectName + " has " + actionName, types_1.messageLevels.debug);
                    objectAllowed = true;
                }
            }
            else if (theObjectAllPermissions && theObjectAllPermissions.indexOf(action) > -1) {
                (0, exports.printData)("all objects has " + actionName, types_1.messageLevels.debug);
                objectAllowed = true;
            }
            if (!objectAllowed) {
                reason += "User has no permission to " + actionName + " " + objectName;
                (0, exports.printMessage)("Reason : " + reason, types_1.messageLevels.debug);
            }
        }
        allowed = regionAllowed && objectAllowed;
        if (!allowed) {
            (0, exports.printMessage)("Allowed : " + allowed, types_1.messageLevels.debug);
            (0, exports.printData)(reason, types_1.messageLevels.debug, "Reason");
            (0, exports.printData)(objectName, types_1.messageLevels.debug, "objectString : ");
        }
        else {
            // if(reason !== lastReason) {
            // 	printMessage("Allowed : " + allowed, messageLevels.debug);
            // 	printMessage("Reason : " + reason, messageLevels.debug);
            // 	lastReason = reason;
            // }
        }
    }
    else {
        reason = "Error: no user data available";
        (0, exports.printMessage)("Allowed : " + allowed, types_1.messageLevels.debug);
        (0, exports.printMessage)("Reason : " + reason, types_1.messageLevels.debug);
    }
    return allowed;
};
exports.checkAuthorityForUser = checkAuthorityForUser;
const getUser = () => (0, exports.getUserDataSync)();
exports.getUser = getUser;
function typeReplacer(key, value) {
    // Filtering out properties
    if (key === "_type") {
        return "-> " + value.name;
    }
    return value;
}
