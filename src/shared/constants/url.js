export const URL_PRODUCAO = {
  href: 'https://app.petmap.com.br',
  hostname: 'app.petmap.com.br',
  api: 'https://api.petmap.com.br'
};

export const URL_UAT = {
  href: 'https://portal.uat.conexpass.com.br',
  hostname: 'portal.uat.conexpass.com.br',
  api: 'https://api.uat.conexpass.com.br'
};

export const URL_LOCAL = {
  href: 'http://localhost:3010',
  hostname: 'localhost',
  api: 'http://192.168.0.59:8082' // IP da máquina na rede local (Expo Go em dispositivo físico)
};

export const LOCATION = (() => {
  const env = process.env.EXPO_PUBLIC_APP_ENV;

  switch (env) {
    case 'production':
      return URL_PRODUCAO;
    case 'uat':
      return URL_UAT;
    default:
      //return URL_UAT;
      return URL_LOCAL;
  }
})();
