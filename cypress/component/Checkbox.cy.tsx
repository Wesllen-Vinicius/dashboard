// cypress/component/Checkbox.cy.tsx
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const CheckboxWrapper = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" checked={checked} onCheckedChange={(c) => setChecked(!!c)} />
      <Label htmlFor="terms">Aceitar os termos</Label>
    </div>
  );
};

describe('<Checkbox />', () => {
  it('Alterna o estado de marcado ao ser clicado', () => {
    cy.mount(<CheckboxWrapper />);

    cy.get('[role="checkbox"]').should('not.be.checked');
    cy.get('[role="checkbox"]').click();
    cy.get('[role="checkbox"]').should('be.checked');
    cy.get('[role="checkbox"]').click();
    cy.get('[role="checkbox"]').should('not.be.checked');
  });

  it('Alterna o estado ao clicar no Label associado', () => {
    cy.mount(<CheckboxWrapper />);

    cy.get('[role="checkbox"]').should('not.be.checked');
    cy.contains('Aceitar os termos').click();
    cy.get('[role="checkbox"]').should('be.checked');
  });
});
