interface DBSchema {
  [key: string]: string[];
}

export interface SQLQuery {
  select: string[] | null;
  from: string | null;
  where: string | null;
  joins: { table: string; condition: string }[];
}

export interface OperatorGraph {
  nodes: { id: string; label: string }[];
  edges: { from: string; to: string }[];
}

const dbSchema: DBSchema = {
  categoria: ["idCategoria", "Descricao"],
  produto: [
    "idProduto",
    "Nome",
    "Descricao",
    "Preco",
    "QuantEstoque",
    "Categoria_idCategoria",
  ],
  tipocliente: ["idTipoCliente", "Descricao"],
  cliente: [
    "idCliente",
    "Nome",
    "Email",
    "Nascimento",
    "Senha",
    "TipoCliente_idTipoCliente",
    "DataRegistro",
  ],
  tipoendereco: ["idTipoEndereco", "Descricao"],
  endereco: [
    "idEndereco",
    "EnderecoPadrao",
    "Logradouro",
    "Numero",
    "Complemento",
    "Bairro",
    "Cidade",
    "UF",
    "CEP",
    "TipoEndereco_idTipoEndereco",
    "Cliente_idCliente",
  ],
  telefone: ["Numero", "Cliente_idCliente"],
  status: ["idStatus", "Descricao"],
  pedido: [
    "idPedido",
    "Status_idStatus",
    "DataPedido",
    "ValorTotalPedido",
    "Cliente_idCliente",
  ],
  pedido_has_produto: [
    "idPedidoProduto",
    "Pedido_idPedido",
    "Produto_idProduto",
    "Quantidade",
    "PrecoUnitario",
  ],
};

export function isValidTable(table: string): boolean {
  // Tornar a comparação case-insensitive com .toLowerCase()
  return Object.keys(dbSchema).some(
    (key) => key.toLowerCase() === table.toLowerCase()
  );
}

export function isValidField(table: string | null, field: string): boolean {
  if (!table || !isValidTable(table)) return false;

  if (field === "*") return true;

  // Tornar a comparação de campos case-insensitive também
  return dbSchema[table.toLowerCase()].some(
    (fieldName) => fieldName.toLowerCase() === field.toLowerCase()
  );
}

export function parseSQL(query: string) {
  // Remover ponto e vírgula ao final, mas manter dentro de strings
  if (query.includes(";")) {
    query = query.replace(/;(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/g, "");
  }

  // Limpar espaços extras
  query = query.replace(/\s+/g, " ").trim();

  const selectRegex = /SELECT (.+?) FROM/i; // Modificado para incluir a opção '?' após '.+'
  const fromRegex = /FROM (.+?)( WHERE| JOIN|$)/i;
  const whereRegex = /WHERE (.+?)( JOIN|$|;)/i;
  const joinRegex = /JOIN (.+?) ON (.+?)(?= JOIN| WHERE|$)/gi;

  // Matchers
  const selectMatch = selectRegex.exec(query);
  const fromMatch = fromRegex.exec(query);
  const whereMatch = whereRegex.exec(query);

  const joinMatches = [];
  let joinMatch;
  while ((joinMatch = joinRegex.exec(query)) !== null) {
    joinMatches.push({
      table: joinMatch[1].trim(),
      condition: joinMatch[2].trim(),
    });
  }

  return {
    select: selectMatch ? selectMatch[1].split(",").map((s) => s.trim()) : null,
    from: fromMatch ? fromMatch[1].trim() : null,
    where: whereMatch ? whereMatch[1].trim() : null,
    joins: joinMatches,
  };
}

export function buildOperatorGraph(parsedQuery: SQLQuery): OperatorGraph {
  const nodes = [];
  const edges = [];

  // Adicionando nós de tabelas
  if (parsedQuery.from) {
    nodes.push({ id: "From", label: `Tabela: ${parsedQuery.from}` });
  }

  // Adicionando nós de joins
  parsedQuery.joins.forEach((join, index) => {
    nodes.push({
      id: `Join${index}`,
      label: `Join: ${join.table} ON ${join.condition}`,
    });
    edges.push({ from: "From", to: `Join${index}` });
  });

  // Adicionando cláusula WHERE
  if (parsedQuery.where) {
    nodes.push({ id: "Where", label: `Where: ${parsedQuery.where}` });
    edges.push({ from: "From", to: "Where" });
  }

  return { nodes, edges };
}

export function validateSQL(parsedQuery: SQLQuery) {
  const errors = [];

  if (!parsedQuery.select) {
    errors.push("Cláusula SELECT é obrigatória.");
    return errors;
  }

  if (!parsedQuery.from) {
    errors.push("Cláusula FROM é obrigatória.");
    return errors;
  }

  // Validar tabela FROM
  if (!isValidTable(parsedQuery.from)) {
    errors.push(`Tabela '${parsedQuery.from}' não existe.`);
  }

  // Validar campos SELECT
  if (parsedQuery.select) {
    parsedQuery.select.forEach((field) => {
      const [table, fieldName] = field.includes(".")
        ? field.split(".")
        : [parsedQuery.from, field];
      if (!isValidField(table, fieldName)) {
        errors.push(`Campo '${fieldName}' não existe na tabela '${table}'.`);
      }
    });
  }

  // Validar tabelas e condições JOIN
  parsedQuery.joins.forEach((join) => {
    if (!isValidTable(join.table)) {
      errors.push(`Tabela '${join.table}' no JOIN não existe.`);
    }
    // Validar campos nas condições de JOIN
    const conditionParts = join.condition.split(/\s*=\s*/);
    conditionParts.forEach((part) => {
      const [table, fieldName] = part.trim().split(".");
      if (!isValidField(table, fieldName)) {
        errors.push(
          `Campo '${fieldName}' não existe na tabela '${table}' na condição JOIN.`
        );
      }
    });
  });

  // Validar campos WHERE
  if (parsedQuery.where) {
    const whereConditions = parsedQuery.where.split(/\s+AND\s+|\s+OR\s+/i);
    whereConditions.forEach((condition) => {
      const [table, fieldName] = condition.split(/[=><]/)[0].trim().split(".");
      if (!isValidField(table, fieldName)) {
        errors.push(
          `Campo '${fieldName}' não existe na tabela '${table}' na condição WHERE.`
        );
      }
    });
  }

  return errors;
}
