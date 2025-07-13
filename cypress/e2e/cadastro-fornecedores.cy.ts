// cypress/e2e/cadastro-fornecedores.cy.ts
describe('Módulo de Cadastro - Fornecedores', () => {
  beforeEach(() => {
    cy.login('admin@dominio.com', 'password123');
    cy.visit('/dashboard/fornecedores');
  });

  it('Deve realizar o CRUD completo de um Fornecedor', () => {
    const razaoSocial = `Fornecedor Teste E2E ${Date.now()}`;
    const razaoSocialEditada = `${razaoSocial} (Editado)`;

    // --- Etapa de Criação ---
    cy.log('Iniciando criação de fornecedor');
    cy.get('input[name="razaoSocial"]').type(razaoSocial);
    cy.get('input[name="cnpj"]').type('47.508.411/0001-56');

    // Botão de busca CNPJ
    cy.get('button[aria-label="Buscar dados do CNPJ"]').click();
    cy.contains('Dados preenchidos!', { timeout: 10000 }).should('be.visible');

    // Preenche o restante dos dados
    cy.get('input[name="endereco.numero"]').type('100');
    cy.get('input[name="dadosBancarios.banco"]').type('Banco Teste');
    cy.get('input[name="dadosBancarios.agencia"]').type('0001');
    cy.get('input[name="dadosBancarios.conta"]').type('12345-6');

    cy.get('button').contains('Cadastrar Fornecedor').click();
    cy.contains('sucesso').should('be.visible');
    cy.get('table').contains(razaoSocial).should('be.visible');
    cy.log('Criação de fornecedor concluída');

    // --- Etapa de Edição ---
    cy.log('Iniciando edição de fornecedor');
    cy.get('table').contains('tr', razaoSocial).find('button[aria-label="Editar Fornecedor"]').click();
    cy.get('input[name="razaoSocial"]').clear().type(razaoSocialEditada);
    cy.get('input[name="contato"]').clear().type('(99) 99999-9999');
    cy.get('button').contains('Salvar Alterações').click();
    cy.contains('sucesso').should('be.visible');
    cy.get('table').contains(razaoSocialEditada).should('be.visible');
    cy.log('Edição de fornecedor concluída');

    // --- Etapa de Inativação ---
    cy.log('Iniciando inativação de fornecedor');
    cy.get('table').contains('tr', razaoSocialEditada).find('button[aria-label="Inativar Fornecedor"]').click();
    cy.get('button').contains('Confirmar').click();
    cy.contains('inativado(s) com sucesso').should('be.visible');
    cy.get('table').contains(razaoSocialEditada).should('not.exist');
    cy.log('Inativação de fornecedor concluída');

    // --- Etapa de Reativação ---
    cy.log('Verificando na aba de inativos e reativando');
    cy.get('button').contains('Inativos').click();
    cy.get('table').contains(razaoSocialEditada).should('be.visible');
    cy.get('table').contains('tr', razaoSocialEditada).find('button[aria-label="Reativar Fornecedor"]').click();
    cy.get('button').contains('Confirmar').click();
    cy.contains('reativado(s) com sucesso').should('be.visible');
    cy.get('button').contains('Ativos').click();
    cy.get('table').contains(razaoSocialEditada).should('be.visible');
    cy.log('Ciclo CRUD de fornecedor finalizado');
  });
});
