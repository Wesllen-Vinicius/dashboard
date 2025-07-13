// cypress/e2e/1-auth.cy.ts
describe('Autenticação e Controle de Acesso', () => {
  it('Deve redirecionar para /login se não estiver autenticado', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('Deve falhar o login com credenciais inválidas', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('email@invalido.com');
    cy.get('input[name="password"]').type('senhaerrada');
    cy.get('button[type="submit"]').click();
    cy.contains('Credenciais inválidas').should('be.visible');
  });

  it('Deve abrir o diálogo de redefinição de senha', () => {
    cy.visit('/login');
    cy.get('button').contains('Esqueceu sua senha?').click();
    cy.get('[data-slot="dialog-content"]').should('be.visible');
    cy.get('[data-slot="dialog-title"]').should('contain', 'Recuperar Senha');
  });

  it('Deve fazer login como ADMINISTRADOR e ter acesso total', () => {
    cy.login('admin@dominio.com', 'password123');
    cy.visit('/dashboard/usuarios');
    cy.contains('Acesso Restrito').should('not.exist');
    cy.get('button').contains('Criar Usuário').should('be.visible');
  });

  it('Deve fazer login como USUARIO e ter o acesso restrito validado', () => {
    cy.login('usuario@dominio.com', 'password123');
    cy.visit('/dashboard/cargos');
    cy.get('[data-slot="alert-title"]').contains('Acesso Restrito').should('be.visible');
    cy.get('input[name="nome"]').should('be.disabled');
  });
});
