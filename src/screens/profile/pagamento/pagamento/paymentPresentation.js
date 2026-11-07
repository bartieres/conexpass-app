export function moeda(valor) {
  return valor == null || valor === '' || !Number.isFinite(Number(valor))
    ? '—'
    : Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
}

// Datas civis do backend não possuem offset. A data do pagamento não tem
// horário confiável, portanto o detalhe a apresenta somente como data.
export function dataPagamento(valor, comHora = false) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(
    valor || ''
  );
  if (!partes) return '—';
  const [, ano, mes, dia, hora, minuto] = partes;
  return `${dia}/${mes}/${ano}${comHora && hora ? ` às ${hora}:${minuto}` : ''}`;
}

export function apresentacaoSituacao(situacao) {
  const codigo = situacao?.codigo;
  if (codigo === 'CONFIRMADO')
    return {
      label: 'Pago',
      detail: 'Pagamento aprovado',
      icon: 'checkmark-circle',
      color: '#18752B',
      bg: '#E1F3E5',
    };
  if (codigo === 'RECUSADO')
    return {
      label: 'Recusado',
      detail: 'Pagamento recusado',
      icon: 'alert-circle',
      color: '#C51F32',
      bg: '#FFE5E9',
    };
  if (['PENDENTE', 'AGUARDANDO_CONFIRMACAO', 'PROCESSANDO'].includes(codigo))
    return {
      label: 'Pendente',
      detail: situacao?.descricao || 'Aguardando confirmação',
      icon: 'time-outline',
      color: '#94520A',
      bg: '#FFF1D1',
    };
  return {
    label: situacao?.descricao || 'Não informado',
    detail: situacao?.descricao || 'Situação não informada',
    icon: 'information-circle',
    color: '#596579',
    bg: '#EEF1F6',
  };
}

export function iconeOrigem(descricao) {
  const origem = (descricao || '').toLocaleLowerCase('pt-BR');
  if (origem.includes('avulso')) return 'ticket-outline';
  if (origem.includes('conexpass')) return 'ribbon-outline';
  if (origem.includes('estabelecimento')) return 'storefront-outline';
  return 'receipt-outline';
}
