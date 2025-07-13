// cypress/e2e/estoque.cy.ts
describe('Módulo de Estoque - Ajuste Manual', () => {
    beforeEach(() => {
      cy.login('admin@dominio.com', 'password123');
      cy.visit('/dashboard/estoque');
    });

    it('Deve registrar uma entrada manual no estoque', () => {
      cy.get('input[placeholder*="Selecione um produto"]').click().type('{enter}');
      cy.get('input[name="quantidade"]').type('10');
      cy.get('button[aria-haspopup="listbox"]').last().click();
      cy.get('[data-slot="select-item"]').contains('Entrada').click();
      cy.get('input[name="motivo"]').type('Ajuste de inventário inicial');

      cy.get('button').contains('Registrar Movimentação').click();
      cy.contains('sucesso').should('be.visible');

      cy.get('table').contains('Ajuste de inventário inicial').should('be.visible');
      cy.get('table').contains('td', '10').should('be.visible');
      cy.get('table').find('span').contains('Entrada').should('be.visible');
    });

    it('Deve registrar uma saída manual no estoque', () => {
        cy.get('input[placeholder*="Selecione um produto"]').click().type('{enter}');
        cy.get('input[name="quantidade"]').type('2');
        cy.get('button[aria-haspopup="listbox"]').last().click();
        cy.get('[data-slot="select-item"]').contains('Saída').click();
        cy.get('input[name="motivo"]').type('Perda por avaria');

        cy.get('button').contains('Registrar Movimentação').click();
        cy.contains('sucesso').should('be.visible');

        cy.get('table').contains('Perda por avaria').should('be.visible');
        cy.get('table').contains('td', '2').should('be.visible');
        cy.get('table').find('span').contains('Saída').should('be.visible');
      });
  });
