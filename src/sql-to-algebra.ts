// Função para converter SQLQuery para álgebra relacional
import {
  RelationalOperation,
  Selection,
  Projection,
  Join,
  Table,
} from "./data-structures"; // Certifique-se de ajustar a importação das classes

import { parseSQL, SQLQuery, validateSQL } from "./parser"; // Certifique-se de ajustar a importação da função parseSQL

export function convertToRelationalAlgebra(
  parsedQuery: SQLQuery
): RelationalOperation {
  let relation: RelationalOperation = new Table(parsedQuery.from!); // Tabela base

  // Adicionar operações JOIN se existirem
  parsedQuery.joins.forEach((join) => {
    relation = new Join(join.condition, relation, new Table(join.table));
  });

  // Adicionar a operação WHERE (Seleção)
  if (parsedQuery.where) {
    relation = new Selection(parsedQuery.where, relation);
  }

  // Adicionar a operação SELECT (Projeção)
  if (parsedQuery.select) {
    relation = new Projection(parsedQuery.select, relation);
  }

  return relation;
}

// Função principal para validar e converter SQL em álgebra relacional
export function sqlToRelationalAlgebra(query: string): string {
  const parsedQuery = parseSQL(query);

  // Validar a consulta SQL
  const errors = validateSQL(parsedQuery);
  if (errors.length > 0) {
    return `Erro de Validação: ${errors.join(", ")}`;
  }

  // Converter a consulta SQL para álgebra relacional
  const relationalAlgebra = convertToRelationalAlgebra(parsedQuery);
  return relationalAlgebra.toString();
}
