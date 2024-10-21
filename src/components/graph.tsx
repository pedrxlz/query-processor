import { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";
import { sqlToExecutionPlan } from "@/graph-builder";

const GraphVisualization = ({ sqlQuery }: { sqlQuery: string }) => {
  const graphContainerRef = useRef(null);
  const [executionPlan, setExecutionPlan] = useState<string[]>([]);

  useEffect(() => {
    // Generate the execution plan from SQL
    const result = sqlToExecutionPlan(sqlQuery);

    // If there are validation errors, alert the user
    if (typeof result === "string") {
      alert(result);
      return;
    }

    const { steps, graph } = result;
    setExecutionPlan(steps); // Set the execution plan

    // Create a vis-network instance
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

    // Render the network
    if (!container) return;
    new Network(container, data, options);
  }, [sqlQuery]);

  return (
    <div>
      <h1>\Grafo de Consulta de Operadores</h1>
      <div
        ref={graphContainerRef}
        style={{
          width: "100%",
          height: "400px",
          border: "1px solid lightgray",
        }}
      ></div>

      <h2 className="text-white font-bold">Plano de Execução</h2>
      <ol className="text-white font-bold">
        {executionPlan.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  );
};

export default GraphVisualization;
