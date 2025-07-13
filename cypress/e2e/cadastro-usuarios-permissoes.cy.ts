// cypress/e2e/cadastro-usuarios-permissoes.cy.ts
describe('Módulo de Cadastro - Usuários e Permissões', () => {
    beforeEach(() => {
      cy.login('admin@dominio.com', 'password123');
    });

    context('Funções e Permissões', () => {
      it('Deve criar uma nova função com permissões específicas', () => {
        cy.visit('/dashboard/permissoes');
        const nomeFuncao = `Vendedor ${Date.now()}`;

        cy.get('input[name="nome"]').type(nomeFuncao);
        cy.get('input[name="descricao"]').type('Acesso apenas a vendas e clientes');

        // Adicionar módulo de Clientes
        cy.get('input[placeholder*="Selecione um módulo"]').click().type('Clientes{enter}');
        cy.get('button').contains('Adicionar').click();

        // Adicionar módulo de Vendas
        cy.get('input[placeholder*="Selecione um módulo"]').click().type('Vendas{enter}');
        cy.get('button').contains('Adicionar').click();

        // Edita permissões do módulo de Clientes
        cy.contains(nomeFuncao).parents('tr').find('button[aria-label="Editar Permissões"]').click();
        cy.get('[data-slot="popover-content"]').should('be.visible');
        cy.get('label').contains('Criar').click(); // Adiciona a permissão de Criar

        cy.get('button').contains('Criar Função').click();
        cy.contains('sucesso').should('be.visible');
        cy.get('table').contains(nomeFuncao).should('be.visible');
      });
    });

    context('Usuários', () => {
      it('Deve criar um novo usuário e depois inativá-lo', () => {
        cy.visit('/dashboard/usuarios');
        const emailUsuario = `usuario.teste.${Date.now()}@email.com`;

        // Criar
        cy.get('input[name="displayName"]').type('Usuário de Teste');
        cy.get('input[name="email"]').type(emailUsuario);
        cy.get('input[name="password"]').type('senha@123');
        cy.get('select[name="role"]').select('USUARIO');
        cy.get('button').contains('Criar Usuário').click();
        cy.contains('sucesso').should('be.visible');
        cy.get('table').contains(emailUsuario).should('be.visible');

        // Inativar
        cy.window().then((win) => {
          cy.stub(win, 'confirm').returns(true);
        });
        cy.get('table').contains('tr', emailUsuario).find('button[aria-label="Inativar Usuário"]').click();
        cy.contains('sucesso').should('be.visible');
        cy.get('table').contains(emailUsuario).find('span').contains('Inativo').should('be.visible');
      });
    });
});
