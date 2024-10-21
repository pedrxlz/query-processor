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
  Categoria: ["idCategoria", "Descricao"],
  Produto: [
    "idProduto",
    "Nome",
    "Descricao",
    "Preco",
    "QuantEstoque",
    "Categoria_idCategoria",
  ],
  TipoCliente: ["idTipoCliente", "Descricao"],
  Cliente: [
    "idCliente",
    "Nome",
    "Email",
    "Nascimento",
    "Senha",
    "TipoCliente_idTipoCliente",
    "DataRegistro",
  ],
  TipoEndereco: ["idTipoEndereco", "Descricao"],
  Endereco: [
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
  Telefone: ["Numero", "Cliente_idCliente"],
  Status: ["idStatus", "Descricao"],
  Pedido: [
    "idPedido",
    "Status_idStatus",
    "DataPedido",
    "ValorTotalPedido",
    "Cliente_idCliente",
  ],
  Pedido_has_Produto: [
    "idPedidoProduto",
    "Pedido_idPedido",
    "Produto_idProduto",
    "Quantidade",
    "PrecoUnitario",
  ],
};

/* Exemplo de Consultas SQL:

Válida `SELECT Produto.Nome, Produto.Preco, Categoria.Descricao
FROM Produto JOIN Categoria ON Produto.Categoria_idCategoria = Categoria.idCategoria
WHERE Produto.Preco > 100`;

Inválida `SELECT Produto.Nome, Produto.Preco, Categoria.Descricao
FROM Produto JOIN Categoria ON Produto.Categoria_idCategoria = Categoria.idCategoria
WHERE Produto.Preco > 100 AND Produto.InvalidField = 10`;

*/

export function isValidTable(table: string): boolean {
  return Object.keys(dbSchema).includes(table);
}

export function isValidField(table: string | null, field: string): boolean {
  if (!table || !isValidTable(table)) return false;

  if (field == "*") return true;

  return dbSchema[table].includes(field);
}

export function parseSQL(query: string) {
  query = query.replace(/\s+/g, " ").trim();

  const selectRegex = /SELECT (.+) FROM/i;
  const fromRegex = /FROM (.+?)( WHERE| JOIN|$)/i;
  const whereRegex = /WHERE (.+?)( JOIN|$)/i;
  const joinRegex = /JOIN (.+?) ON (.+?)( WHERE|$)/gi;

  const selectMatch = selectRegex.exec(query);
  const fromMatch = fromRegex.exec(query);
  const whereMatch = whereRegex.exec(query);
  const joinMatches = [];
  let joinMatch;
  while ((joinMatch = joinRegex.exec(query)) !== null) {
    joinMatches.push({
      table: joinMatch[1],
      condition: joinMatch[2],
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
