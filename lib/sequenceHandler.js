"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceHandler = void 0;
const remotehq_1 = require("./remotehq");
const types_1 = require("./types");
class sequenceHandler {
    constructor() {
        this.stages = {};
        this.stageNames = [];
        this.requestedStage = "";
        this.requestedStageIndex = -1;
        this.currentStageIndex = -1;
        this.lastStageIndex = -1;
        this.itemToSend = null;
        this.completedCallbacks = [];
        this.doCallbacks = (stageName, stage) => {
            if (stage.callbacks) {
                (0, remotehq_1.printMessage)("Callbacks for " + stage.index, types_1.messageLevels.debug);
                stage.callbacks.forEach((call) => {
                    call(stageName, this.itemToSend);
                });
            }
        };
        this.requestStep = (stageName) => {
            const theIndex = this.stages[stageName].index;
            (0, remotehq_1.printMessage)("Request stage: " + stageName + " " + theIndex, types_1.messageLevels.debug);
            if (this.requestedStageIndex < theIndex) {
                this.requestedStage = stageName;
                this.requestedStageIndex = theIndex;
                this.doStep();
            }
        };
        this.stageKeys = () => {
            return Object.keys(this.stages);
        };
        this.stageCount = () => {
            return this.stageKeys.length;
        };
        this.requestCompletion = () => {
            const theKeys = this.stageKeys();
            const theIndex = theKeys.length - 1;
            const stageName = theKeys[theIndex];
            if (this.requestedStageIndex < theIndex) {
                this.requestedStage = stageName;
                this.requestedStageIndex = theIndex;
                this.doStep();
            }
        };
        this.completed = () => {
            if (this.completedCallbacks) {
                (0, remotehq_1.printMessage)("Completed callbacks", types_1.messageLevels.debug);
                this.completedCallbacks.forEach((call) => {
                    if (call) {
                        call("Done", this.itemToSend);
                    }
                });
            }
        };
        this.doStep = () => {
            if (this.currentStageIndex < 0) {
                this.currentStageIndex = this.currentStageIndex + 1;
            }
            if (this.requestedStageIndex >= this.currentStageIndex) {
                const theStage = this.stages[this.stageNames[this.currentStageIndex]];
                const stepName = Object.keys(this.stages)[this.currentStageIndex];
                (0, remotehq_1.printData)(stepName, types_1.messageLevels.debug, "Do Step:");
                if (theStage.done && this.requestedStageIndex > this.currentStageIndex) {
                    (0, remotehq_1.printMessage)("stage done increment and re-fire doStep", types_1.messageLevels.debug);
                    this.currentStageIndex = this.currentStageIndex + 1;
                    window.setTimeout(() => {
                        this.doStep();
                    }, 100);
                }
                else if (theStage.done) {
                    (0, remotehq_1.printMessage)("stage done stop", types_1.messageLevels.debug);
                    return;
                }
                else if (theStage.inProgress) {
                    (0, remotehq_1.printMessage)("stage in progress stop", types_1.messageLevels.debug);
                    return;
                }
                else {
                    theStage.inProgress = true;
                    (0, remotehq_1.printMessage)("Start stage", types_1.messageLevels.debug);
                    theStage.function(this.stepFinished, stepName);
                }
            }
        };
        this.stepFinished = (stageName, succeded) => {
            const stageNumber = this.stageKeys().indexOf(stageName);
            (0, remotehq_1.printMessage)(stageName + " finished: " + (succeded ? "succeeded" : "failed"), types_1.messageLevels.debug);
            if (stageNumber > -1) {
                const theStage = this.stages[stageName];
                if (theStage) {
                    theStage.inProgress = false;
                    theStage.succeeded = succeded;
                    (0, remotehq_1.printMessage)(stageNumber + " of " + this.lastStageIndex, types_1.messageLevels.debug);
                    if (succeded) {
                        theStage.done = true;
                        this.doCallbacks(stageName, theStage);
                        if (stageNumber >= this.lastStageIndex) {
                            this.completed();
                        }
                        else {
                            window.setTimeout(() => {
                                this.doStep();
                            }, 100);
                        }
                    }
                }
            }
        };
    }
    addStage(stageName, stageProcess, conditionsCheck) {
        const theStage = {
            function: stageProcess,
            checkFunction: conditionsCheck,
            inProgress: false,
            succeeded: false,
            done: false,
            index: this.stageNames.length,
        };
        this.stageNames.push(stageName);
        this.lastStageIndex += 1;
        this.stages[stageName] = theStage;
    }
    addCallbackForStage(stageName, callback) {
        const theStage = this.stages[stageName];
        if (theStage && theStage !== undefined) {
            if (!theStage.callbacks || theStage.callbacks === undefined) {
                theStage.callbacks = [callback];
            }
            else {
                theStage.callbacks.push(callback);
            }
        }
    }
    removeCallbackForStage(stageName, callback) {
        const theStage = this.stages[stageName];
        if (theStage && theStage !== undefined) {
            if (!theStage.callbacks || theStage.callbacks === undefined) {
                return;
            }
            else {
                const theIndex = Array.prototype.indexOf(callback);
                if (theIndex > -1) {
                    theStage.callbacks.splice(theIndex);
                }
            }
        }
    }
    addCompletionCallback(callback) {
        if (!this.completedCallbacks || this.completedCallbacks === undefined) {
            this.completedCallbacks = [callback];
        }
        else {
            this.completedCallbacks.push(callback);
        }
    }
}
exports.sequenceHandler = sequenceHandler;
