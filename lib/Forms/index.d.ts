import { Style } from "@react-pdf/types";
import { SemanticCOLORS, SemanticICONS } from "semantic-ui-react";
import { IconSizeProp } from "semantic-ui-react/dist/commonjs/elements/Icon/Icon";
import { IQueryParams } from "../types";
import { storedItem } from "../storedItem";
export interface NumberFormatOptions {
    localeMatcher?: string;
    style?: string;
    unit?: string;
    currency?: string;
    currencyDisplay?: string;
    useGrouping?: boolean;
    minimumIntegerDigits?: number;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    minimumSignificantDigits?: number;
    maximumSignificantDigits?: number;
}
export interface FormFieldProperties {
    name: string;
    label?: string;
    type: string;
    tooltip?: string;
    description?: string;
    mandatory?: boolean | "some" | "every";
    validator?: any;
    errorMessage?: any;
    choices?: string[];
    subfields?: FormFieldProperties[];
    conditional?: IQueryParams;
    acceptedFileTypes?: string[];
    error?: string;
    showInDisplay?: boolean;
    showInEdit?: boolean;
    allowEdit?: boolean;
    formatOptions?: NumberFormatOptions;
    defaultValue?: string;
    scale?: number;
    style?: Style;
    validateCondition?: string;
    customGetHeader?: (item: storedItem, field: FormFieldProperties) => string | null | undefined;
    icon?: SemanticICONS;
    color?: SemanticCOLORS | undefined;
    size?: IconSizeProp | undefined;
}
export interface FormPageItemProps {
    title: string;
    fields: FormFieldProperties[];
    conditions?: IQueryParams;
    showInDisplay?: boolean;
    style?: Style;
    validIcon?: SemanticICONS;
    invalidIcon?: SemanticICONS;
    remember?: boolean;
    description?: string;
    hidden?: boolean;
    type?: string;
}
export interface FormItemProps {
    item: storedItem;
    index?: any;
    field: FormFieldProperties;
    updateFormData?: any;
    error?: any;
    displayMode?: boolean;
    style?: Style;
}
export interface FormItemComponentProps {
    item?: storedItem | null;
    index?: any;
    field: FormFieldProperties;
    container?: any;
    updateFormData?: any;
    error?: any;
    displayMode?: boolean;
    setDirty?: any;
    setValue?: any;
    page?: FormPageItemProps;
    onCancel?(): void;
}
export interface FormBlockProps {
    item?: storedItem | null;
    index: number;
    field: FormFieldProperties;
    container?: any;
    updateFormData?: any;
    errors?: string[];
    displayMode?: boolean;
    setValue?: any;
    setDirty?: any;
    changed?: boolean;
    style?: Style;
    page?: FormPageItemProps;
}
export interface ItemContextProps {
    visible?: boolean;
    minimize?: boolean;
    item?: storedItem | null;
    container?: any;
    title: string;
    formID?: string;
    pages?: FormPageItemProps[];
    onSubmit?: any;
    onCancel?: any;
    displayMode?: boolean;
    target?: any;
    styles?: any;
}
export interface MultipageFormProps {
    item?: storedItem | null;
    title: string;
    container?: any;
    pages: FormPageItemProps[];
    onSubmit?: any;
    onCancel?: any;
    displayMode?: boolean;
    setDirty?: any;
    renderMiddleButtons?: any;
}
export type Validator = (value: any, form?: storedItem) => boolean;
export type ErrorMsg = (condition?: string) => string;
export interface Validation {
    getFields: () => FormFieldProperties[];
    getFieldsByKey: () => {
        [key: string]: FormFieldProperties;
    };
    getFieldByKey: (key: string) => FormFieldProperties;
    getErrors: () => {
        [key: string]: string[];
    };
    getErrorByKey: (key: string) => string[];
    validateAll: (form: storedItem, showErrorMsg?: boolean) => boolean;
    validate: (field: FormFieldProperties, form: storedItem, showErrorMsg: boolean) => boolean;
    hasError: () => boolean;
    clearErrors: () => void;
    getValidateGroups: () => (boolean | null)[];
}
export declare function validateField(validator: any, value: any, fieldName?: string, error?: string): string | null | undefined;
export declare function validateEmail(value: string): boolean;
export declare const isValidString: (value: string) => boolean;
export declare const isKeySet: (item: storedItem, key: string) => boolean;
export declare function formFormatNumber(value: any, formatOptions?: NumberFormatOptions, multiplier?: number, defaultValue?: string): any;
export declare const createValidation: (..._fields: FormFieldProperties[][]) => Validation;
