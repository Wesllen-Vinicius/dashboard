// cypress/e2e/5-financeiro.cy.ts
describe('Módulo Financeiro', () => {
  beforeEach(() => {
    cy.login('admin@dominio.com', 'password123');
  });

  it('Deve criar e dar baixa em uma Conta Bancária', () => {
    cy.visit('/dashboard/financeiro/contas-bancarias');
    const nomeConta = `Conta Teste ${Date.now()}`;
    cy.get('input[name="nomeConta"]').type(nomeConta);
    cy.get('input[placeholder="Selecione o banco..."]').click().type('Banco do Brasil{enter}');
    cy.get('button[type="submit"]').click();
    cy.contains('sucesso').should('be.visible');
    cy.get('table').contains(nomeConta).should('be.visible');
  });

  it('Deve gerar um relatório de Fluxo de Caixa', () => {
    cy.visit('/dashboard/financeiro/fluxo-caixa');
    cy.get('input[placeholder*="Selecione uma conta"]').click().type('{enter}');
    cy.get('button#date').click();
    cy.get('.rdp-day').contains('10').click();
    cy.get('.rdp-day').contains('20').click();
    cy.get('button').contains('Gerar Extrato').click();
    cy.contains('Extrato do Período').should('be.visible');
  });
});
