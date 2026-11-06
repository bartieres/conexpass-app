# ConexPass — Refresh Token | Aplicativo (`conexpass-app`)

## Objetivo
Manter o cliente autenticado entre aberturas do app e renovar silenciosamente o Access Token expirado. **Não transformar falha de internet em logout.** Este documento descreve a implementação desejada; adaptar ao código existente após leitura de `AGENTS.md`.

## Dependência do backend
Implementar somente após confirmar contrato real de `POST /api/auth/login`, `/api/auth/refresh` e `/api/auth/logout`. Proposta: `X-Client-Type: APP`; refresh enviado no corpo; resposta com `accessToken`, `refreshToken`, `expiresIn` (ou envelope atual). Não presumir campos diferentes sem verificar o backend.

## Armazenamento e inicialização
- Usar `expo-secure-store` para **Refresh Token**; não usar `AsyncStorage` para tokens.
- Manter Access Token **em memória** durante o uso; se for persistido por necessidade de arquitetura, justificar e revisar risco.
- Ao abrir o app, exibir estado de restauração/splash: recuperar refresh do SecureStore, chamar `/api/auth/refresh` e só então escolher navegação autenticada ou login.
- Se refresh válido: guardar novo refresh no SecureStore, atualizar access em memória e abrir fluxo autenticado.
- Se refresh inválido/revogado/expirado (401 de sessão): limpar credenciais e abrir login.
- Se falha de rede/timeout/5xx: **não apagar refresh**, exibir estado de conexão/retry e permitir nova tentativa. Não assumir sessão válida para operações protegidas sem access válido.
- O SecureStore pode perder conteúdo em reinstalação, troca de aparelho ou mudanças no armazenamento seguro: nesse caso pedir login normalmente.

## Cliente HTTP / interceptor
1. Enviar `Authorization: Bearer <access>` e `X-Client-Type: APP` em requisições autenticadas.
2. Ao receber **401 por access expirado**, iniciar uma única Promise de refresh compartilhada entre chamadas concorrentes (`single-flight`); outras aguardam a mesma Promise.
3. A chamada de refresh deve usar cliente HTTP **sem interceptor recursivo**; não tentar refresh do próprio endpoint refresh/login.
4. Se refresh tiver sucesso, substituir os tokens **na ordem correta**, persistindo o novo refresh antes de liberar requisições aguardando, atualizar access e repetir cada request original **uma única vez**.
5. Se refresh retornar 401 definitivo, limpar sessão e navegar para login uma única vez.
6. Se refresh falhar por rede/5xx, preservar SecureStore, rejeitar a chamada com erro recuperável e permitir retry futuro.
7. **Não** renovar em 403; nem em qualquer 401 indistintamente: usar código do backend para distinguir expiração de access de outras causas.
8. Evitar corrida com logout: ao sair, invalidar geração/estado da sessão local para impedir que refresh em andamento regrave tokens ou reabra navegação autenticada.

## Logout
- Chamar backend para revogar refresh/sessão (conforme contrato).
- Apagar access em memória e refresh no SecureStore, inclusive se a API estiver indisponível (logout local imediato; informar que revogação remota pode falhar e exigir política de retry).
- Limpar dados privados em cache, estado de usuário e navegação autenticada.
- Nunca deixar refresh/token em logs, analytics, crash reports ou mensagens de erro.

## Integração com o ConexPass
- Preservar fluxo de check-in, polling de 3 segundos e timeout de 2 minutos; refresh deve ocorrer sem reiniciar a operação ou criar check-in duplicado.
- Para requisições mutáveis como criar check-in ou checkout, repetir automaticamente somente quando seguro; avaliar chave de idempotência e se o servidor executou a operação antes do 401. Evitar dupla compra/duplo check-in.
- Ao voltar do background, validar/renovar sessão se necessário; não fazer refresh a cada renderização ou a cada request.
- Manter o usuário na tela atual quando refresh funcionar; não redirecionar para login durante renovação.
- Não usar a aba `Pendentes` de Meus acessos como status de autenticação; ela permanece dedicada a contratações aguardando pagamento/ativação.

## Testes e critérios de aceite
- Fechar/reabrir app com refresh válido -> entra sem senha.
- Access expira com app aberto -> refresh silencioso e request reexecutada uma vez.
- 5 requests simultâneas com 401 -> apenas **1 refresh**.
- Refresh expirado/revogado -> limpa sessão e mostra login.
- Sem internet/500 no refresh -> mantém refresh salvo e mostra opção de tentar novamente.
- Logout durante refresh -> não restaura sessão.
- Rejeição 403 -> não tenta refresh.
- Check-in/checkout -> não duplica ação por renovação.
- Confirmar build/testes no ambiente real; não alegar validação sem executar.

## Prompt para Codex
> Leia `AGENTS.md` e este arquivo. Inspecione o provider/context de autenticação, serviço HTTP, interceptors, navegação e persistência atuais. Apresente primeiro plano de alterações e contrato esperado do backend. **Não altere arquivos antes da minha aprovação.** Depois implemente com mudanças mínimas, testes de concorrência e restauração de sessão; reporte testes realmente executados.
