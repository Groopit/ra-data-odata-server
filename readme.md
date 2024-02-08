# OData Data Provider For React-Admin

OData Data Provider for [react-admin](https://github.com/marmelab/react-admin), the frontend framework for building admin applications in the browser.

## Features

- Parses OData $metadata and creates a list of EntitySets which can be displayed as react-admin \<Resources\>
- Transparently renames entity keys to 'id' fields so they can be used by react-admin.
- Handles scalar keys (Edm.Int16, Edm.Int32, Edm.Int64 and Edm.Guid) correctly so you can directly use EntitySets with integer or guid keys.
- extends the react-admin `getManyReference()` method to support expanding child relations.

## Installation

```sh
npm install --save ra-data-odata-server
```

## Usage

Initializing the OData provider requires loading and parsing the OData service's manifest. Since that is an async operation, you need to make sure it is complete before passing the provider to react-admin. An easy way to do that is the React `useEffect()` hook.

Once the provider is initialized, you can use the `getResources()` method to get a list of EntitySets that can be used directly by react-admin.

```ts
import odataProvider, { OdataDataProvider } from "ra-data-odata-server";

function App() {
  const [dataProvider, setDataProvider] = useState<OdataDataProvider>();
  useEffect(() => {
    odataProvider(
      "https://services.odata.org/v4/Northwind/Northwind.svc/"
    ).then((p) => setDataProvider(p));
    return () => {};
  }, []);

  return dataProvider ? (
    <Admin dataProvider={dataProvider}>
      {dataProvider.getResources().map((r) => (
        <Resource
          key={r}
          name={r}
          list={ListGuesser}
          edit={EditGuesser}
          show={ShowGuesser}
        />
      ))}
    </Admin>
  ) : (
    <Loading></Loading>
  );
}
```

See the [example directory](https://github.com/Groopit/ra-data-odata-server/tree/main/example) for a complete working react-admin 4.x solution that runs against the Northwind odata service.

### List Filters

This provider has support for [react-admin filter operators](https://marmelab.com/react-admin/FilteringTutorial.html#filter-operators). By appending an underscore and operator name to an identifier, you can override the default 'Contains' operator. The following operators are supported

Suffix | [OData filter](http://docs.oasis-open.org/odata/odata/v4.0/errata03/os/complete/part2-url-conventions/odata-v4.0-errata03-os-part2-url-conventions-complete.html#_Filter_System_Query) | example
---|---|---|
_neq| ne | `filter: {email_neq: "test@example.com"}`
_eq| eq | `filter: {name_eq: "John Smith"}`
_lte| le | `filter: {price_lte: 0.99}`
_lt| lt | `filter: {price_lt: 1}`
_gte| ge | `filter: {price_gte: 1}`
_gt| gt | `filter: {quantity_gt: 10}`
_eq_any| in | `filter: {quantity_eq_any: [10, 20]}`
_neq_any| not in | `filter: {quantity_neq_any: [10, 20]}`
_inc| eq (AND) | `filter: {quantity_inc: [10, 20]}`
_inc_any| eq (OR) | `filter: {quantity_inc_any: [10, 20]}`
_ninc_any| ne (AND) | `filter: {quantity_ninc_any: [10, 20]}`
_boolean| eq | `filter: {active_boolean: true}`
_q| contains | `filter: {name_q: "John"}`

If the filter field name is `q`, then it is converted to a search query:

```
filter: {q: "John"} -> $search=John
```

If a suffix operator is not supplied, then the default filter operator is `Contains` to search a field for a substring.

Multiple filters can also be combined and used directly with the [`<List>`](https://marmelab.com/react-admin/List.html) component.

```ts
<List resource="posts"
    filter={{
      author_eq: "John Smith",
      published_at_gte: "2020-01-01T23:59:59.99Z"
    }}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <DateField source="published_at" />
      <TextField source="category" />
      <BooleanField source="commentable" />
    </Datagrid>
</List>
```

### List Sorting

The name of the field to be sorted is converted to a format that OData understands. For example, "category.name" will turn into "Category/Name".

```ts
<List resource="posts"
    filter={{
      author_eq: "John Smith",
      published_at_gte: "2020-01-01T23:59:59.99Z"
    }}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <DateField source="published_at" />
      <TextField source="category" sortBy="category.name" />
      <BooleanField source="commentable" />
    </Datagrid>
</List>
```

### Select fields

If the API provides more data than necessary, then you can request only those fields that are needed.

```ts
<ReferenceInput
  source="user.id"
  reference="users"
  queryOptions={{
    meta: {
      select: ["firstName", "lastName", "fullName"]
    }
  }}
  fullWidth
  sort={{ field: "lastName", order: "ASC" }}
  perPage={0}
>
  <AutocompleteInput
    optionText="fullName"
    filterToQuery={(q) => ({ q })}
  />
</ReferenceInput>
```

### Expand fields

If an entity has nested fields, you can ask the API to include them in the response.

```ts
<ReferenceInput
  source="company.id"
  reference="companies"
  queryOptions={{
    meta: {
      expand: ["city", "city.info", "city.info.company"]
    }
  }}
  fullWidth
  sort={{ field: "name", order: "ASC" }}
  perPage={0}
>
  <AutocompleteInput
    optionText="name"
    filterToQuery={(q) => ({ q })}
  />
</ReferenceInput>
```

### OData Actions

This provider has built-in support for invoking OData actions. This works with react-admin's
mutation support. For example, if you had an 'Approve' action for an OData comment, you could
invoke it like this:

```ts
import * as React from "react";
import { useMutation } from "react-query";
import { useDataProvider, Button } from "react-admin";

const ApproveButton = ({ record }) => {
  const dataProvider = useDataProvider();
  const { mutate, isLoading } = useMutation(() =>
    dataProvider.action("comments", {
      id: record.id,
      action: "approve",
      payload: { isApproved: true },
    })
  );
  return (
    <Button label="Approve" onClick={() => mutate()} disabled={isLoading} />
  );
};
```

### Child relationships

OData supports hierarchical relationships - e.g. `/Customers('ALFKI')/Orders` returns all the order entities related to the customer with ID 'ALFKI'. In order to support this type of query in react-admin, the `getManyReferences()` filter is enhanced with a 'parent' property. You can pass this to the standard \<ReferenceManyField> react-admin component. For example, when the current record is a customer, you can display all that customer's orders with this syntax

```tsx
<ReferenceManyField
  label="Customer Orders"
  reference="Orders"
  target="Orders"
  filter={{ parent: "customers" }}
>
  <SingleFieldList linkType="show">
    <ChipField source="id" />
  </SingleFieldList>
</ReferenceManyField>
```

This also supports many-to-many relationships without requiring that your service exposes an intermediate join table as a resource.

## Authentication hook

To support OData servers that require authentication, you can provide an options callback when creating the data provider. This will get called before each query and must return a `Partial<ODataNewOptions>`. Notably the `commonHeaders` property of this object will be added to each outgoing
HTTP request. For example, if you have a `getAccessToken()` function that returns a `Promise<string>` you would initialize your provider like this.

```ts
odataProvider("https://myodataservice.com/odata", () => {
  return getAccessToken().then((token) => ({
    commonHeaders: {
      Authorization: "Bearer " + token,
    },
  }));
}).then((provider) => setDataProvider(provider));
```

## Fetch proxy interface

If your authentication requires more than just a header (cookie-based authentication, for instance) you can provide a
[fetchProxy](https://github.com/Soontao/light-odata/blob/HEAD/docs/Advanced.md#fetch-proxy) property which can implement
any fetch() behavior you need.

```ts
odataProvider("https://myodataservice.com/odata", () => {
  fetchProxy: async (url, init) => {
    // just add some transform here
    // for example, add headers, change url, rate limit, retry ...
    const response = await fetch(url, {
      method: init.method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Some-Custom": "Header",
      },
    });    let content: any;
    if (
      //
      // Check to see if the returned content is JSON
      //
      response.headers
        .get("content-type")
        ?.indexOf("application/json") !== -1
    ) {
      content = await response.json();
    } else {
      content = await response.text();
    }
    return { content, response }; // the content is an object
  },
}).then((provider) => setDataProvider(provider));
```

## Known Limitations

- EntitySets with no keys or compound keys are not supported - react-admin only supports string keys
- EntityType inheritance doesn't work

## License

This data provider is licensed under the MIT License, and sponsored by [Groopit](https://groopit.co).
