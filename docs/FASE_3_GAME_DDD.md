# 🛡️ Diário de Bordo - Fase 3: Motor do Jogo, Provably Fair e Outbox Pattern

## 🎯 Objetivo da Fase
Implementar o Bounded Context do Jogo (Game Service). O foco é garantir que os resultados do Cassino sejam matematicamente justos e auditáveis, além de preparar a comunicação segura com o serviço de carteira.

##  Decisões Arquiteturais e Justificativas (Trade-offs)

### 1. Algoritmo Provably Fair (Transparência)
* **A Decisão:** Utilizar a biblioteca nativa `crypto` do Node.js para gerar uma `Server Seed` randômica (32 bytes) e derivar o `Crash Point` utilizando HMAC-SHA256, lendo os primeiros 52 bits do hash gerado. Apliquei uma margem para a casa (House Edge) divisível por 33 (aprox. 3%).
* **O Impacto:** O jogo se torna 100% determinístico e auditável. O resultado de uma rodada é calculado no instante em que ela é criada, impossibilitando que o sistema "manipule" o gráfico com base nas apostas ativas.

### 2. O Padrão Outbox (Dual-Write Problem)
* **O Problema:** Quando um jogador aposta, o serviço de Jogos precisa salvar a aposta no banco e enviar um evento para o RabbitMQ para a Carteira debitar o saldo. Se o RabbitMQ cair no meio do processo, a aposta fica salva, mas o dinheiro nunca é cobrado (Dual-Write Problem).
* **A Decisão:** Implementei o *Transactional Outbox Pattern*. A aposta (`Bet`) e a intenção de evento (`OutboxEvent`) são salvas na mesma transação no PostgreSQL. 
* **O Impacto:** Desacoplamento total. O Game Service não faz chamadas HTTP síncronas para a Wallet, evitando falhas em cascata. Um *Relay/Worker* lerá a tabela Outbox de forma assíncrona para publicar no mensageiro, garantindo consistência eventual robusta.

### 3. O Estado "PENDING" da Aposta
* **A Decisão:** Uma aposta nasce com o status `PENDING`. Ela só passa para `ACCEPTED` quando o Game Service recebe uma resposta assíncrona da Wallet confirmando que o saldo foi debitado com sucesso. Se a Wallet responder com "Saldo Insuficiente", o Game Service atualiza a aposta para `REJECTED`.
* **O Impacto:** O sistema respeita as leis de negócios assíncronos. Nenhuma aposta entra no jogo sem lastro financeiro confirmado.