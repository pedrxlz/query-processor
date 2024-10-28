import {
  Join,
  Projection,
  RelationalOperation,
  Selection,
  Table,
} from "./data-structures";
import { OperatorGraph, parseSQL, validateSQL } from "./parser";
import { convertToRelationalAlgebra } from "./sql-to-algebra";

// Definindo a interface do Plano de Execução
interface ExecutionPlan {
  steps: string[];
  graph: OperatorGraph;
}

interface Node {
  id: string;
  label: string;
}

interface Edge {
  from: string;
  to: string;
}

// Função para aplicar a Heurística de Redução de Tuplas
function applyTupleReduction(
  relation: RelationalOperation
): RelationalOperation {
  if (relation instanceof Join) {
    // Aplicar redução de tuplas recursivamente nas sub-relações
    relation.left = applyTupleReduction(relation.left);
    relation.right = applyTupleReduction(relation.right);

    // Mover seleção para antes do join, se possível
    if (relation.left instanceof Selection) {
      const selection = relation.left;
      relation.left = selection.relation;
      console.log(`Movendo Seleção para antes do Join: ${selection.condition}`);
      return new Selection(selection.condition, relation);
    } else if (relation.right instanceof Selection) {
      const selection = relation.right;
      relation.right = selection.relation;
      console.log(`Movendo Seleção para antes do Join: ${selection.condition}`);
      return new Selection(selection.condition, relation);
    }
  } else if (relation instanceof Selection) {
    // Continuar aplicando a redução de tuplas na sub-relação
    relation.relation = applyTupleReduction(relation.relation);
  }
  return relation;
}

// Função para aplicar a Heurística de Redução de Atributos
function applyAttributeReduction(
  relation: RelationalOperation
): RelationalOperation {
  if (relation instanceof Projection) {
    // Aplicar a redução de atributos recursivamente
    relation.relation = applyAttributeReduction(relation.relation);

    // Mover projeção para antes do join ou seleção, se possível
    if (
      relation.relation instanceof Join ||
      relation.relation instanceof Selection
    ) {
      const projection = relation;
      const innerRelation = projection.relation;

      // Trocar projeção com a sub-relação, mantendo a projeção antes do join ou seleção
      projection.relation = (innerRelation as Selection | Projection).relation;
      (innerRelation as Selection | Projection).relation = projection;
      console.log(
        `Movendo Projeção para antes de ${
          innerRelation instanceof Join ? "Join" : "Seleção"
        }`
      );
      return innerRelation;
    }
  } else if (relation instanceof Join || relation instanceof Selection) {
    // Continuar aplicando a redução de atributos nas sub-relações
    if (relation instanceof Join) {
      relation.left = applyAttributeReduction(relation.left);
      relation.right = applyAttributeReduction(relation.right);
    } else if (relation instanceof Selection) {
      relation.relation = applyAttributeReduction(relation.relation);
    }
  }
  return relation;
}

// Função para gerar o plano de execução otimizado
export function buildOptimizedExecutionPlan(
  relation: RelationalOperation
): ExecutionPlan {
  // Aplicar as heurísticas de redução de tuplas e de atributos
  let optimizedRelation = applyTupleReduction(relation);
  optimizedRelation = applyAttributeReduction(optimizedRelation);

  // Verificar a estrutura otimizada no console
  console.log("Relação Otimizada:", optimizedRelation);

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;
  const executionSteps: string[] = [];

  // Função auxiliar para adicionar nós e arestas
  function addNode(label: string, parentId: string | null): string {
    // Converte os símbolos para notação matemática
    const formattedLabel = label
      .replace("Select:", "σ ")
      .replace("Projeção:", "π ")
      .replace("Join:", "⋈ ")
      .replace("Tabela:", "Tabela: ");
    const id = `Node${nodeId++}`;
    nodes.push({ id, label: formattedLabel });

    if (parentId) {
      edges.push({ from: parentId, to: id });
    }

    return id;
  }

  // Função recursiva para percorrer a árvore de operações de álgebra relacional
  function traverse(
    operation: RelationalOperation,
    parentId: string | null
  ): void {
    let currentId: string;

    // Caso seja uma Tabela
    if (operation instanceof Table) {
      currentId = addNode(`Tabela: ${operation.name}`, parentId);
      executionSteps.push(`Tabela lida: ${operation.name}`);
    }
    // Caso seja uma Seleção
    else if (operation instanceof Selection) {
      currentId = addNode(`σ ${operation.condition}`, parentId);
      executionSteps.push(`Select feito: ${operation.condition}`);
      traverse(operation.relation, currentId);
    }
    // Caso seja uma Projeção
    else if (operation instanceof Projection) {
      currentId = addNode(`π ${operation.attributes.join(", ")}`, parentId);
      executionSteps.push(`Projeção feita: ${operation.attributes.join(", ")}`);
      traverse(operation.relation, currentId);
    }
    // Caso seja um Join
    else if (operation instanceof Join) {
      currentId = addNode(`⋈ ${operation.condition}`, parentId);
      executionSteps.push(`Join feito: ${operation.condition}`);
      traverse(operation.left, currentId);
      traverse(operation.right, currentId);
    }
  }

  // Construir o grafo e o plano de execução a partir da relação otimizada
  traverse(optimizedRelation, null);

  return {
    steps: executionSteps,
    graph: { nodes, edges },
  };
}

// Função para converter SQL para o plano de execução otimizado
export function sqlToOptimizedExecutionPlan(
  query: string
): ExecutionPlan | string {
  const parsedQuery = parseSQL(query);

  // Validar a consulta SQL
  const errors = validateSQL(parsedQuery);
  if (errors.length > 0) {
    return `Erro de Validação: ${errors.join(", ")}`;
  }

  // Converter a consulta SQL para álgebra relacional
  const relationalAlgebra = convertToRelationalAlgebra(parsedQuery);

  // Construir o plano de execução otimizado
  return buildOptimizedExecutionPlan(relationalAlgebra);
}
