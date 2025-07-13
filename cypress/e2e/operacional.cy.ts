// cypress/e2e/4-operacional.cy.ts
describe('Módulo Operacional', () => {
  beforeEach(() => {
    cy.login('admin@dominio.com', 'password123');
  });

  it('Deve registrar uma Compra a Prazo e verificar a Conta a Pagar', () => {
    cy.visit('/dashboard/compras');
    const nf = `NF-${Date.now()}`;
    cy.get('input[placeholder*="fornecedor"]').click().type('{enter}');
    cy.get('input[name="notaFiscal"]').type(nf);
    cy.get('button').contains('Adicionar Item').click();
    cy.get('select[name="itens.0.produtoId"]').select(1);
    cy.get('input[name="itens.0.quantidade"]').type('10');
    cy.get('input[name="itens.0.custoUnitario"]').type('50');
    cy.get('select[name="condicaoPagamento"]').select('A_PRAZO');
    cy.get('input[placeholder*="conta de origem"]').click().type('{enter}');
    cy.get('input[name="numeroParcelas"]').type('2');
    cy.get('button[type="submit"]').click();
    cy.contains('sucesso').should('be.visible');

    cy.visit('/dashboard/financeiro/contas-a-pagar');
    cy.get('table').contains('td', nf).should('be.visible');
  });

  it('Deve registrar uma Venda e abrir o modal de pré-visualização da NF-e', () => {
    cy.visit('/dashboard/vendas');
    cy.get('input[placeholder*="Selecione um cliente"]').click().type('{enter}');
    cy.get('button').contains('Adicionar Produto').click();
    cy.get('select[name="produtos.0.produtoId"]').select(1);
    cy.get('button').contains('Finalizar Venda').click();
    cy.contains('sucesso').should('be.visible');

    cy.visit('/dashboard/notas-fiscais');
    cy.get('table').find('button').contains('Emitir NF-e').first().click();
    cy.contains('Pré-Visualização da NF-e').should('be.visible');
  });
});
