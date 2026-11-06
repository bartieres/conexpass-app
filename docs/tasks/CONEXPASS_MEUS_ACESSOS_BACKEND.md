# ConexPass — Especificação de Backend: Meus acessos (MVP)

> Documento de requisitos para análise e implementação pelo Codex no IntelliJ, no repositório `conexpass-api`.
> **Não presume nomes de entidades, campos, enums ou endpoints existentes.** O agente deve inspecionar o código e adaptar a proposta à arquitetura real, preservando convenções do projeto.

## 1. Objetivo

Criar a camada de consulta que alimentará a nova tela **Meus acessos** do aplicativo, substituindo o conceito de menu exclusivamente de check-ins. O menu é **consultivo**: não inicia check-in. A execução de check-in permanece **exclusivamente no detalhe do estabelecimento**.

A tela contém três abas:

1. **Ativos** — contratações vigentes e elegíveis, com informações de saldo/uso, validade e renovação.
2. **Pendentes** — contratações ainda não ativadas, especialmente por pagamento em processamento.
3. **Histórico** — histórico de solicitações de check-in e seus resultados, com filtros e paginação.

**Fora do escopo:** comunidade, seguir pessoas, notificações push, agendamentos, compra/renovação diretamente nesta tela, novo fluxo de check-in, novas regras de consumo.

## 2. Contexto e decisões já estabelecidas

- Ofertas próprias dos estabelecimentos podem ser `RECORRENTE`, `PACOTE` e `AVULSO`.
- Também existe assinatura ConexPass compartilhada, com elegibilidade e limites definidos por seu plano.
- O fluxo de check-in foi concluído e a origem do acesso consumido é selecionada pelo backend.
- Regra de prioridade já acordada: **contratações próprias elegíveis do estabelecimento primeiro**; entre elas, **saldo que expira primeiro**; empate: **AVULSO > PACOTE > RECORRENTE**; assinatura ConexPass como fallback quando não houver acesso próprio elegível.
- O saldo só é consumido após confirmação do estabelecimento; check-in recusado/expirado não consome saldo.
- O fluxo de solicitação e aprovação do check-in já existe; não deve ser duplicado nesta implementação.
- Contratações com pagamento pendente não podem aparecer como acesso utilizável.
- **Atenção:** a interface visual anterior é apenas conceitual. Não assumir acesso ilimitado ConexPass nem criar quantidade de acessos fictícia.

## 3. Contratos de domínio a inspecionar antes de codificar

Identificar no repositório:

- Entidades e serviços de contratação de ofertas próprias e de assinatura ConexPass.
- Situações reais de contratação, cobrança, pagamento, ciclo e check-in.
- Como o saldo disponível é calculado, especialmente para recorrentes, pacotes e avulsos.
- Como a validade de um pacote e o fim de ciclo de um recorrente são representados.
- Relacionamentos com estabelecimento, oferta, plano e usuário autenticado.
- Endpoint/DTO atual de histórico de check-ins, se existir.
- Estrutura de controllers, services, repositories, DTOs, filtros, paginação e tratamento de exceções.
- Identificador e rota existentes para navegar ao detalhe do estabelecimento.

**Não criar tabelas, enums ou migrações antes de verificar se os dados já estão disponíveis.** Preferir projeções/DTOs sobre entidades existentes. Não inferir `saldo` a partir do valor da oferta ou de contagens de check-ins sem validar a regra real.

## 4. Aba Ativos

### 4.1 Conteúdo

Cada item representa **uma contratação ativa** do usuário, não um check-in e não um estabelecimento agregado. Um usuário pode possuir mais de uma contratação no mesmo estabelecimento: retornar itens distintos com identificadores distintos.

Informações necessárias:

- ID da contratação, tipo/origem da contratação e situação.
- ID, nome e imagem do estabelecimento **quando a contratação estiver vinculada a um estabelecimento específico**.
- ID e nome da oferta ou plano contratado.
- Tipo de oferta (`RECORRENTE`, `PACOTE`, `AVULSO`) quando aplicável.
- Saldo disponível, quantidade total do ciclo/pacote e quantidade utilizada **somente quando esses números fizerem sentido e estiverem disponíveis**.
- Data de validade do saldo ou do contrato, e próxima renovação quando aplicável.
- Informação suficiente para o aplicativo navegar ao detalhe do estabelecimento (ID do estabelecimento; ID da oferta opcional).

### 4.2 Assinatura ConexPass

A assinatura compartilhada **não deve ser artificialmente duplicada para cada estabelecimento da rede**. Representá-la como uma contratação própria da plataforma, com `origem = CONEXPASS`, sem `estabelecimentoId` obrigatório. A lista de estabelecimentos elegíveis continua pertencendo ao fluxo de exploração/detalhe.

Não presumir acesso ilimitado. Se o plano tiver limites, expor os limites reais; se o backend não oferecer um saldo simples, retornar campos nulos e uma descrição de regra apropriada, sem inventar valores.

### 4.3 Contratações sem saldo

