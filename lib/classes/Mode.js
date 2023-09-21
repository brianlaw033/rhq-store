"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appMode = void 0;
const __1 = require("..");
const storedItem_1 = require("../storedItem");
class appMode extends storedItem_1.storedItem {
    disableMode() {
    }
    setupMode() {
        const dataRequests = this.getValue("data_requests");
        if (dataRequests) {
            dataRequests.forEach((type) => {
                (0, __1.requestLoad)(type);
            });
        }
    }
}
exports.appMode = appMode;
