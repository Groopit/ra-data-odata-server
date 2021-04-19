import { Admin, ListGuesser, Resource } from "react-admin";
import "./App.css";
import odataProvider from "ra-data-odata-server";

const Northwind = "https://services.odata.org/v4/Northwind/Northwind.svc/";
const ODataSample = "https://services.odata.org/v4/OData/OData.svc/";

const dataProvider = odataProvider(ODataSample);

function App() {
  return (
    <Admin dataProvider={dataProvider}>
      <Resource name="Products" list={ListGuesser} />
    </Admin>
  );
}

export default App;
