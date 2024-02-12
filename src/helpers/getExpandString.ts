import { getODataLikeKeyFormat } from "./getODataLikeKeyFormat";

/**
 * @example
 * import { getExpandString } from "./helpers";
 *
 * getExpandString(['company', 'city', 'city.info']); // $expand=Company,City,City($expand=Info)
 */
export function getExpandString(key: string): string {
  const odataKey = getODataLikeKeyFormat(key);
  const keyAsArrayOfReversedString = odataKey.split('/').reverse();

  if (keyAsArrayOfReversedString.length === 1) {
    return odataKey;
  }

  let result = '';

  for (let i = 0; i <= keyAsArrayOfReversedString.length; i += 1) {
    const child: string = keyAsArrayOfReversedString[i];
    const parent: string | undefined = keyAsArrayOfReversedString[i + 1];

    if (!parent) {
      return result;
    }

    result = result === ''
      ? `${parent}($expand=${child})`
      : `${parent}($expand=${result})`;
  }

  return result;
}
