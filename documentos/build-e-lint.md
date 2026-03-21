# Guia de Build e Lint (Frontend e Backend)

Durante o desenvolvimento ou no momento do deploy para produção, nós utilizamos processos de **build** (para empacotar/compilar o código de forma otimizada) e de **lint** (para varrer problemas de padronização, ortografia ou sintaxe).

---

## 🏗️ 1. Comandos de Build

O build gera os arquivos finais otimizados que serão efetivamente lidos e rodados pelo servidor de hospedagem. 
> 💡 *Atenção:* O comando correto sempre pede o "run" no meio: `npm run build`.

### 🖥️ Frontend (Next.js)

Para iniciar o build da interface:
```bash
cd frontend
npm run build
```
**O que acontece:** O Next.js irá gerar bundles super reduzidos e otimizados de HTML/CSS/JS para a web. As páginas estáticas são geradas e agrupadas dentro da pasta `.next/`, prontas para serem veiculadas em produção.

### ⚙️ Backend (NestJS / Node.js)

Para compilar o código do lado do servidor:
```bash
cd backend
npm run build
```
**O que acontece:** O TypeScript (do pacote `tsc`) transforma todo o código moderno (`.ts`) em código JavaScript convencional compatível com qualquer servidor Node, e o empacota na pasta `dist/`.

---

## 🧹 2. Comandos de Lint (ESLint)

O processo de **linting** valida se você está seguindo as regras de formatação estipuladas na equipe. Ele ajuda a banir "variáveis não usadas", "importações esquecidas", etc.

### 🖥️ Frontend

Para exibir os erros e inconformidades no terminal:
```bash
cd frontend
npm run lint
```

### ⚙️ Backend

No lado do backend existem dois comandos mapeados. O clássico para listar erros, e uma variante que **resolve automaticamente** pequenos errinhos no código:

1. **Exibir os erros:**
```bash
cd backend
npm run lint
```

2. **Corrigir automaticamente:** *(Útil para arrumar espaçamentos e aspas mal colocadas de uma vez)*
```bash
cd backend
npm run lint:fix
```

> **Dica Final:** É uma excelente prática acostumar-se a rodar o comando de `lint` antes de abrir as Pull Requests ou realizar *commits*, garantindo um código sempre legível e sadio.
