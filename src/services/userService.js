import { useAuth } from '../context/AuthContext';
import { api, ENDPOINTS } from '../config/api';

function onlyDigits(value = '') {
  return value.replace(/\D/g, '');
}

export const userService = {
  // GET /users/me -> dados atualizados do usuário
  async getProfile() {
    const { user } = useAuth();
    const { data } = await api.get(`${ENDPOINTS.me}/${user.id}`);
    return data;
  },

  // PUT /users/me { name, email, phone, birthDate } -> user atualizado
  // OBS: CPF normalmente não é editável depois do cadastro (regra comum),
  // por isso não é enviado aqui. Se seu backend permitir, é só incluir.
  async updateProfile({ name, email, phone, birthDate }) {
    const { data } = await api.put(ENDPOINTS.me, {
      name: name.trim(),
      email: email.trim(),
      phone: onlyDigits(phone),
      birthDate, // enviar em ISO (YYYY-MM-DD) se o backend exigir — ver observação abaixo
    });
    return data;
  },
};