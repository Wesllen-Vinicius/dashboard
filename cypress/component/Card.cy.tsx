// cypress/component/Card.cy.tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';

describe('<Card />', () => {
  it('Renderiza todos os subcomponentes corretamente', () => {
    cy.mount(
      <Card>
        <CardHeader>
          <CardTitle>Título do Card</CardTitle>
          <CardDescription>Descrição do Card</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Conteúdo do card.</p>
        </CardContent>
        <CardFooter>
          Rodapé do Card
        </CardFooter>
      </Card>
    );

    cy.get('[data-slot="card-title"]').should('contain', 'Título do Card');
    cy.get('[data-slot="card-description"]').should('contain', 'Descrição do Card');
    cy.get('[data-slot="card-content"]').should('contain', 'Conteúdo do card.');
    cy.get('[data-slot="card-footer"]').should('contain', 'Rodapé do Card');
  });
});
