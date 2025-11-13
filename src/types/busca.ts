// app/types/busca.ts

export interface Pessoa {
  id_pessoa: number;
  cpf_cnpj: string;
  nome: string;
}

export interface Imovel {
  id_imovel: number;
  codigo_visual: string;
  nome_imovel: string;
  cep: string;
}

export interface ApoliceAtual {
  id_apolice: number;
  numero_apolice: string;
  numero_proposta?: string | null;
  seguradora: string;
  data_emissao?: string | null;
  data_vencimento?: string | null;
  status: string;
  data_pagamento?: string | null;
  parcelamento?: number | null;
  qtdAnexos: number;
}

export interface ResultadoBusca {
  imovel: Imovel;
  locador: Pessoa;
  locatario: Pessoa;
  apoliceAtual: ApoliceAtual;
}
