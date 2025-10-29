import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Transaction,
  loadTransactions,
  getSalesByPaymentMethod,
} from '@/lib/data';
import { formatCurrency } from '@/lib/currency';
import { exportChartAsImage } from '@/lib/export';
import { Download } from 'lucide-react';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
];

// Función para obtener ventas mensuales
function getMonthlySales(transactions: Transaction[]): Array<{ month: string; sales: number }> {
  const salesByMonth: Record<string, number> = {};

  transactions.forEach(t => {
    const month = dayjs(t.Fecha).format('YYYY-MM');
    salesByMonth[month] = (salesByMonth[month] || 0) + t.Total_Venta;
  });

  return Object.entries(salesByMonth)
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([month, sales]) => ({
      month: dayjs(month).locale('es').format('MMM YYYY'),
      sales: parseFloat(sales.toFixed(2)),
    }));
}

// Función para obtener top 5 productos por venta total
function getTop5ProductsByRevenue(transactions: Transaction[]): Array<{ name: string; sales: number; quantity: number }> {
  const productMap: Record<string, { name: string; sales: number; quantity: number }> = {};

  transactions.forEach(t => {
    if (!productMap[t.ID_Producto]) {
      productMap[t.ID_Producto] = { name: t.Nombre_Producto, sales: 0, quantity: 0 };
    }
    productMap[t.ID_Producto].sales += t.Total_Venta;
    productMap[t.ID_Producto].quantity += t.Cantidad;
  });

  return Object.values(productMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map(product => ({
      name: product.name.length > 20 ? product.name.substring(0, 17) + '...' : product.name,
      sales: parseFloat(product.sales.toFixed(2)),
      quantity: product.quantity,
    }));
}

export const StatsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

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

  const handleExport = async (elementId: string, fileName: string) => {
    setExporting(elementId);
    try {
      await exportChartAsImage(elementId, fileName);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  // Prepare data
  const monthlySalesData = getMonthlySales(transactions);
  const top5ProductsData = getTop5ProductsByRevenue(transactions);
  const paymentMethodData = getSalesByPaymentMethod(transactions);

  const paymentData = Object.entries(paymentMethodData)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas y Análisis</h1>
        <p className="text-gray-600 mt-2">
          Visualización detallada del desempeño de ventas
        </p>
      </div>

      {/* Monthly Sales Line Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ventas Totales Mensuales</CardTitle>
            <CardDescription>Evolución de ventas mes a mes</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('monthly-sales-chart', 'ventas-mensuales')}
            disabled={exporting === 'monthly-sales-chart'}
            className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting === 'monthly-sales-chart' ? 'Exportando...' : 'Exportar'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="w-full h-96" id="monthly-sales-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #000',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                  
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#0088FE"
                  strokeWidth={2}
                  name="Ventas"
                  dot={{ fill: '#0088FE', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products Bar Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top 5 Productos Más Vendidos</CardTitle>
              <CardDescription>Por total de ventas</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('top5-products-chart', 'top5-productos')}
              disabled={exporting === 'top5-products-chart'}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'top5-products-chart' ? 'Exportando...' : 'Exportar'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80" id="top5-products-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top5ProductsData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #000',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#00C49F" name="Ventas" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Pie Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Distribución de Métodos de Pago</CardTitle>
              <CardDescription>Proporción de ventas por método</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('payment-methods-chart', 'metodos-pago')}
              disabled={exporting === 'payment-methods-chart'}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting === 'payment-methods-chart' ? 'Exportando...' : 'Exportar'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80" id="payment-methods-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name}: ${((value as number / paymentData.reduce((sum, p) => sum + p.value, 0)) * 100).toFixed(1)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #000',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Products Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles de Top 5 Productos</CardTitle>
          <CardDescription>Información detallada de los productos más vendidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {top5ProductsData.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">Cantidad: {product.quantity} unidades</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-green-600">{formatCurrency(product.sales)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

