// cypress/component/Tooltip.cy.tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

describe('<Tooltip />', () => {
  it('Exibe o conteúdo do tooltip ao passar o mouse sobre o gatilho', () => {
    cy.mount(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Passe o mouse</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Conteúdo do Tooltip</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    cy.contains('Conteúdo do Tooltip').should('not.be.visible');
    cy.get('button').contains('Passe o mouse').trigger('mouseover');
    cy.contains('Conteúdo do Tooltip').should('be.visible');
  });
});
