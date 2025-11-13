// app/apolices/page.tsx
'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import styles from './page.module.css';
import type { Pessoa, Imovel } from '@/types/busca';
import Select from 'react-select';
import { FiHome, FiUser, FiFileText } from "react-icons/fi";
import { MdLocationCity } from "react-icons/md";
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function toIsoOrNull(value: string): string | null {
  if (!value) return null; // campo vazio -> null
  // value vem no formato 'YYYY-MM-DD' do <input type="date">
  return new Date(value).toISOString();
}

export default function NovaApolicePage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);

  const [imovelId, setImovelId] = useState<number | ''>('');
  const [locatarioId, setLocatarioId] = useState<number | ''>('');

  const [numeroApolice, setNumeroApolice] = useState('');
  const [numeroProposta, setNumeroProposta] = useState('');
  const [seguradora, setSeguradora] = useState('');
  const [status, setStatus] = useState<'ATIVA' | 'VENCIDA'>('ATIVA');

  const [dataEmissao, setDataEmissao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [parcelamento, setParcelamento] = useState('');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [arquivos, setArquivos] = useState<File[]>([]);

  const locatarioOptions = pessoas.map((pessoa) => ({
    value: pessoa.id_pessoa,
    label: `${pessoa.nome} (${pessoa.cpf_cnpj})`,
  }));

  const imovelOptions = imoveis.map((imovel) => ({
    value: imovel.id_imovel,
    label: `#${imovel.codigo_visual} - ${imovel.nome_imovel} - CEP:${imovel.cep}`,
  }));

  // Carregar imóveis e pessoas
  useEffect(() => {
    async function fetchDados() {
      try {
        const [resImoveis, resPessoas] = await Promise.all([
          fetch(`${API_URL}/imoveis`),
          fetch(`${API_URL}/pessoas`),
        ]);

        if (!resImoveis.ok || !resPessoas.ok) {
          throw new Error('Erro ao carregar dados para apólice.');
        }

        const imoveisData: Imovel[] = await resImoveis.json();
        const pessoasData: Pessoa[] = await resPessoas.json();

        setImoveis(imoveisData);
        setPessoas(pessoasData);
      } catch (err) {
        console.error(err);
        setErro('Erro ao carregar imóveis e pessoas.');
      }
    }

    fetchDados();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!imovelId || !locatarioId || !numeroApolice || !seguradora || !status) {
      setErro('Preencha os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/apolices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero_apolice: numeroApolice,
          numero_proposta: numeroProposta || undefined,
          seguradora,
          status, // 'ATIVA' ou 'VENCIDA'
          data_emissao: toIsoOrNull(dataEmissao),
          data_vencimento: toIsoOrNull(dataVencimento),
          data_pagamento: toIsoOrNull(dataPagamento),
          parcelamento: parcelamento ? Number(parcelamento) : null,
          id_imovel: Number(imovelId),
          id_locatario: Number(locatarioId),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.message) {
          const msg =
            Array.isArray(data.message) ? data.message.join(' | ') : data.message;
          throw new Error(msg);
        }
        throw new Error('Erro ao salvar apólice.');
      }

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      console.log('Resposta da criação de apólice:', body);

      const apoliceId =
        body?.id_apolice ??
        body?.id ??
        body?.apoliceId ??
        null;

      if (!apoliceId) {
        setSucesso('Apólice cadastrada, mas não foi possível enviar anexos (sem id da apólice na resposta).');
        setImovelId('');
        setLocatarioId('');
        setNumeroApolice('');
        setNumeroProposta('');
        setSeguradora('');
        setStatus('ATIVA');
        setDataEmissao('');
        setDataVencimento('');
        setDataPagamento('');
        setParcelamento('');
        setArquivos([]);
        return;
      }

      // Se tiver arquivos selecionados, faz upload de cada um
      if (arquivos.length > 0) {
        for (const file of arquivos) {
          const formData = new FormData();
          formData.append('arquivo', file);

          const upRes = await fetch(
            `${API_URL}/apolices/${apoliceId}/anexos`,
            {
              method: 'POST',
              body: formData,
            },
          );

          if (!upRes.ok) {
            const texto = await upRes.text().catch(() => '');
            console.error('Erro upload anexo:', upRes.status, texto);
            throw new Error('Erro ao enviar um ou mais anexos.');
          }
        }
      }

      setSucesso(
        arquivos.length > 0
          ? 'Apólice cadastrada e anexos enviados com sucesso!'
          : 'Apólice cadastrada com sucesso!',
      );

      // limpa formulário
      setImovelId('');
      setLocatarioId('');
      setNumeroApolice('');
      setNumeroProposta('');
      setSeguradora('');
      setStatus('ATIVA');
      setDataEmissao('');
      setDataVencimento('');
      setDataPagamento('');
      setParcelamento('');
      setArquivos([]);
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro ao salvar apólice.');
    } finally {
      setLoading(false);
    }
  }

  function removerArquivo(index: number) {
    setArquivos((prev) => {
      const novos = prev.filter((_, i) => i !== index);
      console.log('Anexo removido. Lista atual:', novos.map(f => f.name));
      return novos;
    })
  }

  function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    console.log('[FILE PICKED]', files.length, Array.from(files).map(f => f.name));
    setArquivos(prev => [...prev, ...Array.from(files)]);
  }

  function handleBeforeOpen(e: React.MouseEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    input.value = ''; // garante que o usuário pode escolher o mesmo arquivo novamente
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  function abrirSeletorArquivos() {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  }

  return (
    <main className={styles.main}>
      {/* Botões de navegação */}
      <div className={styles.navButtons}>
        <Link href="/" className={styles.navBtn}>
          <FiHome />
          <span>Home</span>
        </Link>

        <Link href="/pessoas" className={styles.navBtn}>
          <FiUser />
          <span>Cadastrar Pessoas</span>
        </Link>

        <Link href="/imoveis" className={styles.navBtn}>
          <MdLocationCity />
          <span>Cadastrar Imóveis</span>
        </Link>

        <Link href="/apolices" className={styles.navBtn}>
          <FiFileText />
          <span>Cadastrar Apólices</span>
        </Link>
      </div>
      <div className={styles.card}>
        <h1 className={styles.title}>Cadastrar Apólice</h1>
        <p className={styles.subtitle}>
          Preencha os dados da apólice, selecione o imóvel e o locatário já cadastrados.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.grid2}>
            <label className={styles.label}>
              Imóvel
              <Select
                classNamePrefix="react-select"
                options={imovelOptions}
                placeholder="Digite para buscar o imóvel..."
                value={imovelOptions.find((opt) => opt.value === imovelId) || null}
                onChange={(opt) => setImovelId(opt ? opt.value : '')}
                isClearable
              />
            </label>

            <label className={styles.label}>
              Locatário
              <Select
                classNamePrefix="react-select"
                options={locatarioOptions}
                placeholder="Digite para buscar o locatário..."
                value={locatarioOptions.find((opt) => opt.value === locatarioId) || null}
                onChange={(opt) => setLocatarioId(opt ? opt.value : '')}
                isClearable
              />
            </label>
          </div>

          <div className={styles.grid2}>
            <label className={styles.label}>
              Nº Apólice
              <input
                className={styles.input}
                type="text"
                value={numeroApolice}
                onChange={(e) => setNumeroApolice(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              Nº Proposta
              <input
                className={styles.input}
                type="text"
                value={numeroProposta}
                onChange={(e) => setNumeroProposta(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.grid2}>
            <label className={styles.label}>
              Seguradora
              <input
                className={styles.input}
                type="text"
                value={seguradora}
                onChange={(e) => setSeguradora(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              Status
              <select
                className={styles.input}
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ATIVA' | 'VENCIDA')}
              >
                <option value="ATIVA">Ativa</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </label>
          </div>

          <div className={styles.grid3}>
            <label className={styles.label}>
              Emissão
              <input
                className={styles.input}
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              Vencimento
              <input
                className={styles.input}
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              Pagamento
              <input
                className={styles.input}
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </label>
          </div>

          <label className={styles.label}>
            Parcelamento (nº de parcelas)
            <input
              className={styles.input}
              type="number"
              min={1}
              value={parcelamento}
              onChange={(e) => setParcelamento(e.target.value)}
            />
          </label>
          {/* Campo de anexos */}
          <div className={styles.fileField}>
            <span className={styles.labelText}>Anexos (opcional)</span>

            {/* input nativo escondido */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className={styles.hiddenFile}
              onChange={handlePickFiles}
            />

            {/* botão centralizado que abre o seletor */}
            <button
              type="button"
              className={styles.pickBtn}
              onClick={abrirSeletorArquivos}
              disabled={loading}
            >
              Escolher arquivos
            </button>

            {/* lista centralizada dos anexos selecionados */}
            {arquivos.length > 0 && (
              <ul className={styles.anexosPreview}>
                {arquivos.map((file, index) => (
                  <li key={file.name + index} className={styles.anexoPreviewItem}>
                    <span className={styles.anexoName}>{file.name}</span>
                    <button
                      type="button"
                      className={styles.removeAnexoBtn}
                      onClick={() =>
                        setArquivos(prev => {
                          const novos = prev.filter((_, i) => i !== index);
                          console.log('Anexo removido. Lista atual:', novos.map(f => f.name));
                          return novos;
                        })
                      }
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {erro && <p className={styles.error}>{erro}</p>}
          {sucesso && <p className={styles.success}>{sucesso}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar apólice'}
          </button>
        </form>
      </div>
    </main>
  );
}
