import { Pessoa } from 'src/core/pessoa/entities/pessoa.entity';
import { Factory, Seeder } from 'typeorm-seeding';

export class PessoaSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(Pessoa)().createMany(10);
  }
}
