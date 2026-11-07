# ConexPass App — Refatoração da tela Planos para lista de assinaturas

## Instruções ao Codex
Ler `AGENTS.md` e inspecionar `PlanScreen.jsx`, `Plan.jsx`, `assinaturaService`, `ChangePlanScreen`, navegação, theme, utilitários de data e outros consumidores de `getMeuPlano`. O código atual enviado pelo usuário usa `getMeuPlano()` e `response.plano` para montar **um único objeto `plano`**; o `Plan.jsx` recebido renderiza **um único card**, `SemAssinaturaCard`, menu `Alterar plano` e ação `Cancelar plano`. **Refatorar sem reescrever o design inteiro**, manter a paleta e os componentes do projeto. Não introduzir linhas vazias entre todas as linhas nem JSX inválido. Validar sintaxe e build quando o repositório estiver disponível.

## Comportamento final
- Tela `Planos` apresenta **Plano atual** (se existir), **Próximo plano** (se `SCHEDULED`), e estado de **pagamento em andamento** quando pertinente.
- Só um plano ConexPass pode estar **Em uso**. O atual com renovação cancelada **continua em uso até fim da vigência**.
- Card do próximo mostra `Agendado`, nome, valor opcional, início calculado pelo backend e texto: **“Cobrança programada para DD/MM/AAAA. O acesso será liberado após a confirmação do pagamento.”**
- Abaixo do próximo, somente: **`Alterar próximo plano`** e **`Cancelar próximo plano`**. Não mostrar `Alterar data ou plano`; não oferecer seleção manual de data.
- Cancelar próximo não afeta o atual. Ao confirmar, remover o card de próximo após resposta da API e recarregar lista.
- Plano atual sem cancelamento mantém `Alterar plano` e `Cancelar plano` (renovação). Após cancelar, mostrar **“Renovação cancelada”** e fim da vigência; não mostrar “Sua assinatura foi cancelada” como se o acesso tivesse acabado.
- Se o próximo já estiver `PROCESSING_PAYMENT` ou `PENDING_PAYMENT`, não exibir botões de alterar/cancelar agendamento como se fosse somente local. Mostrar status financeiro e botão `Atualizar situação` quando apropriado.
- Se não houver nenhum plano atual mas existir um próximo/pagamento pendente, **não** mostrar “Você ainda não tem uma assinatura” como único conteúdo; renderizar o registro pendente.
- `Planos` é a gestão de assinatura **compartilhada ConexPass**; ofertas próprias de estabelecimentos e seus check-ins continuam em `Meus Acessos`.

## Mudança de API
**Antes:** `getMeuPlano()` retorna um objeto em `data.response` com `plano` e `situacao`.

**Depois (contrato proposto):** `getMinhasAssinaturas()` ou nome coerente com serviço atual retorna `data.response` como **array** de assinaturas relevantes. Não assumir array dentro de `response.plano`; validar contrato real com backend. `response: []` é usuário sem assinatura.

Exemplo simplificado:
```json
{
  "response": [
    {
      "id": 101,
      "tipoRegistro": "ATUAL",
      "situacao": { "codigo": "CANCELAMENTO_AGENDADO" },
      "plano": { "id": 1, "nome": "Basic", "valor": 49.90, "beneficios": [] },
      "valor": 49.90,
      "inicioVigencia": "2026-11-01T00:00:00-03:00",
      "fimVigencia": "2026-12-01T00:00:00-03:00",
      "renovacaoAutomatica": false,
      "podeUtilizar": true,
      "acoesPermitidas": []
    },
    {
      "id": 102,
      "tipoRegistro": "PROXIMO",
      "situacao": { "codigo": "AGENDADO" },
      "plano": { "id": 3, "nome": "Premium", "valor": 119.90, "beneficios": [] },
      "inicioVigencia": "2026-12-01T00:00:00-03:00",
      "podeUtilizar": false,
      "acoesPermitidas": ["ALTERAR_PROXIMO", "CANCELAR_PROXIMO"]
    }
  ]
}
```
Valores e datas ilustrativos. Usar `tipoRegistro`/situação retornados pelo backend, nunca `response[0]` como plano atual. O backend deve definir se `fimVigencia` é exclusivo; exibir a última data de acesso corretamente, sem `new Date('YYYY-MM-DD')` interpretado em UTC incorretamente.

