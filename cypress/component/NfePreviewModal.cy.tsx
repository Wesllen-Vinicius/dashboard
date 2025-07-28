// cypress/component/NfePreviewModal.cy.tsx
import { NfePreviewModal } from '@/components/NfePreviewModal';
import { Venda, CompanyInfo, Cliente, Produto, Unidade } from '@/lib/schemas';

describe('<NfePreviewModal />', () => {
  const mockPreviewData = {
    venda: { id: 'v1', data: new Date(), valorTotal: 100, valorFinal: 100, produtos: [{ produtoId: 'p1', produtoNome: 'Produto Teste', quantidade: 2, precoUnitario: 50, custoUnitario: 30 }] } as Venda,
    empresa: { razaoSocial: 'Empresa Teste', nomeFantasia: 'Fantasia', cnpj: '00.000.000/0001-91', inscricaoEstadual: '123456', endereco: { logradouro: 'Rua Teste', numero: '123', bairro: 'Centro', cidade: 'Cidade', uf: 'UF', cep: '12345-678' }, configuracaoFiscal: {} } as CompanyInfo,
    cliente: { nome: 'Cliente Teste', documento: '123.456.789-00', endereco: { logradouro: 'Rua Cliente', numero: '456', bairro: 'Bairro', cidade: 'Cidade', uf: 'UF', cep: '98765-432' } } as Cliente,
    todosProdutos: [{ id: 'p1', nome: 'Produto Teste', tipoProduto: 'VENDA', codigo: 'P001', ncm: '12345678', cfop: '5101', unidadeId: 'u1' }] as Produto[],
    todasUnidades: [{ id: 'u1', nome: 'Unidade', sigla: 'UN' }] as Unidade[],
  };

  it('Renderiza os dados de pré-visualização e permite o envio do formulário', () => {
    const onSubmitSpy = cy.spy().as('onSubmitSpy');
    cy.mount(
      <NfePreviewModal
        isOpen={true}
        onOpenChange={() => {}}
        previewData={mockPreviewData}
        onSubmit={onSubmitSpy}
        isLoading={false}
      />
    );

    // Verifica se os dados da empresa e cliente estão visíveis
    cy.contains('Empresa Teste').should('be.visible');
    cy.get('input[name="nome"]').should('have.value', 'Cliente Teste');
    cy.contains('Produto Teste').should('be.visible');

    // Clica no botão de confirmar
    cy.get('button').contains('Confirmar e Emitir NF-e').click();

    // Verifica se a função de submit foi chamada
    cy.get('@onSubmitSpy').should('have.been.called');
  });

  it('Mostra o estado de "carregando" no botão de submit', () => {
    cy.mount(
      <NfePreviewModal
        isOpen={true}
        onOpenChange={() => {}}
        previewData={mockPreviewData}
        onSubmit={() => {}}
        isLoading={true}
      />
    );

    cy.get('button').contains('Emitindo...').should('be.visible').and('be.disabled');
  });
});
