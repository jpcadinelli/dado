# Plano em ondas — versão 2

## Preservação da V1

A branch `backup/v1` aponta para o commit `726b838d959f3153d0942e90b2853f68640f9849`. Não editar essa branch. Integrar a V2 por PR, sem reescrever histórico.

## Onda 1 — Estrutura e navegação

- [x] Página inicial com catálogo responsivo.
- [x] Rotas estáticas para dado tradicional, letras, Imagem & Ação e personalização.
- [x] Código reutilizável em `assets/`, sem build nem backend.

## Onda 2 — Motor e novos dados

- [x] D6 3D com cores e animação.
- [x] D6 de letras com perfis de categorias.
- [x] Motor uniforme de sorteio, independência por instância e controle contra toques duplicados.
- [x] Representações animadas de dados D4, D8, D10, D12 e D20. Nota: os não-D6 são marcadores poligonais, não modelos físicos em 3D.

## Onda 3 — Imagem & Ação

- [x] Dado numérico e dado de letras simultaneamente visíveis.
- [x] Rolar número, rolar categoria e rolar os dois juntos.
- [x] Preservação do resultado não acionado e visualização do par atual.
- [x] Histórico por dado e por lançamento conjunto.

## Onda 4 — Configuração

- [x] Perfil clássico `P O A D L T` e alternativo `P O A D L M`.
- [x] Seis letras e descrições personalizadas salvas localmente.
- [x] Composição de até seis dados, lançamento individual e em conjunto.
- [x] Preferências salvas com `localStorage` sem conta ou coleta de dados pessoais.

## Onda 5 — Validação e publicação

- [x] Testes de navegador e de responsividade em `tests/`.
- [x] Verificações de fluxo por dado, lançamento conjunto, perfil e construtor.
- [x] Acessibilidade: botões por dado, foco de teclado e mensagem acessível.
- [x] Preferência por movimento reduzido.
- [x] GitHub Pages com caminhos relativos ao prefixo `/dado/`.

## Critérios de entrega

A V2 não substitui nem modifica a branch de backup. Página tradicional preservada como modo dedicado; Imagem & Ação oferece os três tipos de rolagem; personalização é opcional e funciona sem login. Testes de navegação automatizados executados localmente antes da publicação.
