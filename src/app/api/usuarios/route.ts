import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs'; // npm install bcrypt

// GET /api/usuarios - Listar usuários
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    const result = await query(
      `SELECT id, uuid, nome, email, telefone, ativo, criado_em 
       FROM usuarios 
       WHERE ativo = true 
       ORDER BY criado_em DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return NextResponse.json({
      usuarios: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

// POST /api/usuarios - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, email, senha, telefone } = body;

    // Validação básica
    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const emailExiste = await query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailExiste.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Inserir usuário
    const result = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, telefone) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, uuid, nome, email, telefone, criado_em`,
      [nome, email, senhaHash, telefone || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
