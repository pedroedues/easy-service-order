// Non-cryptographic FNV-1a variant — only used for a short, human-readable
// reference code printed on the PDF footer, not for verification.
export function shortHash(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(8, '0').slice(-8);
}
