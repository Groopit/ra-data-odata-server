export default class ArrayFilterExpressions {
  private filterExpressions!: Set<string>;

  constructor() {
    this.filterExpressions = new Set<string>();
  }

  public add(filterExpression: string): ArrayFilterExpressions {
    if (filterExpression.length === 0) {
      throw new Error("Filter expression can't be empty");
    }

    this.filterExpressions.add(filterExpression);

    return this;
  }

  public clear(): ArrayFilterExpressions {
    this.filterExpressions.clear();

    return this;
  }

  public toString(): string {
    return Array.from(this.filterExpressions).join(' and ');
  }
}
