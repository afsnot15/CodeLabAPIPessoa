import { Test, TestingModule } from '@nestjs/testing';
import { EMensagem } from '../../shared/enums/mensagem.enum';
import { IFindAllOrder } from '../../shared/interfaces/find-all-order.interface';
import { PessoaController } from './pessoa.controller';
import { PessoaService } from './pessoa.service';

describe('PessoaController', () => {
  let controller: PessoaController;
  let service: PessoaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PessoaController],
      providers: [
        {
          provide: PessoaService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            unactivate: jest.fn(),
            exportPdf: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PessoaController>(PessoaController);
    service = module.get<PessoaService>(PessoaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('criar um novo registro', async () => {
      const createPessoaDto = {
        nome: 'Nome Teste',
        documento: '123456789',
        cep: '123456',
        endereco: 'Rua 1234',
        telefone: '12345-4667',
        ativo: true,
      };

      const mockPessoa = Object.assign(createPessoaDto, { id: 1 });

      const spyServiceCreate = jest
        .spyOn(service, 'create')
        .mockReturnValue(Promise.resolve(mockPessoa) as any);

      const response = await controller.create(createPessoaDto);

      expect(response.message).toEqual(EMensagem.SalvoSucesso);
      expect(response.data).toEqual(mockPessoa);
      expect(spyServiceCreate).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('obter uma listagem de pessoas', async () => {
      const mockListaPessoa = [
        {
          nome: 'Nome Teste',
          documento: '123456789',
          cep: '123456',
          endereco: 'Rua 1234',
          telefone: '12345-4667',
          ativo: true,
        },
      ];

      const spyServiceFindAll = jest.spyOn(service, 'findAll').mockReturnValue(
        Promise.resolve({
          data: mockListaPessoa,
          count: 1,
          message: null,
        }) as any,
      );

      const order: IFindAllOrder = { column: 'id', sort: 'asc' };

      const response = await controller.findAll(1, 10, order);

      expect(response.message).toEqual(undefined);
      expect(response.data).toEqual(mockListaPessoa);
      expect(spyServiceFindAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('obter uma pessoa', async () => {
      const mockPessoa = {
        nome: 'Nome Teste',
        documento: '123456789',
        cep: '123456',
        endereco: 'Rua 1234',
        telefone: '12345-4667',
        ativo: true,
      };
      const spyServiceFindOne = jest
        .spyOn(service, 'findOne')
        .mockReturnValue(Promise.resolve(mockPessoa) as any);

      const response = await controller.findOne(1);

      expect(response.message).toEqual(undefined);
      expect(response.data).toEqual(mockPessoa);
      expect(spyServiceFindOne).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('alterar uma pessoa', async () => {
      const mockPessoa = {
        id: 1,
        nome: 'Nome Teste',
        documento: '123456789',
        cep: '123456',
        endereco: 'Rua 1234',
        telefone: '12345-4667',
        ativo: true,
      };

      const spyServiceUpdate = jest
        .spyOn(service, 'update')
        .mockReturnValue(Promise.resolve(mockPessoa) as any);

      const response = await controller.update(1, mockPessoa);

      expect(response.message).toEqual(EMensagem.AtualizadoSucesso);
      expect(response.data).toEqual(mockPessoa);
      expect(spyServiceUpdate).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletar uma pessoa', async () => {
      const spyServiceUpdate = jest
        .spyOn(service, 'unactivate')
        .mockReturnValue(Promise.resolve(false) as any);

      const response = await controller.unactivate(1);

      expect(response.message).toEqual(EMensagem.DesativadoSucesso);
      expect(response.data).toEqual(false);
      expect(spyServiceUpdate).toHaveBeenCalled();
    });
  });

  describe('exportPdf', () => {
    it('exportar relatorio pdf', async () => {
      const spyServiceExportPdf = jest
        .spyOn(service, 'exportPdf')
        .mockReturnValue(Promise.resolve(true) as any);

      const order: IFindAllOrder = { column: 'id', sort: 'asc' };

      const response = await controller.exportPdf(1, order);

      expect(spyServiceExportPdf).toHaveBeenCalled();
      expect(response.message).toEqual(EMensagem.IniciadaGeracaoPDF);
    });
  });
});
