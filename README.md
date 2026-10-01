# Limpar Gmail

Script em **Google Apps Script** que mantém sua caixa de entrada organizada automaticamente. Todos os dias ele:

1. **Esvazia a lixeira** do Gmail (exclusão permanente).
2. **Move para a lixeira** todas as mensagens enviadas pelos remetentes de uma lista que você define.

Assim, a lixeira sempre contém apenas o que foi apagado na última execução.

> ⚠️ **Atenção:** a exclusão da lixeira é **permanente**. Use o modo teste antes de ativar a rotina de verdade.

---

## Como funciona

| Etapa | O que acontece |
|-------|----------------|
| 1. Esvaziar a lixeira | Todas as mensagens que estão na lixeira são excluídas definitivamente. |
| 2. Limpar remetentes | O script busca as mensagens dos remetentes da lista `REMETENTES` e as envia para a lixeira. |

Detalhes importantes:

- O script mexe **apenas nas mensagens do remetente**, não na conversa inteira. Respostas suas ou de outras pessoas na mesma conversa permanecem.
- Mensagens que já estão na lixeira são ignoradas na etapa 2.
- O Google limita cada execução a cerca de 6 minutos. O script para antes desse limite e retoma na próxima execução.

---

## Requisitos

- Uma conta Google com Gmail.
- Acesso ao [Google Apps Script](https://script.google.com).

Não é necessário instalar nada nem criar chaves de API.

---

## Instalação

1. Acesse [script.google.com](https://script.google.com) e clique em **Novo projeto**.
2. Apague o código padrão e cole o conteúdo de `limpar_gmail.gs`.
3. No menu lateral esquerdo, clique no **+** ao lado de **Serviços**, escolha **Gmail API** e clique em **Adicionar**.
   Este passo é obrigatório: sem ele, o script falha com o erro `Gmail is not defined`.
4. Edite a lista `REMETENTES` (veja a seção abaixo).
5. Salve o projeto.

---

## Configuração

No início do arquivo existem quatro constantes:

```javascript
const REMETENTES = [
  "exemplo1@empresa.com",
  "newsletter@site.com",
  "@dominio-inteiro.com",
];

const MODO_TESTE = true;
const HORA_EXECUCAO = 3;
const LIMITE_MS = 5 * 60 * 1000;
```

| Constante | Descrição |
|-----------|-----------|
| `REMETENTES` | Lista de remetentes a limpar. Aceita e-mail completo (`"promocoes@loja.com"`) ou domínio inteiro (`"@loja.com"`). Para incluir mais, adicione novas linhas. |
| `MODO_TESTE` | `true`: apenas simula e mostra o resultado no log, sem apagar nada. `false`: executa de verdade. |
| `HORA_EXECUCAO` | Hora aproximada (0 a 23) da execução diária, no fuso horário do projeto. |
| `LIMITE_MS` | Tempo máximo de execução em milissegundos, para parar antes do limite do Google. Normalmente não precisa ser alterado. |

---

## Uso

### 1. Teste primeiro

Com `MODO_TESTE = true`:

1. No menu suspenso de funções, escolha `rotinaDiaria`.
2. Clique em **Executar** e autorize o acesso quando o Google pedir.
3. Abra o **Registro de execução** e confira a saída, por exemplo:

```
[TESTE] Seriam excluídas da lixeira: 44
messages-noreply@linkedin.com: 15 mensagem(ns)
no-reply@mercadolivre.com.br: 6 mensagem(ns)
[TESTE] Seriam enviadas à lixeira: 21
```

Verifique se há algo na lixeira que você quer guardar e se os remetentes listados estão corretos.

### 2. Execute de verdade

1. Mude para `MODO_TESTE = false`.
2. Rode `rotinaDiaria` manualmente uma vez.

### 3. Agende a execução diária

Rode a função `ativarExecucaoDiaria` uma vez. Ela cria um acionador que executa `rotinaDiaria` todos os dias, por volta da hora definida em `HORA_EXECUCAO`.

Para conferir, abra o ícone de **relógio (Acionadores)** no menu lateral. Deve aparecer um acionador para `rotinaDiaria`.

Para cancelar o agendamento, rode `desativarExecucaoDiaria`.

---

## Funções do script

| Função | Para que serve |
|--------|----------------|
| `rotinaDiaria()` | Função principal: esvazia a lixeira e depois limpa os remetentes. É a que o acionador executa. |
| `esvaziarLixeira(inicio)` | Exclui permanentemente as mensagens da lixeira, em lotes de 500. |
| `limparEmails(inicio)` | Busca as mensagens dos remetentes da lista e as move para a lixeira. |
| `ativarExecucaoDiaria()` | Cria o acionador diário (remove antes qualquer acionador duplicado). |
| `desativarExecucaoDiaria()` | Remove o acionador diário. |

---

## Segurança e limitações

- **Exclusão permanente:** depois que a lixeira é esvaziada, não há como recuperar as mensagens. Isso elimina a margem normal de 30 dias do Gmail.
- **A lixeira inteira é esvaziada,** inclusive mensagens que você apagou manualmente. Se apagar algo por engano, recupere antes da próxima execução.
- **Permissões:** o script precisa de acesso total ao Gmail da conta, porque exclui mensagens. Ele roda dentro da sua própria conta Google e não envia dados para terceiros.
- **Aviso de "app não verificado":** ao autorizar, o Google pode exibir essa tela. É normal para scripts pessoais. Clique em *Avançado* e continue.
- **Limite de tempo:** se houver muitas mensagens, a execução para antes de 6 minutos e continua na vez seguinte.
- **Horário aproximado:** o Google executa acionadores diários em uma janela de cerca de uma hora a partir da hora escolhida. Confira o fuso horário em *Configurações do projeto*.

---

## Solução de problemas

| Problema | Solução |
|----------|---------|
| `ReferenceError: Gmail is not defined` | Ative o serviço **Gmail API** em *Serviços* (passo 3 da instalação). |
| O script pede autorização de novo | Aceite as permissões. Isso acontece quando o código passa a usar um serviço novo. |
| A execução para sem terminar | Normal em caixas muito grandes. Rode `rotinaDiaria` de novo ou aguarde o próximo dia. |
| Nada é apagado | Verifique se `MODO_TESTE` está como `false` e se os remetentes estão escritos corretamente. |

---

## Contribuindo

Sugestões e melhorias são bem-vindas. Abra uma *issue* ou envie um *pull request*.

## Licença

Defina aqui a licença do projeto (por exemplo, MIT). No GitHub, o botão **Add file → Create new file** com o nome `LICENSE` oferece modelos prontos.
