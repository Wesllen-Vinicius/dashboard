// cypress/component/Input.cy.tsx
import { Input } from '@/components/ui/input';

describe('<Input />', () => {
  it('Deve permitir a digitação de texto', () => {
    cy.mount(<Input placeholder="Digite aqui..." />);
    const textoDigitado = 'Olá, mundo!';
    cy.get('input').type(textoDigitado).should('have.value', textoDigitado);
  });

  it('Deve estar desabilitado quando a propriedade disabled for passada', () => {
    cy.mount(<Input disabled />);
    cy.get('input').should('be.disabled');
  });
});
