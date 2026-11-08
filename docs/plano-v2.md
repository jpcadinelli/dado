# Plano de evolução — Dado Virtual V2

## Estado inicial e preservação
- Repositório: `jpcadinelli/dado`.
- Produção: `main`, publicada pelo GitHub Pages quando habilitado.
- Backup imutável da V1: `backup/v1`, criado a partir do commit `726b838d959f3153d0942e90b2853f68640f9849`.
- Não realizar commits em `backup/v1`. Se precisar restaurar, criar uma branch a partir dela e abrir PR contra `main`; não fazer force push em produção.
- Desenvolvimento da V2 em branches `feature/v2-<onda>-<tema>`; PR com revisão e checklist antes de integrar à `main`.
- A primeira implantação da plataforma deve preservar o dado tradicional e seu endereço atual.

## Onda 1 — Fundação e navegação
**Objetivo:** transformar o site de dado único em estrutura de modos, sem regressão.

**Tarefas**
1. Extrair o HTML/CSS/JS monolítico para módulos reutilizáveis, sem adicionar dependência de backend ou de build.
2. Criar início com catálogo: Dado tradicional e Imagem & Ação; outros modos ficam identificados como futuros (sem links quebrados).
3. Definir navegação com URLs estáticas relativas compatíveis com GitHub Pages em `/dado/`.
4. Manter o dado tradicional acessível a partir da página inicial (inclusive por link e botão próprios).
5. Definir paleta, estados de foco, navegação por teclado e layout para telas estreitas.

**Aceite:** dado D6 atual continua sorteando de 1–6 com animação; navegação funciona em celular e desktop; não existem rotas quebradas.

## Onda 2 — Motor de dados e dado de letras
**Objetivo:** oferecer dois tipos de dado de seis faces usando o mesmo motor.

**Tarefas**
1. Criar componente visual reutilizável `Dice3D` (seis faces, cores e conteúdo configuráveis).
2. Separar lógica de sorteio, animação, estado, resultado, histórico e contagem.
3. Implementar D6 numérico e D6 de letras com cores animadas.
4. Aceitar configurações de faces com letras e legendas; não presumir que todas as edições do jogo usam o mesmo conjunto de letras.
5. Manter o resultado sorteado consistente com a face do cubo voltada para frente.
6. Impedir duplo acionamento de um dado que esteja em animação, sem bloquear o outro.

**Aceite:** sorteios dos dados são independentes, cada resultado exibido coincide com sua face visual; funcionamento sem rede após carregamento.

## Onda 3 — Modo Imagem & Ação
**Objetivo:** entregar o principal caso de uso da V2.

**Interface**
- Dois dados 3D na mesma página: **numérico (1–6)** e **letras (categorias)**.
- Botões independentes: **Rolar número** e **Rolar categoria**.
- Botão conjunto: **Rolar os dois**.
- Toque/clique no próprio dado aciona somente aquele dado.
- Resultado individual permanece visível quando apenas o outro é lançado.
- Resultado combinado mostra o último número e a última letra disponíveis, distinguindo quais são os valores atualizados.
- Apresentar legenda da categoria e opção para selecionar a edição/perfil de letras; permitir alteração manual caso o dado físico seja diferente.

**Regras**
- Cada dado sorteia entre suas seis faces com probabilidade uniforme.
- Comando conjunto inicia os dois lançamentos na mesma interação, aguarda ambos terminarem e atualiza a combinação.
- Durante um lançamento conjunto, bloquear um novo comando conjunto até a conclusão; não permitir interações conflitantes.
- Os sorteios são independentes, inclusive quando acionados simultaneamente.

**Aceite:** testar lançamento só do número, só da letra, ambos juntos, repetições e alternância dos três comandos, em celular e computador.

## Onda 4 — Personalização e combinações
**Objetivo:** generalizar a plataforma sem desviar do caso Imagem & Ação.

**Tarefas**
1. Disponibilizar perfis de faces/legendas configuráveis para letras, com valores padrão por edição após validação.
2. Permitir compor de um a vários dados para uma sessão (primeira versão: dois D6; expansão: D4, D8, D10, D12 e D20).
3. Oferecer controles de lançamento individual e conjunto e histórico por dado.
4. Salvar preferências não sensíveis no `localStorage`, com opção de redefinir.
5. Não armazenar informações pessoais nem exigir cadastro.

**Aceite:** recarregar preserva configurações; um perfil personalizado não modifica as configurações padrão; os dados podem ser rolados separadamente.

## Onda 5 — Testes, desempenho e lançamento
**Objetivo:** consolidar a V2 e publicar com segurança.

**Checklist**
- Testar larguras móveis (320, 375, 390, 430 px), tablet e desktop; evitar rolagem horizontal.
- Testar toque, mouse, teclado, leitores de tela e preferência por movimento reduzido.
- Conferir coerência da face exibida com resultado, inclusive após sequências longas de rolagens.
- Verificar que sorteios numéricos e de letras não interferem entre si.
- Validar links relativos em `https://jpcadinelli.github.io/dado/` e páginas de jogos.
- Checar console do navegador, recursos ausentes, desempenho de animação e carregamento.
- Atualizar README com instruções de execução e publicação.
- Integrar PR final à `main` após revisão; manter `backup/v1` preservado.

**Aceite:** V1 preservada; D6 tradicional e modo Imagem & Ação funcionais e responsivos; atualização pública validada.

## Ordem recomendada e política de entrega
`Onda 1 → Onda 2 → Onda 3 → Onda 4 → Onda 5`.

- **Marco funcional prioritário:** fim da Onda 3; permite usar o jogo com dois dados independentes e lançamento conjunto.
- A Onda 4 pode ser adiada sem impedir o lançamento do modo Imagem & Ação.
- Preferir PR pequeno por onda e validação manual dos critérios de aceite antes de avançar.
- A edição e as seis faces exatas do dado de letras devem ser confirmadas com o jogo físico ou manual da edição desejada antes de configurar o perfil padrão definitivo.
