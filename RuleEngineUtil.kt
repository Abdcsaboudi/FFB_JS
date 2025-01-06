package com.leadingpoint.ffb.core.util

import androidx.compose.runtime.MutableState
import com.leadingpoint.ffb.core.constants.enums.FfbComponentsTypes
import com.leadingpoint.ffb.core.data.model.FormResponseItem
import com.leadingpoint.ffb.core.constants.enums.RulesActions
import com.leadingpoint.ffb.core.constants.enums.RulesConditions
import com.leadingpoint.ffb.core.constants.enums.RulesTypes
import com.leadingpoint.ffb.core.data.model.FormIOResponse
import kotlinx.parcelize.RawValue
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

internal object RuleEngineUtil {

    fun evaluateRules(
        field: FormResponseItem,
        allFields: List<FormResponseItem>,
        fieldValueState: Map<String, MutableState<Any?>>,
        fieldsStates: Map<String, MutableState<FieldStates>>,
        fieldErrorMessages: Map<String, MutableState<String?>>
    ) {
        field.rules.forEach { rule ->
            if(!field.components.isNullOrEmpty())
                field.components.forEach {
                    val updatedFields = allFields.toMutableList() + field.components
                    evaluateRules(it,updatedFields,fieldValueState,fieldsStates,fieldErrorMessages)
                }
            if (rule == null)
                return@forEach
            val targetField = allFields.firstOrNull { it.id == rule.condition?.dependsOn }
            var fieldValue = fieldValueState[targetField?.id]?.value
            var ruleValue = rule.condition?.value
            if(fieldValue==null)
                return@forEach
            when (rule.condition?.compareOn) {
                RulesTypes.value.name -> {
                    when (targetField?.type) {

                        FfbComponentsTypes.number.name -> {
                            fieldValue = parseNumber(fieldValue.toString().ifEmpty { null })
                            ruleValue = parseNumber(ruleValue.toString().ifEmpty { null })
                        }


                        FfbComponentsTypes.datetime.name -> {
                            fieldValue = handleValueDateTime(fieldValue, targetField)
                            ruleValue = handleRuleDateTime(targetField, ruleValue)
                        }


                        else -> {
                            if (rule.actions.any { it?.type == RulesActions.filter.name }) {
                                ruleValue =
                                    field.data?.values?.filter { it?.relatedWith == fieldValueState[targetField?.id]?.value }
                            } else {
                                fieldValue = fieldValue.toString()
                                ruleValue = ruleValue.toString()
                            }
                        }
                    }
                }

                RulesTypes.length.name -> {
                    fieldValue = fieldValue.toString().length.toDouble()
                    ruleValue = ruleValue.toString().toDouble()
                }

                else -> {
                    //empty block
                }
            }

            val condition = handleConditions(rule.condition?.operator, fieldValue, ruleValue)


            applyActions(
                fieldValueState[field.id],
                rule.actions,
                fieldsStates,
                condition,
                ruleValue,
                fieldErrorMessages
            )
        }
    }

     fun handleRuleDateTime(targetField: FormResponseItem, ruleValue: @RawValue Any?): Date {
        val rule = if (targetField.validation?.enableDate == false)
            parseTime(ruleValue.toString()) as Date
        else if (targetField.validation?.enableTime == false)
            parseDate(ruleValue.toString()) as Date
        else {
            parseDateTime(ruleValue.toString()) as Date
        }
        return rule
    }

     fun handleValueDateTime(fieldValue: Any?, targetField: FormResponseItem): Date {
        val value = if ((fieldValue as? Date == null)) {
            Calendar.getInstance().time
        } else {
            if (targetField.validation?.enableDate == false)
                formatTime(fieldValue)
            else if (targetField.validation?.enableTime == false)
                formatDate(fieldValue)
            else {
                formatDateTime(fieldValue)
            }
        }
        return value
    }


    fun handleConditions(operator: String?, fieldValue: Any?, value: Any?): Boolean {
        if(fieldValue == null || value == null)
            return false
        return when (operator) {
            RulesConditions.eq.name -> {
                when {
                    fieldValue is Number && value is Number -> {
                        fieldValue.toDouble() == value.toDouble()
                    }

                    fieldValue is Date && value is Date -> {
                        fieldValue == value
                    }

                    fieldValue is List<*> || value is List<*> -> {
                        true
                    }

                    else -> {
                        fieldValue as String? == value as String
                    }
                }

            }

            RulesConditions.ne.name -> {
                when {
                    fieldValue is Number && value is Number -> {
                        fieldValue.toDouble() != value.toDouble()
                    }

                    fieldValue is Date && value is Date -> {
                        fieldValue != value
                    }

                    else -> {
                        fieldValue as String != value as String
                    }
                }
            }

            RulesConditions.lt.name -> {
                when {
                    fieldValue is Date && value is Date -> {
                        fieldValue < value
                    }

                    else -> {
                        fieldValue.toString().toDouble() < value.toString().toDouble()
                    }
                }
            }

            RulesConditions.gt.name -> {
                when {
                    fieldValue is Date && value is Date -> {
                        fieldValue > value
                    }

                    else -> {
                        fieldValue.toString().toDouble() > value.toString().toDouble()
                    }
                }
            }

            RulesConditions.le.name -> {
                when {
                    fieldValue is Date && value is Date -> {
                        fieldValue <= value
                    }

                    else -> {
                        fieldValue.toString().toDouble() <= value.toString().toDouble()
                    }
                }
            }

            RulesConditions.contains.name -> {
                fieldValue.toString().lowercase().contains(value.toString(),ignoreCase = true)
            }

            RulesConditions.ge.name -> {
                when {
                    fieldValue is Date && value is Date -> {
                        fieldValue >= value
                    }

                    else -> {
                        fieldValue.toString().toDouble() >= value.toString().toDouble()
                    }
                }
            }

            else -> {
                true
            }
        }
    }

