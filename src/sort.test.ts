import * as fs from "fs";
import { enableFetchMocks } from "jest-fetch-mock";
import odataProvider from "./index";

enableFetchMocks();

const Northwind = "https://services.odata.org/v4/Northwind/Northwind.svc";
const ODataSample = "https://services.odata.org/v4/OData/OData.svc";
const nw_metadata = fs
  .readFileSync("./test/metadata/Northwind.metadata.xml")
  .toString();

const sample_metadata = fs
  .readFileSync("./test/metadata/OData.metadata.xml")
  .toString();

//
// Setup mock fetch data
//
beforeEach(() => {
  fetchMock.resetMocks();
  fetchMock.doMock();
  fetchMock.mockResponse((req) => {
    if (req.url.startsWith(Northwind)) {
      if (req.url.endsWith("/$metadata")) {
        return Promise.resolve(nw_metadata);
      }
    }
    if (req.url.startsWith(ODataSample)) {
      if (req.url.endsWith("/$metadata")) {
        return Promise.resolve(sample_metadata);
      }
    }
    return Promise.resolve("");
  });
});

//
// Jest test to verify the "country.name" sort field name
//
test('sort by "country.name" field', async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Customers.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  await provider.getList("Customers", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "country.name", order: "asc" },
    filter: {},
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Customers?$orderby=Country/Name asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});
