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

//
// Jest test to verify the q filter field name
//
test("filter q", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Customers.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Customers", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ContactName", order: "asc" },
    filter: { q: "Search string" },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Customers?$orderby=ContactName asc&$top=15&$count=true&$search=Search string"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _q filter functionality
//
test("filter_q", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Customers.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Customers", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ContactName", order: "asc" },
    filter: { ContactName_q: "Alejandra" },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Customers?$filter=Contains(ContactName,'Alejandra') eq true&$orderby=ContactName asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _neq filter functionality
//
test("filter_neq", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Customers.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Customers", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ContactName", order: "asc" },
    filter: { ContactName_neq: "Alejandra Camino" },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Customers?$filter=ContactName ne 'Alejandra Camino'&$orderby=ContactName asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _eq filter functionality
//
test("filter_eq", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Customers.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Customers", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ContactName", order: "asc" },
    filter: { ContactName_eq: "Alejandra Camino" },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Customers?$filter=ContactName eq 'Alejandra Camino'&$orderby=ContactName asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _lte filter functionality
//
test("filter_lte", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Products.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Products", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ProductID", order: "asc" },
    filter: { UnitPrice_lte: 10 },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Products?$filter=UnitPrice le 10&$orderby=ProductID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _lt filter functionality
//
test("filter_lt", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Products.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Products", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ProductID", order: "asc" },
    filter: { UnitPrice_lt: 10 },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Products?$filter=UnitPrice lt 10&$orderby=ProductID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _gte filter functionality
//
test("filter_gte", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Products.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Products", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ProductID", order: "asc" },
    filter: { UnitPrice_gte: 10 },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Products?$filter=UnitPrice ge 10&$orderby=ProductID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _gt filter functionality
//
test("filter_gt", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Products.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Products", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ProductID", order: "asc" },
    filter: { UnitPrice_gt: 10 },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Products?$filter=UnitPrice gt 10&$orderby=ProductID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _eq_any filter functionality
//
test("filter_eq_any", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Products.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Products", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ProductID", order: "asc" },
    filter: { UnitPrice_eq_any: [10, 20], UnitPrice2_eq_any: [10, 20] },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Products?$filter=(UnitPrice eq 10 or UnitPrice eq 20) and (UnitPrice2 eq 10 or UnitPrice2 eq 20)&$orderby=ProductID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _neq_any filter functionality
//
test("filter_neq_any", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Products.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Products", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ProductID", order: "asc" },
    filter: { UnitPrice_neq_any: [10, 20] },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Products?$filter=(UnitPrice eq 10 or UnitPrice eq 20) eq false&$orderby=ProductID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _eq filter functionality
//
test("filter_boolean", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Customers.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Customers", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ContactName", order: "asc" },
    filter: { ContactName_boolean: true },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Customers?$filter=ContactName eq true&$orderby=ContactName asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _inc filter functionality
//
test("filter_inc", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Products.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Products", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ProductID", order: "asc" },
    filter: { UnitPrice_inc: [10, '20'] },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Products?$filter=(UnitPrice eq 10) and (UnitPrice eq '20')&$orderby=ProductID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _inc_any filter functionality
//
test("filter_inc_any", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Products.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Products", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ProductID", order: "asc" },
    filter: { UnitPrice_inc_any: [10, '20'] },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Products?$filter=(UnitPrice eq 10) or (UnitPrice eq '20')&$orderby=ProductID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});

//
// Jest test to verify the _ninc_any filter functionality
//
test("filter_ninc_any", async () => {
  const provider = await odataProvider(Northwind);
  fetchMock.mockOnce(
    fs.readFileSync("./test/service/Products.json").toString(),
    { headers: { "Content-Type": "application/json" } }
  );
  const { data, total } = await provider.getList("Products", {
    pagination: { page: 1, perPage: 15 },
    sort: { field: "ProductID", order: "asc" },
    filter: { UnitPrice_ninc_any: [10, '20'] },
  });
  expect(fetchMock.mock.calls[1][0]).toEqual(
    Northwind +
      "/Products?$filter=(UnitPrice ne 10) and (UnitPrice ne '20')&$orderby=ProductID asc&$top=15&$count=true"
  );
  expect(fetchMock.mock.calls[1][1]?.method).toEqual("GET");
});
