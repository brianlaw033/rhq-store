import { storedItem } from "../storedItem";
import { IQueryParams, ISortParams, sortDirection, sortMethod } from "../types";
import { EntryList } from "./EntryList";

export interface IStats {
	min?: number;
	max?: number;
	avg?: number;
	total?: number;
	count?: number;
}
export interface IEntry {
	value: any;
	key: any;
	count: number;
	items?: storedItem[];
}

export function sortItemArray(
	theList: storedItem[],
	queryParams: IQueryParams | ISortParams,
): storedItem[] {
	let sortParams: ISortParams | undefined;

	if ((queryParams as IQueryParams)?.sort) {
		sortParams = (queryParams as IQueryParams)?.sort;
	} else {
		sortParams = queryParams as ISortParams;
	}
	if (!sortParams) {
		return theList;
	}
	if (!sortParams.sortField || sortParams.sortField === "") {
		// printMessage ("No sort",messageLevels.verbose);
		return theList;
	}
	const sortfield = sortParams.sortField;

	let sortMult = 1;
	if (sortParams.sortDirection == sortDirection.descending) {
		sortMult = -1;
	}
	if (!sortfield || sortfield === "") {
		// printMessage ("No sort",messageLevels.verbose);
		return theList;
	}
	let defaultValue: any;

	switch (sortParams.sortMethod) {
		case sortMethod.numeric:
			if (sortParams.defaultSortValue) {
				defaultValue = parseFloat(sortParams.defaultSortValue);
			}
			return sortItemsAsNumber(
				theList,
				sortParams.sortField || "primaryKey",
				sortMult,
				defaultValue,
			);
		case sortMethod.alpha:
			if (sortParams.defaultSortValue) {
				defaultValue = sortParams.defaultSortValue.toString();
			}
			return sortItemsAsAlpha(
				theList,
				sortParams.sortField || "primaryKey",
				sortMult,
				defaultValue,
			);
		case sortMethod.date:
			return sortItemsAsDate(
				theList,
				sortParams.sortField || "primaryKey",
				sortMult,
				defaultValue,
			);
		default:
			return sortItemsRaw(
				theList,
				sortParams.sortField || "primaryKey",
				sortMult,
				parseFloat(defaultValue),
			);
	}
}

function sortItemsAsNumber(
	theList: storedItem[],
	sortField: string,
	sortMult: number,
	defaultValue: number,
) {
	const sortedList = theList.sort((a, b) => {
		let numA = parseFloat(a.getValue(sortField) || defaultValue);
		let numB = parseFloat(b.getValue(sortField) || defaultValue);
		if (isNaN(numA)) {
			numA = defaultValue || 0;
		}
		if (isNaN(numB)) {
			numB = defaultValue || 0;
		}

		if (numA < numB) {
			return -1 * sortMult;
		}
		if (numA > numB) {
			return sortMult;
		}
		// vals must be equal
		return 0;
	});
	return sortedList;
}

function sortItemsAsDate(
	theList: storedItem[],
	sortField: string,
	sortMult: number,
	defaultValue: Date,
) {
	return theList.sort((a, b) => {
		const dateA = new Date(a.getValue(sortField)) || defaultValue; // ignore upper and lowercase
		const dateB = new Date(b.getValue(sortField)) || defaultValue; // ignore upper and lowercase

		if (dateA < dateB) {
			return -1 * sortMult;
		}
		if (dateA > dateB) {
			return 1 * sortMult;
		}
		// names must be equal
		return 0;
	});
}

function sortItemsAsAlpha(
	theList: storedItem[],
	sortField: string,
	sortMult: number,
	defaultValue: string,
) {
	return theList.sort((a, b) => {
		const strA = a.getValue(sortField)
			? (a.getValue(sortField) || defaultValue).toString().toLowerCase()
			: ""; // ignore upper and lowercase
		const strB = b.getValue(sortField)
			? (b.getValue(sortField) || defaultValue).toString().toLowerCase()
			: ""; // ignore upper and lowercase

		if (strA < strB) {
			return -1 * sortMult;
		}
		if (strA > strB) {
			return sortMult;
		}
		// names must be equal
		return 0;
	});
}
function sortItemsRaw(
	theList: storedItem[],
	sortField: string,
	sortMult: number,
	defaultValue: any,
) {
	return theList.sort((a, b) => {
		const valA = a.getValue(sortField) || defaultValue; // ignore upper and lowercase
		const valB = b.getValue(sortField) || defaultValue; // ignore upper and lowercase

		if (valA < valB) {
			return -1 * sortMult;
		}
		if (valA > valB) {
			return 1 * sortMult;
		}
		// names must be equal
		return 0;
	});
}

// list of no storedItems handlers

