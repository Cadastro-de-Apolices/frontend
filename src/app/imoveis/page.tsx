'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import type { Pessoa } from '@/types/busca';
import { FiHome, FiUser, FiFileText } from "react-icons/fi";
import { MdLocationCity } from "react-icons/md";
import Select from 'react-select';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function NovoImovelPage() {
  const [nomeImovel, setNomeImovel] = useState('');
  const [cep, setCep] = useState('');
  const [locadores, setLocadores] = useState<Pessoa[]>([]);
  const [locadorId, setLocadorId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [filtroLocador, setFiltroLocador] = useState('');

  useEffect(() => {
    async function fetchLocadores() {
      try {
        const res = await fetch(`${API_URL}/pessoas`);
        if (!res.ok) throw new Error('Erro ao buscar pessoas.');
        const data: Pessoa[] = await res.json();
        setLocadores(data);
      } catch (err) {
        console.error(err);
        setErro('Erro ao carregar lista de pessoas (locadores).');
      }
    }

    fetchLocadores();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!nomeImovel || !cep || !locadorId) {
      setErro('Preencha todos os campos e selecione um locador.');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/imoveis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_imovel: nomeImovel,
          cep: cep.replace(/\D/g, ''),
          id_locador: Number(locadorId),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.message) {
          const msg =
            Array.isArray(data.message) ? data.message.join(' | ') : data.message;
          throw new Error(msg);
        }
        throw new Error('Erro ao salvar imóvel.');
      }

      setSucesso('Imóvel cadastrado com sucesso!');
      setNomeImovel('');
      setCep('');
      setLocadorId('');
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro ao salvar imóvel.');
    } finally {
      setLoading(false);
    }
  }

  const locadorOptions = locadores.map((pessoa) => ({
    value: pessoa.id_pessoa,
    label: `${pessoa.nome} (${pessoa.cpf_cnpj})`,
  }));

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
        <h1 className={styles.title}>Cadastrar Imóvel</h1>
        <p className={styles.subtitle}>
          Informe os dados do imóvel e selecione o locador responsável já cadastrado.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Nome do imóvel
            <input
              type="text"
              className={styles.input}
              value={nomeImovel}
              onChange={(e) => setNomeImovel(e.target.value)}
              placeholder="Ex.: Apartamento Centro 101"
            />
          </label>

          <label className={styles.label}>
            CEP
            <input
              type="text"
              className={styles.input}
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              placeholder="Somente números"
            />
          </label>

          <label className={styles.label}>
            Locador
            <Select
              classNamePrefix="react-select"
              options={locadorOptions}
              placeholder="Digite para buscar o locador..."
              value={locadorOptions.find((opt) => opt.value === locadorId) || null}
              onChange={(opt) => setLocadorId(opt ? opt.value : '')}
              isClearable
            />
          </label>

          {erro && <p className={styles.error}>{erro}</p>}
          {sucesso && <p className={styles.success}>{sucesso}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar imóvel'}
          </button>
        </form>
      </div>
    </main>
  );
}
