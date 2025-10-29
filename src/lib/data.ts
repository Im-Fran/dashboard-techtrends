export interface Transaction {
  ID_Transaccion: string;
  Fecha: string;
  ID_Producto: string;
  Nombre_Producto: string;
  Categoria: string;
  Cantidad: number;
  Precio_Unitario: number;
  Total_Venta: number;
  Pais: string;
  Metodo_Pago: string;
}

export async function loadTransactions(): Promise<Transaction[]> {
  const response = await fetch('/data.csv');
  const text = await response.text();
  const lines = text.trim().split('\n');

  // Parse rows (skip header)
  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (sin comillas)
    const values = line.split(',').map(v => v.trim());

    const transaction: Transaction = {
      ID_Transaccion: values[0] || '',
      Fecha: values[1] || '',
      ID_Producto: values[2] || '',
      Nombre_Producto: values[3] || '',
      Categoria: values[4] || '',
      Cantidad: parseInt(values[5]) || 0,
      Precio_Unitario: parseFloat(values[6]) || 0,
      Total_Venta: parseFloat(values[7]) || 0,
      Pais: values[8] || '',
      Metodo_Pago: values[9] || '',
    };

    transactions.push(transaction);
  }

  return transactions;
}

export function calculateTotalSales(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.Total_Venta, 0);
}

export function calculateTotalTransactions(transactions: Transaction[]): number {
  return transactions.length;
}

export function calculateTotalQuantity(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.Cantidad, 0);
}

export function calculateAverageOrderValue(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;
  return calculateTotalSales(transactions) / transactions.length;
}

export function getSalesByCategory(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce((acc, t) => {
    acc[t.Categoria] = (acc[t.Categoria] || 0) + t.Total_Venta;
    return acc;
  }, {} as Record<string, number>);
}

export function getSalesByCountry(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce((acc, t) => {
    acc[t.Pais] = (acc[t.Pais] || 0) + t.Total_Venta;
    return acc;
  }, {} as Record<string, number>);
}

export function getSalesByPaymentMethod(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce((acc, t) => {
    acc[t.Metodo_Pago] = (acc[t.Metodo_Pago] || 0) + t.Total_Venta;
    return acc;
  }, {} as Record<string, number>);
}

export function getSalesOverTime(transactions: Transaction[]): Array<{ date: string; sales: number }> {
  const salesByDate = transactions.reduce((acc, t) => {
    acc[t.Fecha] = (acc[t.Fecha] || 0) + t.Total_Venta;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(salesByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, sales]) => ({ date, sales }));
}

export function getTopProducts(transactions: Transaction[], limit: number = 10): Array<{ name: string; sales: number; quantity: number }> {
  const productMap = transactions.reduce((acc, t) => {
    if (!acc[t.ID_Producto]) {
      acc[t.ID_Producto] = { name: t.Nombre_Producto, sales: 0, quantity: 0 };
    }
    acc[t.ID_Producto].sales += t.Total_Venta;
    acc[t.ID_Producto].quantity += t.Cantidad;
    return acc;
  }, {} as Record<string, { name: string; sales: number; quantity: number }>);

  return Object.values(productMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit);
}

