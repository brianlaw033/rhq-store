import { storedItem } from "../storedItem";
export declare class authority extends storedItem {
    getParent(): storedItem;
    get formattedPhoneNumber(): string;
    get formattedFaxNumber(): string;
}
