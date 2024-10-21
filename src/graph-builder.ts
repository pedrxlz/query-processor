import {
  RelationalOperation,
  Selection,
  Projection,
  Join,
  Table,
} from "./data-structures";
import { OperatorGraph } from "./parser";
import { parseSQL } from "./parser";
import { validateSQL } from "./parser";
import { convertToRelationalAlgebra } from "./sql-to-algebra";

// Função para gerar o grafo a partir de operações de álgebra relacional
export function buildRelationalAlgebraGraph(
  relation: RelationalOperation
): OperatorGraph {
  const nodes: { id: string; label: string }[] = [];
  const edges: { from: string; to: string }[] = [];
  let nodeId = 0;

  // Função auxiliar para adicionar nós e arestas
  function addNode(label: string, parentId: string | null): string {
    const id = `Node${nodeId++}`;
    nodes.push({ id, label });

    if (parentId) {
      edges.push({ from: parentId, to: id });
    }

    return id;
  }

  // Função recursiva para percorrer a árvore de operações de álgebra relacional
  function traverse(operation: RelationalOperation, parentId: string | null) {
    let currentId: string;

    if (operation instanceof Table) {
      currentId = addNode(`Table: ${operation.name}`, parentId);
    } else if (operation instanceof Selection) {
      currentId = addNode(`Selection: ${operation.condition}`, parentId);
      traverse(operation.relation, currentId);
    } else if (operation instanceof Projection) {
      currentId = addNode(
        `Projection: ${operation.attributes.join(", ")}`,
        parentId
      );
      traverse(operation.relation, currentId);
    } else if (operation instanceof Join) {
      currentId = addNode(`Join: ${operation.condition}`, parentId);
      traverse(operation.left, currentId);
      traverse(operation.right, currentId);
    }
  }

  // Iniciar a construção do grafo a partir da operação de álgebra relacional
  traverse(relation, null);

  return { nodes, edges };
}

// Função para converter SQL para álgebra relacional e gerar o grafo
export function sqlToOperatorGraph(query: string): OperatorGraph | string {
  const parsedQuery = parseSQL(query);

  // Validar a consulta SQL
  const errors = validateSQL(parsedQuery);
  if (errors.length > 0) {
    return `Erro de Validação: ${errors.join(", ")}`;
  }

  // Converter a consulta SQL para álgebra relacional
  const relationalAlgebra = convertToRelationalAlgebra(parsedQuery);

  // Construir o grafo de operadores a partir da álgebra relacional
  return buildRelationalAlgebraGraph(relationalAlgebra);
}
