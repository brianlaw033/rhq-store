"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeZone = exports.keyNotSet = exports.base64Decode = exports.removeHash = exports.utf8_to_b64 = exports.debounce = exports.chunk = exports.throttle = void 0;
const buffer_1 = require("buffer");
const remotehq_1 = require("../remotehq");
const types_1 = require("../types");
const throttle = (func, delay) => {
    let inThrottle;
    let timeout;
    return (...args) => {
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
exports.throttle = throttle;
const chunk = (arr, chunkSize = 1, cache = [], middleware) => {
    const tmp = [...arr];
    if (chunkSize <= 0)
        return cache;
    let tmpChunk = tmp.splice(0, chunkSize);
    if (middleware)
        tmpChunk = middleware(tmpChunk);
    while (tmp.length)
        cache.push(tmpChunk);
    return cache;
};
exports.chunk = chunk;
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        return new Promise((resolve, reject) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                try {
                    const output = func(...args);
                    resolve(output);
                }
                catch (err) {
                    console.error(err);
                    reject(err);
                }
            }, delay);
        });
    };
};
exports.debounce = debounce;
const utf8_to_b64 = (str) => window.btoa(decodeURIComponent(encodeURIComponent(str)));
exports.utf8_to_b64 = utf8_to_b64;
const removeHash = () => window.history.replaceState(null, "", " ");
exports.removeHash = removeHash;
const base64Decode = (data) => {
    let text = "";
    if (typeof data !== "undefined") {
        try {
            const buff = buffer_1.Buffer.from(data, "base64");
            text = buff.toString("ascii");
        }
        catch (err) {
            (0, remotehq_1.printMessage)(err, types_1.messageLevels.error);
        }
        return text;
    }
    return "";
};
exports.base64Decode = base64Decode;
function keyNotSet(item, key) {
    const theValue = item.getValue(key);
    if (!theValue || theValue === undefined || theValue === "") {
        return true;
    }
    return false;
}
exports.keyNotSet = keyNotSet;
exports.timeZone = "Pacific/Auckland";
