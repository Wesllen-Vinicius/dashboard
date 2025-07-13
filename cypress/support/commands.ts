// cypress/support/commands.ts

Cypress.Commands.add('login', (email, password) => {
  // Visita a página de login
  cy.visit('/login');

  // Espera a página carregar completamente antes de interagir
  cy.contains('h1', 'Acessar', { timeout: 10000 }).should('be.visible');

  // Preenche o formulário e envia
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();

  // A asserção mais importante: espera por um elemento que só existe
  // no dashboard para garantir que o login foi bem-sucedido.
  cy.url().should('include', '/dashboard');
  cy.get('[data-slot="sidebar-header"]').should('be.visible');
});
