// cypress/component/Dialog.cy.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

describe('<Dialog />', () => {
  it('Abre o diálogo ao clicar no gatilho e exibe o conteúdo', () => {
    cy.mount(
      <Dialog>
        <DialogTrigger>Abrir Diálogo</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Título do Diálogo</DialogTitle>
            <DialogDescription>
              Descrição do diálogo aqui.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    cy.get('[data-slot="dialog-content"]').should('not.exist');
    cy.contains('Abrir Diálogo').click();
    cy.get('[data-slot="dialog-content"]').should('be.visible');
    cy.get('[data-slot="dialog-title"]').should('contain', 'Título do Diálogo');
    cy.get('[data-slot="dialog-description"]').should('contain', 'Descrição do diálogo aqui.');
  });
});
