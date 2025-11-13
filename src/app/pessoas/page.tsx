// app/pessoas/novo/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import styles from './page.module.css';
import { FiHome, FiUser, FiFileText } from "react-icons/fi";
import { MdLocationCity } from "react-icons/md";
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function NovaPessoaPage() {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!cpfCnpj || !nome) {
      setErro('Preencha CPF/CNPJ e nome.');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/pessoas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf_cnpj: cpfCnpj.replace(/\D/g, ''), // deixa só dígitos
          nome,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);

        // trata mensagens do ValidationPipe ou do filtro do Prisma
        if (data?.message) {
          const msg =
            Array.isArray(data.message) ? data.message.join(' | ') : data.message;
          throw new Error(msg);
        }

        throw new Error('Erro ao salvar pessoa.');
      }

      setSucesso('Pessoa cadastrada com sucesso!');
      setCpfCnpj('');
      setNome('');
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro ao salvar pessoa.');
    } finally {
      setLoading(false);
    }
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
        <h1 className={styles.title}>Cadastrar Pessoa</h1>
        <p className={styles.subtitle}>
          Preencha os dados da pessoa. Ela poderá ser usada como locador e/ou locatário.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            CPF / CNPJ
            <input
              type="text"
              className={styles.input}
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              placeholder="Somente números"
            />
          </label>

          <label className={styles.label}>
            Nome completo
            <input
              type="text"
              className={styles.input}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da pessoa"
            />
          </label>

          {erro && <p className={styles.error}>{erro}</p>}
          {sucesso && <p className={styles.success}>{sucesso}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar pessoa'}
          </button>
        </form>
      </div>
    </main>
  );
}
