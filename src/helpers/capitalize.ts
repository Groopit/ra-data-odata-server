/**
 * Capitalizes the first letter of the input string.
 *
 * @example
* const fieldName = capitalize("city");
* console.log(fieldName); // City
*
* @param {string} fieldName - the input string to be capitalized
* @return {string} the capitalized string
*/
export function capitalize(fieldName: string): string {
 return `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`;
}