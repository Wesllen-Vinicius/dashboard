// cypress/component/DatePicker.cy.tsx
import { useState } from 'react';
import { DatePicker } from '@/components/date-picker';

const DatePickerWrapper = () => {
  const [date, setDate] = useState<Date | undefined>(new Date('2024-01-10'));
  return <DatePicker date={date} onDateChange={setDate} />;
};

describe('<DatePicker />', () => {
  it('Exibe a data inicial e abre o calendário ao ser clicado', () => {
    cy.mount(<DatePickerWrapper />);
    cy.get('button').contains('10/01/2024').should('be.visible');
    cy.get('button').click();
    cy.get('[data-slot="calendar"]').should('be.visible');
  });

  it('Altera a data ao selecionar um novo dia no calendário', () => {
    cy.mount(<DatePickerWrapper />);
    cy.get('button').click();
    cy.get('.rdp-day').contains('15').click();
    cy.get('button').contains('15/01/2024').should('be.visible');
  });
});
