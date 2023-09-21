import { storedItem } from "./storedItem";
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
export declare class sequenceHandler {
    stages: IStages;
    stageNames: string[];
    requestedStage: string;
    requestedStageIndex: number;
    currentStageIndex: number;
    lastStageIndex: number;
    itemToSend: storedItem | null;
    completedCallbacks: Function[];
    addStage(stageName: string, stageProcess: Function, conditionsCheck?: Function): void;
    addCallbackForStage(stageName: string, callback: Function): void;
    removeCallbackForStage(stageName: string, callback: Function): void;
    addCompletionCallback(callback: Function): void;
    doCallbacks: (stageName: string, stage: IStage) => void;
    requestStep: (stageName: string) => void;
    stageKeys: () => string[];
    stageCount: () => number;
    requestCompletion: () => void;
    completed: () => void;
    doStep: () => void;
    stepFinished: (stageName: string, succeded: boolean) => void;
}
export {};