export function sortArray(theList: any[], queryParams: IQueryParams | ISortParams): storedItem[] {
	let sortParams: ISortParams | undefined;

	if ((queryParams as IQueryParams)?.sort) {
		sortParams = (queryParams as IQueryParams)?.sort;
	} else {
		sortParams = queryParams as ISortParams;
	}
	if (!sortParams) {
		return theList;
	}
	if (!sortParams.sortField || sortParams.sortField === "") {
		// printMessage ("No sort",messageLevels.verbose);
		return theList;
	}
	const sortfield = sortParams.sortField;

	let sortMult = 1;
	if (sortParams.sortDirection == sortDirection.descending) {
		sortMult = -1;
	}
	if (!sortfield || sortfield === "") {
		// printMessage ("No sort",messageLevels.verbose);
		return theList;
	}
	const defaultValue: any = "";

	switch (sortParams.sortMethod) {
		case sortMethod.numeric:
			return sortAsNumber(theList, sortParams.sortField, sortMult, parseFloat(defaultValue));
		case sortMethod.alpha:
			return sortAsAlpha(theList, sortParams.sortField, sortMult, defaultValue.toString());
		case sortMethod.date:
			return sortAsDate(theList, sortParams.sortField, sortMult, defaultValue);
		default:
			return sortRaw(theList, sortParams.sortField, sortMult, parseFloat(defaultValue));
	}
}

function sortAsNumber(theList: any[], sortField: string, sortMult: number, defaultValue: number) {
	return theList.sort(function (a, b) {
		const numA = parseFloat(a[sortField] || defaultValue); // ignore upper and lowercase
		const numB = parseFloat(b[sortField] || defaultValue); // ignore upper and lowercase

		if (numA < numB) {
			return -1 * sortMult;
		}
		if (numA > numB) {
			return 1 * sortMult;
		}
		// names must be equal
		return 0;
	});
}
function sortAsDate(theList: any[], sortField: string, sortMult: number, defaultValue: Date) {
	return theList.sort(function (a, b) {
		const dateA = new Date(a[sortField]) || defaultValue; // ignore upper and lowercase
		const dateB = new Date(b[sortField]) || defaultValue; // ignore upper and lowercase

		if (dateA < dateB) {
			return -1 * sortMult;
		}
		if (dateA > dateB) {
			return 1 * sortMult;
		}
		// names must be equal
		return 0;
	});
}
function sortAsAlpha(theList: any[], sortField: string, sortMult: number, defaultValue: string) {
	return theList.sort(function (a, b) {
		const strA = a[sortField] ? (a[sortField] || defaultValue).toString().toLowerCase() : ""; // ignore upper and lowercase
		const strB = b[sortField] ? (b[sortField] || defaultValue).toString().toLowerCase() : ""; // ignore upper and lowercase

		if (strA < strB) {
			return -1 * sortMult;
		}
		if (strA > strB) {
			return 1 * sortMult;
		}
		// names must be equal
		return 0;
	});
}
function sortRaw(theList: any[], sortField: string, sortMult: number, defaultValue: any) {
	return theList.sort(function (a, b) {
		const valA = a[sortField] || defaultValue; // ignore upper and lowercase
		const valB = b[sortField] || defaultValue; // ignore upper and lowercase

		if (valA < valB) {
			return -1 * sortMult;
		}
		if (valA > valB) {
			return 1 * sortMult;
		}
		// names must be equal
		return 0;
	});
}

export function listStats(theData: storedItem[], key: string): IStats {
	let count = theData.length;
	if (count < 1) {
		return { max: 0, min: 0, count: count, total: 0, avg: 0 };
	}
	let total = 0;
	let max = 0;
	let min = 100000;
	count = 0;

	theData.forEach((element) => {
		const theValue = parseFloat(element.getValue(key));
		if (typeof theValue === "number" && !isNaN(theValue)) {
			total += theValue;
			max = Math.max(max, theValue);
			min = Math.min(min, theValue);
			count += 1;
		}
	});
	const average = total / count;

	return { max: max, min: min, count: count, total: total, avg: average };
}

export function listValues(theData: storedItem[], key: string, split?: boolean): EntryList {
	const theList = new EntryList();
	// printData(split,messageLevels.verbose,"Split");
	theData.forEach((element) => {
		let theValue = element.getValue(key);

		if (split && typeof theValue === "string") {
			theValue = theValue.split(",");
		}
		if (theValue && theValue !== undefined) {
			if (Array.isArray(theValue)) {
				theValue.forEach((item) => {
					const theTrimmed = item.trim();
					theList.add(theTrimmed, theTrimmed);
				});
			} else {
				theList.add(theValue, theValue);
			}
		}
	});

	return theList;
}
