import { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";
import { sqlToOptimizedExecutionPlan } from "@/graph-builder"; // Ajuste para usar a versão otimizada

const GraphVisualization = ({ sqlQuery }: { sqlQuery: string }) => {
  const graphContainerRef = useRef<HTMLDivElement | null>(null);
  const [executionPlan, setExecutionPlan] = useState<string[]>([]);

  useEffect(() => {
    if (!sqlQuery) return;

    // Gerar o plano de execução otimizado a partir da SQL
    const result = sqlToOptimizedExecutionPlan(sqlQuery);

    // Se houver erros de validação, mostrar um alerta ao usuário
    if (typeof result === "string") {
      alert(result);
      return;
    }

    const { steps, graph } = result;
    setExecutionPlan(steps); // Define o plano de execução

    // Adicionar notação matemática nos rótulos dos nós
    const formattedNodes = graph.nodes.map((node: any) => ({
      ...node,
      label: node.label
        .replace("Select:", "σ ")
        .replace("Projeção:", "π ")
        .replace("Join:", "⋈ ")
        .replace("Tabela:", "Tabela: "),
    }));

    // Criar uma instância de vis-network
    const container = graphContainerRef.current;
    const data = {
      nodes: formattedNodes,
      edges: graph.edges,
    };

    // Opções para o layout em árvore
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: "UD", // Direção: de cima para baixo
          sortMethod: "directed",
          nodeSpacing: 200, // Ajuste para espaçamento maior
          levelSeparation: 150, // Distância entre níveis
        },
      },
      nodes: {
        shape: "box",
        margin: 10,
        font: {
          size: 16,
          bold: true,
          color: "#000000", // Texto em preto para melhor contraste
        },
        color: {
          border: "#333",
          background: "#f0f0f0",
          highlight: {
            border: "#000",
            background: "#d3d3d3",
          },
        },
      },
      edges: {
        arrows: { to: { enabled: true } },
        smooth: {
          type: "cubicBezier",
          forceDirection: "vertical", // Força as arestas a serem verticais
          roundness: 0.4,
        },
      },
      physics: {
        enabled: false, // Desabilitar física para layout mais estável
      },
    };

    // Renderizar o grafo
    if (container) {
      const network = new Network(container, data, options);

      // Ajustar a visualização para centralizar o grafo
      network.fit({ animation: true });
    }
  }, [sqlQuery]);

  return (
    <div>
      <h1>Grafo de Consulta de Operadores Otimizado</h1>
      <div
        ref={graphContainerRef}
        style={{
          width: "100%",
          height: "600px", // Aumentar altura para melhor visualização
          border: "1px solid lightgray",
          marginBottom: "20px",
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
