import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

type AssetKind = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SVG' | 'OTHER';

interface UploadedAsset {
  id: string;
  title: string;
  kind: AssetKind;
  sourceUrl: string;
  createdAt: string;
  bytes: number | null;
}

interface ConteudoResponse {
  assets: UploadedAsset[];
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000';

export function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<AssetKind>('IMAGE');
  const [file, setFile] = useState<File | null>(null);
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const uploadDisabled = useMemo(() => !file || title.trim().length < 2 || isSubmitting, [file, isSubmitting, title]);

  useEffect(() => {
    void reloadAssets();
  }, []);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    if (nextFile && title.trim().length === 0) {
      setTitle(nextFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setStatusMessage(null);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('kind', kind);
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/painel/conteudo/assets/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload falhou (${response.status}): ${text}`);
      }

      setStatusMessage('Arquivo enviado com sucesso e cadastrado no conteúdo.');
      setDescription('');
      setFile(null);
      await reloadAssets();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao enviar arquivo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reloadAssets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/painel/conteudo`);
      if (!response.ok) {
        throw new Error(`Falha ao carregar conteúdo (${response.status}).`);
      }

      const payload = (await response.json()) as ConteudoResponse;
      setAssets(payload.assets ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao carregar assets.');
    }
  };

  return (
    <main className="page">
      <section className="card">
        <h1>Painel de Conteúdo - Upload de Arquivo</h1>
        <p>
          Fluxo da Etapa 1: <strong>Tema</strong> -&gt; <strong>Módulo</strong> -&gt; <strong>Atividade</strong> -&gt;{' '}
          <strong>Mídia</strong> -&gt; <strong>Telas base</strong>.
        </p>
        <p>Esta tela é o passo de mídia: selecione o arquivo e faça o upload.</p>

        <form onSubmit={onSubmit} className="form">
          <label>
            Título do arquivo
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Vídeo aula da letra A" />
          </label>

          <label>
            Tipo de mídia
            <select value={kind} onChange={(event) => setKind(event.target.value as AssetKind)}>
              <option value="IMAGE">Imagem</option>
              <option value="VIDEO">Vídeo</option>
              <option value="AUDIO">Áudio</option>
              <option value="SVG">SVG (tela base)</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>

          <label>
            Descrição (opcional)
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </label>

          <label>
            Arquivo
            <input type="file" onChange={onFileChange} />
          </label>

          <button type="submit" disabled={uploadDisabled}>
            {isSubmitting ? 'Enviando...' : 'Enviar arquivo'}
          </button>
        </form>

        {statusMessage ? <p className="success">{statusMessage}</p> : null}
        {errorMessage ? <p className="error">{errorMessage}</p> : null}
      </section>

      <section className="card">
        <div className="listHeader">
          <h2>Arquivos cadastrados</h2>
          <button type="button" onClick={() => void reloadAssets()}>
            Atualizar
          </button>
        </div>

        {assets.length === 0 ? (
          <p>Nenhum arquivo cadastrado ainda.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Tamanho</th>
                <th>Criado em</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.title}</td>
                  <td>{asset.kind}</td>
                  <td>{asset.bytes ? `${Math.round(asset.bytes / 1024)} KB` : '-'}</td>
                  <td>{new Date(asset.createdAt).toLocaleString('pt-BR')}</td>
                  <td>
                    <a href={asset.sourceUrl} target="_blank" rel="noreferrer">
                      Abrir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
