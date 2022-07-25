import {
  CreateParams,
  DataProvider,
  DeleteManyParams,
  DeleteManyResult,
  DeleteParams,
  GetListParams,
  GetManyParams,
  GetManyReferenceParams,
  GetOneParams,
  HttpError,
  Identifier,
  Record as RARecord,
  UpdateParams,
} from "ra-core";
import { OData, param, EdmV4, ODataQueryParam } from "@odata/client";
import { resource_id_mapper } from "./ra-data-id-mapper";
import { parse_metadata } from "./metadata_parser";

async function get_entities(url: string, options: ODataRequestOptions) {
  const m = await fetch(url + "/$metadata", options);
  const t = await m.text();

  return parse_metadata(t);
}

export interface ActionParams {
  action: string;
  id: Identifier;
  payload: any;
}

export interface OdataDataProvider extends DataProvider {
  getResources: () => string[];
  action: (resource: string, params: ActionParams) => Promise<any>;
}

interface ODataRequestOptions {
  headers?: Record<string, string>;
}

const ra_data_odata_server = async (
  apiUrl: string,
  option_callback: () => Promise<ODataRequestOptions> = () =>
    Promise.resolve({})
): Promise<OdataDataProvider> => {
  const resources = await get_entities(apiUrl, await option_callback());
  const id_map: Record<string, string> = {};
  for (const r in resources) {
    const id_name = resources[r]?.Key?.Name ?? "id";
    if (id_name !== "id") {
      id_map[r] = id_name;
    }
  }

  /**
   * in order to support entities with non-string IDs we
   * need to look at the key type since they are encoded
   * differently in the odata URL ("/Employees(1)" vs
   * "/Customers('ALFKI')")
   * @param resource supplies the resource
   * @param id supplies the entity ID
   * @returns
   */

  function getproperty_identifier(
    resource: string,
    propertyName: string,
    id: Identifier
  ) {
    const type = resources[resource.toLowerCase()].Type.Property.find(
      (p) => p.Name == propertyName
    )?.Type;
    if (type === "Edm.Guid") {
      return EdmV4.Guid.from(id as string);
    } else if (type === "Edm.Int32" && typeof id !== "number") {
      return parseInt(id);
    }
    return id;
  }

  const getClient = async () => {
    const commonHeaders = (await option_callback()).headers;
    const client = OData.New4({
      metadataUri: apiUrl + "/$metadata",
      commonHeaders,
    });
    return client;
  };

  const getEntity = async <RecordType extends RARecord = RARecord>(
    resource: string,
    id: Identifier,
    params?: ODataQueryParam
  ) => {
    const res = resources[resource.toLowerCase()];
    const keyName = res?.Key?.Name ?? "UnknownKey";
    const client = await getClient();
    const es = client.getEntitySet<RecordType>(resource);

    return await es.retrieve(
      getproperty_identifier(resource, keyName, id),
      params
    );
  };
  const getEntities = async <RecordType extends RARecord = RARecord>(
    resource: string,
    params: ODataQueryParam
  ) => {
    const client = await getClient();
    const result = await client.newRequest<RecordType>({
      collection: resource,
      params,
    });

    return { data: result.value ?? [], total: result["@odata.count"] ?? 0 };
  };

  return resource_id_mapper(
    {
      getResources: () => Object.values(resources).map((r) => r.Name),
      getList: async <RecordType extends RARecord = RARecord>(
        resource: string,
        params: GetListParams
      ) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort; // order is either 'DESC' or 'ASC'
        const client = await getClient();

        let p = param()
          .count()
          .orderby(field, order === "DESC" ? "desc" : "asc")
          .skip((page - 1) * perPage)
          .top(perPage);
        for (const filterName in params.filter) {
          p = p.filter(
            client
              .newFilter()
              .property(
                `Contains(${filterName},'${params.filter[filterName]}')`
              )
              .eq(true)
          );
        }
        const resp = await client.newRequest<RecordType>({
          collection: resource,
          params: p,
        });
        if (resp.error) {
          return Promise.reject(
            new HttpError(resp.error.message || "getOne error", resp.error.code)
          );
        }

        return {
          data: resp.value ?? [],
          total: resp["@odata.count"] ?? 0,
        };
      },

      getOne: async <RecordType extends RARecord = RARecord>(
        resource: string,
        params: GetOneParams
      ) => {
        return { data: await getEntity<RecordType>(resource, params.id) };
      },

      getMany: async <RecordType extends RARecord = RARecord>(
        resource: string,
        params: GetManyParams
      ) => {
        const res2 = params.ids.map((id) =>
          getEntity<RecordType>(resource, id)
        );
        const val2 = await Promise.all(res2);
        return { data: val2 };
      },

      getManyReference: async <RecordType extends RARecord = RARecord>(
        resource: string,
        params: GetManyReferenceParams
      ) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort; // order is either 'DESC' or 'ASC'
        if (!params.id) {
          return Promise.resolve({ data: [], total: 0 });
        }
        if (params.filter.parent) {
          const odataParams = OData.newParam().expand(params.target);
          const o = await getEntity<RecordType>(
            params.filter.parent,
            params.id,
            odataParams
          );
          const d = (o[params.target] as RecordType[]) ?? [];
          return {
            data: d
              .sort((a, b) => (a[field] < b[field] ? -1 : 1))
              .slice((page - 1) * perPage, (page - 1) * perPage + perPage),
            total: d.length,
          };
        } else {
          const odataParams = OData.newParam()
            .count()
            .filter(
              OData.newFilter()
                .property(params.target)
                .eq(getproperty_identifier(resource, params.target, params.id))
            )
            .orderby(field, order === "DESC" ? "desc" : "asc")
            .skip((page - 1) * perPage)
            .top(perPage);
          return await getEntities<RecordType>(resource, odataParams);
        }
      },

      update: async <RecordType extends RARecord = RARecord>(
        resource: string,
        params: UpdateParams<RecordType>
      ) => {
        const res = resources[resource.toLowerCase()];
        const keyName = res?.Key?.Name ?? "UnknownKey";
        const client = await getClient();
        const es = client.getEntitySet<RecordType>(resource);

        await es.update(
          getproperty_identifier(resource, keyName, params.id),
          params.data
        );

        return { data: params.data };
      },

      updateMany: (resource, params) =>
        Promise.reject(new Error("not implemented")),

      create: async <RecordType extends RARecord = RARecord>(
        resource: string,
        params: CreateParams<RecordType>
      ) => {
        const client = await getClient();
        const es = client.getEntitySet<RecordType>(resource);

        const data = await es.create(params.data);

        return { data: data };
      },

      delete: async <RecordType extends RARecord = RARecord>(
        resource: string,
        params: DeleteParams
      ) => {
        const res = resources[resource.toLowerCase()];
        const keyName = res?.Key?.Name ?? "UnknownKey";
        const client = await getClient();
        const es = client.getEntitySet<RecordType>(resource);

        await es.delete(getproperty_identifier(resource, keyName, params.id));
        return { data: { id: params.id } as RecordType };
      },

      deleteMany: async <RecordType extends RARecord = RARecord>(
        resource: string,
        params: DeleteManyParams
      ): Promise<DeleteManyResult> => {
        const res = resources[resource.toLowerCase()];
        const keyName = res?.Key?.Name ?? "UnknownKey";
        const client = await getClient();
        const es = client.getEntitySet<RecordType>(resource);

        const results = params.ids.map((id) => {
          es.delete(getproperty_identifier(resource, keyName, id));
        });

        await Promise.all(results);

        return { data: params.ids };
      },
      action: async (
        resource: string,
        params: { id: Identifier; action: string; payload: any }
      ): Promise<any> => {
        const res = resources[resource.toLowerCase()];
        const keyName = res?.Key?.Name ?? "UnknownKey";
        const client = await getClient();
        const es = client.getEntitySet(resource);

        return await es.action(
          params.action,
          getproperty_identifier(resource, keyName, params.id),
          params.payload
        );
      },
    },
    id_map
  );
};

export default ra_data_odata_server;
