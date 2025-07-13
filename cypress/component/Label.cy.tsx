// cypress/component/Label.cy.tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

describe('<Label />', () => {
  it('Deve renderizar o texto e estar associado a um input', () => {
    const labelText = 'Nome de Usuário';
    cy.mount(
      <div>
        <Label htmlFor="username">{labelText}</Label>
        <Input id="username" />
      </div>
    );

    cy.get('label').should('contain', labelText).and('have.attr', 'for', 'username');
    cy.get('label').click();
    cy.get('input#username').should('have.focus');
  });
});
