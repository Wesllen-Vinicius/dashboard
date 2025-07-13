// cypress/support/e2e.ts

import './commands'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Realiza o login na aplicação através da interface de usuário.
       * @example cy.login('admin@dominio.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;
    }
  }
}
