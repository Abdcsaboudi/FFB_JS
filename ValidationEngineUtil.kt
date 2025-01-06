package com.leadingpoint.ffb.core.util

import android.content.Context
import androidx.compose.runtime.MutableState
import com.leadingpoint.ffb.R
import com.leadingpoint.ffb.core.data.model.FormResponseItem
import com.leadingpoint.ffb.core.constants.enums.FfbComponentsTypes
import com.leadingpoint.ffb.core.util.helpers.TranslationManager.getTranslation

internal object ValidationEngineUtil {
    fun validateField(
        context:Context,
        field: FormResponseItem,
        fieldValue: MutableState<Any?>?,
        fieldStatesObject: MutableState<FieldStates>?,
    ): String? {
        if(field.type == FfbComponentsTypes.customview.name){
            return checkCustomValidation(field,fieldValue,context)
        }
        if (field.validation != null)
            return when {
                checkRequired(field,fieldValue) -> field.validation.customMessage?.ifEmpty { "${field.validation.errorLabel?.ifEmpty { field.label }} ${context.getTranslation(
                    R.string.ffb_required_error)}" } ?: "${field.label} ${context.getTranslation(
                    R.string.ffb_required_error)}"
                checkMin(field,fieldValue) -> field.validation.customMessage?.ifEmpty { "${field.validation.errorLabel?.ifEmpty { field.label }} ${context.getTranslation(R.string.ffb_minimum_value_error)} ${parseNumber(field.validation.min.toString())}." } ?: "${ field.label } ${context.getTranslation(R.string.ffb_minimum_value_error)} ${parseNumber(field.validation.min.toString())}."
                checkMax(field,fieldValue) -> field.validation.customMessage?.ifEmpty { "${field.validation.errorLabel?.ifEmpty { field.label }} ${context.getTranslation(R.string.ffb_maximum_value_error)} ${parseNumber(field.validation.max.toString())}." } ?: "${ field.label } ${context.getTranslation(R.string.ffb_maximum_value_error)} ${parseNumber(field.validation.max.toString())}."
                field.validation.regex != null && fieldValue?.value.toString()
                    .isNotEmpty() && !fieldValue?.value.toString()
                    .matches(field.validation.regex.toRegex()) -> field.validation.customMessage?.ifEmpty { "${field.validation.errorLabel?.ifEmpty { field.label }} ${context.getTranslation(R.string.ffb_regex_error)}" }

                field.validation.maxLength != null && ((fieldValue?.value as String).length.toDouble()) > field.validation.maxLength -> field.validation.customMessage?.ifEmpty { "${field.validation.errorLabel?.ifEmpty { field.label }} ${context.getTranslation(R.string.ffb_max_length_error)} ${field.validation.maxLength} ${context.getTranslation(R.string.ffb_characters)}." } ?: "${field.label } ${context.getTranslation(R.string.ffb_max_length_error)} ${field.validation.maxLength} ${context.getTranslation(R.string.ffb_characters)}."
                field.validation.minLength != null && ((fieldValue?.value as String).length.toDouble()) < field.validation.minLength -> field.validation.customMessage?.ifEmpty { "${field.validation.errorLabel?.ifEmpty { field.label }} ${context.getTranslation(R.string.ffb_min_length_error)} ${field.validation.minLength} ${context.getTranslation(R.string.ffb_characters)}." } ?: "${field.label } ${context.getTranslation(R.string.ffb_min_length_error)} ${field.validation.minLength} ${context.getTranslation(R.string.ffb_characters)}."
                fieldStatesObject?.value?.isRequired ?: false && (fieldValue?.value == false || fieldValue?.value == null || fieldValue.value.toString()
                    .isEmpty()) -> field.validation.customMessage?.ifEmpty { "${field.validation.errorLabel?.ifEmpty { field.label }} ${context.getTranslation(
                    R.string.ffb_required_error)}" } ?: "${field.label} ${context.getTranslation(
                    R.string.ffb_required_error)}"
                else -> null
            }
        else if (fieldStatesObject != null)
            return when {
                fieldStatesObject.value.isRequired && (fieldValue?.value == null || fieldValue.value.toString()
                    .isEmpty()) -> fieldStatesObject.value.validationMessage.ifEmpty { field.errorMessage }

                else -> null
            }
        else return null
    }

    private fun checkCustomValidation(field: FormResponseItem, fieldValue: MutableState<Any?>?, context: Context): String? {

        val customValidatorResult = CustomComponentRegistry.getCustomValidator(field.customType)
            ?.invoke(field,fieldValue?.value)

        return if(customValidatorResult?.isValid == false)
            customValidatorResult.message.takeIf { !it.isNullOrEmpty() }?: context.getString(R.string.ffb_invalid_field)
        else
            null

    }

    private fun checkMax(field: FormResponseItem, fieldValue: MutableState<Any?>?): Boolean {
            return field.validation?.max != null && fieldValue?.value.toString().isNotEmpty() && ((fieldValue?.value as String).replace(",","").toDouble()) > field.validation.max
    }

    private fun checkMin(field: FormResponseItem, fieldValue: MutableState<Any?>?): Boolean {
            return  field.validation?.min != null &&  fieldValue?.value.toString().isNotEmpty() && ((fieldValue?.value as String).replace(",","").toDouble()) < field.validation.min
    }
    private fun checkRequired(
        field: FormResponseItem,
        fieldValue: MutableState<Any?>?,
    ): Boolean {
        if(field.type == FfbComponentsTypes.file.name && field.validation?.isOptional == false){
        val values = fieldValue?.value as? List<*>
        if (values.isNullOrEmpty() || values.all { it == null || it.toString().isEmpty() }) {
            return true
        }
        }

        return field.validation?.isOptional == false  && (fieldValue?.value == null || fieldValue.value.toString()
            .isEmpty() || (field.type == FfbComponentsTypes.checkbox.name && fieldValue.value == false))

    }

}