Distinguir **contrato ativo** de **acesso disponível**. Se o contrato continua ativo mas o saldo do ciclo está zerado, ele pode aparecer em Ativos com `podeUtilizar = false` e motivo específico, desde que isso corresponda à regra do domínio. Não rotular automaticamente como pendente ou expirado. Expor um campo derivado de elegibilidade apenas se o serviço existente permitir calcular corretamente.

### 4.4 Ordenação

Preferir contratos com acesso utilizável, depois os que expiram antes e, por fim, os mais recentes. A ordenação é sugestão, sujeita à validação da estrutura real.

## 5. Aba Pendentes

Esta aba é sobre **contratações em processamento**, não sobre check-ins aguardando aprovação.

Exibir:

- Contratação/oferta e estabelecimento quando aplicável.
- Situação real da contratação/pagamento, mapeada para um status público estável.
- Data da contratação e informação de atualização, se disponível.
- Mensagem orientativa, sem prometer prazo de confirmação não garantido.
- Navegação para o estabelecimento quando existir vínculo.

Possíveis situações a mapear conforme enums reais: aguardando pagamento, pagamento em análise, processamento/ativação. **Não incluir pagamento recusado, cancelado ou expirado como “pendente” sem uma decisão explícita de produto**; esses estados podem requerer um futuro histórico de contratações.

Não consultar gateway diretamente em cada abertura de tela. Usar o estado persistido e atualizado pelo fluxo de webhook já existente. Nunca retornar dados sensíveis do pagamento.

## 6. Aba Histórico

Exibir o histórico de **check-ins**, com os resultados persistidos:

- ID do check-in.
- Estabelecimento: ID, nome e imagem quando disponível.
- Data/hora da solicitação e da confirmação/recusa/expiração, conforme dados existentes.
- Situação real (`CONFIRMADO`, `RECUSADO`, `EXPIRADO` ou equivalentes existentes).
- Origem do acesso efetivamente selecionado/utilizado (`ESTABELECIMENTO` ou `CONEXPASS`) e identificação da contratação/oferta, se o check-in já registrar esses dados.
- Quantidade consumida: `1` somente quando efetivamente consumido; `0` para recusado/expirado. **Não inventar valor se o domínio não armazenar consumo dessa forma.**
- Navegação para o detalhe do estabelecimento quando possível.

Filtros: período inicial/final e origem (`TODAS`, `ESTABELECIMENTO`, `CONEXPASS`). Ordenar do mais recente para o mais antigo. Usar paginação; nunca carregar todo o histórico do usuário.

**Histórico de contratações encerradas/canceladas não faz parte desta aba no MVP**, salvo mudança explícita de escopo. Não misturar ciclo de vida de contratos com histórico de check-ins.

## 7. Proposta de API (adaptar às rotas existentes)

Preferir reutilizar controllers/serviços já existentes quando coerente. Uma alternativa é:

```http
GET /api/meus-acessos/ativos?page=0&size=20
GET /api/meus-acessos/pendentes?page=0&size=20
GET /api/meus-acessos/historico?page=0&size=20&dataInicio=2026-10-01&dataFim=2026-11-30&origem=TODAS
```

Apenas **sugestões de contrato**. Respeitar prefixos, nomenclatura, parâmetros e padrão de paginação reais do projeto. Se já existir endpoint de check-ins com filtros, ampliá-lo/reutilizá-lo em vez de criar duplicação.

### 7.1 Exemplo de resposta de Ativos (ilustrativo)

```json
{
  "content": [
    {
      "contratacaoId": 501,
      "origem": "ESTABELECIMENTO",
      "tipo": "PACOTE",
      "situacao": "ATIVO",
      "estabelecimento": { "id": 10, "nome": "Academia Exemplo", "imagemUrl": null },
      "oferta": { "id": 30, "nome": "Pacote Fitness" },
      "saldoDisponivel": 7,
      "quantidadeTotal": 10,
      "quantidadeUtilizada": 3,
      "validadeSaldo": "2026-12-20",
      "proximaRenovacao": null,
      "podeUtilizar": true
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1
}
```

### 7.2 Exemplo de resposta de Pendentes (ilustrativo)

```json
{
  "content": [
    {
      "contratacaoId": 502,
      "origem": "ESTABELECIMENTO",
      "tipo": "RECORRENTE",
      "situacao": "EM_PROCESSAMENTO",
      "estabelecimento": { "id": 11, "nome": "Estúdio Exemplo", "imagemUrl": null },
      "oferta": { "id": 31, "nome": "Pilates Mensal" },
      "contratadoEm": "2026-11-04T10:24:00",
      "mensagem": "Aguardando confirmação do pagamento"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1
}
```

### 7.3 Exemplo de resposta de Histórico (ilustrativo)

```json
{
  "content": [
    {
      "checkinId": 901,
      "estabelecimento": { "id": 10, "nome": "Academia Exemplo", "imagemUrl": null },
      "solicitadoEm": "2026-11-04T19:40:00",
      "finalizadoEm": "2026-11-04T19:42:00",
      "situacao": "CONFIRMADO",
      "origem": "ESTABELECIMENTO",
      "contratacaoId": 501,
      "ofertaNome": "Pacote Fitness",
      "quantidadeConsumida": 1
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1
}
```

