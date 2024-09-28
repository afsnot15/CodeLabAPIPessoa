import { fakerPT_BR as faker } from '@faker-js/faker';
import { CreatePessoaDto } from 'src/core/pessoa/dto/create-pessoa.dto';
import { Pessoa } from 'src/core/pessoa/entities/pessoa.entity';
import { define } from 'typeorm-seeding';

define(Pessoa, () => {
  const pessoa = new CreatePessoaDto();

  pessoa.nome = faker.person.fullName().substring(0, 100);
  pessoa.documento = faker.number.int({ max: 99999999999 }).toString();
  pessoa.cep = faker.location.zipCode('#####-###');
  pessoa.endereco = faker.location.streetAddress();
  pessoa.telefone = ` 199 ${faker.number.int({ max: 99999999 }).toString()}`;
  pessoa.ativo = true;

  return new Pessoa(pessoa);
});
