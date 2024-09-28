import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { EnviarEmailDto } from '../../shared/dtos/enviar-email.dto';
import { EMensagem } from '../../shared/enums/mensagem.enum';
import { mobilePhoneFormat } from '../../shared/helpers/formatter.helper';
import { handleFilter } from '../../shared/helpers/sql.helper';
import { IFindAllFilter } from '../../shared/interfaces/find-all-filter.interface';
import { IFindAllOrder } from '../../shared/interfaces/find-all-order.interface';
import { IGrpcUsuarioService } from '../../shared/interfaces/grpc-usuario.service';
import { IResponse } from '../../shared/interfaces/response.interface';
import { IUsuario } from '../../shared/interfaces/usuario.interface';
import { ExportPdfService } from '../../shared/services/export-pdf.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { Pessoa } from './entities/pessoa.entity';

@Injectable()
export class PessoaService {
  private readonly logger = new Logger(PessoaService.name);

  @Inject('MAIL_SERVICE')
  private readonly mailService: ClientProxy;

  @InjectRepository(Pessoa)
  private repository: Repository<Pessoa>;

  @Inject(ExportPdfService)
  private exportPdfService: ExportPdfService;

  private grpcUsuarioService: IGrpcUsuarioService;

  constructor(
    @Inject('GRPC_USUARIO')
    private readonly clientGrpcUsuario: ClientGrpc,
  ) {
    this.grpcUsuarioService =
      this.clientGrpcUsuario.getService<IGrpcUsuarioService>('UsuarioService');
  }

  async create(createPessoaDto: CreatePessoaDto): Promise<Pessoa> {
    const created = this.repository.create(new Pessoa(createPessoaDto));

    return await this.repository.save(created);
  }

  async findAll(
    page: number,
    size: number,
    order: IFindAllOrder,
    filter?: IFindAllFilter | IFindAllFilter[],
  ): Promise<IResponse<Pessoa[]>> {
    const where = handleFilter(filter);

    const [data, count] = await this.repository.findAndCount({
      loadEagerRelations: false,
      order: {
        [order.column]: order.sort,
      },
      where,
      skip: size * page,
      take: size,
    });

    return { data, count, message: null };
  }

  async findOne(id: number): Promise<Pessoa> {
    return await this.repository.findOne({
      where: { id: id },
    });
  }

  async update(id: number, updatePessoaDto: UpdatePessoaDto): Promise<Pessoa> {
    if (id !== updatePessoaDto.id) {
      throw new HttpException(
        EMensagem.IDsDiferentes,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    return await this.repository.save(new Pessoa(updatePessoaDto));
  }

  async unactivate(id: number): Promise<boolean> {
    const finded = await this.repository.findOne({
      where: { id: id },
    });

    if (!finded) {
      throw new HttpException(
        EMensagem.ImpossivelAlterar,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    finded.ativo = false;

    return (await this.repository.save(finded)).ativo;
  }

  async exportPdf(
    idUsuario: number,
    order: IFindAllOrder,
    filter?: IFindAllFilter | IFindAllFilter[],
  ): Promise<boolean> {
    try {
      const where = handleFilter(filter);

      const size = 100;
      let page = 0;

      const reportData: Pessoa[] = [];

      let reportDataTemp: Pessoa[] = [];

      do {
        reportDataTemp = await this.repository.find({
          select: ['id', 'nome', 'telefone', 'ativo'],
          order: {
            [order.column]: order.sort,
          },
          where,
          skip: size * page,
          take: size,
        });

        reportData.push(...reportDataTemp);
        page++;
      } while (reportDataTemp.length === size);

      const filePath = await this.exportPdfService.export(
        'Listagem de Pessoas',
        idUsuario,
        {
          columnStyles: {
            3: { halign: 'center' },
          },
          columns: ['Código', 'Nome', 'Telefone', 'Ativo'],
          body: reportData.map((pessoa) => [
            pessoa.id,
            pessoa.nome,
            mobilePhoneFormat(pessoa.telefone),
            pessoa.ativo ? 'Sim' : 'Não',
          ]),
        },
      );

      const filename = filePath.split('/').pop();
      const filedata = readFileSync(filePath);
      const base64 = filedata.toString('base64');

      const usuario = await this.getUsuarioFromGrpc(idUsuario);

      if (usuario.id === 0) {
        throw new HttpException(
          EMensagem.UsuarioNaoIdentificado,
          HttpStatus.NOT_ACCEPTABLE,
        );
      }

      const data: EnviarEmailDto = {
        subject: 'Exportação de Relatório',
        to: usuario.email,
        template: 'exportacao-relatorio',
        context: {
          name: usuario.nome,
        },
        attachments: [{ filename, base64 }],
      };

      this.mailService.emit('enviar-email', data);

      return true;
    } catch (error) {
      this.logger.error(`Erro ao gerar relatorio pdf: ${error}`);

      throw new HttpException(
        EMensagem.ErroExportarPDF,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  private async getUsuarioFromGrpc(id: number): Promise<IUsuario> {
    try {
      return (await lastValueFrom(
        this.grpcUsuarioService.FindOne({ id }),
      )) as unknown as IUsuario;
    } catch (error) {
      this.logger.error(`Erro comunicação gRPC - APIUsuario: ${error}`);
      throw new HttpException(
        EMensagem.ErroComunicacaoGrpcUsuario,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
