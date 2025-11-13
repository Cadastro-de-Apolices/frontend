// app/page.tsx
'use client';

import { FormEvent, useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';
import Link from 'next/link';
import { FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FiHome, FiUser, FiFileText } from "react-icons/fi";
import { MdLocationCity } from "react-icons/md";
import type { ResultadoBusca, Pessoa, Imovel, ApoliceAtual } from '@/types/busca';
import Select from 'react-select';
import { getUser } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type EditType = 'pessoa' | 'imovel' | 'apolice' | null;
type OrdenarPor = 'data_vencimento' | 'data_emissao' | null;
type Option = {
  value: string;
  label: string;
};
type Anexo = {
  id_anexo: number;
  nome_arquivo: string;
  caminho: string;
  content_type?: string | null;
  tamanho_bytes?: number | null;
  criado_em: string;
};
type ViewMode = 'apolices' | 'imoveis' | 'pessoas';


export default function HomePage() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<'todas' | 'ativas' | 'vencidas'>('todas');
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const isAdmin = user?.role === "admin";
  const [viewMode, setViewMode] = useState<ViewMode>('apolices');
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [anexosApoliceId, setAnexosApoliceId] = useState<number | null>(null);

  // modal de edição
  type EditPessoaCtx = {
    tipo: 'locador' | 'locatario';
    apoliceId: number;
    pessoaAtual: Pessoa;
  };

  type EditImovelCtx = {
    apoliceId: number;
    imovelAtual: Imovel;
  };

  // modal de edição
  const [editType, setEditType] = useState<EditType>(null);
  const [editPessoaCtx, setEditPessoaCtx] = useState<EditPessoaCtx | null>(null);
  const [editImovelCtx, setEditImovelCtx] = useState<EditImovelCtx | null>(null);
  const [editApolice, setEditApolice] = useState<ApoliceAtual | null>(null);


  useEffect(() => {
    if (viewMode === 'apolices') {
      carregarRecentes();
    } else if (viewMode === 'pessoas') {
      carregarPessoas();
    } else if (viewMode === 'imoveis') {
      carregarImoveis();
    }
  }, [viewMode]);

  useEffect(() => {
  (async () => {
    const u = await getUser();
    setUser(u);
  })();
}, []);

  async function carregarRecentes() {
    try {
      setLoading(true);
      setErro(null);

      const res = await fetch(`${API_URL}/apolices`);
      if (!res.ok) throw new Error('Erro ao buscar apólices recentes.');

      const data = await res.json();

      // Normaliza para o formato ResultadoBusca
      const normalizado: ResultadoBusca[] = data.map((ap: any) => ({
        imovel: {
          id_imovel: ap.imovel.id_imovel,
          codigo_visual: ap.imovel.codigo_visual,
          nome_imovel: ap.imovel.nome_imovel,
          cep: ap.imovel.cep,
        },
        locador: ap.imovel.locador,
        locatario: ap.locatario,
        apoliceAtual: {
          id_apolice: ap.id_apolice,
          numero_apolice: ap.numero_apolice,
          numero_proposta: ap.numero_proposta,
          seguradora: ap.seguradora,
          data_emissao: ap.data_emissao,
          data_vencimento: ap.data_vencimento,
          status: ap.status,
          data_pagamento: ap.data_pagamento,
          parcelamento: ap.parcelamento,
          qtdAnexos: ap._count?.anexos ?? 0,
        },
      }));

      // ordena da mais recente pra mais antiga por data_vencimento
      normalizado.sort((a, b) => {
        const da = a.apoliceAtual.data_vencimento
          ? new Date(a.apoliceAtual.data_vencimento).getTime()
          : 0;
        const db = b.apoliceAtual.data_vencimento
          ? new Date(b.apoliceAtual.data_vencimento).getTime()
          : 0;
        return db - da;
      });

      setResultados(normalizado);
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao carregar recentes.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarPessoas() {
    try {
      setLoading(true);
      setErro(null);

      const res = await fetch(`${API_URL}/pessoas`);
      if (!res.ok) throw new Error('Erro ao carregar pessoas.');

      const data: Pessoa[] = await res.json();
      setPessoas(data);
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao carregar pessoas.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarImoveis() {
    try {
      setLoading(true);
      setErro(null);

      const res = await fetch(`${API_URL}/imoveis`);
      if (!res.ok) throw new Error('Erro ao carregar imóveis.');

      const data: Imovel[] = await res.json();
      setImoveis(data);
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao carregar imóveis.');
    } finally {
      setLoading(false);
    }
  }

  const atualizarQtdAnexos = useCallback(
    (apoliceId: number, novaQtd: number) => {
      setResultados((prev) =>
        prev.map((r) =>
          r.apoliceAtual.id_apolice === apoliceId
            ? {
              ...r,
              apoliceAtual: {
                ...r.apoliceAtual,
                qtdAnexos: novaQtd,
              },
            }
            : r,
        ),
      );
    },
    [],
  );

  async function buscar(e?: FormEvent) {
    e?.preventDefault();
    setErro(null);

    if (!termo.trim()) {
      await carregarRecentes();
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/apolices/busca?termo=${encodeURIComponent(termo.trim())}`,
      );
      if (!res.ok) throw new Error('Erro ao buscar apólices.');

      const data: ResultadoBusca[] = await res.json();
      setResultados(data);
      if (data.length === 0) {
        setErro('Nenhum resultado encontrado.');
      }
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao buscar.');
    } finally {
      setLoading(false);
    }
  }

  const apolicesFiltradas = resultados
    .filter((r) => {
      const status = r.apoliceAtual.status;
      if (statusFiltro === 'ativas') return status === 'ATIVA';
      if (statusFiltro === 'vencidas') return status === 'VENCIDA';
      return true; // todas
    })
    .filter((r) => {
      // se o usuário escolheu ordenar por data e não filtrou explicitamente,
      // esconde vencidas
      if (!ordenarPor) return true;
      if (statusFiltro === 'todas') {
        return r.apoliceAtual.status === 'ATIVA';
      }
      return true;
    })
    .sort((a, b) => {
      if (!ordenarPor) return 0;

      const valorA = a.apoliceAtual[ordenarPor];
      const valorB = b.apoliceAtual[ordenarPor];

      const dataA = valorA ? new Date(valorA).getTime() : 0;
      const dataB = valorB ? new Date(valorB).getTime() : 0;

      return dataA - dataB; // crescente
    });

  async function deletarApolice(id: number) {
    if (!confirm('Excluir essa apólice?')) return;
    try {
      await fetch(`${API_URL}/apolices/${id}`, { method: 'DELETE' });
      setResultados((prev) =>
        prev.filter((r) => r.apoliceAtual.id_apolice !== id),
      );
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir apólice.');
    }
  }

  async function deletarPessoa(id: number) {
    if (!confirm('Excluir essa pessoa?')) return;
    try {
      const res = await fetch(`${API_URL}/pessoas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir pessoa.');
      setPessoas((prev) => prev.filter((p) => p.id_pessoa !== id));
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir pessoa.');
    }
  }

  async function deletarImovel(id: number) {
    if (!confirm('Excluir esse imóvel?')) return;
    try {
      const res = await fetch(`${API_URL}/imoveis/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir imóvel.');
      setImoveis((prev) => prev.filter((i) => i.id_imovel !== id));
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir imóvel.');
    }
  }

  function abrirEditarPessoa(
    tipo: 'locador' | 'locatario',
    apoliceId: number,
    pessoa: Pessoa,
  ) {
    setEditPessoaCtx({ tipo, apoliceId, pessoaAtual: pessoa });
    setEditType('pessoa');
  }

  function abrirEditarImovel(apoliceId: number, imovel: Imovel) {
    setEditImovelCtx({ apoliceId, imovelAtual: imovel });
    setEditType('imovel');
  }

  function abrirEditarApolice(a: ApoliceAtual) {
    setEditApolice(a);
    setEditType('apolice');
  }

  function fecharModal() {
    setEditType(null);
    setEditPessoaCtx(null);
    setEditImovelCtx(null);
    setEditApolice(null);
  }


  async function handleSaved() {
    fecharModal();
    // recarrega dados (pode ser mais fino depois)
    await (termo.trim() ? buscar() : carregarRecentes());
  }

  return (
    <main className={styles.main}>
      {/* HEADER */}
      <section className={styles.header}>
        <h1 className={styles.title}>Buscar Apólices</h1>
        <form className={styles.searchBar} onSubmit={buscar}>
          <input
            type="text"
            placeholder="Número da apólice, nome do imóvel, código ou CPF/CNPJ..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
          <button type="submit">
            <FiSearch />
          </button>
        </form>

        {isAdmin && (
  <div className={styles.actions}>
    <Link href="/pessoas" className={styles.actionBtn}>
      <FiUser />
      Cadastrar Pessoa
    </Link>
    <Link href="/imoveis" className={styles.actionBtn}>
      <MdLocationCity />
      Cadastrar Imóvel
    </Link>
    <Link href="/apolices" className={styles.actionBtn}>
      <FiFileText />
      Cadastrar Apólice
    </Link>
  </div>
)}

        <hr className={styles.divisor} />
      </section>

      {/* RESULTADOS */}
      <section className={styles.results}>
        <h2 className={styles.subtitle}>
          {viewMode === 'apolices' && (termo.trim() ? 'Resultados da busca' : 'Apólices recentes')}
          {viewMode === 'imoveis' && 'Imóveis cadastrados'}
          {viewMode === 'pessoas' && 'Pessoas cadastradas'}
        </h2>

        <div className={styles.viewTabs}>
          <button
            type="button"
            className={viewMode === 'apolices' ? styles.viewTabActive : styles.viewTab}
            onClick={() => setViewMode('apolices')}
          >
            Apólices
          </button>
          <button
            type="button"
            className={viewMode === 'imoveis' ? styles.viewTabActive : styles.viewTab}
            onClick={() => setViewMode('imoveis')}
          >
            Imóveis
          </button>
          <button
            type="button"
            className={viewMode === 'pessoas' ? styles.viewTabActive : styles.viewTab}
            onClick={() => setViewMode('pessoas')}
          >
            Pessoas
          </button>
        </div>

        {erro && <p className={styles.error}>{erro}</p>}
        {loading && <p className={styles.info}>Carregando...</p>}

        {viewMode === 'apolices' && (
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <button
                className={statusFiltro === 'todas' ? styles.filterActive : styles.filterButton}
                onClick={() => setStatusFiltro('todas')}
              >
                Todas
              </button>
              <button
                className={statusFiltro === 'ativas' ? styles.filterActive : styles.filterButton}
                onClick={() => setStatusFiltro('ativas')}
              >
                Ativas
              </button>
              <button
                className={statusFiltro === 'vencidas' ? styles.filterActive : styles.filterButton}
                onClick={() => setStatusFiltro('vencidas')}
              >
                Vencidas
              </button>
            </div>

            <select
              className={styles.orderSelect}
              value={ordenarPor ?? ''}
              onChange={(e) =>
                setOrdenarPor(
                  e.target.value === '' ? null : (e.target.value as OrdenarPor),
                )
              }
            >
              <option value="">Ordenar por...</option>
              <option value="data_vencimento">Data de vencimento</option>
              <option value="data_emissao">Data de emissão</option>
            </select>
          </div>
        )}

        {!loading && !erro && (
          <div className={styles.cards}>
            {/* --- APÓLICES --- */}
            {viewMode === 'apolices' &&
              apolicesFiltradas.map((r, idx) => (
                <div key={idx} className={styles.card}>
                  <div className={styles.cardBlock}>
                    <span className={styles.badge}>{r.apoliceAtual.status}</span>
                    <h3 className={styles.cardTitle}>
                      #{r.imovel.codigo_visual} - {r.imovel.nome_imovel}
                    </h3>
                    <p className={styles.cardLine}>
                      Apólice: <strong>{r.apoliceAtual.numero_apolice}</strong>{' '}
                      {r.apoliceAtual.numero_proposta && (
                        <> · Proposta: {r.apoliceAtual.numero_proposta}</>
                      )}
                    </p>
                    <p className={styles.cardLine}>
                      Seguradora: {r.apoliceAtual.seguradora}
                    </p>
                    <p className={styles.cardLineSmall}>
                      Emissão:{' '}
                      {r.apoliceAtual.data_emissao
                        ? new Date(r.apoliceAtual.data_emissao).toLocaleDateString('pt-BR')
                        : '-'}
                    </p>
                    <p className={styles.cardLineSmall}>
                      Vencimento:{' '}
                      {r.apoliceAtual.data_vencimento
                        ? new Date(
                          r.apoliceAtual.data_vencimento,
                        ).toLocaleDateString('pt-BR')
                        : '-'}{' '}
                      · Parcelas: {r.apoliceAtual.parcelamento ?? '-'}
                    </p>

                    <p className={styles.cardLine}>
                      <strong>Anexos:</strong>{' '}
                      {r.apoliceAtual.qtdAnexos === 0
                        ? 'Nenhum anexo'
                        : `${r.apoliceAtual.qtdAnexos} arquivo${r.apoliceAtual.qtdAnexos === 1 ? '' : 's'
                        }`}
                    </p>

                    <button
                      type="button"
                      className={styles.editMini}
                      onClick={() => setAnexosApoliceId(r.apoliceAtual.id_apolice)}
                    >
                      Ver anexos
                    </button>

                    {isAdmin && (
                      <div className={styles.cardActionsRow}>
                        <button
                          className={styles.editBtn}
                          onClick={() => abrirEditarApolice(r.apoliceAtual)}
                        >
                          <FiEdit2 /> Editar apólice
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => deletarApolice(r.apoliceAtual.id_apolice)}
                        >
                          <FiTrash2 /> Excluir apólice
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardBlock}>
                    <p className={styles.blockTitle}>Imóvel</p>
                    <p className={styles.cardLineSmall}>
                      CEP: {r.imovel.cep || '-'}
                    </p>
                    {isAdmin && (
                      <div className={styles.cardActionsRow}>
                        <button
                          className={styles.editMini}
                          onClick={() =>
                            abrirEditarImovel(r.apoliceAtual.id_apolice, r.imovel)
                          }
                        >
                          <FiEdit2 /> Editar
                        </button>
                      </div>
                    )}
                    <p className={styles.blockTitle}>Locador</p>
                    <p className={styles.cardLineSmall}>{r.locador.nome}</p>
                    <p className={styles.cardLineSmall}>
                      CPF/CNPJ: {r.locador.cpf_cnpj}
                    </p>
                    {isAdmin && (
                      <div className={styles.cardActionsRow}>
                        <button
                          className={styles.editMini}
                          onClick={() =>
                            abrirEditarPessoa('locador', r.apoliceAtual.id_apolice, r.locador)
                          }
                        >
                          <FiEdit2 /> Editar
                        </button>
                      </div>
                    )}
                    <p className={styles.blockTitle}>Locatário</p>
                    <p className={styles.cardLineSmall}>{r.locatario.nome}</p>
                    <p className={styles.cardLineSmall}>
                      CPF/CNPJ: {r.locatario.cpf_cnpj}
                    </p>
                    {isAdmin && (
                      <div className={styles.cardActionsRow}>
                        <button
                          className={styles.editMini}
                          onClick={() =>
                            abrirEditarPessoa(
                              'locatario',
                              r.apoliceAtual.id_apolice,
                              r.locatario,
                            )
                          }
                        >
                          <FiEdit2 /> Editar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {/* --- IMÓVEIS --- */}
            {viewMode === 'imoveis' &&
              imoveis.map((i) => (
                <div key={i.id_imovel} className={styles.card}>
                  <div className={styles.cardBlock}>
                    <span className={styles.badge}>Imóvel</span>
                    <h3 className={styles.cardTitle}>
                      #{i.codigo_visual} - {i.nome_imovel}
                    </h3>
                    <p className={styles.cardLineSmall}>CEP: {i.cep || '-'}</p>

                    {isAdmin && (
                      <div className={styles.cardActionsRow}>
                        <button
                          className={styles.editBtn}
                          onClick={() => {
                            // aqui futuramente você pode abrir um modal de edição do imóvel
                            alert('Aqui vai abrir a edição de dados do imóvel.');
                          }}
                        >
                          <FiEdit2 /> Editar imóvel
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => deletarImovel(i.id_imovel)}
                        >
                          <FiTrash2 /> Excluir imóvel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {/* --- PESSOAS --- */}
            {viewMode === 'pessoas' &&
              pessoas.map((p) => (
                <div key={p.id_pessoa} className={styles.card}>
                  <div className={styles.cardBlock}>
                    <span className={styles.badge}>Pessoa</span>
                    <h3 className={styles.cardTitle}>{p.nome}</h3>
                    <p className={styles.cardLineSmall}>CPF/CNPJ: {p.cpf_cnpj}</p>

                    {isAdmin && (
                      <div className={styles.cardActionsRow}>
                        <button
                          className={styles.editBtn}
                          onClick={() => {
                            // aqui depois você pode abrir o modal de edição da pessoa
                            alert('Aqui vai abrir a edição de dados da pessoa.');
                          }}
                        >
                          <FiEdit2 /> Editar pessoa
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => deletarPessoa(p.id_pessoa)}
                        >
                          <FiTrash2 /> Excluir pessoa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

            {/* Mensagens de lista vazia */}
            {viewMode === 'apolices' && apolicesFiltradas.length === 0 && (
              <p className={styles.info}>Nenhuma apólice encontrada.</p>
            )}
            {viewMode === 'imoveis' && imoveis.length === 0 && (
              <p className={styles.info}>Nenhum imóvel cadastrado.</p>
            )}
            {viewMode === 'pessoas' && pessoas.length === 0 && (
              <p className={styles.info}>Nenhuma pessoa cadastrada.</p>
            )}
          </div>
        )}


      </section>

      {/* MODAIS DE EDIÇÃO */}
      {editType === 'pessoa' && editPessoaCtx && (
        <EditPessoaModal
          tipo={editPessoaCtx.tipo}
          apoliceId={editPessoaCtx.apoliceId}
          pessoaAtual={editPessoaCtx.pessoaAtual}
          onClose={fecharModal}
          onSaved={handleSaved}
        />
      )}

      {editType === 'imovel' && editImovelCtx && (
        <EditImovelModal
          apoliceId={editImovelCtx.apoliceId}
          imovelAtual={editImovelCtx.imovelAtual}
          onClose={fecharModal}
          onSaved={handleSaved}
        />
      )}
      {editType === 'apolice' && editApolice && (
        <EditApoliceModal apolice={editApolice} onClose={fecharModal} onSaved={handleSaved} />
      )}

      {anexosApoliceId !== null && (
        <AnexosModal
          apoliceId={anexosApoliceId}
          onClose={() => setAnexosApoliceId(null)}
          isAdmin={isAdmin}
          onChangeQtd={atualizarQtdAnexos}
        />
      )}


    </main>
  );
}

/* ------------ MODAIS ------------- */

type PessoaModalProps = {
  tipo: 'locador' | 'locatario';
  apoliceId: number;
  pessoaAtual: Pessoa;
  onClose: () => void;
  onSaved: () => void;
};
function EditPessoaModal({
  tipo,
  apoliceId,
  pessoaAtual,
  onClose,
  onSaved,
}: PessoaModalProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    String(pessoaAtual.id_pessoa),
  );
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/pessoas`);
        if (!res.ok) throw new Error('Erro ao carregar pessoas.');
        const data: Pessoa[] = await res.json();
        setOptions(
          data.map((p) => ({
            value: String(p.id_pessoa),
            label: `${p.nome} (${p.cpf_cnpj})`,
          })),
        );
      } catch (e: any) {
        console.error(e);
        setErro(e.message || 'Erro ao carregar pessoas.');
      }
    })();
  }, []);

  async function salvar() {
    if (!selectedId) {
      setErro('Selecione uma pessoa.');
      return;
    }

    try {
      setSaving(true);
      setErro(null);

      const body: any = {};
      if (tipo === 'locador') {
        body.locadorId = Number(selectedId);
      } else {
        body.locatarioId = Number(selectedId);
      }

      const res = await fetch(`${API_URL}/apolices/${apoliceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar apólice.');
      }

      await onSaved();
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  const titulo = tipo === 'locador' ? 'Trocar Locador' : 'Trocar Locatário';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>

        <p className={styles.cardLineSmall}>
          Atual: {pessoaAtual.nome} ({pessoaAtual.cpf_cnpj})
        </p>

        <label className={styles.modalLabel}>
          Nova pessoa
          <Select
            classNamePrefix="react-select"
            options={options}
            placeholder="Digite para buscar a pessoa..."
            value={options.find((opt) => opt.value === selectedId) || null}
            onChange={(opt) => setSelectedId(opt ? opt.value : '')}
            isClearable
          />
        </label>

        {erro && <p className={styles.error}>{erro}</p>}

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.modalCancel}>
            Cancelar
          </button>
          <button onClick={salvar} className={styles.modalSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

type ImovelModalProps = {
  apoliceId: number;
  imovelAtual: Imovel;
  onClose: () => void;
  onSaved: () => void;
};
function EditImovelModal({
  apoliceId,
  imovelAtual,
  onClose,
  onSaved,
}: ImovelModalProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    String(imovelAtual.id_imovel),
  );
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/imoveis`);
        if (!res.ok) throw new Error('Erro ao carregar imóveis.');
        const data: Imovel[] = await res.json();
        setOptions(
          data.map((i) => ({
            value: String(i.id_imovel),
            label: `${i.nome_imovel} (${i.codigo_visual})`,
          })),
        );
      } catch (e: any) {
        console.error(e);
        setErro(e.message || 'Erro ao carregar imóveis.');
      }
    })();
  }, []);

  async function salvar() {
    if (!selectedId) {
      setErro('Selecione um imóvel.');
      return;
    }

    try {
      setSaving(true);
      setErro(null);

      const body: any = {};
      // Ajuste o nome do campo para o que sua API espera: imovelId ou id_imovel
      body.imovelId = Number(selectedId);

      const res = await fetch(`${API_URL}/apolices/${apoliceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar apólice.');
      }

      await onSaved();
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3>Trocar Imóvel</h3>

        <p className={styles.cardLineSmall}>
          Atual: {imovelAtual.nome_imovel} ({imovelAtual.codigo_visual})
        </p>

        <label className={styles.modalLabel}>
          Novo imóvel
          <Select
            classNamePrefix="react-select"
            options={options}
            placeholder="Digite para buscar o imóvel..."
            value={options.find((opt) => opt.value === selectedId) || null}
            onChange={(opt) => setSelectedId(opt ? opt.value : '')}
            isClearable
          />
        </label>

        {erro && <p className={styles.error}>{erro}</p>}

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.modalCancel}>
            Cancelar
          </button>
          <button onClick={salvar} className={styles.modalSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

type ApoliceModalProps = {
  apolice: ApoliceAtual;
  onClose: () => void;
  onSaved: () => void;
};
function EditApoliceModal({ apolice, onClose, onSaved }: ApoliceModalProps) {
  const [numero, setNumero] = useState(apolice.numero_apolice);
  const [proposta, setProposta] = useState(apolice.numero_proposta || '');
  const [seguradora, setSeguradora] = useState(apolice.seguradora);
  const [status, setStatus] = useState<'ATIVA' | 'VENCIDA'>(
    apolice.status as 'ATIVA' | 'VENCIDA',);
  const [parcelamento, setParcelamento] = useState(
    apolice.parcelamento?.toString() || '',
  );
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function toIsoDate(value?: string | null) {
    if (!value) return '';
    return value.slice(0, 10);
  }

  const [dataEnvio, setDataEnvio] = useState(toIsoDate(apolice.data_emissao));
  const [dataVenc, setDataVenc] = useState(toIsoDate(apolice.data_vencimento));
  const [dataPag, setDataPag] = useState(toIsoDate(apolice.data_pagamento));

  async function salvar() {
    try {
      setSaving(true);
      setErro(null);

      const res = await fetch(`${API_URL}/apolices/${apolice.id_apolice}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_apolice: numero,
          numero_proposta: proposta || undefined,
          seguradora,
          status,
          parcelamento: parcelamento ? Number(parcelamento) : undefined,
          data_emissao: dataEnvio || undefined,
          data_vencimento: dataVenc || undefined,
          data_pagamento: dataPag || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.message) {
          throw new Error(
            Array.isArray(data.message) ? data.message.join(' | ') : data.message,
          );
        }
        throw new Error('Erro ao salvar apólice.');
      }

      await onSaved();
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao salvar apólice.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3>Editar Apólice</h3>

        <label className={styles.modalLabel}>
          Nº Apólice
          <input
            className={styles.modalInput}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </label>

        <label className={styles.modalLabel}>
          Nº Proposta
          <input
            className={styles.modalInput}
            value={proposta}
            onChange={(e) => setProposta(e.target.value)}
          />
        </label>

        <label className={styles.modalLabel}>
          Seguradora
          <input
            className={styles.modalInput}
            value={seguradora}
            onChange={(e) => setSeguradora(e.target.value)}
          />
        </label>

        <label className={styles.modalLabel}>
          Status
          <select
            className={styles.modalInput}
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ATIVA' | 'VENCIDA')}
          >
            <option value="ATIVA">Ativa</option>
            <option value="VENCIDA">Vencida</option>
          </select>
        </label>

        <div className={styles.modalGrid3}>
          <label className={styles.modalLabel}>
            Emissão
            <input
              className={styles.modalInput}
              type="date"
              value={dataEnvio}
              onChange={(e) => setDataEnvio(e.target.value)}
            />
          </label>
          <label className={styles.modalLabel}>
            Vencimento
            <input
              className={styles.modalInput}
              type="date"
              value={dataVenc}
              onChange={(e) => setDataVenc(e.target.value)}
            />
          </label>
          <label className={styles.modalLabel}>
            Pagamento
            <input
              className={styles.modalInput}
              type="date"
              value={dataPag}
              onChange={(e) => setDataPag(e.target.value)}
            />
          </label>
        </div>

        <label className={styles.modalLabel}>
          Parcelamento (nº parcelas)
          <input
            className={styles.modalInput}
            type="number"
            min={1}
            value={parcelamento}
            onChange={(e) => setParcelamento(e.target.value)}
          />
        </label>

        {erro && <p className={styles.error}>{erro}</p>}

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.modalCancel}>
            Cancelar
          </button>
          <button onClick={salvar} className={styles.modalSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

type AnexosModalProps = {
  apoliceId: number;
  onClose: () => void;
  isAdmin: boolean;
  onChangeQtd: (apoliceId: number, novaQtd: number) => void;
};
function AnexosModal({ apoliceId, onClose, isAdmin, onChangeQtd }: AnexosModalProps) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErro(null);
        const res = await fetch(`${API_URL}/apolices/${apoliceId}/anexos`);
        if (!res.ok) throw new Error('Erro ao carregar anexos.');
        const data: Anexo[] = await res.json();
        setAnexos(data);
      } catch (e: any) {
        console.error(e);
        setErro(e.message || 'Erro ao carregar anexos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [apoliceId]);

  useEffect(() => {
    onChangeQtd(apoliceId, anexos.length);
  }, [apoliceId, anexos.length, onChangeQtd]);

  async function enviarArquivo() {
    if (!arquivo) return;
    try {
      setUploading(true);
      setErro(null);

      const formData = new FormData();
      formData.append('arquivo', arquivo);

      const res = await fetch(`${API_URL}/apolices/${apoliceId}/anexos`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Erro ao enviar arquivo.');

      const listaRes = await fetch(`${API_URL}/apolices/${apoliceId}/anexos`);
      const lista: Anexo[] = await listaRes.json();

      setAnexos(lista);
      setArquivo(null);
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  }

  async function deletarAnexo(id_anexo: number) {
    if (!confirm('Excluir este anexo?')) return;

    try {
      setErro(null);

      const res = await fetch(
        `${API_URL}/apolices/${apoliceId}/anexos/${id_anexo}`,
        { method: 'DELETE' },
      );

      if (!res.ok) {
        const texto = await res.text();
        console.error('Falha ao excluir anexo:', res.status, texto);
        throw new Error(texto || 'Erro ao excluir anexo.');
      }

      setAnexos((prev) => prev.filter((a) => a.id_anexo !== id_anexo));
    } catch (e: any) {
      console.error(e);
      setErro(e.message || 'Erro ao excluir anexo.');
    }
  }

  function formatBytes(bytes?: number | null) {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3>Anexos da apólice #{apoliceId}</h3>
        {isAdmin ? (
          <>
            <div className={styles.modalLabel}>
              <span>Adicionar arquivo</span>
              <input
                type="file"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </div>
            <button
              className={styles.modalSave}
              type="button"
              disabled={!arquivo || uploading}
              onClick={enviarArquivo}
            >
              {uploading ? 'Enviando...' : 'Enviar'}
            </button>
          </>
        ) : (
          <p className={styles.info}>
            Apenas administradores podem enviar ou excluir anexos.
          </p>
        )}

        {erro && <p className={styles.error}>{erro}</p>}
        {loading && <p className={styles.info}>Carregando anexos...</p>}

        {!loading && anexos.length === 0 && (
          <p className={styles.info}>Nenhum anexo cadastrado.</p>
        )}

        {!loading && anexos.length > 0 && (
          <ul className={styles.anexosList}>
            {anexos.map((a) => (
              <li key={a.id_anexo} className={styles.anexoItem}>
                <div>
                  <strong>
                    <a
                      href={`${API_URL}/apolices/anexos/${a.id_anexo}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.anexoLink} // opcional, pra estilizar
                    >
                      {a.nome_arquivo}
                    </a>
                  </strong>
                  <div className={styles.cardLineSmall}>
                    {a.content_type || 'tipo desconhecido'} ·{' '}
                    {formatBytes(a.tamanho_bytes)}
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => deletarAnexo(a.id_anexo)}
                  >
                    Excluir
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.modalCancel}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}