// Definindo as operações básicas em álgebra relacional
export type Condition = string; // Simplesmente para fins de exemplo, condições podem ser representadas como strings

// Interface para uma operação de álgebra relacional
export interface RelationalOperation {
  toString(): string;
}

// Operação de Seleção (σ)
class Selection implements RelationalOperation {
  constructor(
    public condition: Condition,
    public relation: RelationalOperation
  ) {}

  toString(): string {
    return `σ(${this.condition})(${this.relation.toString()})`;
  }
}

// Operação de Projeção (π)
class Projection implements RelationalOperation {
  constructor(
    public attributes: string[],
    public relation: RelationalOperation
  ) {}

  toString(): string {
    return `π(${this.attributes.join(", ")})(${this.relation.toString()})`;
  }
}

// Operação de Junção (⨝)
class Join implements RelationalOperation {
  constructor(
    public condition: Condition,
    public left: RelationalOperation,
    public right: RelationalOperation
  ) {}

  toString(): string {
    return `(${this.left.toString()} ⨝ ${this.right.toString()} ON ${
      this.condition
    })`;
  }
}

// Operação de Renomeação (ρ)
class Rename implements RelationalOperation {
  constructor(public newName: string, public relation: RelationalOperation) {}

  toString(): string {
    return `ρ(${this.newName})(${this.relation.toString()})`;
  }
}

// Operação de União (∪)
class Union implements RelationalOperation {
  constructor(
    public left: RelationalOperation,
    public right: RelationalOperation
  ) {}

  toString(): string {
    return `(${this.left.toString()} ∪ ${this.right.toString()})`;
  }
}

// Operação de Diferença (−)
class Difference implements RelationalOperation {
  constructor(
    public left: RelationalOperation,
    public right: RelationalOperation
  ) {}

  toString(): string {
    return `(${this.left.toString()} − ${this.right.toString()})`;
  }
}

// Representação de uma tabela base
class Table implements RelationalOperation {
  constructor(public name: string) {}

  toString(): string {
    return this.name;
  }
}

export { Selection, Projection, Join, Rename, Union, Difference, Table };
