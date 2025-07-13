// cypress/component/Badge.cy.tsx
import { Badge } from '@/components/ui/badge';

describe('<Badge />', () => {
  it('Renderiza com a variante padrão', () => {
    cy.mount(<Badge>Padrão</Badge>);
    cy.get('[data-slot="badge"]').should('contain', 'Padrão').and('have.class', 'bg-primary');
  });

  it('Renderiza com a variante "destructive"', () => {
    cy.mount(<Badge variant="destructive">Destrutivo</Badge>);
    cy.get('[data-slot="badge"]').should('contain', 'Destrutivo').and('have.class', 'bg-destructive');
  });

  it('Renderiza com a variante "success"', () => {
    cy.mount(<Badge variant="success">Sucesso</Badge>);
    cy.get('[data-slot="badge"]').should('contain', 'Sucesso').and('have.class', 'bg-emerald-500');
  });

  it('Renderiza com a variante "warning"', () => {
    cy.mount(<Badge variant="warning">Aviso</Badge>);
    cy.get('[data-slot="badge"]').should('contain', 'Aviso').and('have.class', 'bg-amber-500');
  });
});
