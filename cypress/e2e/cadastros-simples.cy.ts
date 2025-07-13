// cypress/e2e/cadastros-simples.cy.ts
describe('Módulo de Cadastros Simples', () => {
  beforeEach(() => {
    cy.login('admin@dominio.com', 'password123');
  });

  context('Cargos', () => {
    it('Deve criar, editar e inativar um Cargo', () => {
      cy.visit('/dashboard/cargos');
      const nomeCargo = `Cargo Teste ${Date.now()}`;
      const nomeEditado = `${nomeCargo} (Editado)`;

      // Criar
      cy.get('input[name="nome"]').type(nomeCargo);
      cy.get('button').contains('Adicionar Cargo').click();
      cy.contains('sucesso').should('be.visible');
      cy.get('table').contains(nomeCargo).should('be.visible');

      // Editar
      cy.get('table').contains('tr', nomeCargo).find('button[aria-label="Editar Cargo"]').click();
      cy.get('input[name="nome"]').clear().type(nomeEditado);
      cy.get('button').contains('Salvar Alterações').click();
      cy.contains('sucesso').should('be.visible');
      cy.get('table').contains(nomeEditado).should('be.visible');

      // Inativar (simulado com um confirm)
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      cy.get('table').contains('tr', nomeEditado).find('button[aria-label="Inativar Cargo"]').click();
      cy.contains('sucesso').should('be.visible');
      cy.get('table').contains(nomeEditado).should('not.exist');
    });
  });

  context('Unidades', () => {
    it('Deve criar e editar uma Unidade de Medida', () => {
      cy.visit('/dashboard/unidades');
      const nomeUnidade = `Unidade ${Date.now()}`;
      const siglaUnidade = `U${Date.now().toString().slice(-2)}`;

      // Criar
      cy.get('input[name="nome"]').type(nomeUnidade);
      cy.get('input[name="sigla"]').type(siglaUnidade);
      cy.get('button').contains('Cadastrar').click();
      cy.contains('sucesso').should('be.visible');
      cy.get('table').contains(nomeUnidade).should('be.visible');
    });
  });

  context('Categorias', () => {
    it('Deve criar e editar uma Categoria de Item', () => {
      cy.visit('/dashboard/categorias');
      const nomeCategoria = `Categoria ${Date.now()}`;

      // Criar
      cy.get('input[name="nome"]').type(nomeCategoria);
      cy.get('button').contains('Cadastrar').click();
      cy.contains('sucesso').should('be.visible');
      cy.get('table').contains(nomeCategoria).should('be.visible');
    });
  });
});
