import { format, parseISO, isValid } from 'date-fns';

import constants from '../shared/constants';

const parseDate = (date) => {
  if (!date) return null;
  const parsed = parseISO(date.replace(' ', 'T'));
  return isValid(parsed) ? parsed : null;
};

export const dateToDateMasked = (date) => {
  const parsed = parseDate(date);
  return parsed ? format(parsed, constants.SETUP.dateFormat) : '';
};

export const dateTimeToDateMasked = (dateTime) => {
  const parsed = parseDate(dateTime);
  return parsed ? format(parsed, constants.SETUP.dateTimeFormat) : '';
};

// --- NAO UTILIZADO

/*export const dateMaskedToISO = (dateMasked) =>
  moment(dateMasked, constants.SETUP.dateFormat).toISOString();

export const dateTimeMaskedToISO = (dateMasked) =>
  moment(dateMasked, constants.SETUP.dateTimeFormat).toISOString(true);

export const currentDateMasked = (pattener = constants.SETUP.dateFormat) =>
  moment().format(pattener);

export const currentHoraMasked = (pattener = constants.SETUP.horaFormat) =>
  moment().format(pattener);

export const dateISOToDateTime = (ISOString) =>
  ISOString && moment(ISOString).format(constants.SETUP.dateTimeFormat);

export const beginDate = (
  dias = constants.SETUP.diasMesCompleto,
  pattener = constants.SETUP.dateFormat
) => moment().subtract(dias, 'days').format(pattener);*/
