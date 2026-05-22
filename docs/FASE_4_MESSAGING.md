#  Diário de Bordo - Fase 4: Comunicação Assíncrona e Coreografia de Eventos

## 🎯 Objetivo da Fase
Estabelecer a comunicação entre os Bounded Contexts (Game Service e Wallet Service) garantindo alta disponibilidade, tolerância a falhas e desacoplamento total.

##  Decisões Arquiteturais e Justificativas (Trade-offs)

### 1. Coreografia de Eventos vs Orquestração (HTTP)
* **O Problema:** Se o Game Service fizesse uma chamada HTTP síncrona (REST/gRPC) para o Wallet Service durante a aposta, uma lentidão ou queda da Carteira derrubaria o Jogo inteiro, impedindo novos usuários de apostarem.
* **A Decisão:** Adotar Arquitetura Orientada a Eventos (Event-Driven Architecture) via RabbitMQ usando o padrão de Coreografia. 
* **O Impacto:** O Game Service emite o evento `wallet.debit` e continua seu fluxo. A Wallet escuta, processa o débito isoladamente e responde com `bet.accepted` ou `bet.rejected`. Os serviços não se conhecem e não dependem do uptime um do outro em tempo real.

### 2. O Worker do Outbox Pattern (At-Least-Once Delivery)
* **A Decisão:** Implementação de um CronJob (Polling) no Game Service que escaneia a tabela `outbox_events` a cada 1 segundo em busca de eventos não publicados.
* **O Impacto:** Mesmo que o RabbitMQ fique indisponível, as mensagens ficam seguras no PostgreSQL. Assim que o *broker* retornar, o Worker esvazia a fila. O uso do `.subscribe()` e da flag `published: true` garante que a mensagem só é marcada como entregue após o RabbitMQ confirmar o recebimento (ACK).

### 3. Máquina de Estados da Aposta (State Machine)
* **A Decisão:** A aposta transita entre os estados `PENDING` -> `ACCEPTED` / `REJECTED`. 
* **O Impacto:** O Frontend e o Jogo sempre sabem se uma aposta possui "lastro financeiro". O jogador não participa do Crash Game se a aposta estiver pendente, eliminando completamente a chance de fraudes financeiras onde o usuário tenta apostar um dinheiro que não possui na carteira.

### 4. Integração Nativa NestJS Microservices
* **A Decisão:** Utilização dos decorators `@EventPattern` e `ClientProxy` do próprio framework NestJS em vez de bibliotecas genéricas (como `amqplib` pura).
* **O Impacto:** Código muito mais limpo, padronizado e testável. O framework cuida da conexão persistente, reconexões automáticas e serialização do payload, permitindo foco exclusivo nas regras de negócio.