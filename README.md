# DADO. — Dados virtuais V2

Site estático, responsivo, sem build ou backend, publicado via GitHub Pages.

## Modos

- `/` — catálogo de dados e modos de jogo.
- `/dados/tradicional/` — dado numérico D6 em 3D.
- `/dados/letras/` — dado de categorias D6 em 3D, com perfis editáveis.
- `/jogos/imagem-e-acao/` — D6 numérico + D6 de categorias, com lançamentos independentes ou conjuntos.
- `/dados/personalizado/` — até seis dados simultâneos, D4/D6/D8/D10/D12/D20 ou seis faces personalizadas. D6 é cubo 3D; demais quantidades de faces usam marcadores animados, sem representar a geometria física do poliedro.

## Executar

Usar um servidor estático local: `python3 -m http.server 8000` e acessar `http://localhost:8000/`. Os módulos JavaScript usam `type=module` e precisam de HTTP (não apenas `file://`).

## GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → `main` e `/(root)`.

Site: https://jpcadinelli.github.io/dado/

## Projeto

- `assets/dice.js` — sorteio uniforme com `crypto.getRandomValues`, renderização/rotação de faces, animação e controle de lançamentos.
- `assets/config.js` — predefinições, letras/categorias e configurações em `localStorage`.
- `assets/app.js` — orquestração de cada modo.
- `assets/styles.css` — identidade visual e responsividade.
- `tests/` — testes de navegador automatizados (Playwright Python, quando disponível).

## Imagem & Ação

No modo de jogo, é possível rolar somente o dado numérico, somente o dado de letras, ou os dois ao mesmo tempo. O último resultado do dado não acionado permanece visível. Padrão configurado: `P`, `O`, `A`, `D`, `L`, `T`. Também há perfil alternativo com `M` e seis faces editáveis; adapte às regras da sua edição. Ferramenta independente, não oficial.

## Versões

- `backup/v1`: preserva a primeira versão antes da reforma da interface.
- `main`: publicação atual após aprovação das mudanças.
