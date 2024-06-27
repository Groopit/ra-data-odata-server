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
  QueryFunctionContext,
  RaRecord,
  UpdateParams,
} from "ra-core";
import {
  OData,
  EdmV4,
  SystemQueryOptions,
  ODataNewOptions,
} from "@odata/client";
import { resource_id_mapper } from "./ra-data-id-mapper";
import { parse_metadata } from "./metadata_parser";
import { ArrayFilterExpressions } from "./ArrayFilterExpressions";
import { filterNameParser } from "./filterNameParser";
import {
  capitalize,
  getExpandString,
  getODataLikeKeyFormat,
} from "./helpers";

interface GetListParamsWithTypedMeta extends GetListParams {
  meta?: {
    select?: string[];
    expand?: string[];
    [key: string]: any;
  }
}

async function get_entities(
  url: string,
  odata_options?: Partial<ODataNewOptions>
) {
  let t: string;
  url += "/$metadata";

  if (odata_options?.fetchProxy)
    // content needs to be a string in order to be correctly passed to parse_metadata
    // TODO: document this
    t = (await odata_options.fetchProxy(url, {})).content;
  else {
    const m = await fetch(url, {
      // passing common_headers to fetch function here as this might be required
      // for token-based authentication
      headers: odata_options?.commonHeaders,
    });
    t = await m.text();
  }

  return parse_metadata(t);
}

export interface ActionParams {
  action: string;
  id: Identifier;
  payload: unknown;
}

export type OdataDataProvider = DataProvider<string> & {
  getResources: () => string[];
  action: (resource: string, params: ActionParams) => Promise<unknown>;
};

