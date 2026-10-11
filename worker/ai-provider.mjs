export function aiProviderForRequest(request, trustedCountry) {
  const country = String(trustedCountry || request?.cf?.country || '').trim().toUpperCase();
  return {
    id: 'doubao',
    name: '豆包',
    country: country || null,
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: '',
  };
}

export function aiProviderConfigured(provider, env) {
  return Boolean(env.DOUBAO_API_KEY && env.DOUBAO_MODEL);
}

export function aiProviderKey(provider, env) {
  return env.DOUBAO_API_KEY;
}

export function aiProviderModel(provider, env) {
  return String(env.DOUBAO_MODEL || '').trim();
}
