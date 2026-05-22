# 🛡️ Diário de Bordo - Fase 5: Motor do Jogo e WebSockets (Real-Time)

## 🎯 Objetivo da Fase
Criar o coração autônomo do Cassino (Game Loop) e transmitir os dados de cada rodada em tempo real para os jogadores utilizando comunicação bidirecional de baixa latência (WebSockets).

## 🏛️ Decisões Arquiteturais e Justificativas (Trade-offs)

### 1. Game Loop Autônomo
* **A Decisão:** Implementar um loop infinito assíncrono (`while(true)`) inicializado através do hook de ciclo de vida do NestJS (`OnModuleInit`).
* **O Impacto:** O servidor não depende de *cronjobs* externos ou de requisições manuais para gerenciar o estado da rodada. Ele gerencia as transições de estado (`BETTING_PHASE` -> `IN_PROGRESS` -> `CRASHED`) de forma autônoma. O uso de `Promises` não-bloqueantes (`await sleep`) garante que o *Event Loop* do Node.js/Bun não seja travado, permitindo que o servidor continue aceitando requisições HTTP (como apostas e cashouts) de milhares de usuários simultaneamente.

### 2. Broadcasting Unidirecional (WebSockets)
* **O Problema:** Como notificar o frontend sobre a subida do multiplicador sem sobrecarregar o servidor com *Long Polling*?
* **A Decisão:** Utilizar o módulo `@nestjs/websockets` com a engine do `Socket.io`. A comunicação em tempo real neste módulo foi desenhada para ser estritamente unidirecional (Server-Sent).
* **O Impacto:** O backend apenas "grita" o estado atual do jogo (Eventos `game:tick`, `game:crash`). Isso evita gargalos no WebSocket Gateway. Toda ação crítica do usuário (como apostar e fazer *cash out*) continua passando pela camada REST convencional para validação síncrona, autorização e persistência ACID.

### 3. A Lógica de Cash Out e Consistência de Estado
* **A Decisão:** No exato milissegundo em que o usuário faz a chamada REST para o Cash Out, o Controller injeta o serviço do Motor (`GameEngineService`) para ler o `currentMultiplier` da memória da aplicação, ao invés de aceitar o multiplicador enviado pelo *payload* do cliente.
* **O Impacto:** Blindagem contra injeção de dados maliciosos. O jogador não consegue burlar o sistema enviando um multiplicador artificial. O saque é validado instantaneamente com o "Tick" atual do servidor, e o pagamento é orquestrado via Outbox Pattern para a Carteira.