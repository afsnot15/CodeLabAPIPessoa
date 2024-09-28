import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { HttpResponse } from '../../shared/classes/http-response';
import { EMensagem } from '../../shared/enums/mensagem.enum';
import { IFindAllFilter } from '../../shared/interfaces/find-all-filter.interface';
import { IFindAllOrder } from '../../shared/interfaces/find-all-order.interface';
import { IResponse } from '../../shared/interfaces/response.interface';
import { ParseFindAllFilter } from '../../shared/pipes/parse-find-all-filter.pipe';
import { ParseFindAllOrder } from '../../shared/pipes/parse-find-all-order.pipe';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { Pessoa } from './entities/pessoa.entity';
import { PessoaService } from './pessoa.service';

@Controller('pessoa')
export class PessoaController {
  constructor(private readonly pessoaService: PessoaService) {}

  @Post()
  async create(
    @Body() createPessoaDto: CreatePessoaDto,
  ): Promise<IResponse<Pessoa>> {
    const data = await this.pessoaService.create(createPessoaDto);

    return new HttpResponse<Pessoa>(data).onCreated();
  }

  @Get(':page/:size/:order')
  async findAll(
    @Param('page') page: number,
    @Param('size') size: number,
    @Param('order', ParseFindAllOrder) order: IFindAllOrder,
    @Query('filter', ParseFindAllFilter)
    filter?: IFindAllFilter | IFindAllFilter[],
  ): Promise<IResponse<Pessoa[]>> {
    const { data, count } = await this.pessoaService.findAll(
      page,
      size,
      order,
      filter,
    );

    return new HttpResponse<Pessoa[]>(data, undefined, count);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<IResponse<Pessoa>> {
    const data = await this.pessoaService.findOne(+id);

    return new HttpResponse<Pessoa>(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updatePessoaDto: UpdatePessoaDto,
  ): Promise<IResponse<Pessoa>> {
    const data = await this.pessoaService.update(+id, updatePessoaDto);

    return new HttpResponse<Pessoa>(data).onUpdated();
  }

  @Delete(':id')
  async unactivate(@Param('id') id: number): Promise<IResponse<boolean>> {
    const data = await this.pessoaService.unactivate(+id);

    return new HttpResponse<boolean>(data).onUnactivated();
  }

  @Get('export/pdf/:idUsuario/:order')
  async exportPdf(
    @Param('idUsuario') idUsuario: number,
    @Param('order', ParseFindAllOrder) order: IFindAllOrder,
    @Query('filter', ParseFindAllFilter)
    filter?: IFindAllFilter | IFindAllFilter[],
  ): Promise<IResponse<boolean>> {
    const data = await this.pessoaService.exportPdf(idUsuario, order, filter);

    return new HttpResponse<boolean>(data).onSuccess(
      EMensagem.IniciadaGeracaoPDF,
    );
  }
}
