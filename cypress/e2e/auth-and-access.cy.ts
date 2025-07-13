// cypress/e2e/auth-and-access.cy.ts

describe('Fluxo de Autenticação e Acesso', () => {

  it('Deve redirecionar para /login ao acessar uma página protegida sem estar logado', () => {
    // Começa sem nenhuma sessão.
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
    cy.contains('h1', 'Acessar').should('be.visible');
  });

  it('Deve mostrar erro ao tentar logar com credenciais inválidas', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('email@errado.com');
    cy.get('input[name="password"]').type('senha-incorreta');
    cy.get('button[type="submit"]').click();
    cy.contains('Credenciais inválidas').should('be.visible');
  });

  it('Deve fazer login como ADMINISTRADOR e ter acesso total', () => {
    // Usa o comando de login para entrar como admin.
    cy.login('admin@dominio.com', 'password123');

    // Após o login, visita a página a ser testada.
    cy.visit('/dashboard/usuarios');

    // Verifica o conteúdo da página.
    cy.contains('h3', 'Usuários Cadastrados').should('be.visible');
    cy.get('body').should('not.contain', 'Acesso Restrito');
  });

  it('Deve fazer login como USUARIO e ter o acesso restrito', () => {
    // Usa o comando de login para entrar como usuário comum.
    cy.login('usuario@dominio.com', 'password123');

    // Visita a página restrita.
    cy.visit('/dashboard/usuarios');

    // Verifica se a mensagem de "Acesso Restrito" é exibida.
    cy.get('[data-slot="alert-title"]').contains('Acesso Restrito').should('be.visible');
  });

});
