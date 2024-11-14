import {
  filterNameParser,
  operators,
} from "./filterNameParser";

test("Default to 'q' if filter name doesn't contain an operator", () => {
  const {
    fieldName: parsedFieldName,
    operator: parsedOperator,
  } = filterNameParser(`filterName`);
  expect(parsedFieldName).toEqual("FilterName");
  expect(parsedOperator).toEqual("q");
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
