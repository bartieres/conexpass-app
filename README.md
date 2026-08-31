# ConexPass — App Mobile (React Native + Expo)

Projeto mobile do ConexPass (Android/iOS) gerado a partir do mockup de telas
"Modelos de Telas do Aplicativo", mantendo a identidade visual azul da marca
(`#2B6CE0` / `#1B3FAE` / `#3B82F6`) e fidelidade a layout, textos e ícones.

## Como rodar

```bash
npm install
npx expo start
```

Abra no celular com o app **Expo Go** (Android/iOS) escaneando o QR Code no
terminal, ou pressione `a` / `i` no terminal para emulador Android/iOS.

> Dica (conforme já validado no projeto): se você não tem o Android Studio
> instalado, prefira testar num **dispositivo físico com Expo Go** em vez do
> emulador Android.

## Estrutura

```
App.js                          -> Stack raiz (Login/Register/ForgotPassword/MainTabs)
src/theme/theme.js               -> Cores, espaçamentos, tipografia (paleta oficial)
src/data/mock.js                 -> Dados mock (academias, histórico, planos, usuário)
src/components/BottomNav.js      -> Tab bar customizada (Explorar/Histórico/Check-in/Planos/Perfil)
src/navigation/MainTabs.js       -> Bottom tabs + stacks aninhados
src/screens/
  LoginScreen.js                 -> Login (e-mail/CPF + senha, social login)
  RegisterScreen.js              -> Criar conta (com máscara de CPF)
  ForgotPasswordScreen.js        -> Recuperação de senha
  ExploreScreen.js                -> Explorar (Lista/Mapa, categorias, busca)
  EstablishmentDetailScreen.js   -> Detalhes do estabelecimento
  HistoryScreen.js                -> Histórico (Check-ins/Visitas)
  CheckInScreen.js                -> Check-in com QR Code
  CheckInSuccessScreen.js        -> Confirmação de check-in
  PlanScreen.js                   -> Meu Plano (uso diário, progresso)
  PlansScreen.js                  -> Planos (Básico/Premium, mensal/anual)
  ProfileScreen.js                -> Perfil (menu de conta)
  FiltersScreen.js                -> Filtros (categoria, distância, avaliação, ordenação)
```

## Autenticação com o backend (real, não mais mock)

O app agora chama de fato o backend **Java + Spring Boot** para autenticação:

```
src/config/api.js       -> URL base da API + endpoints
src/services/api.js      -> instância axios (injeta token JWT, trata erros/401)
src/services/authService.js -> login / register / forgotPassword / getMe / logout
src/context/AuthContext.js  -> estado global de sessão (useAuth())
src/screens/SplashLoadingScreen.js -> tela exibida enquanto valida o token salvo
```

**Fluxo:**
1. Ao abrir o app, o `AuthContext` verifica se há um token salvo no
   `expo-secure-store`. Se houver, chama `GET /users/me` para validar; se o
   backend confirmar, o usuário entra direto (sem precisar logar de novo).
2. `LoginScreen` chama `POST /auth/login` (aceita e-mail ou CPF); em caso de
   sucesso, o `AuthContext` guarda o token e o app troca sozinho para
   `MainTabs` (não há mais `navigation.replace` manual).
3. `RegisterScreen` chama `POST /auth/register`.
4. `ForgotPasswordScreen` chama `POST /auth/forgot-password`.
5. `ProfileScreen` → "Sair da conta" chama `logout()`, que apaga o token do
   SecureStore e volta para a tela de Login.
6. Qualquer chamada futura que responda **401** desloga o usuário
   automaticamente (interceptor em `services/api.js`).

**Antes de rodar, ajuste `src/config/api.js`:**
- Emulador Android → `http://10.0.2.2:8080/api`
- Dispositivo físico (Expo Go) → IP da sua máquina na mesma Wi-Fi, ex:
  `http://192.168.0.15:8080/api`
- Produção → domínio real da API

**Contrato REST assumido** (ajuste no backend Spring Boot se os campos forem
diferentes):

| Endpoint | Método | Body | Retorno |
|---|---|---|---|
| `/auth/login` | POST | `{ email\|cpf, password }` | `{ token, user }` |
| `/auth/register` | POST | `{ name, email, cpf, password }` | `{ token, user }` |
| `/auth/forgot-password` | POST | `{ email }` | `{ message }` |
| `/users/me` | GET (Bearer token) | — | `user` |

As demais telas (Explorar, Histórico, Planos, Check-in) **continuam usando
dados mock** (`src/data/mock.js`) — é o próximo passo natural: trocar cada
mock pelas chamadas reais em `/gyms`, `/checkins`, `/plans`, etc., seguindo o
mesmo padrão de `services/authService.js` (um arquivo de serviço por
domínio, chamando a instância `api` já configurada com o token).



- **Mapa**: a tela "Mapa" usa uma área estilizada com pins posicionados (sem
  dependência de `react-native-maps`/chave de API), para funcionar direto no
  Expo Go sem configuração nativa adicional. Se quiser um mapa real do
  Google/Apple Maps, dá para trocar por `react-native-maps` depois (requer
  build nativo / EAS, não funciona no Expo Go gerenciado sem dev client).
- **Check-in por QR Code**: o mockup mostra check-in via QR Code
  (`react-native-qrcode-svg`). Isso é diferente do fluxo combinado
  anteriormente para o MVP (check-in manual: usuário solicita no app, e a
  recepção aprova pelo painel, sem QR/hardware). Mantive fiel à imagem que
  você enviou agora — se o MVP real deve ser só o fluxo manual, me avise que
  eu adapto a tela de Check-in para um botão "Solicitar check-in" com status
  pendente/aprovado em vez do QR Code.
- Todas as telas usam dados mock (`src/data/mock.js`) — é só trocar pelas
  chamadas reais da sua API Spring Boot quando o backend estiver pronto.
- Paleta, ícones (Ionicons) e nomes de tela seguem exatamente os textos do
  mockup (Explorar, Detalhes do Estabelecimento, Histórico, etc.).
