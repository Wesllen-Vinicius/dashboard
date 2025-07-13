// cypress/e2e/2-dashboard.cy.ts
describe('Dashboard Principal', () => {
  it('Deve carregar os cards de estatísticas e os gráficos', () => {
    cy.login('admin@dominio.com', 'password123');
    cy.visit('/dashboard');

    // Verifica se os cards de estatísticas foram carregados
    cy.contains('Lucro Bruto (Mês)').should('be.visible');
    cy.contains('Vendas (Mês)').should('be.visible');
    cy.contains('A Receber (Pendente)').should('be.visible');

    // Verifica se os contêineres dos gráficos existem
    cy.get('[data-slot="chart"]').should('have.length.at.least', 3);
  });
});
