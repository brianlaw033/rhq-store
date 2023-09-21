import { printData, printMessage } from "../remotehq";
import { storedItem } from "../storedItem";
import { messageLevels, actionNameToNumber, objectNameToNumber, actionNames } from "../types";

export class user extends storedItem {
    _regionPermissions: { [name: string]: number[] } | null = null;
    _objectPermissions: { [name: number]: number[] } | null = null;
    _regionAllPermissions: number[] | null = null;
    _objectAllPermissions: number[] | null = null;

    get isDisabled() {
       return this.getValue("status") === "disabled";
    }
    get permissionsObject () {
        if (this.getValue("_permissions")) {
            return this.getValue("_permissions");
        }
        const theUserPermissions = this.getValue("permissions");

        let thePermissions;

        if(typeof theUserPermissions === "string") {
            try {
                (this as any)._permissions = JSON.parse(theUserPermissions);
                printData((this as any)._permissions, messageLevels.debug,"_permissions")
                return (this as any)._permissions;
            } catch (err) {
                printMessage("Couldnt decode user permissions", messageLevels.error);
                return null;
            }
            
        } else {
            thePermissions = theUserPermissions;
            return thePermissions;
        }
        
    }
    get regionPermissions () {
        return this.permissionsObject.regions;
    }
    get objectPermissions () {
        return this.permissionsObject.objects;
    }
    get regionPermissionsDecoded ():  { [name: string]: number[] } {
        if(this._regionPermissions) {
            return this._regionPermissions;
        }
        const thePermissions = this.regionPermissions;
        const decodedPermissions: { [name: string]: number[] } = {};
       
        Object.keys(thePermissions).forEach((key: string) => {
            const theValues = thePermissions[key];
            const theValuesNums: number[] = actionsArrayToNumbersArray(theValues);
            if(key === "all") {
                this._regionAllPermissions = theValuesNums;
            } else {
                decodedPermissions[key] = theValuesNums;
            }

            printData(key,messageLevels.debug);
            printData(thePermissions[key],messageLevels.debug);
        })
        printData(decodedPermissions,messageLevels.debug);
        this._regionPermissions = decodedPermissions;
        return this._regionPermissions;
    };
    get regionAllPermissions () {
        if(this._regionAllPermissions) {
            return this._regionAllPermissions;
        }
        const theRegionPermissions = this.regionPermissionsDecoded;
        printData(theRegionPermissions,messageLevels.debug);
        return this._regionAllPermissions;
    } 
    get objectAllPermissions () {
        if(this._objectAllPermissions) {
            return this._objectAllPermissions;
        }
        const theObjectPermissions = this.objectPermissionsDecoded;
        printData(theObjectPermissions,messageLevels.debug);
        return this._objectAllPermissions;
    } 
    get objectPermissionsDecoded (): { [name: number]: number[] } {
        if(this._objectPermissions) {
            return this._objectPermissions;
        }
        const thePermissions = this.objectPermissions;
        const decodedPermissions: { [name: number]: number[] } = {};

        Object.keys(thePermissions).forEach((key: string) => {
            const theValues = thePermissions[key];
           
            const theValuesNums: number[] = actionsArrayToNumbersArray(theValues);
            if(key === "all") {
                this._objectAllPermissions = theValuesNums;
            } else {
                const objectNumber = objectNameToNumber(key);
                decodedPermissions[objectNumber] = theValuesNums;
            }
            printData(key,messageLevels.debug);
            printData(thePermissions[key],messageLevels.debug);
        })
        
        this._objectPermissions = decodedPermissions;
        printData(this._objectPermissions, messageLevels.debug, "object permissions");
        return this._objectPermissions;
    }
}

function actionsArrayToNumbersArray(actions: string[]):number[] {
    const theValuesNums: number[] = [];
    if(actions.length === 1 && actions[0] === "all") {
        for (let x = 1; x < actionNames.length; x++) {
            theValuesNums.push(x);
        }
    } else {
        actions.forEach((item: string) => {
            const theNumber = actionNameToNumber(item);
            if(theNumber > -1) {
                theValuesNums.push(theNumber);
            }
        });
    }
    return theValuesNums;
}