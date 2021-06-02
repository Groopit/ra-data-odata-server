import {
  CreateParams,
  DataProvider,
  GetListParams,
  HttpError,
  Identifier,
} from "ra-core";
import odata from "odata-client";
import { resource_id_mapper } from "./ra-data-id-mapper";
import {parse_metadata} from "./metadata_parser";
import { Response } from "request";

interface GetRelatedParams extends GetListParams {
  id?: string;
  related?: string;
}

interface CreateRelatedParams extends CreateParams {
  id?: Identifier;
  related?: string;
}


async function get_entities(url: string, options?: RequestInit) {
  const m = await window.fetch(url + "/$metadata", options);
  const t = await m.text();

  return parse_metadata(t);
}

export interface OdataDataProvider extends DataProvider {
  getResources: () => string[];
}

const ra_data_odata_server = async (
  apiUrl: string,
  option_callback: (() => Promise<RequestInit>) = () => Promise.resolve({})
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
  function getresource(resource: string, id: Identifier) {
    const o = odata({ service: apiUrl });
    const res = resources[resource.toLowerCase()];
    const type = res?.Key?.Name ?? "UnknownType";
    return o.resource(res.Url, getproperty_identifier(resource, type, id));
  }
  function getproperty_identifier(
    resource: string,
    propertyName: string,
    id: Identifier
  ) {
    const type = resources[resource.toLowerCase()].Type.Property.find(
      (p) => p.Name == propertyName
    )?.Type;
    if (type === "Edm.Int32" || type === "Edm.Guid") {
      return odata.identifier(id);
    } else {
      return id;
    }
  }

  return resource_id_mapper(
    {
      getResources: () => Object.values(resources).map(r => r.Name),
      getList: async (resource, params: GetRelatedParams) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort; // order is either 'DESC' or 'ASC'
        let o = odata({
          service: apiUrl,
        }).count(true);
        if (params.id) {
          o = o.resource(resource, params.id);
        } else {
          o = o.resource(resource);
        }
        if (params.related) {
          o = o.resource(params.related);
        }

        o = o
          .orderby(field, order)
          .skip((page - 1) * perPage)
          .top(perPage);

        for (const filterName in params.filter) {
          o = o.filter(
            `Contains(${filterName},'${params.filter[filterName]}')`
          );
        }

        return o.get(await option_callback()).then((resp: Response) => {
          if (resp.statusCode !== 200) {
            return Promise.reject(
              new HttpError(
                resp.statusMessage || "getList error",
                resp.statusCode,
                resp.body
              )
            );
          }
          const json = JSON.parse(resp.body);
          if (json.error) {
            return Promise.reject(json.error.message);
          }
          return {
            data: json.value,
            total: json["@odata.count"],
          };
        });
      },

      getOne: async (resource, params) =>
        getresource(resource, params.id)
          .get(await option_callback())
          .then((resp: Response) => {
            if (resp.statusCode !== 200) {
              return Promise.reject(
                new HttpError(
                  resp.statusMessage || "getOne error",
                  resp.statusCode,
                  resp.body
                )
              );
            }
            const json = JSON.parse(resp.body);
            if (json.error) {
              return Promise.reject(json.error.message);
            }
            return { data: json };
          }),

      getMany: async (resource, params) => {
        const options = await option_callback();
        const results = params.ids.map((id) =>
          getresource(resource, id)
            .get(options)
            .then((resp: Response) => {
              if (resp.statusCode !== 200) {
                return {
                  id: id,
                  error: new HttpError(
                    resp.statusMessage || "getMany error",
                    resp.statusCode,
                    resp.body
                  ),
                };
              }
              const json = JSON.parse(resp.body);
              if (json.error) {
                return {
                  id: id,
                  error: new HttpError(
                    resp.statusMessage || "getMany error",
                    json.error,
                    resp.body
                  ),
                };
              }
              return json;
            })
        );

        const values = await Promise.all(results);
        return { data: values };
      },

      getManyReference: async (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort; // order is either 'DESC' or 'ASC'
        if (!params.id) {
          return Promise.resolve({ data: [], total: 0 });
        }
        const o = params.filter.parent
          ? getresource(params.filter.parent, params.id).expand(params.target)
          : odata({ service: apiUrl, resources: resource })
              .count(true)
              .filter(
                params.target,
                "=",
                getproperty_identifier(resource, params.target, params.id)
              );

        o.count(true)
          .orderby(field, order)
          .skip((page - 1) * perPage)
          .top(perPage);

        return o.get(await option_callback()).then((resp: Response) => {
          if (resp.statusCode !== 200) {
            return Promise.reject(resp.body);
          }
          const json = JSON.parse(resp.body);
          if (json.error) {
            return Promise.reject(json.error.message);
          }
          if (params.filter.parent) {
            const d = json[params.target];
            return {
              data: d,
              total: d.length,
            };
          } else {
            const d = json.value;
            return {
              data: d,
              total: json["@odata.count"],
            };
          }
        });
      },

      update: async (resource, params) =>
        getresource(resource, params.id)
          .patch(params.data, await option_callback())
          .then((resp: Response) => {
            if (resp.statusCode !== 200) {
              return Promise.reject(resp.body);
            }
            const json = JSON.parse(resp.body);
            if (json.error) {
              return Promise.reject(json.error.message);
            }
            return { data: json };
          }),

      updateMany: (resource, params) =>
        Promise.reject(new Error("not implemented")),

      create: async (resource, params: CreateRelatedParams) => {
        const o =
          params.related && params.id
            ? getresource(resource, params.id).resource(params.related)
            : odata({
                service: apiUrl,
              }).resource(resource);

        return o.post(params.data, await option_callback()).then((resp: Response) => {
          if (resp.statusCode !== 200) {
            return Promise.reject(resp.body);
          }
          const json = JSON.parse(resp.body);
          if (json.error) {
            return Promise.reject(json.error.message);
          }
          return { data: json };
        });
      },

      delete: async (resource, params) =>
        getresource(resource, params.id)
          .delete(await option_callback())
          .then((resp: Response) => {
            if (resp.statusCode !== 200) {
              return Promise.reject(resp.body);
            }
            const json = JSON.parse(resp.body);
            if (json.error) {
              return Promise.reject(json.error.message);
            }
            return { data: json };
          }),

      deleteMany: async (resource, params) => {
        const options = await option_callback();
        const results = params.ids.map((id) =>
          getresource(resource, id)
            .delete(options)
            .then((resp: Response) => {
              if (resp.statusCode >= 200 && resp.statusCode < 300) {
                return id;
              }
            })
        );

        const values = await Promise.all(results);
        return { data: values };
      },
    },
    id_map
  );
};

export default ra_data_odata_server;
