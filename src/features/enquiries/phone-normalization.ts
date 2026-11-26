export function getPhoneLookupValues(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('0')) {
    const international = `+27${digits.slice(1)}`;
    return {
      canonical: international,
      lookupValues: [international, international.slice(1), digits]
    };
  }

  if (digits.length === 11 && digits.startsWith('27')) {
    const international = `+${digits}`;
    const local = `0${digits.slice(2)}`;
    return {
      canonical: international,
      lookupValues: [international, digits, local]
    };
  }

  const canonical = trimmed.startsWith('+') ? `+${digits}` : digits;
  return {
    canonical,
    lookupValues: [...new Set([canonical, digits, `+${digits}`])]
  };
}
