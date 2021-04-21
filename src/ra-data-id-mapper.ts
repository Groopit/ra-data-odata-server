import { DataProvider, GetListParams } from "ra-core";

/**
 * Wraps a react-admin data provider and transforms the 'id' field in all input and
 * outputs. react-admin requires all data providers to have an 'id' field.
 * This might not fit your data source ('ID', "UserID", etc.) so this
 * function creates a wrapper which transforms each record, mapping your custom ID
 * field to 'id' for both results and queries.
 *
 * Any data provider extensions are passed through to the original data provider
 * without any id mapping.
 *
 * @see {@link https://marmelab.com/react-admin/FAQ.html#can-i-have-custom-identifiersprimary-keys-for-my-resources}
 * @param dataProvider - Supplies an existing data provider that you want
 * to wrap
 * @param id_map - Supplies a resource/custom ID mapping for each resource you
 * want to map. e.g. \{users: "UserID", products: "ID"\}
 * @returns - A new data provider that wraps the provided one.
 *
 * @example
 * Here's an example of wrapping the default react admin Simple REST provider
 * ```
 * import simpleRestProvider from 'ra-data-simple-rest';
 * import resource_id_mapper from 'ra-data-odata-server';
 *
 * const dataProvider = simpleRestProvider('http://path.to.my.api/');
 * const wrappedProvider = resource_id_mapper(dataProvider, {
 *   users: "UserId",
 *   products: "ID",
 * });
 * ```
 */
export function resource_id_mapper<ProviderType extends DataProvider>(
  dataProvider: ProviderType,
  id_map: Record<string, string>
): ProviderType {
  const wrapper:ProviderType = Object.create(dataProvider);
  wrapper.getList = (resource: string, params: GetListParams) => {
    console.log("getList called with resource " + resource);
    return dataProvider.getList(resource, params);
  };
  return wrapper;
}
