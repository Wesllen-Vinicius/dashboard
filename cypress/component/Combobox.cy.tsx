// cypress/component/Combobox.cy.tsx
import { useState } from 'react';
import { Combobox } from '@/components/ui/combobox';

const options = [
  { value: '1', label: 'Opção 1' },
  { value: '2', label: 'Opção 2' },
  { value: '3', label: 'Opção 3' },
];

const ComboboxWrapper = () => {
  const [value, setValue] = useState('');
  return <Combobox options={options} value={value} onChange={setValue} placeholder="Selecione..." />;
};

describe('<Combobox />', () => {
  it('Abre, filtra e seleciona uma opção', () => {
    cy.mount(<ComboboxWrapper />);

    cy.get('button').contains('Selecione...').click();
    cy.get('[data-slot="command-list"]').should('be.visible');

    cy.get('input[placeholder="Buscar item..."]').type('Opção 2');
    cy.get('[data-slot="command-item"]').should('have.length', 1);

    cy.get('[data-slot="command-item"]').contains('Opção 2').click();
    cy.get('button').contains('Opção 2').should('be.visible');
  });
});
