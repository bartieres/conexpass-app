# ConexPass — Task 3.17: identificar ofertas já contratadas pelo usuário

> **Instrução para o Codex no VS Code:** implemente esta task **diretamente nos arquivos reais do repositório**, preservando o código existente. Antes de editar, leia os componentes e serviços envolvidos. Não recrie componentes inteiros a partir desta especificação, não invente endpoints e não altere funcionalidades fora do escopo.

## 1. Contexto e objetivo

O ConexPass é um aplicativo React Native/Expo em que o usuário explora estabelecimentos, consulta suas ofertas e pode contratar assinaturas, pacotes e acessos avulsos. No detalhe de um estabelecimento há a aba **“Planos e ofertas”**, que lista ofertas e permite abrir `EstabelecimentoOfertaDetail`.

**Task:** `3.17 | MVP | App | Explorar | Detalhe - Identificar ofertas já contratadas pelo usuário`.

**Resultado esperado:** na lista de ofertas do estabelecimento, o usuário deve identificar imediatamente quais ofertas possui contratadas, o estado da contratação e, quando disponível, seu saldo e sua validade. Ofertas não contratadas devem continuar com o visual e a navegação atuais.

## 2. Arquivos e fluxo existentes

Localize no repositório os arquivos reais (o caminho pode variar):

- `EstablishmentDetailScreen.jsx`: componente container que busca dados e passa props para o componente visual.
- `EstablishmentDetail.jsx`: componente visual que contém a aba “Planos e ofertas” e os cards.
- `estabelecimentoOfertaService`: fornece `listarPlanosEOfertas(estabelecimentoId)`.
- `EstabelecimentoOfertaDetail`: tela de destino ao tocar uma oferta.

Trechos observados do container original:

```jsx
const [activeTab, setActiveTab] = useState('sobre');
const [planos, setPlanos] = useState([]);
const [planosCarregados, setPlanosCarregados] = useState(false);
const [loadingPlanos, setLoadingPlanos] = useState(false);
const [planosError, setPlanosError] = useState('');

const buscarPlanos = useCallback(async () => {
  if (!gymResumo?.id) return;
  setLoadingPlanos(true);
  setPlanosError('');
  try {
    const data = await listarPlanosEOfertas(gymResumo.id);
    const lista = data?.response?.content ?? data?.response ?? [];
    setPlanos(lista);
    setPlanosCarregados(true);
  } catch (err) {
    setPlanosError(err.friendlyMessage || 'Não foi possível carregar os planos e ofertas.');
  } finally {
    setLoadingPlanos(false);
  }
}, [gymResumo?.id]);

const handleChangeTab = (tab) => {
  setActiveTab(tab);
  if (tab === 'planos' && !planosCarregados && !loadingPlanos) {
    buscarPlanos();
  }
};

const handleSelecionarOferta = (oferta) => {
  navigation.navigate('EstabelecimentoOfertaDetail', {
    ofertaId: oferta.id,
    ofertaResumo: oferta,
    estabelecimento: {
      id: estabelecimento?.id,
      name: estabelecimento?.name,
      image: estabelecimento?.image,
    },
  });
};
```

O componente visual recebe props como `planos`, `loadingPlanos`, `planosError`, `onRetryPlanos` e `onSelecionarOferta`. **Verifique os nomes e a implementação reais antes de modificar.**

## 3. Contrato de resposta sugerido

A proposta é **enriquecer cada oferta da resposta já existente**, sem criar uma chamada extra no aplicativo. Exemplo ilustrativo:

```json
{
  "id": 15,
  "nome": "Pacote 10 treinos",
  "tipo": { "codigo": "PACOTE", "descricao": "Pacote" },
  "valor": 120.00,
  "valorPromocional": 99.90,
  "contratacaoUsuario": {
    "id": 48,
    "situacao": "ATIVA",
    "quantidadeTotal": 10,
    "quantidadeDisponivel": 7,
    "dataValidade": "2026-11-30"
  }
}
```

**Atenção:** esse JSON é um **contrato proposto**, não a confirmação de que os campos já existem no backend. Conferir o DTO real antes de implementar qualquer adaptação. `contratacaoUsuario: null` indica que não há contratação relevante para destacar. Não inventar valores de saldo, validade ou status. Não tratar `0` como ausência de dado.

## 4. Regras de apresentação

### Contratação ativa

- Destacar discretamente o card com borda verde e, opcionalmente, fundo verde muito claro, sem descaracterizar a identidade visual azul do ConexPass.
- Exibir `✓ Você já contratou` no início do card.
- Se `quantidadeDisponivel` existir, mostrar **“N acessos disponíveis”**; se `quantidadeTotal` existir também, usar **“N de M acessos disponíveis”**.
- Se `dataValidade` existir, mostrar **“Válido até DD/MM/AAAA”**. Interpretar `YYYY-MM-DD` como data civil, evitando deslocamento por fuso horário.
- Se a contratação estiver ativa mas o saldo for `0`, mostrar **“Sem acessos disponíveis”**, sem sugerir que ainda pode utilizar.
- Continuar permitindo abrir o detalhe da oferta; não bloquear novas compras automaticamente.

### Pagamento pendente

- Mostrar marcador **“Pagamento pendente”** com estilo distinto do estado ativo (ex.: âmbar/neutro).
- Não mostrar “Você já contratou” como se a compra estivesse confirmada; não contabilizar como acesso disponível.

