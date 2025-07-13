// cypress/e2e/conta-usuario.cy.ts
describe('Página da Conta do Usuário', () => {
  beforeEach(() => {
    cy.login('admin@dominio.com', 'password123');
    cy.visit('/dashboard/account');
  });

  it('Deve atualizar o nome de exibição com sucesso', () => {
    const novoNome = `Admin Teste ${Date.now()}`;
    cy.get('input[name="displayName"]').clear().type(novoNome);
    cy.get('button').contains('Salvar Alterações').click();
    cy.contains('Perfil atualizado com sucesso!').should('be.visible');
    cy.get('.sidebar-text').contains(novoNome).should('be.visible');
  });

  it('Deve falhar ao tentar alterar a senha com a senha atual incorreta', () => {
    cy.get('input[name="currentPassword"]').first().type('senhaerrada');
    cy.get('button').contains('Verificar e Continuar').click();
    cy.contains('Senha atual incorreta').should('be.visible');
  });

  it('Deve permitir a alteração da senha com os dados corretos', () => {
    const senhaAtual = 'password123';
    const novaSenha = `newPassword${Date.now()}`;

    // Verifica a senha atual
    cy.get('input[name="currentPassword"]').first().type(senhaAtual);
    cy.get('button').contains('Verificar e Continuar').click();
    cy.contains('Senha atual verificada').should('be.visible');

    // Insere a nova senha
    cy.get('input[name="newPassword"]').type(novaSenha);
    cy.get('input[name="confirmPassword"]').type(novaSenha);
    cy.get('button').contains('Alterar Senha').click();
    cy.contains('Senha alterada com sucesso!').should('be.visible');

    // Tenta fazer login com a nova senha para confirmar
    cy.get('button').contains('Sair').click({ force: true });
    cy.login('admin@dominio.com', novaSenha);
    cy.url().should('include', '/dashboard');

    // Reverte a senha para o estado original para não quebrar outros testes
    cy.visit('/dashboard/account');
    cy.get('input[name="currentPassword"]').first().type(novaSenha);
    cy.get('button').contains('Verificar e Continuar').click();
    cy.get('input[name="newPassword"]').type(senhaAtual);
    cy.get('input[name="confirmPassword"]').type(senhaAtual);
    cy.get('button').contains('Alterar Senha').click();
    cy.contains('Senha alterada com sucesso!').should('be.visible');
  });
});
