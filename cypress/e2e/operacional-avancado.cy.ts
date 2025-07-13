// cypress/e2e/operacional-avancado.cy.ts
describe('Módulo Operacional - Fluxos Avançados', () => {
  beforeEach(() => {
    cy.login('admin@dominio.com', 'password123');
  });

  it('Deve registrar um Abate e depois uma Produção vinculada a ele', () => {
    // Pré-requisito: Criar Compra para vincular ao Abate
    cy.visit('/dashboard/compras');
    const nfCompra = `NF-ABATE-${Date.now()}`;
    cy.get('input[placeholder*="fornecedor"]').click().type('{enter}');
    cy.get('input[name="notaFiscal"]').type(nfCompra);
    cy.get('button').contains('Adicionar Item').click();
    cy.get('select[name="itens.0.produtoId"]').select(1);
    cy.get('input[name="itens.0.quantidade"]').type('50');
    cy.get('input[name="itens.0.custoUnitario"]').type('100');
    cy.get('button[type="submit"]').click();
    cy.contains('sucesso');

    // Registrar Abate
    cy.visit('/dashboard/abates');
    cy.get('input[placeholder*="Selecione uma compra"]').click().type(nfCompra + '{enter}');
    cy.get('input[name="total"]').type('50');
    cy.get('input[name="condenado"]').type('2');
    cy.get('input[placeholder*="Selecione um responsável"]').click().type('{enter}');
    cy.get('button').contains('Registrar').click();
    cy.contains('sucesso').should('be.visible');

    // Registrar Produção
    cy.visit('/dashboard/producao');
    const loteProducao = `LOTE-${Date.now()}`;
    cy.get('input[placeholder*="Selecione o abate"]').click().type(nfCompra + '{enter}');
    cy.get('input[name="lote"]').type(loteProducao);
    cy.get('input[placeholder*="Selecione um responsável"]').click().type('{enter}');
    cy.get('button').contains('Adicionar Produto').click();
    cy.get('input[placeholder*="Selecione o produto"]').first().click().type('{enter}');
    cy.get('input[name="produtos.0.quantidade"]').type('1200'); // kg
    cy.get('button').contains('Registrar Produção').click();
    cy.contains('sucesso').should('be.visible');
    cy.get('table').contains(loteProducao).should('be.visible');
  });
});
