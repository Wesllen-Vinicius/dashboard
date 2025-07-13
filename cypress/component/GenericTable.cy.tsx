// cypress/component/GenericTable.cy.tsx
import { GenericTable } from '@/components/generic-table';
import { ColumnDef } from '@tanstack/react-table';

interface MockData {
  id: number;
  name: string;
  category: string;
}

const mockData: MockData[] = [
  { id: 1, name: 'Produto A', category: 'Eletrônicos' },
  { id: 2, name: 'Produto B', category: 'Roupas' },
  { id: 3, name: 'Produto C', category: 'Eletrônicos' },
];

const columns: ColumnDef<MockData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'category', header: 'Categoria' },
];

describe('<GenericTable />', () => {
  it('Renderiza os dados e colunas corretamente', () => {
    cy.mount(<GenericTable columns={columns} data={mockData} />);
    cy.get('table').find('tr').should('have.length', 4); // 1 header + 3 data rows
    cy.contains('Produto A').should('be.visible');
  });

  it('Filtra os dados com base na entrada de busca', () => {
    cy.mount(<GenericTable columns={columns} data={mockData} filterPlaceholder="Buscar..." />);

    cy.get('input[placeholder="Buscar..."]').type('Eletrônicos');
    cy.get('table').find('tr').should('have.length', 3); // 1 header + 2 data rows
    cy.contains('Produto A').should('be.visible');
    cy.contains('Produto C').should('be.visible');
    cy.contains('Produto B').should('not.exist');
  });

  it('Ordena a tabela ao clicar no cabeçalho', () => {
    cy.mount(<GenericTable columns={columns} data={mockData} />);

    // Ordem inicial
    cy.get('tbody tr').first().should('contain', 'Produto A');

    // Clica para ordenar por nome
    cy.get('th').contains('Nome').click();
    cy.get('tbody tr').first().should('contain', 'Produto A'); // Ascendente

    cy.get('th').contains('Nome').click();
    cy.get('tbody tr').first().should('contain', 'Produto C'); // Descendente
  });
});
