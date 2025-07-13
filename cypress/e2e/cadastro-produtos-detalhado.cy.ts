// cypress/e2e/cadastro-produtos-detalhado.cy.ts
describe('Módulo de Cadastro - Detalhes de Produtos', () => {
    beforeEach(() => {
      cy.login('admin@dominio.com', 'password123');
      // Garante que os pré-requisitos (unidades e categorias) existam
      // para evitar falhas nos testes de produto.
      cy.visit('/dashboard/unidades');
      cy.get('input[name="nome"]').type('Quilograma');
      cy.get('input[name="sigla"]').type('KG');
      cy.get('button:contains("Cadastrar")').click();

      cy.visit('/dashboard/categorias');
      cy.get('input[name="nome"]').type('Limpeza');
      cy.get('button:contains("Cadastrar")').click();
    });

    it('Deve criar um produto do tipo "Matéria-Prima"', () => {
      cy.visit('/dashboard/produtos');
      const nomeProduto = `Animal Vivo Teste ${Date.now()}`;

      cy.get('button:contains("Selecione o tipo")').click();
      cy.get('[data-slot="select-item"]').contains('Matéria-Prima').click();

      cy.get('input[name="nome"]').type(nomeProduto);
      cy.get('select[name="unidadeId"]').select(1); // Seleciona a primeira unidade da lista
      cy.get('input[name="custoUnitario"]').type('1500.00');

      cy.get('button').contains('Adicionar Produto').click();
      cy.contains('sucesso').should('be.visible');
      cy.get('table').contains(nomeProduto).should('be.visible');
    });

    it('Deve criar um produto do tipo "Produto para Venda"', () => {
        cy.visit('/dashboard/produtos');
        const nomeProduto = `Picanha Teste ${Date.now()}`;

        cy.get('button:contains("Selecione o tipo")').click();
        cy.get('[data-slot="select-item"]').contains('Produto para Venda').click();

        cy.get('input[name="nome"]').type(nomeProduto);
        cy.get('select[name="unidadeId"]').select(1);
        cy.get('input[name="precoVenda"]').type('99.90');
        cy.get('input[name="ncm"]').type('02023000');
        cy.get('input[name="cfop"]').type('5102');

        cy.get('button').contains('Adicionar Produto').click();
        cy.contains('sucesso').should('be.visible');
        cy.get('table').contains(nomeProduto).should('be.visible');
    });

    it('Deve criar um produto do tipo "Item de Uso Interno"', () => {
        cy.visit('/dashboard/produtos');
        const nomeProduto = `Detergente Teste ${Date.now()}`;

        cy.get('button:contains("Selecione o tipo")').click();
        cy.get('[data-slot="select-item"]').contains('Item de Uso Interno').click();

        cy.get('input[name="nome"]').type(nomeProduto);
        cy.get('select[name="categoriaId"]').select(1); // Seleciona a primeira categoria
        cy.get('input[name="custoUnitario"]').type('5.75');

        cy.get('button').contains('Adicionar Produto').click();
        cy.contains('sucesso').should('be.visible');
        cy.get('table').contains(nomeProduto).should('be.visible');
    });
});
