// cypress/component/Button.cy.tsx
import { Button } from '@/components/ui/button';
import { IconLoader } from '@tabler/icons-react';

describe('<Button />', () => {
  it('Renderiza, reage ao clique e aplica variantes', () => {
    const onClickSpy = cy.spy().as('onClickSpy');
    cy.mount(<Button onClick={onClickSpy} variant="destructive">Excluir</Button>);

    cy.get('button').contains('Excluir').should('have.class', 'bg-destructive').click();
    cy.get('@onClickSpy').should('have.been.calledOnce');
  });

  it('Fica desabilitado corretamente', () => {
    cy.mount(<Button disabled>Não Clicável</Button>);
    cy.get('button').should('be.disabled');
  });
});
