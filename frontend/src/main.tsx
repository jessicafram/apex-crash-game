import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import './index.css'
import App from './App.tsx'

// As configurações exatas do Keycloak da Jungle Gaming!
const oidcConfig = {
  authority: "http://localhost:8080/realms/crash-game",
  client_id: "crash-game-client",
  redirect_uri: "http://localhost:5173/",
  // Essa opção limpa a URL do navegador depois que o cara logar
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname)
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)