const ra_data_odata_server = async (
  apiUrl: string,
  odata_options_callback: () => Promise<Partial<ODataNewOptions>> = () =>
    Promise.resolve({})
): Promise<OdataDataProvider> => {
  const options = await odata_options_callback();
  const resources = await get_entities(apiUrl, options);
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
    } else if (type?.startsWith("Edm.Int") && typeof id !== "number") {
      return parseInt(id);
    }
    return id;
  }

  const getClient = async () => {
    const options = await odata_options_callback();
    const client = OData.New4({
      metadataUri: apiUrl + "/$metadata",
      ...options,
    });
    return client;
  };

  const getEntity = async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    id: Identifier,
    params?: SystemQueryOptions
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
  const getEntities = async <RecordType extends RaRecord = RaRecord>(
    resource: string,
    params: SystemQueryOptions
  ) => {
    const client = await getClient();
    const result = await client.newRequest<RecordType>({
      collection: resource,
      params,
    });

    return { data: result.value ?? [], total: result["@odata.count"] ?? 0 };
  };

  return resource_id_mapper<OdataDataProvider>(
    {
      getResources: () => Object.values(resources).map((r) => r.Name),
      getList: async <RecordType extends RaRecord = RaRecord>(
        resource: string,
        params: GetListParamsWithTypedMeta & QueryFunctionContext
      ) => {
        const { page, perPage } = params.pagination ||{};
        const { field, order } = params.sort ||{}; // order is either 'DESC' or 'ASC'
        const { select = [], expand = [] } = params.meta as Required<GetListParamsWithTypedMeta>['meta'] || {};
        const client = await getClient();

        
        const queryOptions =
          (field && page &&perPage) ? new SystemQueryOptions()
          .count()
          .orderby(getODataLikeKeyFormat(field), order === "DESC" ? "desc" : "asc")
          .skip((page - 1) * perPage)
          .top(perPage)
        : new SystemQueryOptions();

        if (select.length > 0) {
          const selectSet = new Set(select);
          const uniqueSelectFields = Array.from(selectSet);

          queryOptions.select(uniqueSelectFields.map(capitalize));
        }

        if (expand.length > 0) {
          const expandSet = new Set(expand);
          const uniqueExpandFields = Array.from(expandSet);

          queryOptions.expand(uniqueExpandFields.map(getExpandString));
        }

        const oDataFilter = OData.newFilter();
        const arrayFilterExpressions = new ArrayFilterExpressions();

        for (const filterName in params.filter) {
          if (filterName === "q") {
            queryOptions.search(params.filter[filterName], false);
            continue;
          }

          const {
            fieldName,
            operator,
          } = filterNameParser(filterName);
          const filterBuilder = client.newFilter().property(fieldName);
          const filterValue = params.filter[filterName];
          let filterExpression: string;

          switch (operator) {
            case "q":
              filterExpression = client
                  .newFilter()
                  .property(`Contains(${fieldName},'${filterValue}')`)
                  .eq(true)
                  .build();
              break;
            case "neq":
              filterExpression = filterBuilder.ne(filterValue).build();
              break;
            case "eq":
              filterExpression = filterBuilder.eq(filterValue).build();
              break;
            case "lte":
              filterExpression = filterBuilder.le(filterValue).build();
              break;
            case "lt":
              filterExpression = filterBuilder.lt(filterValue).build();
              break;
            case "gte":
              filterExpression = filterBuilder.ge(filterValue).build();
              break;
            case "gt":
              filterExpression = filterBuilder.gt(filterValue).build();
              break;
            case "eq_any":
              filterExpression = filterBuilder.in(filterValue).build();
              break;
            case "neq_any":
              filterExpression = `${filterBuilder.in(filterValue).build()} eq false`;
              break;
            case "boolean":
              filterExpression = filterBuilder.eq(filterValue).build();
              break;
            case "inc":
              filterExpression = filterValue
                .map((value: any) => {
                  if (typeof value === 'string') {
                    return `(${fieldName} eq '${value}')`;
                  }

                  return `(${fieldName} eq ${value})`;
                })
                .join(' and ');
              break;
            case "inc_any":
              filterExpression = filterValue
                .map((value: any) => {
                  if (typeof value === 'string') {
                    return `(${fieldName} eq '${value}')`;
                  }

                  return `(${fieldName} eq ${value})`;
                })
                .join(' or ');
              break;
            case "ninc_any":
              filterExpression = filterValue
                .map((value: any) => {
                  if (typeof value === 'string') {
                    return `(${fieldName} ne '${value}')`;
                  }

                  return `(${fieldName} ne ${value})`;
                })
                .join(' and ');
              break;
            default:
              // this default filter was kept for compatibility reasons with
              // ra-data-odata-server@<=4.0.0
              filterExpression = client
                  .newFilter()
                  .property(`Contains(${filterName},'${filterValue}')`)
                  .eq(true)
                  .build();
              console.warn(`Operator "${operator}" is not supported`);
              break;
          }

          arrayFilterExpressions.add(filterExpression);
        }

        const filtersSet = new Set([
          arrayFilterExpressions.toString(),
          oDataFilter.build(),
        ]);
        const uniqueFilters = Array.from(filtersSet);
        const filtersString = uniqueFilters
          .filter(Boolean)
          .join(' and ');

        const resp = await client.newRequest<RecordType>({
          collection: resource,
          params: queryOptions.filter(filtersString),
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

      getOne: async <RecordType extends RaRecord = RaRecord>(
        resource: string,
        params: GetOneParams
      ) => {
        return { data: await getEntity<RecordType>(resource, params.id) };
      },

      getMany: async <RecordType extends RaRecord = RaRecord>(
        resource: string,
        params: GetManyParams
      ) => {
        const res2 = params.ids.map((id) =>
          getEntity<RecordType>(resource, id)
        );
        const val2 = await Promise.all(res2);
        return { data: val2 };
      },

      getManyReference: async <RecordType extends RaRecord = RaRecord>(
        resource: string,
        params: GetManyReferenceParams
      ) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort; // order is either 'DESC' or 'ASC'
        if (!params.id) {
          return Promise.resolve({ data: [], total: 0 });
        }
        if (params.filter.parent) {
          const odataParams = OData.newOptions().expand(params.target);
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
            .orderby(getODataLikeKeyFormat(field), order === "DESC" ? "desc" : "asc")
            .skip((page - 1) * perPage)
            .top(perPage);
          return await getEntities<RecordType>(resource, odataParams);
        }
      },

      update: async <RecordType extends RaRecord = RaRecord>(
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
        return {
          data: await es.retrieve(
            getproperty_identifier(resource, keyName, params.id)
          ),
        };
      },

      updateMany: () => Promise.reject(new Error("not implemented")),

      create: async <RecordType extends RaRecord = RaRecord>(
        resource: string,
        params: CreateParams<RecordType>
      ) => {
        const client = await getClient();
        const es = client.getEntitySet<RecordType>(resource);

        const data = await es.create(params.data);

        return { data: data };
      },

      delete: async <RecordType extends RaRecord = RaRecord>(
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

      deleteMany: async <RecordType extends RaRecord = RaRecord>(
        resource: string,
        params: DeleteManyParams
      ): Promise<DeleteManyResult> => {
        const res = resources[resource.toLowerCase()];
        const keyName = res?.Key?.Name ?? "UnknownKey";
        const client = await getClient();
        const es = client.getEntitySet<RecordType>(resource);

        const results = params.ids.map((id) => 
          es.delete(getproperty_identifier(resource, keyName, id))
        );

        await Promise.all(results);

        return { data: params.ids };
      },
      action: async (
        resource: string,
        params: { id: Identifier; action: string; payload: unknown }
      ): Promise<unknown> => {
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
