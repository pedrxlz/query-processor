import {
  RelationalOperation,
  Selection,
  Projection,
  Join,
  Table,
} from "./data-structures";
import { OperatorGraph } from "./parser";
import { parseSQL, validateSQL } from "./parser";
import { convertToRelationalAlgebra } from "./sql-to-algebra";

interface ExecutionPlan {
  steps: string[];
  graph: OperatorGraph;
}

// Função para gerar o plano de execução junto com o grafo
export function buildExecutionPlan(
  relation: RelationalOperation
): ExecutionPlan {
  const nodes: { id: string; label: string }[] = [];
  const edges: { from: string; to: string }[] = [];
  let nodeId = 0;
  const executionSteps: string[] = [];

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

    // Caso seja uma Tabela
    if (operation instanceof Table) {
      currentId = addNode(`Tabela: ${operation.name}`, parentId);
      executionSteps.push(`Tabela lida: ${operation.name}`);
    }
    // Caso seja uma Seleção
    else if (operation instanceof Selection) {
      currentId = addNode(`Select: ${operation.condition}`, parentId);
      executionSteps.push(`Select feito: ${operation.condition}`);
      traverse(operation.relation, currentId);
    }
    // Caso seja uma Projeção
    else if (operation instanceof Projection) {
      currentId = addNode(
        `Projeção: ${operation.attributes.join(", ")}`,
        parentId
      );
      executionSteps.push(`Projeção feita: ${operation.attributes.join(", ")}`);
      traverse(operation.relation, currentId);
    }
    // Caso seja um Join
    else if (operation instanceof Join) {
      currentId = addNode(`Join: ${operation.condition}`, parentId);
      executionSteps.push(`Join feito: ${operation.condition}`);
      traverse(operation.left, currentId);
      traverse(operation.right, currentId);
    }
  }

  // Iniciar a construção do grafo e do plano de execução
  traverse(relation, null);

  return {
    steps: executionSteps,
    graph: { nodes, edges },
  };
}

// Função para converter SQL para álgebra relacional e gerar o plano de execução
export function sqlToExecutionPlan(query: string): ExecutionPlan | string {
  const parsedQuery = parseSQL(query);

  // Validar a consulta SQL
  const errors = validateSQL(parsedQuery);
  if (errors.length > 0) {
    return `Erro de Validação: ${errors.join(", ")}`;
  }

  // Converter a consulta SQL para álgebra relacional
  const relationalAlgebra = convertToRelationalAlgebra(parsedQuery);

  // Construir o plano de execução a partir da álgebra relacional
  return buildExecutionPlan(relationalAlgebra);
}
