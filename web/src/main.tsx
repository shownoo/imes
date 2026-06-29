import React from 'react'
import ReactDOM from 'react-dom/client'
import 'locales'
import { ApolloProvider } from '@apollo/client'
import { BrowserRouter } from 'react-router-dom'
import { client } from './lib/apollo'
import { ChetaVisualVariantProvider } from './contexts/cheta-visual-variant-context'
import { WorkspaceProvider } from './contexts/workspace-context'
import { LeaderSkinBridge } from './components/leader-skin-bridge'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <ChetaVisualVariantProvider>
          <WorkspaceProvider>
            <LeaderSkinBridge />
            <App />
          </WorkspaceProvider>
        </ChetaVisualVariantProvider>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
)
