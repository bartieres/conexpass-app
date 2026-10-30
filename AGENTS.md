# ConexPass — Instruções para o Codex

## 1. Sobre o projeto

O ConexPass é uma plataforma para descobrir estabelecimentos, experiências e atividades, permitindo adquirir acessos por assinatura, planos próprios dos estabelecimentos, compras avulsas e outros benefícios.

O aplicativo deve permitir explorar estabelecimentos sem exigir previamente um cartão de crédito.

## 2. Tecnologias

- React Native com Expo.
- JavaScript e componentes React.
- Comunicação com API REST em Java/Spring Boot.
- Autenticação JWT.
- Integração com serviços de localização.

Antes de sugerir dependências ou alterações, verificar as versões efetivamente instaladas no package.json.

## 3. Funcionalidades

O aplicativo possui ou prevê:

- Explorar estabelecimentos por proximidade e categoria.
- Consultar detalhes, horários e ofertas.
- Realizar check-ins e acompanhar seus estados.
- Consultar e contratar planos.
- Gerenciar formas de pagamento.
- Consultar histórico de acessos.
- Gerenciar perfil e dados pessoais.
- Futuramente, funcionalidades sociais e publicações de experiências.

Não presumir que todas as funcionalidades estão implementadas.

## 4. Regras de negócio

- O limite padrão de check-in é de um por dia, sujeito às regras do acesso contratado.
- O usuário poderá adquirir acessos avulsos sem assinatura recorrente.
- Planos próprios dos estabelecimentos e assinaturas compartilhadas são modalidades distintas.
- Quando aplicável, priorizar o consumo do plano próprio do estabelecimento.
- Upgrade de assinatura deve ocorrer imediatamente.
- Downgrade deve ser aplicado no próximo ciclo.
- A API é a fonte de verdade para autorização, disponibilidade e consumo de acessos.

## 5. Autenticação e integração

- Enviar o header X-Client-Type com valor APP.
- Utilizar Authorization Bearer para endpoints autenticados.
- Não armazenar credenciais sensíveis diretamente no código.
- Respeitar os interceptors e serviços de autenticação existentes.
- Não modificar contratos da API sem verificar o impacto.

## 6. Padrões de desenvolvimento

- Seguir a estrutura de pastas existente.
- Reutilizar componentes, hooks, services e estilos.
- Manter consistência com a identidade visual do ConexPass.
- Respeitar a paleta de cores definida no projeto.
- Evitar duplicação de lógica.
- Não instalar bibliotecas desnecessariamente.
- Não realizar refatorações fora do escopo solicitado.

## 7. Instruções obrigatórias ao Codex

Antes de implementar uma funcionalidade:

1. Analisar os arquivos envolvidos.
2. Identificar os componentes e serviços reutilizáveis.
3. Verificar possíveis impactos em outras telas.
4. Explicar brevemente a solução proposta.
5. Implementar somente as alterações solicitadas.
6. Verificar erros e executar testes disponíveis.
7. Informar os arquivos alterados e os testes realizados.

Nunca inventar endpoints, DTOs, propriedades ou regras de negócio sem verificar o código ou solicitar esclarecimento.

Responder sempre em português brasileiro. Manter nomes de classes, métodos, variáveis e componentes conforme os padrões existentes no projeto.