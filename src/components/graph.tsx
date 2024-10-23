import { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";
import { sqlToOptimizedExecutionPlan } from "@/graph-builder"; // Ajuste para usar a versão otimizada

const GraphVisualization = ({ sqlQuery }: { sqlQuery: string }) => {
  const graphContainerRef = useRef(null);
  const [executionPlan, setExecutionPlan] = useState<string[]>([]);

  useEffect(() => {
    // Gerar o plano de execução otimizado a partir da SQL
    const result = sqlToOptimizedExecutionPlan(sqlQuery);

    // Se houver erros de validação, mostrar um alerta ao usuário
    if (typeof result === "string") {
      alert(result);
      return;
    }

    const { steps, graph } = result;
    setExecutionPlan(steps); // Define o plano de execução

    // Criar uma instância de vis-network
    const container = graphContainerRef.current;
    const data = {
      nodes: graph.nodes,
      edges: graph.edges,
    };
    const options = {
      layout: {
        hierarchical: {
          direction: "UD",
          sortMethod: "directed",
        },
      },
      edges: {
        arrows: "to",
      },
    };

    // Renderizar o grafo
    if (!container) return;
    new Network(container, data, options);
  }, [sqlQuery]);

  return (
    <div>
      <h1>Grafo de Consulta de Operadores Otimizado</h1>
      <div
        ref={graphContainerRef}
        style={{
          width: "100%",
          height: "400px",
          border: "1px solid lightgray",
        }}
      ></div>

      <h2 className="text-white font-bold">Plano de Execução Otimizado</h2>
      <ol className="text-white font-bold">
        {executionPlan.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
};

export default GraphVisualization;
