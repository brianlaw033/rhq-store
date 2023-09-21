import { actions, messageLevels, objects } from "./types";
import { user } from "./classes/user";
export declare const getUserDataSync: () => import("./storedItem").storedItem | undefined;
/**
 * Set the level at which messages should print. Any messages up to and including this level will write to the console.
 *
 * @param {any} level - the level to print (from the remoteHQ.messageLevels)
 * @returns {any} - no return value
 */
export declare const setMessageLevel: (level: messageLevels) => void;
/**
 * Logs an error and prints to console according to message level
 * @param {error} e - the error object.
 * @returns {any}
 */
export declare const reportError: (e: Error | any) => void;
/**
 * Print the message to the console if the message level is appropriate at the current message level.
 * @param {any} message - The message to print
 * @param {any} level - The message level (from remoteHQ.messageLevels)
 * @returns {any} - no returned value
 */
export declare const printMessage: (message: any, level: messageLevels) => void;
/**
 * Print data to the console if the message level is appropriate at the current message level.
 * @param {any} message - The message to print
 * @param {any} level - The message level (from remoteHQ.messageLevels)
 * @param {any} label - A label to output before the data (otional)
 * @returns {any} - no returned value
 */
export declare const printData: (data: any, level: messageLevels, label?: string) => void;
/**
 * Print JSON formatted data to the console if the message level is appropriate at the current message level.
 * @param {any} message - The message to print
 * @param {any} level - The message level (from remoteHQ.messageLevels)
 * @param {any} label - A label to output before the data (otional)
 * @returns {any} - no returned value
 */
export declare const printDataJSON: (data: any, level: messageLevels, label?: string) => void;
/**
 * Description
 * @param {any} action - the action to be performed (from remoteHQ.actions)
 * @param {any} object - the object involved (from remoteHQ.objects)
 * @param {any} record - the ID idetifying the relevant object
 * @param {any} region - the ID of the region being affected
 * @returns {boolean}  - True if action allowed, false if disallowed
 */
export declare const checkAuthority: (action: actions, object: objects, record?: any, region?: string) => Promise<boolean>;
export declare const checkLoadedAuthority: (action: actions, object: objects, record?: any, region?: string) => boolean;
export declare const checkAuthorityForUser: (user: user, action: actions, object: objects, record?: any, region?: string) => boolean;
export declare const getUser: () => import("./storedItem").storedItem | undefined;