### Funções do assinaturaService
Adaptar nomes às rotas reais do backend:
```js
getMinhasAssinaturas()               // GET lista
cancelarRenovacao(assinaturaId)      // POST /{id}/cancel-renewal
agendarProximoPlano(planoId)         // POST /next
alterarProximoPlano(planoId)         // PUT /next
cancelarProximoPlano()               // DELETE /next
```
Preservar funções antigas se outros módulos as utilizam. Centralizar parsing do envelope HTTP e mensagens amigáveis de erro.

## Refatoração detalhada de PlanScreen.jsx
### Estado atual (código recebido)
```js
const [plano, setPlano] = useState(null);
const [temAssinatura, setTemAssinatura] = useState(true);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [cancelando, setCancelando] = useState(false);
const cancelandoRef = useRef(false);
```
`buscarPlano()` lê `getMeuPlano()`, verifica `response?.plano`, constrói objeto único e passa `plano`/`temAssinatura` ao componente visual. `handleCancelarPlano` usa `plano.assiantura.id` (há erro de digitação **`assiantura`**). `useFocusEffect` recarrega ao retornar da tela `ChangePlan`.

### Estado novo sugerido
```js
const [assinaturas, setAssinaturas] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [operacao, setOperacao] = useState(null); // null | 'CANCELAR_RENOVACAO' | 'CANCELAR_PROXIMO'
const operacaoRef = useRef(false);
```
Derivar `planoAtual`, `proximoPlano` e `pagamentoPendente` da lista com `tipoRegistro`/situação; **não** armazenar cada um em estado separado se puder derivar de `assinaturas`. Exemplo conceitual:
```js
const planoAtual = assinaturas.find(a => a.tipoRegistro === 'ATUAL') ?? null;
const proximoPlano = assinaturas.find(a => a.tipoRegistro === 'PROXIMO' && a.situacao?.codigo === 'AGENDADO') ?? null;
const pagamentoPendente = assinaturas.find(a =>
  ['PROCESSING_PAYMENT', 'PENDING_PAYMENT', 'AGUARDANDO_CONFIRMACAO'].includes(a.situacao?.codigo)
) ?? null;
const semAssinatura = assinaturas.length === 0;
```
Os códigos acima são **exemplo**; adaptar aos enums efetivos e garantir que registros históricos não entrem nessa lista. Evitar duplicar um mesmo registro em cards distintos.

### Carregamento
- Trocar `buscarPlano` por `buscarAssinaturas`, chamando `getMinhasAssinaturas()` e validando `Array.isArray(data?.response)`; se resposta incompatível, apresentar erro de integração, **não** tratar como lista vazia.
- Preservar `useFocusEffect` para atualização ao voltar de `ChangePlan`; evitar update após desmontagem/perda de foco e race entre requests (cancelamento ou contador de versão da requisição).
- Separar `loading` inicial de `operacao` para evitar ocultar todos os cards durante cancelamento; desabilitar somente ações conflitantes.
- Não interpretar falha de rede como usuário sem plano.

### Handlers e confirmação
- `handleCancelarRenovacao`: exigir `planoAtual.id`, verificar ação permitida e evitar requisições duplicadas. Alert:
  - título: `Cancelar renovação?`
  - mensagem: `Você continuará utilizando seu plano até DD/MM/AAAA. Depois dessa data, não haverá renovação automática.`
  - ação destrutiva: `Cancelar renovação`
  - sucesso: `Renovação cancelada. Seu plano continua disponível até DD/MM/AAAA.`
