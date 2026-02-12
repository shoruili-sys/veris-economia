import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/artigos - Listar artigos publicados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    const busca = searchParams.get('busca');

    let queryText = `
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
    `;

    const params: any[] = [];
    let paramCount = 1;

    // Filtro por categoria
    if (categoria) {
      queryText += ` AND c.slug = $${paramCount}`;
      params.push(categoria);
      paramCount++;
    }

    // Busca por texto
    if (busca) {
      queryText += ` AND (
        a.titulo ILIKE $${paramCount} OR 
        a.resumo ILIKE $${paramCount} OR 
        a.conteudo ILIKE $${paramCount}
      )`;
      params.push(`%${busca}%`);
      paramCount++;
    }

    queryText += ` ORDER BY a.data_publicacao DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    return NextResponse.json({
      artigos: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Erro ao buscar artigos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar artigos' },
      { status: 500 }
    );
  }
}

// POST /api/artigos - Criar novo artigo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titulo,
      slug,
      resumo,
      conteudo,
      imagem_destaque,
      autor_id,
      categoria_id,
      publicado,
    } = body;

    // Validação básica
    if (!titulo || !slug || !conteudo) {
      return NextResponse.json(
        { error: 'Título, slug e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se slug já existe
    const slugExiste = await query(
      'SELECT id FROM artigos_economia WHERE slug = $1',
      [slug]
    );

    if (slugExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'Slug já existe' },
        { status: 409 }
      );
    }

    // Inserir artigo
    const result = await query(
      `INSERT INTO artigos_economia 
       (titulo, slug, resumo, conteudo, imagem_destaque, autor_id, categoria_id, publicado, data_publicacao) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        titulo,
        slug,
        resumo,
        conteudo,
        imagem_destaque || null,
        autor_id || null,
        categoria_id || null,
        publicado || false,
        publicado ? new Date() : null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar artigo:', error);
    return NextResponse.json(
      { error: 'Erro ao criar artigo' },
      { status: 500 }
    );
  }
}
