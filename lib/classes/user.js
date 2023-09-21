"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.user = void 0;
const remotehq_1 = require("../remotehq");
const storedItem_1 = require("../storedItem");
const types_1 = require("../types");
class user extends storedItem_1.storedItem {
    constructor() {
        super(...arguments);
        this._regionPermissions = null;
        this._objectPermissions = null;
        this._regionAllPermissions = null;
        this._objectAllPermissions = null;
    }
    get isDisabled() {
        return this.getValue("status") === "disabled";
    }
    get permissionsObject() {
        if (this.getValue("_permissions")) {
            return this.getValue("_permissions");
        }
        const theUserPermissions = this.getValue("permissions");
        let thePermissions;
        if (typeof theUserPermissions === "string") {
            try {
                this._permissions = JSON.parse(theUserPermissions);
                (0, remotehq_1.printData)(this._permissions, types_1.messageLevels.debug, "_permissions");
                return this._permissions;
            }
            catch (err) {
                (0, remotehq_1.printMessage)("Couldnt decode user permissions", types_1.messageLevels.error);
                return null;
            }
        }
        else {
            thePermissions = theUserPermissions;
            return thePermissions;
        }
    }
    get regionPermissions() {
        return this.permissionsObject.regions;
    }
    get objectPermissions() {
        return this.permissionsObject.objects;
    }
    get regionPermissionsDecoded() {
        if (this._regionPermissions) {
            return this._regionPermissions;
        }
        const thePermissions = this.regionPermissions;
        const decodedPermissions = {};
        Object.keys(thePermissions).forEach((key) => {
            const theValues = thePermissions[key];
            const theValuesNums = actionsArrayToNumbersArray(theValues);
            if (key === "all") {
                this._regionAllPermissions = theValuesNums;
            }
            else {
                decodedPermissions[key] = theValuesNums;
            }
            (0, remotehq_1.printData)(key, types_1.messageLevels.debug);
            (0, remotehq_1.printData)(thePermissions[key], types_1.messageLevels.debug);
        });
        (0, remotehq_1.printData)(decodedPermissions, types_1.messageLevels.debug);
        this._regionPermissions = decodedPermissions;
        return this._regionPermissions;
    }
    ;
    get regionAllPermissions() {
        if (this._regionAllPermissions) {
            return this._regionAllPermissions;
        }
        const theRegionPermissions = this.regionPermissionsDecoded;
        (0, remotehq_1.printData)(theRegionPermissions, types_1.messageLevels.debug);
        return this._regionAllPermissions;
    }
    get objectAllPermissions() {
        if (this._objectAllPermissions) {
            return this._objectAllPermissions;
        }
        const theObjectPermissions = this.objectPermissionsDecoded;
        (0, remotehq_1.printData)(theObjectPermissions, types_1.messageLevels.debug);
        return this._objectAllPermissions;
    }
    get objectPermissionsDecoded() {
        if (this._objectPermissions) {
            return this._objectPermissions;
        }
        const thePermissions = this.objectPermissions;
        const decodedPermissions = {};
        Object.keys(thePermissions).forEach((key) => {
            const theValues = thePermissions[key];
            const theValuesNums = actionsArrayToNumbersArray(theValues);
            if (key === "all") {
                this._objectAllPermissions = theValuesNums;
            }
            else {
                const objectNumber = (0, types_1.objectNameToNumber)(key);
                decodedPermissions[objectNumber] = theValuesNums;
            }
            (0, remotehq_1.printData)(key, types_1.messageLevels.debug);
            (0, remotehq_1.printData)(thePermissions[key], types_1.messageLevels.debug);
        });
        this._objectPermissions = decodedPermissions;
        (0, remotehq_1.printData)(this._objectPermissions, types_1.messageLevels.debug, "object permissions");
        return this._objectPermissions;
    }
}
exports.user = user;
function actionsArrayToNumbersArray(actions) {
    const theValuesNums = [];
    if (actions.length === 1 && actions[0] === "all") {
        for (let x = 1; x < types_1.actionNames.length; x++) {
            theValuesNums.push(x);
        }
    }
    else {
        actions.forEach((item) => {
            const theNumber = (0, types_1.actionNameToNumber)(item);
            if (theNumber > -1) {
                theValuesNums.push(theNumber);
            }
        });
    }
    return theValuesNums;
}
