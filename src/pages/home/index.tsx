import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, loadTransactions, calculateTotalSales, calculateTotalTransactions, calculateTotalQuantity, calculateAverageOrderValue } from '@/lib/data';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react';

export const Home = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  const totalSales = calculateTotalSales(transactions);
  const totalTransactions = calculateTotalTransactions(transactions);
  const totalQuantity = calculateTotalQuantity(transactions);
  const averageOrderValue = calculateAverageOrderValue(transactions);

  const statCards = [
    {
      title: 'Ventas Totales',
      value: formatCurrency(totalSales),
      description: 'Ingresos totales del período',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Transacciones',
      value: totalTransactions.toLocaleString('es-cl'),
      description: 'Total de órdenes realizadas',
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Unidades Vendidas',
      value: totalQuantity.toLocaleString('es-cl'),
      description: 'Cantidad total de productos',
      icon: Package,
      color: 'text-purple-600',
    },
    {
      title: 'Transacción Promedio',
      value: formatCurrency(averageOrderValue),
      description: 'Valor promedio por transacción',
      icon: TrendingUp,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard TechTrends</h1>
        <p className="text-gray-600 mt-2">Resumen de ventas y estadísticas generales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>Datos del período 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-l-4 border-green-600 pl-4">
              <p className="text-sm text-gray-600">Total de Ventas</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4">
              <p className="text-sm text-gray-600">Número de Transacciones</p>
              <p className="text-2xl font-bold">{totalTransactions.toLocaleString('es-cl')}</p>
            </div>
            <div className="border-l-4 border-purple-600 pl-4">
              <p className="text-sm text-gray-600">Unidades Vendidas</p>
              <p className="text-2xl font-bold">{totalQuantity.toLocaleString('es-cl')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