### Expirada, encerrada ou ausente

- Não destacar como contratação ativa.
- Exibir a oferta normalmente para consulta/compra, preservando preço e demais informações atuais.
- Não assumir que uma compra histórica significa acesso atual.

### Ordenação

- Mostrar **ofertas com contratação ativa primeiro**, preservando a ordem relativa das demais ofertas. Se houver pendentes, não misturá-las com as ativas. Preferir ordenação estável sem mutar o array recebido (`[...lista].sort(...)`).
- Não ocultar nenhuma oferta nem criar filtros novos nesta task.

### Tipos

- Conferir o mapeamento de tipos no componente visual. O backend pode usar `ASSINATURA` para recorrência; preservar compatibilidade com os tipos já usados no app (ex.: `RECORRENTE`, se existir), sem assumir que ambos são equivalentes sem verificar o contrato.

## 5. Implementação sugerida

1. Inspecionar `EstablishmentDetail.jsx` e encontrar o renderizador da aba `planos` e dos cards. **Modificar somente o necessário** para acrescentar os marcadores e o saldo/validade.
2. Inspecionar `EstablishmentDetailScreen.jsx` e manter `listarPlanosEOfertas(gymResumo.id)` e a navegação `EstabelecimentoOfertaDetail`.
3. Usar `oferta.contratacaoUsuario` para determinar o destaque; tratar `null`, campos ausentes e `situacao` com segurança. Conferir se o status chega como string ou objeto `{ codigo }`; adaptar ao contrato real.
4. Ordenar as ofertas para que as ativas apareçam primeiro, sem mutar o retorno original.
5. Garantir atualização da listagem ao retornar do detalhe/checkout, **somente quando a aba de planos já tiver sido carregada**, evitando requisições duplicadas. Usar mecanismo compatível com a versão de React Navigation instalada (`useFocusEffect`, `navigation.addListener('focus')` ou equivalente). Observar dependências de hooks e evitar loops de re-render.
6. Preservar `loading`, `error`, retry, navegação, demais abas, comentários, localização e estilos existentes.
7. Se o backend ainda não retornar `contratacaoUsuario`, manter comportamento anterior sem quebrar a UI; registrar claramente que a integração depende do backend.

## 6. Casos importantes de negócio

- **Pacote/avulso:** pode haver novas compras da mesma oferta. Não bloquear por já existir contratação.
- **Assinatura:** a existência de uma assinatura ativa não autoriza iniciar outra cobrança recorrente sem uma regra explícita; esta task é de **identificação visual**, não de política de compra.
- **Múltiplas contratações ativas da mesma oferta:** ainda é uma decisão de backend se o campo retornará uma contratação principal, uma lista ou saldo consolidado. Não somar saldos com vencimentos diferentes no frontend sem contrato definido.
- **Status pendente, expirado e encerrado:** os códigos exatos precisam ser confirmados no backend. Não assumir que o exemplo JSON já representa todos os estados reais.
- **Ofertas próprias do estabelecimento x assinatura compartilhada ConexPass:** não misturar saldos de contratos diferentes. O destaque pertence à oferta e à contratação associada.

## 7. Critérios de aceite / testes

- [ ] Oferta sem `contratacaoUsuario`: card original, preço e navegação intactos.
- [ ] Oferta com contratação `ATIVA`, saldo 7/10: marcador verde e “7 de 10 acessos disponíveis”.
- [ ] Contratação `ATIVA`, saldo `0`: “Sem acessos disponíveis”.
- [ ] Contratação `ATIVA`, sem campos de quantidade: marcador de contratação, sem número inventado.
- [ ] Data `2026-11-30`: exibir `30/11/2026`, sem alteração de dia por UTC.
- [ ] Contratação com pagamento pendente: marcador específico, sem alegar saldo utilizável.
- [ ] Contratação expirada/encerrada: oferta disponível visualmente como antes.
- [ ] Ativas no início da lista; demais preservam a ordem original.
- [ ] Ao voltar do detalhe/checkout, os dados são atualizados e não há chamadas repetidas em loop.
- [ ] Falha de API: mantém tratamento de erro e botão de tentar novamente.
- [ ] Navegação para `EstabelecimentoOfertaDetail` continua recebendo os parâmetros esperados.
- [ ] As abas “Sobre” e “Horários” e as demais funcionalidades não são afetadas.
- [ ] Executar lint, verificação de sintaxe/build disponíveis no repositório; corrigir erros introduzidos e informar testes que não puderam ser executados.

## 8. Instrução final ao Codex

**Faça as alterações diretamente no workspace do VS Code.** Antes de escrever código, localize os componentes reais e leia o trecho completo que renderiza os cards. Gere um diff pequeno e focado, não substitua arquivos inteiros e não utilize arquivos ZIP anteriores da conversa (eles apresentaram problemas). Após editar, apresente:

1. Arquivos efetivamente modificados.
2. Resumo das mudanças e campos de API utilizados.
3. Resultado de lint/build/testes disponíveis.
4. Pendências do backend, se `contratacaoUsuario` ainda não estiver implementado.

**Não implemente nesta task** mudanças na aba Check-ins, checkout, split de pagamento, criação de contratações ou alterações no modelo de dados do backend sem autorização adicional.
