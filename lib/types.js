"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageLevels = exports.objectNameToNumber = exports.sortDirection = exports.sortMethod = exports.objectNames = exports.objects = exports.actionNameToNumber = exports.actionNames = exports.actions = void 0;
var actions;
(function (actions) {
    actions[actions["none"] = 0] = "none";
    actions[actions["create"] = 1] = "create";
    actions[actions["retrieve"] = 2] = "retrieve";
    actions[actions["update"] = 3] = "update";
    actions[actions["delete"] = 4] = "delete";
})(actions = exports.actions || (exports.actions = {}));
exports.actionNames = ["none",
    "create",
    "retrieve",
    "update",
    "delete"];
function actionNameToNumber(theName) {
    const theItemNumber = exports.actionNames.indexOf(theName);
    return theItemNumber;
}
exports.actionNameToNumber = actionNameToNumber;
// object IDs for permissions
var objects;
(function (objects) {
    objects[objects["none"] = 0] = "none";
    objects[objects["country"] = 1] = "country";
    objects[objects["state"] = 2] = "state";
    objects[objects["region"] = 3] = "region";
    objects[objects["forest"] = 4] = "forest";
    objects[objects["forestBlock"] = 5] = "forestBlock";
    objects[objects["consent"] = 6] = "consent";
    objects[objects["ortho"] = 7] = "ortho";
    objects[objects["elevationModel"] = 8] = "elevationModel";
    objects[objects["blockBoundary"] = 9] = "blockBoundary";
    objects[objects["panorama"] = 10] = "panorama";
    objects[objects["task"] = 11] = "task";
    objects[objects["aoe"] = 12] = "aoe";
    objects[objects["aof"] = 13] = "aof";
    objects[objects["aoc"] = 14] = "aoc";
    objects[objects["quarry"] = 15] = "quarry";
    objects[objects["consentedRoad"] = 16] = "consentedRoad";
    objects[objects["consentedTrack"] = 17] = "consentedTrack";
    objects[objects["consentedSkid"] = 18] = "consentedSkid";
    objects[objects["consentedStreamCrossing"] = 19] = "consentedStreamCrossing";
    objects[objects["asBuiltRoad"] = 20] = "asBuiltRoad";
    objects[objects["asBuiltTrack"] = 21] = "asBuiltTrack";
    objects[objects["asBuiltSkid"] = 22] = "asBuiltSkid";
    objects[objects["asBuiltStreamCrossing"] = 23] = "asBuiltStreamCrossing";
    objects[objects["waterControl"] = 24] = "waterControl";
    objects[objects["forestBlockReport"] = 25] = "forestBlockReport";
    objects[objects["inspectionFeatureEditor"] = 26] = "inspectionFeatureEditor";
    objects[objects["dashboard"] = 27] = "dashboard";
    objects[objects["nesForm"] = 28] = "nesForm";
    objects[objects["forestOwnership"] = 29] = "forestOwnership";
    objects[objects["forestManager"] = 30] = "forestManager";
    objects[objects["nesPFForm"] = 31] = "nesPFForm";
    objects[objects["admin"] = 98] = "admin";
    objects[objects["debug"] = 99] = "debug";
})(objects = exports.objects || (exports.objects = {}));
exports.objectNames = [
    "none",
    "country",
    "state",
    "region",
    "forest",
    "forestBlock",
    "consent",
    "ortho",
    "elevationModel",
    "blockBoundary",
    "panorama",
    "task",
    "aoe",
    "aof",
    "aoc",
    "quarry",
    "consentedRoad",
    "consentedTrack",
    "consentedSkid",
    "consentedStreamCrossing",
    "asBuiltRoad",
    "asBuiltTrack",
    "asBuiltSkid",
    "asBuiltStreamCrossing",
    "waterControl",
    "forestBlockReport",
    "inspectionFeatureEditor",
    "dashboard",
    "nesForm",
    "forestOwnership",
    "forestManager",
    "nesPFForm"
];
exports.objectNames[98] = "admin";
exports.objectNames[99] = "debug";
var sortMethod;
(function (sortMethod) {
    sortMethod[sortMethod["any"] = 0] = "any";
    sortMethod[sortMethod["alpha"] = 1] = "alpha";
    sortMethod[sortMethod["numeric"] = 2] = "numeric";
    sortMethod[sortMethod["date"] = 3] = "date";
})(sortMethod = exports.sortMethod || (exports.sortMethod = {}));
;
var sortDirection;
(function (sortDirection) {
    sortDirection[sortDirection["ascending"] = 0] = "ascending";
    sortDirection[sortDirection["descending"] = 1] = "descending";
})(sortDirection = exports.sortDirection || (exports.sortDirection = {}));
;
;
function objectNameToNumber(theName) {
    const theItemNumber = exports.objectNames.indexOf(theName);
    return theItemNumber;
}
exports.objectNameToNumber = objectNameToNumber;
// levels at which the message system will report
var messageLevels;
(function (messageLevels) {
    messageLevels[messageLevels["none"] = 0] = "none";
    messageLevels[messageLevels["error"] = 1] = "error";
    messageLevels[messageLevels["warning"] = 2] = "warning";
    messageLevels[messageLevels["verbose"] = 3] = "verbose";
    messageLevels[messageLevels["debug"] = 4] = "debug";
})(messageLevels = exports.messageLevels || (exports.messageLevels = {}));
