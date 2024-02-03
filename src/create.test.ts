import fetchMock from "jest-fetch-mock";
import odataProvider from "./index";

fetchMock.dontMock();

const TripSvc =
  "https://services.odata.org/TripPinRESTierService/(S(fz0hgal0ywglauwt10ejigzx))/";

test("Create Customer", async () => {
  const provider = await odataProvider(TripSvc);

  const { data } = await provider.create("Airlines", {
    data: {
      id: "JV",
      Name: "John's Airline",
    },
  });
  expect(data).toMatchObject({
    id: "JV",
    Name: "John's Airline",
  });
});
