/**
 * Rotina diária do Gmail:
 *   1) Esvazia a lixeira (exclusão PERMANENTE)
 *   2) Manda para a lixeira todas as mensagens dos remetentes da lista
 *
 * Assim, a lixeira sempre terá só o que foi apagado na última execução.
 *
 * Configuração inicial (uma vez):
 *   - No editor, menu lateral "Serviços" (+) > "Gmail API" > Adicionar
 *   - Rode "rotinaDiaria" com MODO_TESTE = true e autorize o acesso
 *   - Quando estiver satisfeito, mude MODO_TESTE para false
 *   - Rode "ativarExecucaoDiaria" uma vez para agendar
 */

// ====== CONFIGURAÇÃO ======

// Aceita e-mail completo ("promocoes@loja.com") ou domínio ("@loja.com")
const REMETENTES = [
  "exemplo1@empresa.com",
  "newsletter@site.com",
  "@dominio-inteiro.com",
];

// true  = só simula e mostra no log (NÃO apaga nada)
// false = esvazia a lixeira de verdade e manda as mensagens para ela
const MODO_TESTE = true;

// Hora aproximada da execução diária (0 a 23), no fuso do projeto
const HORA_EXECUCAO = 3;

// Para antes do limite de 6 minutos do Google. Se parar, continua no dia seguinte
// (ou rode "rotinaDiaria" manualmente de novo).
const LIMITE_MS = 5 * 60 * 1000;

// ====== ROTINA PRINCIPAL ======

function rotinaDiaria() {
  const inicio = Date.now();

  const terminou = esvaziarLixeira(inicio);
  if (!terminou) {
    Logger.log("Tempo esgotado ao esvaziar a lixeira. Rode de novo para continuar.");
    return;
  }

  limparEmails(inicio);
}

// ====== ETAPA 1: ESVAZIAR A LIXEIRA ======

function esvaziarLixeira(inicio) {
  let total = 0;
  let pageToken;

  while (true) {
    if (Date.now() - inicio > LIMITE_MS) {
      Logger.log("Lixeira: " + total + " mensagem(ns) processadas até agora.");
      return false;
    }

    const resp = Gmail.Users.Messages.list("me", {
      labelIds: ["TRASH"],
      includeSpamTrash: true,
      maxResults: 500,
      pageToken: pageToken,
    });

    const mensagens = resp.messages || [];
    if (mensagens.length === 0) break;

    total += mensagens.length;

    if (MODO_TESTE) {
      // Só conta: segue para a próxima página
      pageToken = resp.nextPageToken;
      if (!pageToken) break;
    } else {
      // Exclui de verdade e relê a primeira página até esvaziar
      Gmail.Users.Messages.batchDelete({ ids: mensagens.map((m) => m.id) }, "me");
    }
  }

  Logger.log(
    (MODO_TESTE ? "[TESTE] Seriam excluídas da lixeira: " : "Excluídas da lixeira: ") + total
  );
  return true;
}

// ====== ETAPA 2: MANDAR PARA A LIXEIRA ======

function limparEmails(inicio) {
  inicio = inicio || Date.now();
  let totalGeral = 0;

  for (const remetente of REMETENTES) {
    const alvo = remetente.trim().toLowerCase();
    if (!alvo) continue;

    // Coleta as conversas desse remetente (lotes de 100)
    const conversas = [];
    let pagina = 0;
    while (true) {
      const lote = GmailApp.search("from:" + alvo + " -in:trash", pagina * 100, 100);
      if (lote.length === 0) break;
      conversas.push(...lote);
      pagina++;
    }

    // Move só as mensagens desse remetente
    let contagem = 0;
    for (const conversa of conversas) {
      if (Date.now() - inicio > LIMITE_MS) {
        Logger.log("Tempo quase esgotado. Total até aqui: " + (totalGeral + contagem));
        return;
      }

      for (const msg of conversa.getMessages()) {
        if (msg.isInTrash()) continue;
        if (!msg.getFrom().toLowerCase().includes(alvo)) continue;

        contagem++;
        if (!MODO_TESTE) msg.moveToTrash();
      }
    }

    totalGeral += contagem;
    Logger.log(remetente + ": " + contagem + " mensagem(ns)");
  }

  Logger.log(
    (MODO_TESTE ? "[TESTE] Seriam enviadas à lixeira: " : "Enviadas à lixeira: ") + totalGeral
  );
}

// ====== AGENDAMENTO ======

function ativarExecucaoDiaria() {
  desativarExecucaoDiaria(); // evita gatilhos duplicados
  ScriptApp.newTrigger("rotinaDiaria")
    .timeBased()
    .everyDays(1)
    .atHour(HORA_EXECUCAO)
    .create();
  Logger.log("Agendado: todos os dias por volta das " + HORA_EXECUCAO + "h.");
}

function desativarExecucaoDiaria() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "rotinaDiaria")
    .forEach((t) => ScriptApp.deleteTrigger(t));
}
