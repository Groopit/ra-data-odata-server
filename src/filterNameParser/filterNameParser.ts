import { getODataLikeKeyFormat } from "../helpers";

export type Operator =
"q"
| "q_int"
| "neq"
| "eq"
| "lte"
| "lt"
| "gte"
| "gt"
| "eq_any"
| "neq_any"
| "boolean"
| "inc"
| "inc_any"
| "ninc_any";

export const operators: Operator[] = [
  "q",
  "q_int",
  "neq",
  "eq",
  "lte",
  "lt",
  "gte",
  "gt",
  "eq_any",
  "neq_any",
  "boolean",
  "inc",
  "inc_any",
  "ninc_any",
];

export interface FilterNameParserResult {
  fieldName: string;
  operator: Operator;
}

/**
 * Parses the filter name to extract the field name and operator.
 *
 * @example
 * const { fieldName, operator } = filterNameParser("city.name_eq");
 * console.log(fieldName); // CityName
 * console.log(operator); // eq
 *
 * @param {string} filterName - the filter name to parse
 * @return {FilterNameParserResult} an object containing the parsed fieldName and operator
 */
export function filterNameParser(filterName: string): FilterNameParserResult {
  const containsOperator = operators.some((operator) => filterName.endsWith(operator));

  if (!containsOperator) {
    throw new Error(`Field name "${filterName}" must contain an operator: ${operators.join(", ")}`);
  }

  let fieldName: string | null = null;
  let operator: Operator | null = null;

  for (let i = 0; i < operators.length; i++) {
    if (filterName.endsWith(`_${operators[i]}`)) {
      fieldName = filterName.replace(`_${operators[i]}`, "");
      operator = operators[i];
      break;
    }
  }

  if (fieldName === null || operator === null) {
    throw new Error("fieldName and operator must be required");
  }

  return {
    fieldName: getODataLikeKeyFormat(fieldName),
    operator,
  };
}
