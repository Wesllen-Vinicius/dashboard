// cypress/component/SectionCards.cy.tsx
import { SectionCards } from '@/components/section-cards';

describe('<SectionCards />', () => {
  const mockStats = {
    totalFuncionarios: 10,
    totalProdutos: 50,
    totalClientes: 100,
    totalVendasMes: 25000.50,
    lucroBrutoMes: 8000.75,
    totalAPagar: 5000,
    totalAReceber: 12000,
  };

  it('Renderiza os valores formatados corretamente', () => {
    cy.mount(<SectionCards stats={mockStats} />);

    cy.contains('Lucro Bruto (Mês)').should('be.visible');
    cy.contains('R$ 8.000,75').should('be.visible');

    cy.contains('Clientes').should('be.visible');
    cy.contains('100').should('be.visible');

    cy.contains('A Pagar (Pendente)').should('be.visible');
    cy.contains('R$ 5.000,00').should('be.visible');
  });
});
