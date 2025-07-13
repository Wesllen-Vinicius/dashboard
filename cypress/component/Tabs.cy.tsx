// cypress/component/Tabs.cy.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

describe('<Tabs />', () => {
  it('Alterna entre as abas ao clicar nos gatilhos', () => {
    cy.mount(
      <Tabs defaultValue="conta">
        <TabsList>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="senha">Senha</TabsTrigger>
        </TabsList>
        <TabsContent value="conta">Conteúdo da aba de Conta.</TabsContent>
        <TabsContent value="senha">Conteúdo da aba de Senha.</TabsContent>
      </Tabs>
    );

    cy.contains('Conteúdo da aba de Conta').should('be.visible');
    cy.contains('Conteúdo da aba de Senha').should('not.be.visible');

    cy.get('button').contains('Senha').click();

    cy.contains('Conteúdo da aba de Conta').should('not.be.visible');
    cy.contains('Conteúdo da aba de Senha').should('be.visible');
  });
});
