export const load = async ({ fetch }) => {
  const res = await fetch('/api/sales');
  const sales = await res.json();
  return { sales };
};