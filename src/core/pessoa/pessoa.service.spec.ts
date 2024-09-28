import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import { EMensagem } from '../../shared/enums/mensagem.enum';
import { IFindAllOrder } from '../../shared/interfaces/find-all-order.interface';
import { ExportPdfService } from '../../shared/services/export-pdf.service';
import { Pessoa } from './entities/pessoa.entity';
import { PessoaService } from './pessoa.service';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

describe('PessoaService', () => {
  let service: PessoaService;
  let repository: Repository<Pessoa>;

  const mockGrpcUsuarioService = {
    FindOne: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockGrpcUsuarioService),
  };

  const mockExportPdfService = {
    export: jest.fn(),
  };

  const mockMailService = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PessoaService,
        {
          provide: getRepositoryToken(Pessoa),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: 'GRPC_USUARIO',
          useValue: mockClientGrpc,
        },
        {
          provide: ExportPdfService,
          useValue: mockExportPdfService,
        },
        {
          provide: 'MAIL_SERVICE',
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<PessoaService>(PessoaService);

    repository = module.get<Repository<Pessoa>>(getRepositoryToken(Pessoa));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      const spyRepositorySave = jest
        .spyOn(repository, 'save')
        .mockReturnValue(Promise.resolve(mockPessoa) as any);

      const response = await service.create(createPessoaDto);

      expect(response).toEqual(mockPessoa);
      expect(spyRepositorySave).toHaveBeenCalled();
    });

    it('lançar erro ao repetir um email quando criar um novo pessoa', async () => {
      const createPessoaDto = {
        nome: 'Nome Teste',
        documento: '123456789',
        cep: '123456',
        endereco: 'Rua 1234',
        telefone: '12345-4667',
        ativo: true,
      };

      const mockPessoa = Object.assign(createPessoaDto, { id: 1 });

      const spyRepositoryFindOne = jest
        .spyOn(repository, 'findOne')
        .mockReturnValue(Promise.resolve(mockPessoa) as any);

      try {
        await service.create(createPessoaDto);
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe(EMensagem.ImpossivelCadastrar);
        expect(spyRepositoryFindOne).toHaveBeenCalled();
      }
    });
  });

  describe('findAll', () => {
    it('obter uma listagem de pessoas', async () => {
      const mockListaPessoa = [
        {
          id: 1,
          nome: 'Nome Teste',
          documento: '123456789',
          cep: '123456',
          endereco: 'Rua 1234',
          telefone: '12345-4667',
          ativo: true,
        },
      ];

      const resultExpected = {
        count: 1,
        data: mockListaPessoa,
        message: null,
      };

      const spyRepositoryFindAndCount = jest
        .spyOn(repository, 'findAndCount')
        .mockReturnValue(Promise.resolve([mockListaPessoa, 1]) as any);

      const order: IFindAllOrder = { column: 'id', sort: 'asc' };

      const response = await service.findAll(1, 10, order);

      console.log(response);

      expect(response).toEqual(resultExpected);
      expect(spyRepositoryFindAndCount).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('obter uma pessoa', async () => {
      const mockPessoa = {
        id: 1,
        nome: 'Nome Teste',
        email: 'nome.teste@teste.com',
        senha: '123456',
        ativo: true,
        admin: true,
        permissao: [],
      };

      const spyRepositoryFindOne = jest
        .spyOn(repository, 'findOne')
        .mockReturnValue(Promise.resolve(mockPessoa) as any);

      const response = await service.findOne(1);

      expect(response).toEqual(mockPessoa);
      expect(spyRepositoryFindOne).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('alterar pessoa', async () => {
      const updatePessoaDto = {
        id: 1,
        nome: 'Nome Teste',
        documento: '123456789',
        cep: '123456',
        endereco: 'Rua 1234',
        telefone: '12345-4667',
        ativo: true,
      };

      const mockPessoa = Object.assign(updatePessoaDto, {});

      const spyRepositorySave = jest
        .spyOn(repository, 'save')
        .mockReturnValue(Promise.resolve(mockPessoa) as any);

      const response = await service.update(1, updatePessoaDto);

      expect(response).toEqual(updatePessoaDto);
      expect(spyRepositorySave).toHaveBeenCalled();
    });

    it('lançar erro ao enviar ids diferentes quando alterar um pessoa', async () => {
      const updatePessoaDto = {
        id: 1,
        nome: 'Nome Teste',
        documento: '123456789',
        cep: '123456',
        endereco: 'Rua 1234',
        telefone: '12345-4667',
        ativo: true,
      };

      try {
        await service.update(2, updatePessoaDto);
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe(EMensagem.IDsDiferentes);
      }
    });

    it('lançar erro ao repetir um email já utilizado quando alterar um pessoa', async () => {
      const updatePessoaDto = {
        id: 1,
        nome: 'Nome Teste',
        documento: '123456789',
        cep: '123456',
        endereco: 'Rua 1234',
        telefone: '12345-4667',
        ativo: true,
      };

      const mockPessoaFindOne = {
        id: 2,
        nome: 'Nome Teste',
        documento: '123456789',
        cep: '123456',
        endereco: 'Rua 1234',
        telefone: '12345-4667',
        ativo: true,
      };

      const spyRepositoryFindOne = jest
        .spyOn(repository, 'findOne')
        .mockReturnValue(Promise.resolve(mockPessoaFindOne) as any);

      try {
        await service.update(1, updatePessoaDto);
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe(EMensagem.ImpossivelAlterar);
        expect(spyRepositoryFindOne).toHaveBeenCalled();
      }
    });
  });

  describe('unactivate', () => {
    it('desativar uma pessoa', async () => {
      const mockPessoaFindOne = {
        id: 1,
        nome: 'Nome Teste',
        documento: '123456789',
        cep: '123456',
        endereco: 'Rua 1234',
        telefone: '12345-4667',
        ativo: true,
      };

      const spyRepositoryFindOne = jest
        .spyOn(repository, 'findOne')
        .mockReturnValue(Promise.resolve(mockPessoaFindOne) as any);

      const mockPessoaSave = Object.assign(mockPessoaFindOne, {
        ativo: false,
      });

      const spyRepositorySave = jest
        .spyOn(repository, 'save')
        .mockReturnValue(Promise.resolve(mockPessoaSave) as any);

      const response = await service.unactivate(1);

      expect(response).toEqual(false);
      expect(spyRepositoryFindOne).toHaveBeenCalled();
      expect(spyRepositorySave).toHaveBeenCalled();
    });

    it('lançar erro ao não encontrar o pessoa usando o id quando alterar um pessoa', async () => {
      const spyRepositoryFindOne = jest
        .spyOn(repository, 'findOne')
        .mockReturnValue(Promise.resolve(null) as any);

      try {
        await service.unactivate(1);
      } catch (error: any) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe(EMensagem.ImpossivelAlterar);
        expect(spyRepositoryFindOne).toHaveBeenCalled();
      }
    });
  });

  describe('exportPdf', () => {
    it('deve exportar um PDF e enviar um email', async () => {
      const idUsuario = 1;
      const order: IFindAllOrder = { column: 'id', sort: 'asc' };

      const mockPessoaData = [
        {
          id: 1,
          nome: 'Nome Teste',
          documento: '123456789',
          cep: '123456',
          endereco: 'Rua 1234',
          telefone: '12345-4667',
          ativo: true,
        },
        {
          id: 2,
          nome: 'Nome Teste 2',
          documento: '123456789',
          cep: '123456',
          endereco: 'Rua 1234',
          telefone: '12345-4667',
          ativo: true,
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValueOnce(mockPessoaData);
      jest
        .spyOn(mockExportPdfService, 'export')
        .mockResolvedValueOnce('/caminho/para/o/arquivo.pdf');

      jest.spyOn(mockMailService, 'emit').mockImplementation(() => {});
      const mockFileData = Buffer.from('fake file data');
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileData);

      const result = await service.exportPdf(idUsuario, order);

      expect(result).toBe(true);
      expect(mockExportPdfService.export).toHaveBeenCalled();
      expect(mockMailService.emit).toHaveBeenCalled();
    });
  });
});
