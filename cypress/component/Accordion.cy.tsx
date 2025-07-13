// cypress/component/Accordion.cy.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

describe('<Accordion />', () => {
  it('Deve expandir e recolher os itens ao clicar', () => {
    cy.mount(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Item 1</AccordionTrigger>
          <AccordionContent>Conteúdo do Item 1.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Item 2</AccordionTrigger>
          <AccordionContent>Conteúdo do Item 2.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    // Verifica o estado inicial
    cy.contains('Conteúdo do Item 1').should('not.be.visible');
    cy.contains('Conteúdo do Item 2').should('not.be.visible');

    // Abre o primeiro item
    cy.contains('Item 1').click();
    cy.contains('Conteúdo do Item 1').should('be.visible');
    cy.contains('Conteúdo do Item 2').should('not.be.visible');

    // Abre o segundo item (e fecha o primeiro)
    cy.contains('Item 2').click();
    cy.contains('Conteúdo do Item 1').should('not.be.visible');
    cy.contains('Conteúdo do Item 2').should('be.visible');

    // Fecha o segundo item
    cy.contains('Item 2').click();
    cy.contains('Conteúdo do Item 2').should('not.be.visible');
  });
});
