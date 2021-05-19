import {parse_metadata} from "./metadata_parser";
import fs from "fs";

const nw = fs.readFileSync("./test/metadata/Northwind.metadata.xml").toString();

test('Northwind metadata', () => {
    const entities = parse_metadata(nw);
    expect(Object.entries(entities).length).toBe(15);
    expect(entities.categories).toBeDefined();
    expect(entities.customerdemographics).toBeDefined();
    expect(entities.customers).toBeDefined();
    expect(entities.employees).toBeDefined();
    expect(entities.orders).toBeDefined();
    expect(entities.products).toBeDefined();
    expect(entities.regions).toBeDefined();
    expect(entities.shippers).toBeDefined();
    expect(entities.suppliers).toBeDefined();
    expect(entities.territories).toBeDefined();
    expect(entities.category_sales_for_1997).toBeDefined();
    expect(entities.order_subtotals).toBeDefined();
});

const odata = fs.readFileSync("./test/metadata/OData.metadata.xml").toString();

test('OData metadata', () => {
    const entities = parse_metadata(odata);
    expect(Object.entries(entities).length).toBe(7);
    expect(entities.products).toBeDefined();
    expect(entities.productdetails).toBeDefined();
    expect(entities.categories).toBeDefined();
    expect(entities.suppliers).toBeDefined();
    expect(entities.persons).toBeDefined();
    expect(entities.persondetails).toBeDefined();
    expect(entities.advertisements).toBeDefined();
    expect(entities.categories).toBeDefined();
});

const edm = fs.readFileSync("./test/metadata/edm.metadata.xml").toString();

test('EDM metadata', () => {
    const entities = parse_metadata(edm);
    expect(Object.entries(entities).length).toBe(1);
    expect(entities.customer).toBeDefined();
    expect(entities.customer.Type.Property.length).toBe(10);
});