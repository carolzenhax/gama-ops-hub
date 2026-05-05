// Google Apps Script — Web App de autenticação GAMA
// Como publicar:
//   1. Abra a planilha no Google Sheets
//   2. Extensões > Apps Script
//   3. Cole este código (substitui o que estiver lá)
//   4. Salve e reimplante: Implantar > Gerenciar implantações > lápis > Nova versão > Implantar
//   5. A URL permanece a mesma

var SHEET_NAME = "Usuarios";

// Estrutura da planilha (linha 1 = cabeçalho):
// Coluna A: ID | Coluna B: Senha | Coluna C: Nome | Coluna D: Papel

function doGet(e) {
  var action = e.parameter.action || "login";
  try {
    switch (action) {
      case "login":  return handleLogin(e);
      case "list":   return handleList(e);
      case "create": return handleCreate(e);
      case "update": return handleUpdate(e);
      case "delete": return handleDelete(e);
      default:       return jsonResponse({ success: false, error: "Ação inválida." });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: "Erro interno: " + err.message });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getRows() {
  return getSheet().getDataRange().getValues();
}

function verifyAdmin(e) {
  var id    = (e.parameter.id    || "").trim();
  var senha = (e.parameter.senha || "").trim();
  if (!id || !senha) return false;

  var rows = getRows();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString().trim() === id &&
        rows[i][1].toString().trim() === senha &&
        rows[i][3].toString().trim().toLowerCase() === "admin") {
      return true;
    }
  }
  return false;
}

var PAPEIS_VALIDOS = ["admin", "operador", "visitante"];

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Ações ─────────────────────────────────────────────────────────────────────

function handleLogin(e) {
  var id    = (e.parameter.id    || "").trim();
  var senha = (e.parameter.senha || "").trim();
  if (!id || !senha) return jsonResponse({ success: false, error: "Parâmetros ausentes." });

  var rows = getRows();
  for (var i = 1; i < rows.length; i++) {
    var rowId    = rows[i][0] ? rows[i][0].toString().trim() : "";
    var rowSenha = rows[i][1] ? rows[i][1].toString().trim() : "";
    var rowNome  = rows[i][2] ? rows[i][2].toString().trim() : "";
    var rowPapel = rows[i][3] ? rows[i][3].toString().trim().toLowerCase() : "";

    if (rowId === id && rowSenha === senha) {
      if (PAPEIS_VALIDOS.indexOf(rowPapel) === -1)
        return jsonResponse({ success: false, error: "Papel inválido na planilha." });
      return jsonResponse({ success: true, nome: rowNome, papel: rowPapel });
    }
  }
  return jsonResponse({ success: false });
}

function handleList(e) {
  if (!verifyAdmin(e)) return jsonResponse({ success: false, error: "Acesso negado." });

  var rows = getRows();
  var users = [];
  for (var i = 1; i < rows.length; i++) {
    var rowId = rows[i][0] ? rows[i][0].toString().trim() : "";
    if (!rowId) continue;
    users.push({
      id:    rowId,
      nome:  rows[i][2] ? rows[i][2].toString().trim() : "",
      papel: rows[i][3] ? rows[i][3].toString().trim().toLowerCase() : "",
    });
  }
  return jsonResponse({ success: true, users: users });
}

function handleCreate(e) {
  if (!verifyAdmin(e)) return jsonResponse({ success: false, error: "Acesso negado." });

  var newId    = (e.parameter.newId    || "").trim();
  var newSenha = (e.parameter.newSenha || "").trim();
  var newNome  = (e.parameter.newNome  || "").trim();
  var newPapel = (e.parameter.newPapel || "").trim().toLowerCase();

  if (!newId || !newSenha || !newNome || !newPapel)
    return jsonResponse({ success: false, error: "Dados incompletos." });
  if (PAPEIS_VALIDOS.indexOf(newPapel) === -1)
    return jsonResponse({ success: false, error: "Papel inválido." });

  var rows = getRows();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString().trim() === newId)
      return jsonResponse({ success: false, error: "ID já cadastrado." });
  }

  getSheet().appendRow([newId, newSenha, newNome, newPapel]);
  return jsonResponse({ success: true });
}

function handleUpdate(e) {
  if (!verifyAdmin(e)) return jsonResponse({ success: false, error: "Acesso negado." });

  var targetId = (e.parameter.targetId || "").trim();
  var newNome  = (e.parameter.newNome  || "").trim();
  var newPapel = (e.parameter.newPapel || "").trim().toLowerCase();
  var newSenha = (e.parameter.newSenha || "").trim();

  if (!targetId || !newNome || !newPapel)
    return jsonResponse({ success: false, error: "Dados incompletos." });
  if (PAPEIS_VALIDOS.indexOf(newPapel) === -1)
    return jsonResponse({ success: false, error: "Papel inválido." });

  var sheet = getSheet();
  var rows  = getRows();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString().trim() === targetId) {
      sheet.getRange(i + 1, 3).setValue(newNome);
      sheet.getRange(i + 1, 4).setValue(newPapel);
      if (newSenha) sheet.getRange(i + 1, 2).setValue(newSenha);
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ success: false, error: "Usuário não encontrado." });
}

function handleDelete(e) {
  if (!verifyAdmin(e)) return jsonResponse({ success: false, error: "Acesso negado." });

  var adminId  = (e.parameter.id       || "").trim();
  var targetId = (e.parameter.targetId || "").trim();

  if (!targetId)
    return jsonResponse({ success: false, error: "ID não informado." });
  if (targetId === adminId)
    return jsonResponse({ success: false, error: "Não é possível excluir o próprio usuário." });

  var sheet = getSheet();
  var rows  = getRows();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString().trim() === targetId) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ success: false, error: "Usuário não encontrado." });
}
