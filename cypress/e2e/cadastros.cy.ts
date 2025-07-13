// cypress/e2e/cadastros.cy.ts

// Define um tipo para os objetos de campo, resolvendo o erro de 'any' implícito
type Field = {
  name: string;
  value: string;
  type?: 'select' | 'combobox' | 'input';
  placeholder?: string;
};

describe('Módulo de Cadastros Completos', () => {
  beforeEach(() => {
    cy.login('admin@dominio.com', 'password123');
  });

  /**
   * Função reutilizável para testar o fluxo CRUD básico.
   * @param path A URL do módulo (ex: 'clientes').
   * @param uniqueField O campo usado para identificar a nova entidade (ex: 'nome' ou 'razaoSocial').
   * @param fields Um array de objetos descrevendo os campos a serem preenchidos para a criação.
   * @param editFields Um array de objetos para os campos que serão editados.
   */
  // Adiciona tipos explícitos aos parâmetros da função
  const runCrudTests = (
    path: string,
    uniqueField: string,
    fields: Field[],
    editFields: Field[]
  ) => {
    cy.visit(`/dashboard/${path}`);

    const uniqueIdentifier = `Teste E2E ${Date.now()}`;
    const editedIdentifier = `${uniqueIdentifier} (Editado)`;

    // --- Etapa de Criação ---
    cy.log(`Iniciando criação em /${path}`);
    // O parâmetro 'field' agora é inferido corretamente como tipo 'Field'
    fields.forEach(field => {
      const value = field.value.replace('UNIQUE', uniqueIdentifier);
      switch (field.type) {
        case 'select':
          cy.get(`[data-slot="select-trigger"]`).first().click();
          cy.get(`[data-slot="select-item"]`).contains(field.value).click();
          break;
        case 'combobox':
          cy.get(`input[placeholder*="${field.placeholder}"]`).click().type(`{enter}`);
          break;
        default:
          cy.get(`input[name="${field.name}"]`).clear().type(value);
      }
    });
    cy.get('form').find('button[type="submit"]').first().click();
    cy.contains('sucesso').should('be.visible');
    cy.get('table').contains(uniqueIdentifier).should('be.visible');
    cy.log(`Criação em /${path} concluída com sucesso.`);

    // --- Etapa de Edição ---
    cy.log(`Iniciando edição em /${path}`);
    cy.get('table').contains('tr', uniqueIdentifier).find('button[aria-label^="Editar"]').click();
    editFields.forEach(field => {
      const value = field.value.replace('UNIQUE', editedIdentifier);
      cy.get(`input[name="${field.name}"]`).clear().type(value);
    });
    cy.get('button').contains('Salvar Alterações').click();
    cy.contains('sucesso').should('be.visible');
    cy.get('table').contains(editedIdentifier).should('be.visible');
    cy.log(`Edição em /${path} concluída com sucesso.`);

    // --- Etapa de Inativação e Reativação ---
    cy.log(`Iniciando inativação em /${path}`);
    cy.get('table').contains('tr', editedIdentifier).find('button[aria-label^="Inativar"]').click();
    cy.get('button').contains('Confirmar').click();
    cy.contains('inativado(s) com sucesso').should('be.visible');
    cy.contains(editedIdentifier).should('not.exist');

    cy.log(`Verificando na aba de inativos`);
    cy.get('button').contains('Inativos').click();
    cy.get('table').contains(editedIdentifier).should('be.visible');

    cy.log(`Iniciando reativação em /${path}`);
    cy.get('table').contains('tr', editedIdentifier).find('button[aria-label^="Reativar"]').click();
    cy.get('button').contains('Confirmar').click();
    cy.contains('reativado(s) com sucesso').should('be.visible');
    cy.get('button').contains('Ativos').click();
    cy.get('table').contains(editedIdentifier).should('be.visible');
    cy.log(`Ciclo CRUD completo para /${path} finalizado.`);
  };

  // --- Conjunto de Testes para cada Módulo ---

  context('Clientes', () => {
    it('Deve realizar o CRUD completo de um Cliente Pessoa Jurídica', () => {
      runCrudTests('clientes', 'nome',
        [
          { name: 'tipoPessoa', type: 'select', value: 'Pessoa Jurídica' },
          { name: 'nome', value: 'Cliente UNIQUE' },
          { name: 'documento', value: '00.360.305/0001-04' },
          { name: 'telefone', value: '(11) 98765-4321' },
          { name: 'email', value: 'cliente@unique.com' },
          { name: 'endereco.cep', value: '01001000' },
          { name: 'endereco.numero', value: '123' },
        ],
        [
          { name: 'nome', value: 'Cliente UNIQUE' },
          { name: 'telefone', value: '(11) 12345-6789' }
        ]
      );
    });
  });

  context('Funcionários', () => {
    it('Deve realizar o CRUD completo de um Funcionário', () => {
      // Pré-requisito: um cargo precisa existir
      cy.visit('/dashboard/cargos');
      cy.get('input[name="nome"]').type('Cargo para Funcionário');
      cy.get('button[type="submit"]').click();

      cy.visit('/dashboard/funcionarios');
      const nomeFuncionario = `Funcionario Teste ${Date.now()}`;

      cy.get('input[name="razaoSocial"]').type('Empresa do Funcionario MEI');
      cy.get('input[name="cnpj"]').type('33.041.260/0001-62');
      cy.get('input[name="nomeCompleto"]').type(nomeFuncionario);
      cy.get('input[name="cpf"]').type('222.222.222-22');
      cy.get('input[name="contato"]').type('(31) 98877-6655');
      cy.get('select[name="cargoId"]').select(1);
      cy.get('input[name="banco"]').type('Banco Digital');
      cy.get('input[name="agencia"]').type('0002');
      cy.get('input[name="conta"]').type('98765-4');

      cy.get('button').contains('Cadastrar Funcionário').click();
      cy.contains('sucesso').should('be.visible');
      cy.get('table').contains(nomeFuncionario).should('be.visible');
    });
  });

  context('Produtos', () => {
    it('Deve criar um produto para venda e verificar detalhes', () => {
      cy.visit('/dashboard/produtos');
      const nomeProduto = `Picanha Teste ${Date.now()}`;

      cy.get('button').contains('Selecione o tipo').click();
      cy.get('[data-slot="select-item"]').contains('Produto para Venda').click();

      cy.get('input[name="nome"]').type(nomeProduto);
      cy.get('button[aria-haspopup="listbox"]').first().click(); // Abre o select de unidade
      cy.get('[data-slot="select-item"]').first().click();
      cy.get('input[name="precoVenda"]').type('150.99');
      cy.get('input[name="ncm"]').type('02013000');
      cy.get('input[name="cfop"]').type('5101');

      cy.get('button').contains('Adicionar Produto').click();
      cy.contains('sucesso').should('be.visible');
      cy.get('table').contains(nomeProduto).should('be.visible');

      // Verifica o subcomponente
      cy.get('table').contains('tr', nomeProduto).find('button[aria-label^="Expandir"]').click();
      cy.get('div').contains('Detalhes Fiscais').should('be.visible');
      cy.get('div').contains('02013000').should('be.visible');
    });
  });
});
