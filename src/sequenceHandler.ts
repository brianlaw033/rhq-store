import { printData, printMessage } from "./remotehq";
import { storedItem } from "./storedItem";
import { messageLevels } from "./types";

export interface IStage {
	function: Function;
	checkFunction?: Function;
	requiredStages?: string[];
	inProgress: boolean;
	done: boolean;
	succeeded: boolean;
	callbacks?: Function[];
	index: number;
}

interface IStages {
	[key: string]: IStage;
}

export class sequenceHandler {
	stages: IStages = {};
	stageNames: string[] = [];
	requestedStage = "";
	requestedStageIndex = -1;
	currentStageIndex = -1;
	lastStageIndex = -1;
	itemToSend: storedItem | null = null;
	completedCallbacks: Function[] = [];

	addStage(stageName: string, stageProcess: Function, conditionsCheck?: Function) {
		const theStage: IStage = {
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
	addCallbackForStage(stageName: string, callback: Function) {
		const theStage = this.stages[stageName];
		if (theStage && theStage !== undefined) {
			if (!theStage.callbacks || theStage.callbacks === undefined) {
				theStage.callbacks = [callback];
			} else {
				theStage.callbacks.push(callback);
			}
		}
	}
	removeCallbackForStage(stageName: string, callback: Function) {
		const theStage = this.stages[stageName];
		if (theStage && theStage !== undefined) {
			if (!theStage.callbacks || theStage.callbacks === undefined) {
				return;
			} else {
				const theIndex = Array.prototype.indexOf(callback);

				if(theIndex > -1) {
					theStage.callbacks.splice(theIndex);
				}
				
			}
		}
	}

	addCompletionCallback(callback: Function) {
		if (!this.completedCallbacks || this.completedCallbacks === undefined) {
			this.completedCallbacks = [callback];
		} else {
			this.completedCallbacks.push(callback);
		}
	}

	doCallbacks = (stageName: string, stage: IStage) => {
		if (stage.callbacks) {
			printMessage("Callbacks for " + stage.index, messageLevels.debug);
			stage.callbacks.forEach((call) => {
				call(stageName, this.itemToSend);
			});
		}
	};

	requestStep = (stageName: string) => {
		const theIndex = this.stages[stageName].index;
		printMessage("Request stage: " + stageName + " " + theIndex, messageLevels.debug);

		if (this.requestedStageIndex < theIndex) {
			this.requestedStage = stageName;
			this.requestedStageIndex = theIndex;

			this.doStep();
		}
	};
	stageKeys = () => {
		return Object.keys(this.stages);
	};
	stageCount = (): number => {
		return this.stageKeys.length;
	};
	requestCompletion = () => {
		const theKeys = this.stageKeys();
		const theIndex = theKeys.length - 1;
		const stageName = theKeys[theIndex];
		if (this.requestedStageIndex < theIndex) {
			this.requestedStage = stageName;
			this.requestedStageIndex = theIndex;
			this.doStep();
		}
	};

	completed = () => {
		if (this.completedCallbacks) {
			printMessage("Completed callbacks", messageLevels.debug);
			this.completedCallbacks.forEach((call) => {
				if (call) {
					call("Done", this.itemToSend);
				}
			});
		}
	};

	doStep = () => {
		if (this.currentStageIndex < 0) {
			this.currentStageIndex = this.currentStageIndex + 1;
		}
		if (this.requestedStageIndex >= this.currentStageIndex) {
			const theStage = this.stages[this.stageNames[this.currentStageIndex]];
			const stepName = Object.keys(this.stages)[this.currentStageIndex];
			printData(stepName, messageLevels.debug, "Do Step:");
			if (theStage.done && this.requestedStageIndex > this.currentStageIndex) {
				printMessage("stage done increment and re-fire doStep", messageLevels.debug);
				this.currentStageIndex = this.currentStageIndex + 1;
				window.setTimeout(() => {
					this.doStep();
				}, 100);
			} else if (theStage.done) {
				printMessage("stage done stop", messageLevels.debug);
				return;
			} else if (theStage.inProgress) {
				printMessage("stage in progress stop", messageLevels.debug);
				return;
			} else {
				theStage.inProgress = true;
				printMessage("Start stage", messageLevels.debug);
				theStage.function(this.stepFinished, stepName);
			}
		}
	};
	stepFinished = (stageName: string, succeded: boolean) => {
		const stageNumber = this.stageKeys().indexOf(stageName);
		printMessage(
			stageName + " finished: " + (succeded ? "succeeded" : "failed"),
			messageLevels.debug,
		);
		if (stageNumber > -1) {
			const theStage = this.stages[stageName];
			if (theStage) {
				theStage.inProgress = false;
				theStage.succeeded = succeded;
				printMessage(stageNumber + " of " + this.lastStageIndex, messageLevels.debug);
				if (succeded) {
					theStage.done = true;

					this.doCallbacks(stageName, theStage);

					if (stageNumber >= this.lastStageIndex) {
						this.completed();
					} else {
						window.setTimeout(() => {
							this.doStep();
						}, 100);
					}
				}
			}
		}
	};
}
