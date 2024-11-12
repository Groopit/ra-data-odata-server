
import {
  Admin,
  ListGuesser,
  Resource,
  Loading,
  EditGuesser,
  ShowGuesser,
} from "react-admin";

import   ra_data_odata_server,{OdataDataProvider } from "ra-data-odata-server";
import { useEffect, useState } from "react";

const Northwind = "/V4/Northwind/Northwind.svc";

function App() {
  const [dataProvider, setDataProvider] = useState<OdataDataProvider>();
  
  
  useEffect(() => {
    ra_data_odata_server(Northwind).then((p) => setDataProvider(p));
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
