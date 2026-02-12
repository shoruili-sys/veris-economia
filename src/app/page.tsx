import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic'; // ← adicionar esta linha

// export const revalidate = 3600; // ← comentar ou remover esta linha

interface Artigo {
  id: number;
  uuid: string;
  titulo: string;
  slug: string;
  resumo: string;
  imagem_destaque: string | null;
  visualizacoes: number;
  data_publicacao: string;
  autor_nome: string;
  categoria_nome: string;
  categoria_slug: string;
}

// Esta função roda no servidor a cada requisição
async function getArtigos(): Promise<Artigo[]> {
  const result = await query(`
    SELECT 
      a.id,
      a.uuid,
      a.titulo,
      a.slug,
      a.resumo,
      a.imagem_destaque,
      a.visualizacoes,
      a.data_publicacao,
      u.nome as autor_nome,
      c.nome as categoria_nome,
      c.slug as categoria_slug
    FROM artigos_economia a
    LEFT JOIN usuarios u ON a.autor_id = u.id
    LEFT JOIN categorias c ON a.categoria_id = c.id
    WHERE a.publicado = true
    ORDER BY a.data_publicacao DESC
    LIMIT 20
  `);

  return result.rows;
}

export default async function EconomiaPage() {
  const artigos = await getArtigos();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <header className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Economia em Foco
          </h1>
          <p className="text-xl text-gray-600">
            As principais notícias e análises do mercado financeiro brasileiro
          </p>
        </header>

        {/* Grade de artigos */}
        <div className="grid gap-8">
          {artigos.map((artigo) => (
            <article
              key={artigo.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/artigos/${artigo.slug}`}>
                {/* Imagem destaque */}
                {artigo.imagem_destaque && (
                  <div className="relative h-64 w-full">
                    <Image
                      src={artigo.imagem_destaque}
                      alt={artigo.titulo}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Categoria */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                      {artigo.categoria_nome}
                    </span>
                    <span className="text-sm text-gray-500">
                      {artigo.visualizacoes} visualizações
                    </span>
                  </div>

                  {/* Título */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                    {artigo.titulo}
                  </h2>

                  {/* Resumo */}
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {artigo.resumo}
                  </p>

                  {/* Meta informações */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>Por {artigo.autor_nome}</span>
                    </div>
                    <time dateTime={artigo.data_publicacao}>
                      {new Date(artigo.data_publicacao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* Paginação (exemplo simples) */}
        <div className="mt-12 flex justify-center gap-4">
          <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Anterior
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Próxima
          </button>
        </div>
      </div>
    </main>
  );
}

// ISR: Revalidar a cada 1 hora (3600 segundos)
// Isso significa que a página será regenerada no máximo a cada hora
// - export const revalidate = 3600;

// Metadados para SEO
export const metadata = {
  title: 'Economia em Foco - Notícias e Análises',
  description: 'As principais notícias e análises do mercado financeiro brasileiro',
  keywords: 'economia, mercado financeiro, investimentos, brasil',
};
