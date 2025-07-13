// cypress/component/ConfirmationDialog.cy.tsx
import { ConfirmationDialog } from '@/components/confirmation-dialog';

describe('<ConfirmationDialog />', () => {
  it('Chama onConfirm ao clicar em Confirmar', () => {
    const onConfirmSpy = cy.spy().as('onConfirmSpy');
    cy.mount(
      <ConfirmationDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={onConfirmSpy}
        title="Confirmar Ação"
        description="Você tem certeza?"
      />
    );

    cy.get('button').contains('Confirmar').click();
    cy.get('@onConfirmSpy').should('have.been.calledOnce');
  });

  it('Chama onOpenChange(false) ao clicar em Cancelar', () => {
    const onOpenChangeSpy = cy.spy().as('onOpenChangeSpy');
    cy.mount(
      <ConfirmationDialog
        open={true}
        onOpenChange={onOpenChangeSpy}
        onConfirm={() => {}}
        title="Confirmar Ação"
        description="Você tem certeza?"
      />
    );

    cy.get('button').contains('Cancelar').click();
    cy.get('@onOpenChangeSpy').should('have.been.calledWith', false);
  });
});
