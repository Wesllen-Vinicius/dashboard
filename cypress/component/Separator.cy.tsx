// cypress/component/Separator.cy.tsx
import { Separator } from '@/components/ui/separator';

describe('<Separator />', () => {
  it('Deve renderizar um separador horizontal por padrão', () => {
    cy.mount(
      <div>
        <span>Item 1</span>
        <Separator />
        <span>Item 2</span>
      </div>
    );
    cy.get('[data-slot="separator"]').should('have.attr', 'data-orientation', 'horizontal');
  });

  it('Deve renderizar um separador vertical quando a orientação for especificada', () => {
    cy.mount(
      <div style={{ display: 'flex', height: '50px' }}>
        <span>Item 1</span>
        <Separator orientation="vertical" />
        <span>Item 2</span>
      </div>
    );
    cy.get('[data-slot="separator"]').should('have.attr', 'data-orientation', 'vertical');
  });
});
