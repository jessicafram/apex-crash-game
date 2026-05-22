# 🛡️ Diário de Bordo - Fase 1: Infraestrutura e Modelagem de Dados

## 🎯 Objetivo da Fase
Garantir que a fundação do sistema (Bancos de Dados, Filas, Gateway e Identidade) esteja rodando de forma isolada e resiliente, preparando o terreno para a implementação do Domain-Driven Design (DDD).

##  Decisões Arquiteturais e Justificativas (Trade-offs)

### 1. O "Problema do Ponto Flutuante" e a escolha do `BigInt`
Sistemas financeiros de iGaming exigem precisão absoluta. O uso de `float` ou `double` no JavaScript pode gerar distorções (ex: `0.1 + 0.2 = 0.30000000000000004`). 
* **A Decisão:** Modelei os campos `balance` (Wallet), `amount` e `winAmount` (Bet) utilizando o tipo `BigInt` nativo do PostgreSQL.
* **O Impacto:** O backend trabalha 100% do tempo em **centavos** (inteiros). R$ 1,50 é armazenado e processado como `150`. A conversão para decimal ocorre de forma isolada, apenas na camada de apresentação (Frontend), garantindo precisão matemática e zerando o risco de perdas fracionárias.

### 2. Separação Física dos Dados (Bounded Contexts)
Apesar de ser um monorepo, o Game Service e o Wallet Service possuem responsabilidades (Bounded Contexts) estritamente separadas.
* **A Decisão:** Em vez de usar um banco de dados monolítico, o Docker foi configurado para provisionar dois bancos distintos (`games` e `wallets`). 
* **O Impacto:** Um serviço não pode fazer `JOIN` nas tabelas do outro. Isso força a comunicação via mensageria (RabbitMQ), garantindo que a arquitetura seja verdadeiramente orientada a eventos e escalável horizontalmente.

### 3. Padrão Transacional Outbox (Resiliência)
A comunicação entre o Game e a Wallet não pode falhar. Se o RabbitMQ cair no exato momento de uma aposta, o sistema ficaria inconsistente.
* **A Decisão:** Inseri a tabela `outbox_events` no schema do Game Service. 
* **O Impacto:** Quando uma aposta é feita, salvamos o registro da aposta e o evento do RabbitMQ na mesma **Transação ACID** do banco. Se o banco salva, o evento está garantido. Um worker processará esse evento posteriormente, garantindo *At-Least-Once Delivery* (Entrega garantida).

### 4. Downgrade Estratégico (Prisma v6)
* **O Problema:** A versão mais recente do Prisma (v7) introduziu *breaking changes* na injeção de variáveis (`env()`) no `schema.prisma`. 
* **A Decisão:** Fixar a versão do Prisma em `@6` via Bun.
* **O Impacto:** Manutenção da estabilidade do código, utilizando uma versão LTS consolidada pelo mercado, sem perder tempo reescrevendo configurações que não agregam valor à regra de negócio do cassino.

##  Troubleshooting & Infraestrutura Local
* **O Conflito de CRLF (Windows vs Linux):** Arquivos bash (como o `init-databases.sh`) sofrem corrupção de quebra de linha no Windows. O arquivo foi convertido para `LF` para garantir o startup seguro do container PostgreSQL 18.
* **Redes Internas do Docker:** Para o Prisma rodar migrations a partir do host (Windows), utilizamos `localhost`, mas para a execução em runtime dos serviços NestJS, o `.env` é configurado para utilizar o DNS interno do Docker (`postgres` e `rabbitmq`).