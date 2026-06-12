export function generateCode(prefix) {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 90 + 10);
  return `${prefix}${timestamp}${random}`;
}