Os JSONs são **referências funcionais**, não uma exigência de nomes de campos. Seguir os DTOs e a convenção de resposta já adotados no ConexPass.

## 8. Regras técnicas obrigatórias

1. **Segurança:** identificar usuário pelo contexto JWT/serviço de usuário autenticado. Nunca aceitar `usuarioId` livre na query para acessar dados de outro usuário. Respeitar `X-Client-Type: APP` e o perfil CLIENTE.
2. **Autorização:** todas as consultas devem filtrar pelo usuário autenticado; evitar vazamento de contratações e check-ins de terceiros.
3. **Sem efeitos colaterais:** endpoints GET não criam check-ins, não ativam contratos, não descontam saldo e não processam pagamentos.
4. **Consistência:** saldo mostrado deve vir da mesma fonte de verdade utilizada pelo fluxo de check-in já implementado.
5. **Desempenho:** evitar N+1 nas consultas de estabelecimento, oferta e contratos; usar projeções, joins/fetch apropriados e paginação.
6. **Datas:** manter semântica de datas/horários do domínio e contrato de timezone consistente; não calcular validade no app.
7. **Enums:** mapear estados existentes explicitamente; não assumir que `situacao` da oferta cadastrada equivale à situação da contratação do usuário.
8. **Compatibilidade:** preservar APIs já usadas no aplicativo e no portal; evitar alterações destrutivas.
9. **Tratamento de vazios:** retornar coleções vazias e metadados de paginação válidos quando não houver dados.
10. **Dados sensíveis:** não expor tokens, payloads de webhook, dados de cartão, identificadores internos de gateway desnecessários ou informações de outros clientes.

## 9. Cenários mínimos de teste

| Cenário | Resultado esperado |
|---|---|
| Usuário sem contratações | Ativos e Pendentes vazios |
| Pacote próprio ativo com saldo | Card em Ativos com saldo correto |
| Recorrente ativo no ciclo atual | Card com franquia do ciclo e renovação, se aplicável |
| Avulso comprado e ainda não utilizado | Card em Ativos, se elegível |
| Assinatura ConexPass ativa | Uma contratação ConexPass, sem duplicar por estabelecimento |
| Usuário com plano próprio e ConexPass | Ambos listados separadamente; não alterar prioridade do check-in |
| Duas contratações do mesmo estabelecimento | Dois cards com IDs diferentes |
| Pagamento aguardando webhook | Card em Pendentes; não utilizável |
| Webhook confirma pagamento | Contratação deixa Pendentes e passa a Ativos, conforme estado persistido |
| Pagamento recusado/cancelado | Não apresentar falsamente como pendente/ativo |
| Check-in confirmado | Histórico com origem correta e consumo persistido |
| Check-in recusado ou expirado | Histórico sem consumo de saldo |
| Contrato ativo com saldo zerado | Não informar que há acesso utilizável |
| Filtro por origem e período | Histórico restrito corretamente |
| Histórico extenso | Paginação estável e ordenação decrescente |
| Usuário A tenta consultar dados do B | Acesso negado ou dados não retornados |
| Abertura repetida da tela | Nenhuma mutação no saldo ou estado |

## 10. Plano de implementação solicitado ao Codex

**Primeira etapa: apenas análise, sem editar arquivos.**

1. Ler `AGENTS.md` e esta especificação.
2. Localizar controllers, entidades, DTOs, services, repositories e enums existentes.
3. Mapear campos reais para Ativos, Pendentes e Histórico; identificar dados faltantes.
4. Verificar se o histórico de check-in já expõe origem/contratação e se há necessidade real de migration.
5. Propor endpoints e DTOs aderentes ao padrão atual, indicando classes a criar/alterar.
6. Apontar decisões pendentes antes de implementar (por exemplo, contrato ativo sem saldo, renovação e situações de pagamento).
7. Apresentar plano incremental e testes previstos.

**Segunda etapa: implementar somente após aprovação do plano.** Priorizar reutilização, consultas read-only e testes automatizados. Não modificar a lógica de seleção/consumo de check-in já concluída, salvo correção explicitamente aprovada.

## 11. Critérios de aceite do MVP

- [ ] Usuário autenticado consulta suas contratações ativas e seus saldos reais.
- [ ] Usuário consulta contratações aguardando ativação/pagamento.
- [ ] Usuário consulta histórico paginado de check-ins com situação e filtros.
- [ ] Contratos próprios e assinatura ConexPass são identificados corretamente.
- [ ] Nenhum endpoint de Meus acessos inicia check-in ou consome saldo.
- [ ] O aplicativo recebe identificadores necessários para abrir o detalhe do estabelecimento.
- [ ] Não há duplicação de assinatura ConexPass por estabelecimento.
- [ ] Acesso a dados de outro usuário é impedido.
- [ ] Testes automatizados cobrem os principais cenários.
