import { sqlToOperatorGraph } from "@/graph-builder";
import { useEffect, useRef } from "react";
import { Network } from "vis-network";

interface GraphVisualizationProps {
  sqlQuery: string;
}

const GraphVisualization = ({ sqlQuery }: GraphVisualizationProps) => {
  const graphContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate the operator graph from SQL
    const operatorGraph = sqlToOperatorGraph(sqlQuery);

    // If there are validation errors, alert the user
    if (typeof operatorGraph === "string") {
      alert(operatorGraph);
      return;
    }

    // Create a vis-network instance
    const container = graphContainerRef.current;
    const data = {
      nodes: operatorGraph.nodes,
      edges: operatorGraph.edges,
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

    if (!container) return;

    // Render the network
    new Network(container, data, options);
  }, [sqlQuery]);

  return (
    <div>
      <h1>Relational Algebra Operator Graph</h1>
      <div
        ref={graphContainerRef}
        style={{
          width: "100%",
          height: "600px",
          border: "1px solid lightgray",
        }}
      ></div>
    </div>
  );
};

export default GraphVisualization;
