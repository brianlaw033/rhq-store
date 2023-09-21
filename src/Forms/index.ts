import { Style } from "@react-pdf/types";
import { SemanticCOLORS, SemanticICONS } from "semantic-ui-react";
import { IconSizeProp } from "semantic-ui-react/dist/commonjs/elements/Icon/Icon";

import { IQueryParams, messageLevels } from "../types";
import { storedItem } from "../storedItem";
import { printMessage } from "../remotehq";

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
	// formatOptions?: Intl.NumberFormatOptions;
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

export function validateField(validator: any, value: any, fieldName?: string, error?: string) {
	if (!validator(value)) {
		return error;
	}
	return null;
}

export function validateEmail(value: string) {
	// eslint-disable-next-line
	const re = new RegExp(
		// eslint-disable-next-line
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	);
	return re.test(value.toLowerCase().trim());
}

export const isValidString = (value: string) => {
	return value !== null && value !== undefined && value.trim().length > 0;
};

export const isKeySet = (item: storedItem, key: string) => {
	const theValue = item.getValue(key);
	if (Array.isArray(theValue) && !theValue.length) {
		return false;
	}
	if (!theValue || theValue === undefined || theValue === "" || theValue === null) {
		return false;
	}
	if (typeof theValue === "object") {
		if (Object.keys(theValue).length === 0) {
			return false;
		} else {
			if (!(theValue.checked ?? true)) {
				return false;
			}
		}
	}
	return true;
};

export function formFormatNumber(
	value: any,
	formatOptions?: NumberFormatOptions,
	multiplier?: number,
	defaultValue?: string,
): any {
	if (!value) {
		return defaultValue || "-";
	}
	if (isNaN(value)) {
		return value;
	}

	let theValue = value;
	if (multiplier) {
		theValue = theValue * multiplier;
	}
	try {
		theValue = new Intl.NumberFormat("en", formatOptions).format(theValue);
	} catch (e) {
		printMessage(e, messageLevels.error);
	}

	return theValue;
}

