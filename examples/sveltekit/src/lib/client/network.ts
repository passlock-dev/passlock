export type PostDataInput<A, E> = {
  url: string;
  body: object;
  method: 'POST' | 'PATCH' | 'DELETE';
  on2xx: (response: unknown) => A;
  orElse: (response: unknown) => E;
};

export const postData = async <A, E>({ url, method, body, on2xx, orElse }: PostDataInput<A, E>) => {
  const response = await fetch(url, {
    method,
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const jsonResponse = await response.json();

  return response.ok ? on2xx(jsonResponse) : orElse(jsonResponse);
};