import { Buffer } from "buffer";

import { printMessage } from "../remotehq";
import { messageLevels } from "../types";
import { storedItem } from "../storedItem";

export const throttle = (func: Function, delay: number) => {
	let inThrottle: boolean;
	let timeout: NodeJS.Timeout | undefined;
	return (...args: any[]) => {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			clearTimeout(timeout);
			timeout = setTimeout(function () {
				inThrottle = false;
			}, delay);
		}
	};
};

export const chunk = (
	arr: any[],
	chunkSize = 1,
	cache: any[] = [],
	middleware?: (arr: any[]) => any,
) => {
	const tmp = [...arr];
	if (chunkSize <= 0) return cache;
	let tmpChunk = tmp.splice(0, chunkSize);
	if (middleware) tmpChunk = middleware(tmpChunk);
	while (tmp.length) cache.push(tmpChunk);
	return cache;
};

export const debounce = (func: Function, delay: number) => {
	let timeout: NodeJS.Timeout | undefined;
	return (...args: any[]) => {
		return new Promise((resolve, reject) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				try {
					const output = func(...args);
					resolve(output);
				} catch (err) {
					console.error(err);
					reject(err);
				}
			}, delay);
		});
	};
};

export const utf8_to_b64 = (str: string) =>
	window.btoa(decodeURIComponent(encodeURIComponent(str)));

export const removeHash = () => window.history.replaceState(null, "", " ");

export const base64Decode = (data: string) => {
	let text = "";
	if (typeof data !== "undefined") {
		try {
			const buff = Buffer.from(data, "base64");
			text = buff.toString("ascii");
		} catch (err) {
			printMessage(err, messageLevels.error);
		}
		return text;
	}
	return "";
};

export function keyNotSet(item: storedItem, key: string) {
	const theValue = item.getValue(key);
	if (!theValue || theValue === undefined || theValue === "") {
		return true;
	}
	return false;
}

export const timeZone = "Pacific/Auckland";