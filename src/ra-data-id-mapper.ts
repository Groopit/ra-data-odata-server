import {
  CreateParams,
  CreateResult,
  DataProvider,
  DeleteManyParams,
  DeleteParams,
  GetListParams,
  GetManyParams,
  GetManyReferenceParams,
  GetOneParams,
  UpdateManyParams,
  Record as RARecord,
  UpdateParams,
} from "ra-core";

/**
 * clever little function that renames any property in an object to 'id'
 * @param id_name the original name of the property, e.g. 'UserID'
 * @param param1  the object to be renamed, e.g. {UserId: "foo", Name: "John Smith"}
 * @returns the renamed object, e.g. {id: "foo", Name: "John Smith"}
 */
const rename_to_id = (
  id_name: string,
  { [id_name]: ID, ...object }
): RARecord => {
  return {
    id: ID,
    ...object,
  };
};

/**
 * Performs the opposite of rename_to_id for use by create() and update()
 * @param id_name the original name of the property, e.g. 'UserID'
 * @param object the object to be renamed, e.g. {id: "foo", Name: "John Smith"}
 */
const rename_from_id = (id_name: string, object: RARecord) => {
  const renamed: { [x: string]: any } = { [id_name]: object.id, ...object };
  delete renamed.id;
  return renamed;
};

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
  const wrapper: ProviderType = Object.create(dataProvider);
  wrapper.getList = (resource: string, params: GetListParams) => {
    const id_name = id_map[resource.toLowerCase()];
    if (id_name) {
      if (params.sort.field === "id") {
        params.sort.field = id_name;
      }
      return dataProvider.getList(resource, params).then((result) => {
        return {
          ...result,
          data: result.data.map((v) => rename_to_id(id_name, v)),
        } as any;
      });
    }
    return dataProvider.getList(resource, params);
  };

  wrapper.getOne = (resource: string, params: GetOneParams) => {
    const id_name = id_map[resource.toLowerCase()];
    if (id_name) {
      if (params.id === "id") {
        params.id = id_name;
      }
      return dataProvider.getOne(resource, params).then((result) => {
        return {
          ...result,
          data: rename_to_id(id_name, result.data),
        } as any;
      });
    }
    return dataProvider.getOne(resource, params);
  };

  wrapper.getMany = (resource: string, params: GetManyParams) => {
    const id_name = id_map[resource.toLowerCase()];
    if (id_name) {
      params.ids = params.ids.map((i) => (i === "id" ? id_name : i));
    }
    return dataProvider.getMany(resource, params).then((result) => {
      return {
        ...result,
        data: result.data.map((v) => rename_to_id(id_name, v)),
      } as any;
    });
  };

  wrapper.getManyReference = (
    resource: string,
    params: GetManyReferenceParams
  ) => {
    const id_name = id_map[resource.toLowerCase()];
    if (id_name) {
      console.log(`mapping id to ${id_name} for ${resource}`);
      return dataProvider.getManyReference(resource, params).then((result) => {
        return {
          ...result,
          data: result.data.map((v) => rename_to_id(id_name, v)),
        } as any;
      });
    }
    return dataProvider.getManyReference(resource, params);
  };

  wrapper.update = (resource: string, params: UpdateParams) => {
    const id_name = id_map[resource.toLowerCase()];
    if (id_name) {
      console.log(`mapping id to ${id_name} for '${resource}`);
    }
    return dataProvider.update(resource, params);
  };

  wrapper.updateMany = (resource: string, params: UpdateManyParams) => {
    const id_name = id_map[resource.toLowerCase()];
    if (id_name) {
      console.log(`mapping id to ${id_name} for '${resource}`);
    }
    return dataProvider.updateMany(resource, params);
  };

  wrapper.create = <RecordType extends RARecord = RARecord>(
    resource: string,
    params: CreateParams
  ) => {
    const id_name = id_map[resource.toLowerCase()];
    if (id_name) {
      console.log(`mapping id to ${id_name} for '${resource}`);
      params.data = rename_from_id(id_name, params.data);
      return dataProvider.create(resource, params).then((result) => {
        return {
          ...result,
          data: rename_to_id(id_name, result.data) as RecordType,
        };
      });
    }
    return dataProvider.create(resource, params);
  };

  wrapper.delete = (resource: string, params: DeleteParams) => {
    const id_name = id_map[resource.toLowerCase()];
    if (id_name) {
      console.log(`mapping id to ${id_name} for '${resource}`);
    }
    return dataProvider.delete(resource, params);
  };

  wrapper.deleteMany = (resource: string, params: DeleteManyParams) => {
    const id_name = id_map[resource.toLowerCase()];
    if (id_name) {
      console.log(`mapping id to ${id_name} for '${resource}`);
    }
    return dataProvider.deleteMany(resource, params);
  };

  return wrapper;
}
