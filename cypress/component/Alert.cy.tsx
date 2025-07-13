// cypress/component/Alert.cy.tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { IconAlertTriangle } from '@tabler/icons-react';

describe('<Alert />', () => {
  it('Renderiza com título e descrição', () => {
    cy.mount(
      <Alert variant="destructive">
        <IconAlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>Ocorreu um problema.</AlertDescription>
      </Alert>
    );
    cy.get('[data-slot="alert-title"]').should('contain', 'Erro');
    cy.get('[data-slot="alert-description"]').should('contain', 'Ocorreu um problema.');
    cy.get('div[role="alert"]').should('have.class', 'text-destructive');
  });
});
