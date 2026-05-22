# 🛡️ Diário de Bordo - Fase 2: O Coração Financeiro e Prevenção de Fraudes (DDD)

## 🎯 Objetivo da Fase
Implementar o Bounded Context de Wallet (Carteira) utilizando os princípios de Domain-Driven Design (DDD) e Clean Architecture. O foco principal é garantir consistência financeira absoluta, prevenindo condições de corrida (Race Conditions) e gastos duplos (Double-Spending).

## Decisões Arquiteturais e Justificativas (Trade-offs)

### 1. Inversão de Dependência (SOLID - DIP)
* **A Decisão:** O caso de uso `DebitWalletUseCase` (Application) não conhece o Prisma ou o Banco de Dados. Ele depende exclusivamente da interface abstrata `IWalletRepository` (Domain).
* **O Impacto:** O núcleo do negócio fica completamente agnóstico a frameworks de infraestrutura. Isso permite que, no futuro, possamos trocar o Prisma por outro ORM sem alterar nenhuma regra de negócio, além de facilitar a criação de Mocks para testes unitários com execução em milissegundos.

### 2. Tratamento de Concorrência no Banco de Dados (Evitando Double-Spend)
Em sistemas de alta concorrência (apostas em tempo real), ler o saldo na memória da aplicação e depois atualizá-lo é uma falha crítica de segurança. Dois requests simultâneos poderiam ler "R$ 10", aprovar duas apostas de R$ 10, e deixar o saldo em R$ -10.
* **A Decisão:** Em vez de usar Distributed Locks complexos (como Redlock no Redis), delegamos a validação de saldo diretamente para a transação do banco relacional, utilizando uma cláusula condicional no momento do UPDATE: `balance: { gte: amount }`.
* **O Impacto:** O próprio PostgreSQL utiliza *Row-Level Locking* para garantir que a transação falhe atomicamente se o saldo for menor que o exigido no milissegundo exato da escrita. A performance é otimizada e a infraestrutura continua simples e blindada contra fraudes.

### 3. Exceções Ricas no Domínio (Custom Exceptions)
* **A Decisão:** Criamos a `InsufficientFundsException` dentro da camada de Domínio, em vez de lançar erros genéricos do framework (como `HttpException` do NestJS) dentro dos Casos de Uso.
* **O Impacto:** O domínio continua puro. O Controller (Presentation Layer) atua como um tradutor, interceptando a exceção do domínio e a convertendo adequadamente para um código `400 Bad Request` para a interface externa. 

### 4. Transações ACID e Rastreabilidade
* **A Decisão:** A atualização do saldo na tabela `wallets` e a inserção do log na tabela `wallet_transactions` ocorrem estritamente dentro da mesma transação de banco de dados (`$transaction` no Prisma).
* **O Impacto:** Garantia de auditoria. Se o servidor desligar inesperadamente entre a atualização do saldo e a criação do log, o banco faz o *Rollback* automático. A soma do histórico de `wallet_transactions` sempre será matematicamente idêntica ao `balance` final do usuário.