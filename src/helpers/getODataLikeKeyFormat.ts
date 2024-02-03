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
function capitalize(fieldName: string): string {
 return `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`;
}

/**
* Returns a string in OData-like key format.
*
* @example
* const fieldName = capitalize("city.name");
* console.log(fieldName); // City/Name
*
* @param {string} fieldName - the field name to be formatted
* @return {string} the formatted OData-like key
*/
export function getODataLikeKeyFormat(fieldName: string): string {
 return fieldName
   .split('.')
   .map(capitalize)
   .join('/');
}
