// Google Apps Script — Web App de autenticação GAMA
// Como publicar:
//   1. Abra a planilha no Google Sheets
//   2. Extensões > Apps Script
//   3. Cole este código (substitui o que estiver lá)
//   4. Clique em "Implantar" > "Nova implantação" > Tipo: App da Web
//   5. Executar como: Eu | Quem pode acessar: Qualquer pessoa
//   6. Copie a URL e coloque em VITE_APPS_SCRIPT_URL no .env

var SHEET_NAME = "Usuarios"; // nome da aba na planilha

// Estrutura esperada da planilha (linha 1 = cabeçalho):
// Coluna A: ID | Coluna B: Senha | Coluna C: Nome | Coluna D: Papel

function doGet(e) {
  var id = e.parameter.id;
  var senha = e.parameter.senha;

  if (!id || !senha) {
    return jsonResponse({ success: false, error: "Parâmetros ausentes." });
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      var rowId    = rows[i][0] ? rows[i][0].toString().trim() : "";
      var rowSenha = rows[i][1] ? rows[i][1].toString().trim() : "";
      var rowNome  = rows[i][2] ? rows[i][2].toString().trim() : "";
      var rowPapel = rows[i][3] ? rows[i][3].toString().trim().toLowerCase() : "";

      if (rowId === id.trim() && rowSenha === senha.trim()) {
        var papeisValidos = ["admin", "operador", "visitante"];
        if (papeisValidos.indexOf(rowPapel) === -1) {
          return jsonResponse({ success: false, error: "Papel inválido na planilha." });
        }
        return jsonResponse({ success: true, nome: rowNome, papel: rowPapel });
      }
    }

    return jsonResponse({ success: false });
  } catch (err) {
    return jsonResponse({ success: false, error: "Erro interno: " + err.message });
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
