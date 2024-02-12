import { capitalize } from "./capitalize";

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
