export const URL_PRODUCAO = {
  href: 'https://app.petmap.com.br',
  hostname: 'app.petmap.com.br',
  api: 'https://api.petmap.com.br'
};

export const URL_LOCAL_PRODUCAO = {
  href: 'http://localhost:3010',
  hostname: 'localhost',
  api: 'http://api.petmap.com.br'
};

export const URL_LOCAL = {
  href: 'http://localhost:3010',
  hostname: 'localhost',
  api: 'http://localhost:8082'
};

export const LOCATION = (() => {
  const env = import.meta.env.REACT_APP_ENV;

  switch (env) {
    case 'PRODUCAO':
      return URL_PRODUCAO;
    case 'URL_LOCAL_PRODUCAO':
      return URL_LOCAL_PRODUCAO;
    default:
      return URL_LOCAL;
  }
})();
