// ==============================================================================
// NEXA — Portuguese Formatters & Localization Helpers
// ==============================================================================

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

export function formatDocument(doc: string | null | undefined): string {
  if (!doc) return '—';
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) {
    // CPF: 000.000.000-00
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  if (clean.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
  }
  return doc;
}

export function getDaysInactive(lastPurchaseDate: string | null | undefined): number | null {
  if (!lastPurchaseDate) return null;
  try {
    const last = new Date(lastPurchaseDate).getTime();
    const now = new Date().getTime();
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  } catch {
    return null;
  }
}

export function formatDaysInactiveText(days: number | null): string {
  if (days === null) return 'Nenhuma compra';
  if (days === 0) return 'Comprou hoje';
  if (days === 1) return 'Inativo há 1 dia';
  return `Inativo há ${days} dias`;
}
