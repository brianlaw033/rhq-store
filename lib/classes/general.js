"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addClass = exports.classInit = void 0;
const storedItem_1 = require("../storedItem");
const authority_1 = require("./authority");
const Mode_1 = require("./Mode");
const classes = {
    authorities: authority_1.authority,
    modes: Mode_1.appMode,
};
function classInit(objectType, data, doNotStore) {
    const classConstructor = classes[objectType.name];
    if (!classConstructor) {
        return new storedItem_1.storedItem(objectType, data, doNotStore);
    }
    return new classConstructor(objectType, data, doNotStore);
}
exports.classInit = classInit;
// allow adding extra classes
function addClass(name, classConstructor) {
    classes[name] = classConstructor;
}
exports.addClass = addClass;
