import {
  Admin,
  DataProvider,
  ListGuesser,
  Resource,
  Loading,
} from "react-admin";
import "./App.css";
import odataProvider from "ra-data-odata-server";
import { useEffect, useState } from "react";

const Northwind = "https://services.odata.org/v4/Northwind/Northwind.svc/";
// const ODataSample = "https://services.odata.org/v4/OData/OData.svc/";

// odataProvider(ODataSample).then((p) => (dataProvider = p));

function App() {
  const [dataProvider, setDataProvider] = useState<DataProvider>();
  useEffect(() => {
    odataProvider(Northwind).then((p) => setDataProvider(p));
    return () => {};
  }, []);
  return dataProvider ? (
    <Admin dataProvider={dataProvider}>
      <Resource name="Products" list={ListGuesser} />
    </Admin>
  ) : (
    <Loading></Loading>
  );
}

export default App;
