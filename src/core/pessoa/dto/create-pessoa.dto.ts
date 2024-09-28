import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { EMensagem } from '../../../shared/enums/mensagem.enum';

export class CreatePessoaDto {
  @IsNotEmpty({ message: `nome ${EMensagem.NaoPodeSerVazio}` })
  @MaxLength(100, {
    message: `nome  ${EMensagem.MaisCaracteresPermitido}`,
  })
  nome: string;

  @IsNotEmpty({ message: `documento ${EMensagem.NaoPodeSerVazio}` })
  @MaxLength(14, {
    message: `documento  ${EMensagem.MaisCaracteresPermitido}`,
  })
  @MinLength(11, {
    message: `documento  ${EMensagem.MenosCaracteresPermitido}`,
  })
  documento: string;

  @IsNotEmpty({ message: `cep ${EMensagem.NaoPodeSerVazio}` })
  cep: string;

  @IsNotEmpty({ message: `endereco ${EMensagem.NaoPodeSerVazio}` })
  endereco: string;

  @IsNotEmpty({ message: `telefone ${EMensagem.NaoPodeSerVazio}` })
  telefone: string;

  @IsNotEmpty({ message: `ativo ${EMensagem.NaoPodeSerVazio}` })
  ativo: boolean;
}
