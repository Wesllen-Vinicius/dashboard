// cypress/e2e/notas-fiscais-gerenciamento.cy.ts
describe('Módulo de Gerenciamento de Notas Fiscais', () => {
    beforeEach(() => {
      cy.login('admin@dominio.com', 'password123');
    });

    it('Deve filtrar as notas por status e consultar uma nota em processamento', () => {
      // Primeiro, cria uma venda para garantir que haja uma NF-e para gerenciar
      cy.visit('/dashboard/vendas');
      cy.get('input[placeholder*="Selecione um cliente"]').click().type('{enter}');
      cy.get('button').contains('Adicionar Produto').click();
      cy.get('select[name="produtos.0.produtoId"]').select(1);
      cy.get('button').contains('Finalizar Venda').click();
      cy.contains('sucesso');

      // Vai para a tela de gerenciamento
      cy.visit('/dashboard/notas-fiscais');

      // Filtra por status "Não Emitida" (o estado inicial)
      cy.get('button[role="combobox"]').last().click();
      cy.get('[data-slot="select-item"]').contains('Não Emitida').click();
      cy.get('table').find('tr').should('have.length.gte', 2); // Header + pelo menos 1 nota

      // Emite a nota para poder testar outros status
      cy.get('button:contains("Emitir NF-e")').first().click();
      cy.get('button:contains("Confirmar e Emitir NF-e")').click();
      cy.contains('NF-e em processamento', {timeout: 15000}).should('be.visible');

      // Volta para a listagem e filtra
      cy.visit('/dashboard/notas-fiscais');
      cy.get('button[role="combobox"]').last().click();
      cy.get('[data-slot="select-item"]').contains('Processando').click();
      cy.get('table').contains('Processando').should('be.visible');

      // Tenta consultar o status
      cy.get('button:contains("Consultar")').first().click();
      cy.contains('Status atualizado:', {timeout: 15000}).should('be.visible');
    });
});
