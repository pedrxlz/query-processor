// Definindo as operações básicas em álgebra relacional
export type Condition = string; // Representa uma condição simples

// Interface para uma operação de álgebra relacional
export interface RelationalOperation {
  toString(): string;
}

// Operação de Seleção (σ)
export class Selection implements RelationalOperation {
  constructor(
    public condition: Condition,
    public relation: RelationalOperation
  ) {}

  toString(): string {
    return `σ(${this.condition})(${this.relation.toString()})`;
  }
}

// Operação de Projeção (π)
export class Projection implements RelationalOperation {
  constructor(
    public attributes: string[],
    public relation: RelationalOperation
  ) {}

  toString(): string {
    return `π(${this.attributes.join(", ")})(${this.relation.toString()})`;
  }
}

// Operação de Junção (⨝)
export class Join implements RelationalOperation {
  constructor(
    public condition: Condition,
    public left: RelationalOperation,
    public right: RelationalOperation
  ) {}

  toString(): string {
    return `(${this.left.toString()} ⨝ ${this.right.toString()} ON ${this.condition})`;
  }
}

// Operação de Renomeação (ρ)
export class Rename implements RelationalOperation {
  constructor(public newName: string, public relation: RelationalOperation) {}

  toString(): string {
    return `ρ(${this.newName})(${this.relation.toString()})`;
  }
}

// Operação de União (∪)
export class Union implements RelationalOperation {
  constructor(
    public left: RelationalOperation,
    public right: RelationalOperation
  ) {}

  toString(): string {
    return `(${this.left.toString()} ∪ ${this.right.toString()})`;
  }
}

// Operação de Diferença (−)
export class Difference implements RelationalOperation {
  constructor(
    public left: RelationalOperation,
    public right: RelationalOperation
  ) {}

  toString(): string {
    return `(${this.left.toString()} − ${this.right.toString()})`;
  }
}

// Representação de uma tabela base
export class Table implements RelationalOperation {
  constructor(public name: string) {}

  toString(): string {
    return this.name;
  }
}