// Format prix en FCFA (Sénégal)
export function formatXOF(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

// Normalise un numéro sénégalais en format international pour tel: links
// Accepte "77 123 45 67", "771234567", "+221 77 123 45 67", etc.
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("221")) return `tel:+${digits}`;
  // numéro local sénégalais 9 chiffres
  if (digits.length === 9) return `tel:+221${digits}`;
  return `tel:+${digits}`;
}

// Valide un numéro sénégalais (9 chiffres commençant par 7)
export function isValidSenegalPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("221") ? digits.slice(3) : digits;
  return /^7[05678]\d{7}$/.test(local);
}
