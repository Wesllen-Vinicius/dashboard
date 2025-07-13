// cypress/component/GenericForm.cy.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { GenericForm } from '@/components/generic-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const testSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
});
type TestFormValues = z.infer<typeof testSchema>;

// Define explicitamente o tipo da prop 'onSubmit'
const TestForm = ({ onSubmit }: { onSubmit: (values: TestFormValues) => void }) => {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: { name: '' },
  });
  return (
    <GenericForm schema={testSchema} onSubmit={onSubmit} form={form}>
      <Input {...form.register('name')} />
      <p>{form.formState.errors.name?.message}</p>
      <Button type="submit">Enviar</Button>
    </GenericForm>
  );
};

describe('<GenericForm />', () => {
  it('Valida o campo e chama onSubmit com os dados corretos', () => {
    const onSubmitSpy = cy.spy().as('onSubmitSpy');
    cy.mount(<TestForm onSubmit={onSubmitSpy} />);

    // Teste de falha na validação
    cy.get('input[name="name"]').type('ab');
    cy.get('button').click();
    cy.contains('Mínimo 3 caracteres').should('be.visible');
    cy.get('@onSubmitSpy').should('not.have.been.called');

    // Teste de sucesso
    cy.get('input[name="name"]').clear().type('Nome Válido');
    cy.get('button').click();
    cy.get('@onSubmitSpy').should('have.been.calledWith', { name: 'Nome Válido' });
  });
});
