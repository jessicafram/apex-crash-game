📋 O CHECKLIST FINAL DA SELVA (O que falta para entregar)
🟠 FASE 4: Comunicação (RabbitMQ & Outbox Worker)
O desafio exige que Game e Wallet se falem por mensageria, não por API.

Worker do Game: Um cronjob (tarefa de fundo) que lê a tabela OutboxEvent a cada segundo e joga a mensagem no RabbitMQ (wallet.debit).

Consumer da Wallet: O NestJS da carteira vai ouvir o RabbitMQ. Quando chegar o pedido de débito, ele tenta descontar. Se der certo, ele devolve um evento de bet.accepted. Se der erro de saldo, devolve bet.rejected.

Consumer do Game: Ouve a resposta da carteira e muda o status da aposta para ACCEPTED ou REJECTED.
🔵 FASE 5: O Motor do Jogo & WebSockets (A Magia do Tempo Real)
A rodada precisa acontecer sozinha e avisar o mundo.

O Game Loop: Uma rotina que abre as apostas (espera 10s), depois muda para IN_PROGRESS (faz o multiplicador subir 1.01x, 1.02x...) e quando bate no crashPoint, muda pra CRASHED e cria a próxima rodada.

WebSocket Gateway: Enquanto o Game Loop roda, o servidor fica gritando pro Frontend (via Socket.io): "Multiplicador está em 1.45x... 1.46x...".

Cash Out (Saque): A rota onde o jogador grita "Pára!". O backend checa se o jogo ainda está rolando, multiplica a aposta pelo multiplicador atual e cria um Outbox de wallet.credit pra dar o prêmio pro jogador.
🟢 FASE 6: Frontend (Vite + React)
A carinha do nosso cassino.

Auth: Configurar o OIDC com o Keycloak (usando a lib react-oidc-context pra ser rápido).

Socket.io Client: Ouvir os números do servidor para mostrar na tela.

UI Simples e Funcional: Mostrar o saldo, um campo para digitar o valor, um botão de "Apostar" e um número gigante no meio da tela mostrando o gráfico subindo.
🟣 FASE 7: Testes (Requisito Eliminatório)
Eles pediram testes unitários e E2E, se não tiver, o projeto é desclassificado.

Teste unitário da regra de Débito da Wallet.

Teste unitário do algoritmo Provably Fair.