// cypress/e2e/despesas.cy.ts
describe('Módulo de Despesas Operacionais', () => {
    beforeEach(() => {
      cy.login('admin@dominio.com', 'password123');
      cy.visit('/dashboard/financeiro/despesas');
    });

    it('Deve cadastrar uma nova despesa e verificar em contas a pagar', () => {
      const descricaoDespesa = `Aluguel Escritório ${Date.now()}`;

      cy.get('input[name="descricao"]').type(descricaoDespesa);
      cy.get('input[name="categoria"]').type('Custo Fixo');
      cy.get('input[name="valor"]').type('1500.00');
      cy.get('input[placeholder*="conta de origem"]').click().type('{enter}');
      cy.get('button').contains('Adicionar Despesa').click();

      cy.contains('sucesso').should('be.visible');
      cy.get('table').contains(descricaoDespesa).should('be.visible');

      // Verifica se a despesa gerou uma conta a pagar
      cy.visit('/dashboard/financeiro/contas-a-pagar');
      cy.get('table').contains(`Despesa: ${descricaoDespesa}`).should('be.visible');
    });
});