export const createValidation = (..._fields: FormFieldProperties[][]): Validation => {
	let errors: { [key: string]: string[] } = {};
	let validateGroups: (boolean | null)[] = [];
	const flattenFields = _fields.flat();
	const fields = _fields;

	const validators: { [key: string]: { validator: Validator; errorMessage: ErrorMsg } } = {
		email: {
			validator: validateEmail,
			errorMessage: () => "Please enter a valid email address",
		},
		phone: {
			validator: (value: string) => !isNaN(Number(value)),
			errorMessage: () => "Please enter a valid phone number",
		},
		number: {
			validator: (value: string) => !isNaN(Number(value)),
			errorMessage: () => "Please enter a valid number",
		},
		checkboxDateRange: {
			validator: (value: any) => {
				if (value?.checked) {
					const dateRange = value.dates?.split(" - ");
					return dateRange?.length === 2;
				}
				return true;
			},
			errorMessage: () => "Please enter a valid date range",
		},
	};

	const validateAll = (form: storedItem, showErrorMsg = true) => {
		const _validateGroups: (boolean | null)[] = [];
		const isValid = fields.reduce((isValid, fieldGroup) => {
			const isGroupValid = fieldGroup.reduce((isGroupValid, field) => {
				return validate(field, form, showErrorMsg) ? isGroupValid : false;
			}, true);
			if (isGroupValid) {
				// is Valid
				_validateGroups.push(isGroupValid);
				return isValid;
			} else if (fieldGroup.some(isFieldHasError)) {
				// has Error message
				_validateGroups.push(isGroupValid);
				return false;
			} else {
				// Invalid but has no error message
				_validateGroups.push(null);
				return false;
			}
		}, true);
		validateGroups = _validateGroups;
		return isValid;
	};

	const validate = (field: FormFieldProperties, form: storedItem, showErrorMsg: boolean) => {
		let isValid = true;
		const value = form.getValue(field.name);
		if (field.mandatory) {
			if (field.type === "block") {
				if (field.mandatory === "some") {
					isValid =
						field.subfields?.some((subfield) => isKeySet(form, subfield.name)) ?? true;
				} else if (field.mandatory || field.mandatory === "all") {
					isValid =
						field.subfields?.every((subfield) => isKeySet(form, subfield.name)) ?? true;
				}
			} else {
				isValid = isKeySet(form, field.name);
			}
			!isValid && showErrorMsg && pushError(field, `Required`);
			isValid && removeError(field, `Required`);
		}
		if (value && field.validator) {
			let error = validateField(field, value, form);
			if (error) {
				isValid = false;
				showErrorMsg && pushError(field, error);
			} else {
				error = getErrorMessageByValidator(field, field.validator);
				removeError(field, error);
			}
		}
		if (field.subfields) {
			const _isValid = field.subfields.every((subfield) =>
				validate(subfield, form, showErrorMsg),
			);
			if (!_isValid) isValid = false;
		}
		return isValid;
	};

	const validateField = (field: FormFieldProperties, value: any, form: storedItem) => {
		const validate = (_validator: any, field: FormFieldProperties) => {
			let validator: Validator;
			let errorMsg: ErrorMsg;
			if (typeof _validator === "string") {
				validator = validators[_validator]?.validator;
				errorMsg = validators[_validator]?.errorMessage;
			} else {
				validator = _validator;
				errorMsg = field.errorMessage;
			}
			if (validator && !validator(value, form)) {
				return errorMsg(field.validateCondition);
			}

			return null;
		};
		if (!value) return;
		if (Array.isArray(field.validator)) {
			const result = field.validator.reduce((validator, acc) => {
				const error = validate(validator, field);
				error && acc.push(error);
				return acc;
			}, []);
			return result.length ? result : null;
		} else {
			return validate(field.validator, field);
		}
	};

	const pushError = (field: FormFieldProperties, error: string | string[]) => {
		if (Array.isArray(error)) {
			error.forEach((e) => pushError(field, e));
			return;
		}
		if (errors[field.name] && errors[field.name].indexOf(error) < 0) {
			errors[field.name].push(error);
		} else {
			errors[field.name] = [error];
		}
	};

	const removeError = (field: FormFieldProperties, error: string | string[]) => {
		if (!errors[field.name]) return;
		if (Array.isArray(error)) {
			error.forEach((e) => removeError(field, e));
			return;
		}
		const errorPosition = errors[field.name].indexOf(error);
		if (errorPosition < 0) return;
		errors[field.name]?.splice(errorPosition, 1);
		if (!errors[field.name].length) {
			delete errors[field.name];
		}
	};

	const hasError = () => Object.keys(errors).length > 0;

	const clearErrors = () => (errors = {});

	const getErrors = () => errors;

	const getErrorByKey = (key: string) => errors[key];

	const _getFieldsByKey = (
		fields: FormFieldProperties[],
	): { [key: string]: FormFieldProperties } =>
		fields.reduce((acc: { [key: string]: FormFieldProperties }, field) => {
			if (field.subfields) {
				return { ...acc, ..._getFieldsByKey(field.subfields) };
			}
			acc[field.name] = field;
			return acc;
		}, {});

	const isFieldHasError = (field: FormFieldProperties): boolean => {
		if (getErrorByKey(field.name)?.length) return true;
		if (field.subfields) {
			return field.subfields?.some((subfield) => isFieldHasError(subfield));
		}
		return false;
	};

	const fieldsByKey = _getFieldsByKey(flattenFields);
	const getFields = () => flattenFields;
	const getFieldsByKey = () => fieldsByKey;
	const getFieldByKey = (key: string) => fieldsByKey[key];
	const getValidateGroups = () => validateGroups;
	const getErrorMessageByValidator = (field: FormFieldProperties, key: string) => {
		if (field.errorMessage) return field.errorMessage;
		return validators[key]?.errorMessage(field.validateCondition);
	};
	return {
		getFields,
		getFieldsByKey,
		getFieldByKey,
		getErrors,
		getErrorByKey,
		validate,
		validateAll,
		clearErrors,
		hasError,
		getValidateGroups,
	};
};
