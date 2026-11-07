// A API define disponibilidade, papel do registro e ações; a ordem da lista não importa.
export function validarAssinaturas(response) {
  if (
    !Array.isArray(response) ||
    response.some(
      (item) =>
        item?.id == null ||
        item?.plano?.id == null ||
        !['ATUAL', 'PROXIMO', 'PENDENTE'].includes(item.tipoRegistro) ||
        !item.situacao?.codigo ||
        !Array.isArray(item.acoesPermitidas)
    )
  ) {
    throw new Error(
      'Resposta de assinaturas incompatível. Atualize a situação ou tente novamente mais tarde.'
    );
  }
  if (
    new Set(response.map((a) => a.id)).size !== response.length ||
    response.filter((a) => a.tipoRegistro === 'ATUAL').length > 1
  ) {
    throw new Error('A lista de assinaturas contém registros inconsistentes.');
  }
  return response;
}

export function derivarPainel(assinaturas) {
  const planoAtual =
    assinaturas.find((a) => a.tipoRegistro === 'ATUAL') ?? null;
  const proximoPlano =
    assinaturas.find(
      (a) => a.tipoRegistro === 'PROXIMO' && a.situacao.codigo === 'AGENDADO'
    ) ?? null;
  const pagamentosPendentes = assinaturas.filter(
    (a) => a.id !== planoAtual?.id && a.id !== proximoPlano?.id
  );
  return {
    planoAtual,
    proximoPlano,
    pagamentosPendentes,
    semAssinatura: assinaturas.length === 0,
  };
}

export function permiteAcao(assinatura, acao) {
  return assinatura?.acoesPermitidas?.includes(acao) === true;
}

export function podeAlterarAtual(atual, proximo, pendentes) {
  return (
    atual?.podeUtilizar === true &&
    atual.renovacaoAutomatica === true &&
    permiteAcao(atual, 'CANCELAR_RENOVACAO') &&
    !proximo &&
    pendentes.length === 0
  );
}

export function podeAgendarProximo(atual, proximo, pendentes) {
  return (
    atual?.podeUtilizar === true &&
    atual.renovacaoAutomatica === false &&
    permiteAcao(atual, 'CONSULTAR') &&
    !proximo &&
    pendentes.length === 0
  );
}

// LocalDate/LocalDateTime sem offset: preservar a data civil enviada pela API.
export function formatarDataPlano(valor, comHora = false) {
  if (!valor) return 'Data não informada';
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(valor);
  if (!partes) return 'Data não informada';
  const [, ano, mes, dia, hora, minuto] = partes;
  return `${dia}/${mes}/${ano}${comHora && hora ? ` às ${hora}:${minuto}` : ''}`;
}

export function formatarValorPlano(valor) {
  return valor == null || valor === '' || !Number.isFinite(Number(valor))
    ? '—'
    : Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
}
