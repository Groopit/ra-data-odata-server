import fs from "fs";
import odataProvider from "./index";
import { enableFetchMocks } from "jest-fetch-mock";
import { ODataNewOptions } from "@odata/client";
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

test("Northwind resources are correct", async () => {
  const provider = await odataProvider(Northwind);
  const resources = provider.getResources();
  expect(resources).toEqual([
    "Categories",
    "CustomerDemographics",
    "Customers",
    "Employees",
    "Orders",
    "Products",
    "Regions",
    "Shippers",
    "Suppliers",
    "Territories",
    "Category_Sales_for_1997",
    "Order_Subtotals",
    "Products_Above_Average_Prices",
    "Summary_of_Sales_by_Quarters",
    "Summary_of_Sales_by_Years",
  ]);
});

test("OData sample resources are correct", async () => {
  const provider = await odataProvider(ODataSample);
  const resources = provider.getResources();
  expect(resources).toEqual([
    "Products",
    "ProductDetails",
    "Categories",
    "Suppliers",
    "Persons",
    "PersonDetails",
    "Advertisements",
  ]);
});

test("Get Customer from Northwind by ID", async () => {
  const provider = await odataProvider(Northwind);
  await provider.getOne("Customers", { id: "ALFKI" });
  expect(fetchMock.mock.calls[1][0]).toEqual(Northwind + "/Customers('ALFKI')");
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

test("Get Order from Northwind by ID", async () => {
  const provider = await odataProvider(Northwind);
  await provider.getOne("Orders", { id: 10258 });
  expect(fetchMock.mock.calls[1][0]).toEqual(Northwind + "/Orders(10258)");
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

test("Get Order from Northwind by ID as string", async () => {
  const provider = await odataProvider(Northwind);
  await provider.getOne("Orders", { id: "10258" });
  expect(fetchMock.mock.calls[1][0]).toEqual(Northwind + "/Orders(10258)");
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

test("Get Customer list from Northwind", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Customers.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Customers", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ContactName", order: "asc" },
    filter: null,
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind + "/Customers?$orderby=ContactName asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
  expect(total).toEqual(91);
  expect(data.length).toEqual(15);
  expect(data[0]).toMatchObject({
    id: "ROMEY",
    CompanyName: "Romero y tomillo",
    ContactName: "Alejandra Camino",
    ContactTitle: "Accounting Manager",
    Address: "Gran Vía, 1",
    City: "Madrid",
    Region: null,
    PostalCode: "28001",
    Country: "Spain",
    Phone: "(91) 745 6200",
    Fax: "(91) 745 6210",
  });
});

test("Get Category list from Northwind", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Categories.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Categories", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "CategoryID", order: "asc" },
    filter: null,
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind + "/Categories?$orderby=CategoryID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
  expect(total).toEqual(8);
  expect(data.length).toEqual(8);
  expect(typeof data[0].id).toEqual("number");
  expect(data[0]).toMatchObject({
    id: 1,
    CategoryName: "Beverages",
    Description: "Soft drinks, coffees, teas, beers, and ales",
  });
});

test("Get entity with GUID Id", async () => {
  const provider = await odataProvider(ODataSample);
  await provider.getOne("Advertisements", {
    id: "f89dee73-af9f-4cd4-b330-db93c25ff3c7",
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    ODataSample + "/Advertisements(f89dee73-af9f-4cd4-b330-db93c25ff3c7)"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

test("Get many from Northwind", async () => {
  const provider = await odataProvider(Northwind);
  const { data } = await provider.getMany("Customers", {
    ids: ["ROMEY", "ALFKI", "ANATR"],
  });
  expect(fetchMock.mock.calls.length).toEqual(4);
  expect(data.length).toEqual(3);
  expect(fetchMock.mock.calls[1][0]).toEqual(Northwind + "/Customers('ROMEY')");
  expect(fetchMock.mock.calls[2][0]).toEqual(Northwind + "/Customers('ALFKI')");
  expect(fetchMock.mock.calls[3][0]).toEqual(Northwind + "/Customers('ANATR')");
});

test("Get many referenced Products from Northwind", async () => {
  const provider = await odataProvider(Northwind);
  await provider.getManyReference("Products", {
    id: 1,
    target: "CategoryID",
    pagination: { page: 1, perPage: 10 },
    sort: { field: "ProductName", order: "ASC" },
    filter: {},
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
    "/Products?$filter=CategoryID eq 1&$orderby=ProductName asc&$top=10&$count=true"
  );
});

test("Get Products by parent Category", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/CategoriesExpandProducts.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getManyReference("Products", {
    id: 1,
    target: "Products",
    pagination: { page: 1, perPage: 10 },
    sort: { field: "ProductName", order: "ASC" },
    filter: { parent: "Categories" },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind + "/Categories(1)?$expand=Products"
  );
  expect(total).toEqual(12);
  expect(data.length).toEqual(10);

  expect(data[0]).toMatchObject({
    id: 1,
    ProductName: "Chai",
    SupplierID: 1,
    QuantityPerUnit: "10 boxes x 20 bags",
    UnitPrice: 18,
    UnitsInStock: 39,
    UnitsOnOrder: 0,
    ReorderLevel: 10,
    Discontinued: false,
  });
  expect(data[9]).toMatchObject({
    id: 75,
    ProductName: "Rhönbräu Klosterbier",
    SupplierID: 12,
    CategoryID: 1,
    QuantityPerUnit: "24 - 0.5 l bottles",
    UnitPrice: 7.75,
    UnitsInStock: 125,
    UnitsOnOrder: 0,
    ReorderLevel: 25,
    Discontinued: false,
  });
});

test("Actions creates a POST request", async () => {
  const provider = await odataProvider(Northwind);

  await provider.action("Customers", {
    id: "ROMEY",
    action: "AddFlierMiles",
    payload: {
      miles: 100,
    },
  });

  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind + "/Customers('ROMEY')/AddFlierMiles"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("POST");
  const body = fetchMock.mock.calls[1][1]?.body?.toString() ?? "";
  expect(JSON.parse(body)).toEqual({ miles: 100 });
});

test("Custom fetch proxy", async () => {
  const customOptions = async (): Promise<Partial<ODataNewOptions>> => ({
    fetchProxy: async (url, init) => {
      const response = await fetch(url, {
        method: init.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'text/plain',
          'X-Some-Custom': 'Header',
        },
      });

      let content: any;
      if (url.endsWith("/$metadata"))
        // metadata needs to be parsed as text
        content = await response.text();
      else
        // all other content needs to be parsed as json
        content = await response.json();

      return {
        response,
        content,
      };
    },
  })

  const provider = await odataProvider(Northwind, customOptions);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Categories.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data } = await provider.getList("Categories", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "CategoryID", order: "asc" },
    filter: null,
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind + "/Categories?$orderby=CategoryID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
  expect(fetchMock.mock.calls[1][1]?.credentials).toEqual('include');
  expect(fetchMock.mock.calls[1][1]?.headers).toEqual({
    'Content-Type': 'text/plain',
    'X-Some-Custom': 'Header',
  });
  expect(data[0]).toMatchObject({
    id: 1,
    CategoryName: "Beverages",
    Description: "Soft drinks, coffees, teas, beers, and ales",
  });
});