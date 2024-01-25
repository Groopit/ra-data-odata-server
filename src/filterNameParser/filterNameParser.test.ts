import {
  filterNameParser,
  operators,
} from "./filterNameParser";

test("Thrown error if filter name doesn't contain an operator", () => {
  expect(() => filterNameParser("filterName")).toThrow(Error);
});

operators.forEach((operator) => {
  test(`Parse filterName_${operator}`, () => {
    const {
      fieldName: parsedFieldName,
      operator: parsedOperator,
    } = filterNameParser(`filterName_${operator}`);
    expect(parsedFieldName).toEqual("FilterName");
    expect(parsedOperator).toEqual(operator);
  });

  test(`Parse filter.name_${operator}`, () => {
    const {
      fieldName: parsedFieldName,
      operator: parsedOperator,
    } = filterNameParser(`filter.name_${operator}`);
    expect(parsedFieldName).toEqual("Filter/Name");
    expect(parsedOperator).toEqual(operator);
  });
});