- `handleCancelarProximo`: exigir agendamento editável; Alert:
  - título: `Cancelar próximo plano?`
  - mensagem: `O plano agendado será removido. Seu plano atual não será alterado e continuará com a renovação cancelada.`
  - ação destrutiva: `Cancelar próximo plano`
  - sucesso: `Próximo plano cancelado.`
- `handleAlterarProximo`: navegar para `ChangePlan` com `{ modo: 'ALTERAR_PROXIMO', planoAgendadoId: proximoPlano.id, planoAtualId: planoAtual?.id }`; a tela deve selecionar outro plano e chamar `alterarProximoPlano(planoId)`. **Não** chamar fluxo existente de upgrade imediato por engano.
- `handleAlterarPlano`: para plano atual normal, manter navegação/semântica de troca existente (upgrade/downgrade). Se renovação cancelada e nenhum próximo, oferecer escolha de próximo plano e chamar `agendarProximoPlano(planoId)`; confirmar regra final com backend. Não inventar seleção manual de data.
- Após qualquer mutação, recarregar lista; se erro, manter UI consistente e exibir erro. Tratar `409` quando job iniciou cobrança: atualizar lista e informar usuário.

### Props para Plan.jsx
Substituir `plano`, `temAssinatura`, `onCancelarPlano` por:
```jsx
<Plan
  navigation={navigation}
  planoAtual={planoAtual}
  proximoPlano={proximoPlano}
  pagamentoPendente={pagamentoPendente}
  semAssinatura={semAssinatura}
  loading={loading}
  operacao={operacao}
  error={error}
  onRetry={buscarAssinaturas}
  onAlterarPlano={handleAlterarPlano}
  onEscolherPlano={handleEscolherPlano}
  onCancelarRenovacao={handleCancelarRenovacao}
  onAlterarProximo={handleAlterarProximo}
  onCancelarProximo={handleCancelarProximo}
/>
```
Ajustar props de `Plan.jsx` e chamadas reais de maneira sincronizada. Corrigir `assiantura` para `assinatura` ou, preferencialmente, utilizar diretamente `id` da assinatura para não confundir `plano.id` com `assinatura.id`.

## Refatoração detalhada de Plan.jsx (arquivo fornecido)
O arquivo recebido contém `SemAssinaturaCard`, `MenuRow`, `formatarMoeda`, badge `Ativo/Inativo/Aguardando confirmação`, informações de contratação e próxima cobrança, benefícios, `Alterar plano` e `Gerenciar assinatura/Cancelar plano`.

### Novo layout
1. **Título:** `Planos` (manter).
2. **Plano atual:** card semelhante ao `resumoCard` atual; mostrar nome, preço, benefícios e vigência; badge `Em uso` quando utilizável. Se `renovacaoAutomatica === false` e ainda utilizável, adicionar aviso amarelo **`Renovação cancelada`** com data de fim. Não exibir `Próxima cobrança` se não haverá renovação.
3. **Próximo plano:** segundo card apenas quando agendado; badge azul `Agendado`, nome, data de início e aviso de cobrança futura; botões `Alterar próximo plano` (contorno azul) e `Cancelar próximo plano` (contorno vermelho). Sem botão para editar data.
4. **Pagamento pendente:** card separado ou estado no lugar do agendamento quando job já começou; badge `Aguardando pagamento`, texto `Acesso liberado após confirmação do pagamento`, atualização de situação; **sem botões de alteração de agendamento**.
5. **Sem assinatura:** manter `SemAssinaturaCard` apenas se a lista vier realmente vazia; preservar CTA `Escolher plano`.
6. **Ações do atual:** manter `Alterar plano` apenas se permitido pelo estado; renomear ação de cancelamento para **`Cancelar renovação`**. Após cancelar, substituir ação por texto informativo, não permitir cancelar repetidamente.
7. **Erros/loading:** manter padrões visuais existentes, com botão de tentar novamente.

