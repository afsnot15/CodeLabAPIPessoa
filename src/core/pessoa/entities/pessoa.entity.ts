import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CreatePessoaDto } from '../dto/create-pessoa.dto';
import { UpdatePessoaDto } from '../dto/update-pessoa.dto';

@Entity('pessoa')
export class Pessoa {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_pessoa' })
  id: number;

  @Column({ length: 100, nullable: false })
  nome: string;

  @Column({ length: 14, nullable: false })
  documento: string;

  @Column({ length: 10, nullable: false })
  cep: string;

  @Column({ nullable: false })
  endereco: string;

  @Column({ length: 14, nullable: false })
  telefone: string;

  @Column({ nullable: false })
  ativo: boolean;

  constructor(createPessoaDto: CreatePessoaDto | UpdatePessoaDto) {
    Object.assign(this, createPessoaDto);
  }
}
