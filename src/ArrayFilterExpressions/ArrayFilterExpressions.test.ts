import ArrayFilterExpressions from './ArrayFilterExpressions';

let arrayFilterExpressions: ArrayFilterExpressions;

describe('executors/FilterExecutor/ArrayFilterExpressions', () => {
  beforeEach(() => {
    arrayFilterExpressions = new ArrayFilterExpressions();
  });

  test('should add expression to filters array', () => {
    arrayFilterExpressions.add('Field eq 1');
    arrayFilterExpressions.add('Field eq 2');

    expect(arrayFilterExpressions.toString()).toEqual('Field eq 1 and Field eq 2');
  });

  test('should filter duplicates in result', () => {
    arrayFilterExpressions.add('Field eq 1');
    arrayFilterExpressions.add('Field eq 1');

    expect(arrayFilterExpressions.toString()).toEqual('Field eq 1');
  });

  test('should clear filters array', () => {
    arrayFilterExpressions.add('Field eq 1');
    arrayFilterExpressions.add('Field eq 1');
    arrayFilterExpressions.clear();

    expect(arrayFilterExpressions.toString()).toEqual('');
  });

  test('should thrown error if call with empty filter expression', () => {
    expect(() => arrayFilterExpressions.add("")).toThrow(Error);
  });
});
