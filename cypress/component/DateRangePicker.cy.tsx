// cypress/component/DateRangePicker.cy.tsx
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/date-range-picker';

const DateRangePickerWrapper = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 10),
    to: new Date(2024, 0, 20),
  });
  return <DateRangePicker date={date} onDateChange={setDate} />;
};

describe('<DateRangePicker />', () => {
  it('Abre o calendário e permite a seleção de um novo intervalo', () => {
    cy.mount(<DateRangePickerWrapper />);
    cy.get('button').click();
    cy.get('[data-slot="calendar"]').should('be.visible');

    // Seleciona um novo intervalo
    cy.get('.rdp-day').contains('5').click();
    cy.get('.rdp-day').contains('15').click();

    cy.get('button').should('contain.text', 'Jan 05, 2024 - Jan 15, 2024');
  });
});