    fun applyActions(
        fieldValueState: MutableState<Any?>?,
        actions: List<FormResponseItem.Rule.Action?>,
        fieldsStates: Map<String, MutableState<FieldStates>>,
        condition: Boolean,
        ruleValue: Any? = null,
        fieldErrorMessages: Map<String, MutableState<String?>>,
    ) {
        actions.forEach { action ->
            val targetFieldStates = fieldsStates[action?.targetField]
            when (action?.type) {
                RulesActions.show.name -> {
                    if(!condition)
                        fieldErrorMessages[action?.targetField]?.value = null
                    targetFieldStates?.value =
                        targetFieldStates?.value?.copy(isVisible = condition) ?: FieldStates()
                }

                RulesActions.hide.name -> {
                    if(condition)
                        fieldErrorMessages[action.targetField]?.value = null
                    targetFieldStates?.value =
                        targetFieldStates?.value?.copy(isVisible = !condition) ?: FieldStates()

                }

                RulesActions.enable.name -> {
                    if (!condition)
                        fieldValueState?.value = ""

                    targetFieldStates?.value =
                        targetFieldStates?.value?.copy(isEnabled = condition) ?: FieldStates()
                }

                RulesActions.disable.name -> {
                    targetFieldStates?.value =
                        targetFieldStates?.value?.copy(isEnabled = !condition) ?: FieldStates()
                }

                RulesActions.optional.name -> {
                    targetFieldStates?.value =
                        targetFieldStates?.value?.copy(isRequired = !condition) ?: FieldStates()
                }

                RulesActions.required.name -> {
                    targetFieldStates?.value =
                        targetFieldStates?.value?.copy(isRequired = condition) ?: FieldStates()
                }

                RulesActions.filter.name -> {
                    targetFieldStates?.value = targetFieldStates?.value?.copy(
                        options = (ruleValue as? List<FormIOResponse.Data.Value>) ?: listOf(),
                        isEnabled = !(targetFieldStates.value.options?.isEmpty() ?: true)
                    ) ?: FieldStates()

                }

                RulesActions.addValidationMessage.name -> {
                    if (condition)
                        targetFieldStates?.value =
                            targetFieldStates?.value?.copy(validationMessage = action.message)
                                ?: FieldStates()
                    else
                        targetFieldStates?.value =
                            targetFieldStates?.value?.copy(validationMessage = "")
                                ?: FieldStates()
                }
            }
        }
    }

     fun parseDate(date: String): Date? {
        if (date.isEmpty()) return null
        val formatter = SimpleDateFormat("dd-MM-yyyy 00:00:00", Locale.getDefault())
        val text = date
        val date = formatter.parse(text)
        return date ?: Date()
    }

     fun parseDateTime(date: String): Date? {
        if (date.isEmpty()) return null
        val formatter = SimpleDateFormat("dd-MM-yyyy HH:mm:00", Locale.getDefault())
        val text = date
        val date = formatter.parse(text)
        return date ?: Date()
    }

     fun parseTime(date: String): Date? {
        if (date.isEmpty()) return null
        val formatter = SimpleDateFormat("HH:mm:00", Locale.getDefault())
        val text = date
        val date = formatter.parse(text)
        return date ?: Date()
    }

     fun formatDate(date: Date): Date {
        val formatter = SimpleDateFormat("dd-MM-yyyy 00:00:00", Locale.getDefault())
        val formattedDate = (formatter.format(date))
        return formatter.parse(formattedDate) ?: Date()
    }

     fun formatDateTime(date: Date): Date {
        val formatter = SimpleDateFormat("dd-MM-yyyy HH:mm:00", Locale.getDefault())
        val formattedDate = (formatter.format(date))
        return formatter.parse(formattedDate) ?: Date()
    }

     fun formatTime(date: Date): Date {
        val formatter = SimpleDateFormat("HH:mm:00", Locale.getDefault())
        val formattedDate = (formatter.format(date))
        return formatter.parse(formattedDate) ?: Date()
    }

    fun resetChildFields(
        parentFieldId: String,
        fields: List<FormResponseItem>,
        fieldValueState: Map<String, MutableState<Any?>>
    ) {
        fields.forEach { field ->
            if (field.dropDownLabel == "")
                return@forEach
            val dependsOn = field.rules.firstOrNull()?.condition?.dependsOn
            if (dependsOn == parentFieldId) {
                fieldValueState[field.id]?.value = ""
                resetChildFields(field.id, fields, fieldValueState)
            }
        }
    }


}