### Ajustes pontuais obrigatórios
- Remover `aguardandoConfirmacao` global derivado de um único `plano`; estado de pagamento é **por assinatura**.
- Não exibir badge `Inativo` para assinatura atual que ainda está utilizável mas com renovação cancelada.
- `dateToDateMasked` deve lidar com `null` e timezone. Não renderizar `Próxima cobrança: — R$` quando não existir.
- `formatarMoeda` deve usar valor da assinatura retornado pelo backend, não presumir que `plano.valor` equivale a valor contratado em todos os casos.
- `MenuRow` e estilos podem ser reutilizados. Novos estilos para card agendado e ações; manter tipografia, sombras, ícones e cores do tema.
- Não introduzir `PlanHistory`, pagamentos ou forma de pagamento nessa tela se a navegação atual não os exibe; preservar rotas existentes sem inventar menus.

## ChangePlanScreen — diferença essencial entre operações
O fluxo deve receber `modo` explícito:
- `ESCOLHER`: usuário sem assinatura; contratação imediata existente.
- `ALTERAR_ATUAL`: troca do plano atual conforme regras existentes (upgrade imediato/pró-rata, downgrade futuro se já suportado).
- `AGENDAR_PROXIMO`: usuário com plano vigente e renovação cancelada, sem próximo; ao confirmar chama `POST /next`.
- `ALTERAR_PROXIMO`: usuário com próximo agendado; ao confirmar chama `PUT /next`, preservando data calculada pelo backend.

Não permitir que `ALTERAR_PROXIMO` invoque pagamento imediato nem que `ALTERAR_ATUAL` crie um segundo plano utilizável. Mostrar resumo antes de confirmar: nome do plano, preço e **data de início calculada**, deixando claro que **não há cobrança hoje** para agendamento.

## Matriz de renderização e ações
| Cenário | Cards | Ações |
|---|---|---|
| Sem assinatura | Sem assinatura | Escolher plano |
| Plano atual renovável | Atual | Alterar plano, Cancelar renovação |
| Atual com renovação cancelada | Atual + aviso | Agendar próximo plano (via escolha de plano) |
| Atual cancelado + próximo agendado | Atual + Próximo | Alterar próximo plano, Cancelar próximo plano |
| Atual terminou + próximo em cobrança | Aguardando pagamento | Atualizar situação; sem acesso até confirmação |
| Próximo cancelado | Atual + aviso (se vigente) | Agendar outro, ou ficar sem plano ao vencer |
| Pagamento confirmado | Novo atual | Gestão normal do novo plano; anterior somente histórico |
| Falha API | Erro | Tentar novamente |

## Testes e critérios de aceite
1. `response: []` mostra CTA; `response` objeto indevido mostra erro, não “sem plano”.
2. Lista fora de ordem identifica atual/próximo corretamente.
3. Atual cancelado ainda exibe `Em uso`, não mostra próxima cobrança, nem some da tela antes do vencimento.
4. Dois cards apenas quando há atual e próximo; somente próximo possui `Alterar próximo plano` e `Cancelar próximo plano`.
5. Cancelar próximo não chama `cancelarRenovacao` nem remove atual.
6. Alterar próximo usa `PUT /next` e não aciona fluxo de upgrade/pró-rata.
7. Enquanto pagamento está pendente, nenhum card afirma acesso liberado; refresh atualiza estado.
8. Ações bloqueadas contra duplo toque, respostas fora de ordem, erros 409/401/5xx e rede offline.
9. `useFocusEffect` atualiza ao retornar de ChangePlan.
10. Validar sintaxe JSX e executar lint/testes/build Expo disponíveis; reportar qualquer limitação. **Não entregar arquivos com linhas vazias alternadas, escapes de JSX (`\\<View`) ou tags desbalanceadas.**

## Ordem sugerida de implementação
1. Confirmar contrato final de GET lista e endpoints de agendamento com backend.
2. Atualizar `assinaturaService`.
3. Refatorar `PlanScreen.jsx` e `Plan.jsx` em conjunto.
4. Diferenciar modos de `ChangePlanScreen` e integrar POST/PUT.
5. Testar estados, navegação, concorrência e build.
