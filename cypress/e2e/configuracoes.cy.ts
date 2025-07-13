// cypress/e2e/5-configuracoes.cy.ts
describe('Módulo de Configurações', () => {
  beforeEach(() => {
    cy.login('admin@dominio.com', 'password123');
  });

  it('Deve editar e salvar as informações da empresa', () => {
    cy.visit('/dashboard/settings');
    cy.get('button[aria-label="Desbloquear para editar"]').click();
    const novoNome = `Empresa Teste ${Date.now()}`;
    cy.get('input[name="nomeFantasia"]').clear().type(novoNome);
    cy.get('button').contains('Salvar Alterações').click();
    cy.contains('sucesso').should('be.visible');
    cy.get('input[name="nomeFantasia"]').should('have.value', novoNome);
    cy.get('input[name="nomeFantasia"]').should('be.disabled');
  });

  it('Deve criar uma nova função de acesso com permissões', () => {
    cy.visit('/dashboard/permissoes');
    const nomeFuncao = `Função Vendedor ${Date.now()}`;
    cy.get('input[name="nome"]').type(nomeFuncao);
    cy.get('input[placeholder="Selecione um módulo..."]').click().type('Clientes{enter}');
    cy.get('button').contains('Adicionar').click();
    cy.get('button').contains('Criar Função').click();
    cy.contains('sucesso').should('be.visible');
    cy.get('table').contains(nomeFuncao).should('be.visible');
  });
});
