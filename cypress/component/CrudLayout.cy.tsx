// cypress/component/CrudLayout.cy.tsx
import { CrudLayout } from '@/components/crud-layout';

describe('<CrudLayout />', () => {
  it('Renderiza os títulos e o conteúdo dos slots corretamente', () => {
    const formTitle = "Formulário de Teste";
    const tableTitle = "Tabela de Teste";
    const formContent = <div>Conteúdo do Formulário</div>;
    const tableContent = <table><tbody><tr><td>Conteúdo da Tabela</td></tr></tbody></table>;

    cy.mount(
      <CrudLayout
        formTitle={formTitle}
        formContent={formContent}
        tableTitle={tableTitle}
        tableContent={tableContent}
      />
    );

    cy.contains(formTitle).should('be.visible');
    cy.contains('Conteúdo do Formulário').should('be.visible');
    cy.contains(tableTitle).should('be.visible');
    cy.contains('Conteúdo da Tabela').should('be.visible');
  });
});
