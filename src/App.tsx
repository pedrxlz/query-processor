import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  buildOperatorGraph,
  OperatorGraph,
  parseSQL,
  validateSQL,
} from "@/parser";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

enum Step {
  Query,
  Graph,
}

function App() {
  const [query, setQuery] = useState<string>("");
  const [graph, setGraph] = useState<OperatorGraph>({ nodes: [], edges: [] });
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<Step>(Step.Query);

  function processQuery() {
    setErrors([]);
    const parsedQuery = parseSQL(query);

    const validationErrors = validateSQL(parsedQuery);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const graph = buildOperatorGraph(parsedQuery);
    setGraph(graph);
    setStep(Step.Graph);
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setQuery(value);
    if (value.length === 0) {
      setErrors([]);
    }
  }

  return (
    <main className="bg-foreground h-screen flex flex-col items-center">
      <section
        className="group my-auto w-full px-4 sm:w-[580px]"
        data-iserror={errors.length > 0}
      >
        {step === Step.Query && (
          <>
            <h1 className="text-3xl font-bold text-primary-foreground pb-4">
              Processador de Consultas SQL
            </h1>
            <div className="grid gap-2">
              <Textarea
                className="text-primary-foreground group-data-[iserror=true]:border-red-500 h-36"
                placeholder="Digite sua consulta SQL"
                onChange={handleQueryChange}
                value={query}
              />
              <Button variant="secondary" onClick={processQuery}>
                Processar
              </Button>
            </div>
            {errors.length > 0 && (
              <>
                <h3 className="text-red-500 text-sm mt-2 font-semibold">
                  Erros de validação:
                </h3>
                {errors.map((error) => (
                  <p className="text-red-500 text-sm mt-2" key={error}>
                    {error}
                  </p>
                ))}
              </>
            )}
          </>
        )}

        {step === Step.Graph && (
          <>
            <div className="mt-8">
              <div className="flex items-center gap-2">
                <Button
                  className="rounded-full hover:bg-primary-foreground/10 p-1"
                  variant="ghost"
                  onClick={() => setStep(Step.Query)}
                >
                  <ArrowLeft className="text-primary-foreground" />
                </Button>
                <h2 className="text-xl font-bold text-primary-foreground">
                  Grafo de Operadores
                </h2>
              </div>
              <div className="rounded-md shadow-md p-4">
                {graph.nodes.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum grafo gerado</p>
                ) : (
                  <div className="flex flex-col gap-4">{/* Gerar grafo */}</div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
