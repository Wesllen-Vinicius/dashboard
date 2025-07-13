// cypress/e2e/cadastro-metas.cy.ts
describe('Módulo de Cadastro - Metas de Produção', () => {
  beforeEach(() => {
    cy.login('admin@dominio.com', 'password123');
    // Pré-requisito: garantir que existe um produto para venda para associar a meta
    cy.visit('/dashboard/produtos');
    cy.get('button').contains('Selecione o tipo').click();
    cy.get('[data-slot="select-item"]').contains('Produto para Venda').click();
    cy.get('input[name="nome"]').type(`Produto para Meta ${Date.now()}`);
    cy.get('button[aria-haspopup="listbox"]').first().click();
    cy.get('[data-slot="select-item"]').first().click();
    cy.get('input[name="precoVenda"]').type('10');
    cy.get('input[name="ncm"]').type('02013000');
    cy.get('input[name="cfop"]').type('5101');
    cy.get('button').contains('Adicionar Produto').click();
    cy.contains('sucesso');
  });

  it('Deve criar e editar uma meta de produção', () => {
    cy.visit('/dashboard/metas');

    // Criar
    cy.get('input[placeholder*="Selecione um produto"]').click().type('{enter}');
    cy.get('input[name="metaPorAnimal"]').type('2.5');
    cy.get('button').contains('Cadastrar').click();
    cy.contains('sucesso').should('be.visible');
    cy.get('table').find('td').contains('2.5').should('be.visible');

    // Editar
    cy.get('table').contains('tr', '2.5').find('button[aria-label="Editar Meta"]').click();
    cy.get('input[name="metaPorAnimal"]').clear().type('3.0');
    cy.get('button').contains('Salvar Alterações').click();
    cy.contains('sucesso').should('be.visible');
    cy.get('table').find('td').contains('3.0').should('be.visible');
  });
});
