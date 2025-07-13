// cypress/component/Breadcrumb.cy.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

describe('<Breadcrumb />', () => {
  it('Deve renderizar os itens, links, separadores e a página atual', () => {
    cy.mount(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );

    cy.get('[data-slot="breadcrumb-link"]').should('have.length', 2);
    cy.get('[data-slot="breadcrumb-separator"]').should('have.length', 2);
    cy.get('[data-slot="breadcrumb-page"]').should('contain', 'Breadcrumb');
    cy.get('a[href="/"]').should('contain', 'Início');
  });
});
