// A confirmação da assinatura depende da situação retornada pelo servidor.
export function obterEstadoAssinatura(assinatura) {
  const situacao = assinatura?.situacao?.codigo;
  const pagamento = assinatura?.pagamento?.situacao?.codigo;
  const confirmada = situacao === 'ATIVO';

  if (confirmada) {
    return {
      confirmada: true,
      icon: 'checkmark',
      color: '#16A34A',
      titulo: assinatura.alteracaoAgendada
        ? 'Alteração agendada!'
        : 'Assinatura confirmada!',
      mensagem: assinatura.alteracaoAgendada
        ? 'Sua alteração foi confirmada e entrará em vigor no próximo ciclo.'
        : 'Sua assinatura foi confirmada pelo servidor e está ativa.',
    };
  }

  const encerrada = [
    'RECUSADO',
    'CANCELADO',
    'INATIVO',
    'ENCERRADO',
    'VENCIDO',
    'ESTORNADO',
    'FALHA',
  ].includes(situacao);
  const pagamentoRecusado = [
    'RECUSADO',
    'CANCELADO',
    'ESTORNADO',
    'FALHA',
    'VENCIDO',
  ].includes(pagamento);
  if (encerrada || pagamentoRecusado) {
    return {
      confirmada: false,
      icon: 'alert-circle-outline',
      color: '#DC2626',
      titulo: 'Assinatura não confirmada',
      mensagem:
        'A assinatura ou o pagamento não foi aprovado ou foi encerrado. Consulte a situação da cobrança antes de tentar novamente.',
    };
  }

  return {
    confirmada: false,
    icon: 'time-outline',
    color: '#D97706',
    titulo: 'Aguardando confirmação',
    mensagem:
      'Recebemos sua solicitação. A contratação só será confirmada quando o servidor ativar a assinatura após a confirmação do pagamento.',
  };
}
