# 🛡️ Diário de Bordo - Fase 6: Frontend, UX/UI e Autenticação (OIDC)

## 🎯 Objetivo da Fase
Desenvolver uma Single Page Application (SPA) responsiva e em tempo real, garantindo uma experiência de usuário (UX) fluida e imersiva ("Dark Casino"), com integração segura ao Identity Provider (IdP) e comunicação híbrida (REST + WebSockets).

## 🏛️ Decisões Arquiteturais e Justificativas (Trade-offs)

### 1. Comunicação Híbrida: REST para Transações, WebSockets para Telemetria
* **O Problema:** Como garantir a precisão financeira das apostas enquanto mantemos o gráfico subindo na tela em tempo real?
* **A Decisão:** Dividir a responsabilidade da rede. O WebSocket (`Socket.io`) é utilizado de forma estritamente *Server-Sent* para transmitir o "Tick" do multiplicador (baixo custo de rede). Já as ações críticas (Apostar, Cash Out) são feitas via requisições REST autenticadas (`POST`).
* **O Impacto:** Se a conexão WebSocket oscilar, o jogador apenas perde a animação, mas suas chamadas de aposta e saque continuam sendo validadas de forma síncrona e segura pelo API Gateway (Kong) e pelo NestJS.

### 2. Gerenciamento de Estado com Zustand
* **A Decisão:** Em vez de utilizar Redux (verboso) ou a Context API nativa (que pode causar re-renderizações excessivas), adotei o `Zustand` para o estado global do jogo.
* **O Impacto:** O estado da rodada (`multiplier`, `status`, `roundId`) e a instância do WebSocket ficam centralizados e acessíveis em qualquer componente sem *prop drilling*. A interface reage instantaneamente aos eventos do backend com alta performance.

### 3. Autenticação Segura via Keycloak (OIDC)
* **A Decisão:** Integração do fluxo de *Authorization Code com PKCE* utilizando a biblioteca `react-oidc-context`.
* **O Impacto:** A aplicação React não manipula senhas. O login é delegado ao Keycloak, que retorna um Token JWT. Utilizei Interceptors no `axios` (`axios.defaults.headers.common`) para injetar automaticamente o Bearer Token nas requisições, garantindo que os *Guards* do NestJS validem a identidade do jogador (evitando *Spoofing*).

### 4. Tailwind CSS v4 e Design "Neon Casino"
* **A Decisão:** Utilização do Tailwind CSS para a construção da interface, isolando configurações de *Dark Mode* no arquivo principal.
* **O Impacto:** Produtividade extrema na estilização. O uso de classes utilitárias e gradientes (`bg-gradient-to-r`, `drop-shadow`) permitiu criar uma estética Cyberpunk/Casino altamente atrativa (indicadores neon para `IN_PROGRESS` e `CRASHED`), cobrindo o requisito de UX/UI com baixo peso de bundle.