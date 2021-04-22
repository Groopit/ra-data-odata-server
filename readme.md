# OData Data Provider For React-Admin

OData Data Provider for [react-admin](https://github.com/marmelab/react-admin), the frontend framework for building admin applications in the browser.

## Features

- Parses OData $metadata and creates a list of EntitySets which can be displayed as react-admin \<Resources\>
- Transparently renames entity keys to 'id' fields so they can be used by react-admin.
- Handles scalar keys (Edm.Int32 and Edm.Guid) correctly so you can directly use EntitySets with integer or guid keys.
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

See the [example directory](https://github.com/Groopit/ra-data-odata-server/tree/main/example) for a complete working react-admin solution that runs against the Northwind odata service.

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

## Known Limitations

- EntitySets with no keys or compound keys are not supported - react-admin only supports string keys
- EntityType inheritance doesn't work

## License

This data provider is licensed under the MIT License, and sponsored by [Groopit](https://groopit.co).
