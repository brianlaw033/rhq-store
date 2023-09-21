"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authority = void 0;
const storedItem_1 = require("../storedItem");
class authority extends storedItem_1.storedItem {
    getParent() {
        const theParent = this.getRelatedItems("boundaries", this.getRegionISO(), "iso")[0];
        return theParent;
    }
    ;
    get formattedPhoneNumber() {
        return formattedPhoneNumber(this.getValue("phone_number"));
    }
    get formattedFaxNumber() {
        return formattedPhoneNumber(this.getValue("fax"));
    }
}
exports.authority = authority;
const formattedPhoneNumber = (phone) => {
    if (!phone)
        return '';
    const tmp = [...phone.toString()];
    tmp.splice(0, 0, '0');
    tmp.splice(2, 0, ' ');
    tmp.splice(6, 0, ' ');
    return tmp.join('');
};
