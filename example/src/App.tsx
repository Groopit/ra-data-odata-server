import React from "react";
import {
  Admin,
  ListGuesser,
  Resource,
  Loading,
  EditGuesser,
  ShowGuesser,
} from "react-admin";
import "./App.css";
import odataProvider, { OdataDataProvider } from "@4efficiency/ra-data-odata-server";
import { useEffect, useState } from "react";

const Northwind = "/V4/Northwind/Northwind.svc";

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
