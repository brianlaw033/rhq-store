"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValidation = exports.formFormatNumber = exports.isKeySet = exports.isValidString = exports.validateEmail = exports.validateField = void 0;
const types_1 = require("../types");
const remotehq_1 = require("../remotehq");
function validateField(validator, value, fieldName, error) {
    if (!validator(value)) {
        return error;
    }
    return null;
}
exports.validateField = validateField;
function validateEmail(value) {
    // eslint-disable-next-line
    const re = new RegExp(
    // eslint-disable-next-line
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    return re.test(value.toLowerCase().trim());
}
exports.validateEmail = validateEmail;
const isValidString = (value) => {
    return value !== null && value !== undefined && value.trim().length > 0;
};
exports.isValidString = isValidString;
const isKeySet = (item, key) => {
    var _a;
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
        }
        else {
            if (!((_a = theValue.checked) !== null && _a !== void 0 ? _a : true)) {
                return false;
            }
        }
    }
    return true;
};
exports.isKeySet = isKeySet;
function formFormatNumber(value, formatOptions, multiplier, defaultValue) {
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
    }
    catch (e) {
        (0, remotehq_1.printMessage)(e, types_1.messageLevels.error);
    }
    return theValue;
}
exports.formFormatNumber = formFormatNumber;
const createValidation = (..._fields) => {
    let errors = {};
    let validateGroups = [];
    const flattenFields = _fields.flat();
    const fields = _fields;
    const validators = {
        email: {
            validator: validateEmail,
            errorMessage: () => "Please enter a valid email address",
        },
        phone: {
            validator: (value) => !isNaN(Number(value)),
            errorMessage: () => "Please enter a valid phone number",
        },
        number: {
            validator: (value) => !isNaN(Number(value)),
            errorMessage: () => "Please enter a valid number",
        },
        checkboxDateRange: {
            validator: (value) => {
                var _a;
                if (value === null || value === void 0 ? void 0 : value.checked) {
                    const dateRange = (_a = value.dates) === null || _a === void 0 ? void 0 : _a.split(" - ");
                    return (dateRange === null || dateRange === void 0 ? void 0 : dateRange.length) === 2;
                }
                return true;
            },
            errorMessage: () => "Please enter a valid date range",
        },
    };
    const validateAll = (form, showErrorMsg = true) => {
        const _validateGroups = [];
        const isValid = fields.reduce((isValid, fieldGroup) => {
            const isGroupValid = fieldGroup.reduce((isGroupValid, field) => {
                return validate(field, form, showErrorMsg) ? isGroupValid : false;
            }, true);
            if (isGroupValid) {
                // is Valid
                _validateGroups.push(isGroupValid);
                return isValid;
            }
            else if (fieldGroup.some(isFieldHasError)) {
                // has Error message
                _validateGroups.push(isGroupValid);
                return false;
            }
            else {
                // Invalid but has no error message
                _validateGroups.push(null);
                return false;
            }
        }, true);
        validateGroups = _validateGroups;
        return isValid;
    };
    const validate = (field, form, showErrorMsg) => {
        var _a, _b, _c, _d;
        let isValid = true;
        const value = form.getValue(field.name);
        if (field.mandatory) {
            if (field.type === "block") {
                if (field.mandatory === "some") {
                    isValid =
                        (_b = (_a = field.subfields) === null || _a === void 0 ? void 0 : _a.some((subfield) => (0, exports.isKeySet)(form, subfield.name))) !== null && _b !== void 0 ? _b : true;
                }
                else if (field.mandatory || field.mandatory === "all") {
                    isValid =
                        (_d = (_c = field.subfields) === null || _c === void 0 ? void 0 : _c.every((subfield) => (0, exports.isKeySet)(form, subfield.name))) !== null && _d !== void 0 ? _d : true;
                }
            }
            else {
                isValid = (0, exports.isKeySet)(form, field.name);
            }
            !isValid && showErrorMsg && pushError(field, `Required`);
            isValid && removeError(field, `Required`);
        }
        if (value && field.validator) {
            let error = validateField(field, value, form);
            if (error) {
                isValid = false;
                showErrorMsg && pushError(field, error);
            }
            else {
                error = getErrorMessageByValidator(field, field.validator);
                removeError(field, error);
            }
        }
        if (field.subfields) {
            const _isValid = field.subfields.every((subfield) => validate(subfield, form, showErrorMsg));
            if (!_isValid)
                isValid = false;
        }
        return isValid;
    };
    const validateField = (field, value, form) => {
        const validate = (_validator, field) => {
            var _a, _b;
            let validator;
            let errorMsg;
            if (typeof _validator === "string") {
                validator = (_a = validators[_validator]) === null || _a === void 0 ? void 0 : _a.validator;
                errorMsg = (_b = validators[_validator]) === null || _b === void 0 ? void 0 : _b.errorMessage;
            }
            else {
                validator = _validator;
                errorMsg = field.errorMessage;
            }
            if (validator && !validator(value, form)) {
                return errorMsg(field.validateCondition);
            }
            return null;
        };
        if (!value)
            return;
        if (Array.isArray(field.validator)) {
            const result = field.validator.reduce((validator, acc) => {
                const error = validate(validator, field);
                error && acc.push(error);
                return acc;
            }, []);
            return result.length ? result : null;
        }
        else {
            return validate(field.validator, field);
        }
    };
    const pushError = (field, error) => {
        if (Array.isArray(error)) {
            error.forEach((e) => pushError(field, e));
            return;
        }
        if (errors[field.name] && errors[field.name].indexOf(error) < 0) {
            errors[field.name].push(error);
        }
        else {
            errors[field.name] = [error];
        }
    };
    const removeError = (field, error) => {
        var _a;
        if (!errors[field.name])
            return;
        if (Array.isArray(error)) {
            error.forEach((e) => removeError(field, e));
            return;
        }
        const errorPosition = errors[field.name].indexOf(error);
        if (errorPosition < 0)
            return;
        (_a = errors[field.name]) === null || _a === void 0 ? void 0 : _a.splice(errorPosition, 1);
        if (!errors[field.name].length) {
            delete errors[field.name];
        }
    };
    const hasError = () => Object.keys(errors).length > 0;
    const clearErrors = () => (errors = {});
    const getErrors = () => errors;
    const getErrorByKey = (key) => errors[key];
    const _getFieldsByKey = (fields) => fields.reduce((acc, field) => {
        if (field.subfields) {
            return Object.assign(Object.assign({}, acc), _getFieldsByKey(field.subfields));
        }
        acc[field.name] = field;
        return acc;
    }, {});
    const isFieldHasError = (field) => {
        var _a, _b;
        if ((_a = getErrorByKey(field.name)) === null || _a === void 0 ? void 0 : _a.length)
            return true;
        if (field.subfields) {
            return (_b = field.subfields) === null || _b === void 0 ? void 0 : _b.some((subfield) => isFieldHasError(subfield));
        }
        return false;
    };
    const fieldsByKey = _getFieldsByKey(flattenFields);
    const getFields = () => flattenFields;
    const getFieldsByKey = () => fieldsByKey;
    const getFieldByKey = (key) => fieldsByKey[key];
    const getValidateGroups = () => validateGroups;
    const getErrorMessageByValidator = (field, key) => {
        var _a;
        if (field.errorMessage)
            return field.errorMessage;
        return (_a = validators[key]) === null || _a === void 0 ? void 0 : _a.errorMessage(field.validateCondition);
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
exports.createValidation = createValidation;
