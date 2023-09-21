import { storedItem } from "../storedItem";
export declare const throttle: (func: Function, delay: number) => (...args: any[]) => void;
export declare const chunk: (arr: any[], chunkSize?: number, cache?: any[], middleware?: ((arr: any[]) => any) | undefined) => any[];
export declare const debounce: (func: Function, delay: number) => (...args: any[]) => Promise<unknown>;
export declare const utf8_to_b64: (str: string) => string;
export declare const removeHash: () => void;
export declare const base64Decode: (data: string) => string;
export declare function keyNotSet(item: storedItem, key: string): boolean;
export declare const timeZone = "Pacific/Auckland";
