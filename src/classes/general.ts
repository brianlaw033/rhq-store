import { storedItem } from "../storedItem";
import { storeType } from "../storeType";
import { authority } from "./authority";
import { appMode } from "./Mode";

interface IClasses {
	[id: string]: typeof storedItem
}

const classes: IClasses = {
	authorities: authority,
	modes: appMode,
}

export function classInit(objectType: storeType, data: any, doNotStore?: boolean): storedItem {
	const classConstructor = classes[objectType.name]
	if (!classConstructor) {
        return new storedItem(objectType, data, doNotStore);
    }
	return new classConstructor(objectType, data, doNotStore);
}

// allow adding extra classes
export function addClass (name: string, classConstructor: typeof storedItem) {
	classes[name] = classConstructor;
}