import {
  Admin,
  ListGuesser,
  Resource,
  Loading,
  EditGuesser,
  ShowGuesser,
} from "react-admin";
import "./App.css";
import odataProvider, { OdataDataProvider } from "ra-data-odata-server";
import { useEffect, useState } from "react";

const Northwind = "https://services.odata.org/v4/Northwind/Northwind.svc/";
// const ODataSample = "https://services.odata.org/v4/OData/OData.svc/";

function App() {
  const [dataProvider, setDataProvider] = useState<OdataDataProvider>();
  useEffect(() => {
    odataProvider(Northwind).then((p) => setDataProvider(p));
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

export default App;
