import { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Transaction, loadTransactions } from '@/lib/data';
import { formatCurrency } from '@/lib/currency';
import { Search, X, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';

export const TablePage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterCountries, setFilterCountries] = useState<Set<string>>(new Set());
  const [filterPayments, setFilterPayments] = useState<Set<string>>(new Set());
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedFilters, setExpandedFilters] = useState<{
    categories: boolean;
    countries: boolean;
    payments: boolean;
    dates: boolean;
  }>({
    categories: false,
    countries: false,
    payments: false,
    dates: false,
  });

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

  // Get unique values for filters
  const categories = useMemo(
    () => [...new Set(transactions.map(t => t.Categoria))].sort(),
    [transactions]
  );
  const countries = useMemo(
    () => [...new Set(transactions.map(t => t.Pais))].sort(),
    [transactions]
  );
  const paymentMethods = useMemo(
    () => [...new Set(transactions.map(t => t.Metodo_Pago))].sort(),
    [transactions]
  );

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      const matchesSearch =
        t.ID_Transaccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.Nombre_Producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.Pais.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategories.size === 0 || filterCategories.has(t.Categoria);
      const matchesCountry = filterCountries.size === 0 || filterCountries.has(t.Pais);
      const matchesPayment = filterPayments.size === 0 || filterPayments.has(t.Metodo_Pago);

      let matchesDate = true;
      if (filterDateStart || filterDateEnd) {
        const transactionDate = new Date(t.Fecha);
        if (filterDateStart) {
          const startDate = new Date(filterDateStart);
          matchesDate = matchesDate && transactionDate >= startDate;
        }
        if (filterDateEnd) {
          const endDate = new Date(filterDateEnd);
          endDate.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && transactionDate <= endDate;
        }
      }

      return matchesSearch && matchesCategory && matchesCountry && matchesPayment && matchesDate;
    });

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        switch (sortColumn) {
          case 'ID_Transaccion':
            aValue = a.ID_Transaccion;
            bValue = b.ID_Transaccion;
            break;
          case 'Fecha':
            aValue = new Date(a.Fecha).getTime();
            bValue = new Date(b.Fecha).getTime();
            break;
          case 'Nombre_Producto':
            aValue = a.Nombre_Producto;
            bValue = b.Nombre_Producto;
            break;
          case 'Categoria':
            aValue = a.Categoria;
            bValue = b.Categoria;
            break;
          case 'Cantidad':
            aValue = a.Cantidad;
            bValue = b.Cantidad;
            break;
          case 'Precio_Unitario':
            aValue = a.Precio_Unitario;
            bValue = b.Precio_Unitario;
            break;
          case 'Total_Venta':
            aValue = a.Total_Venta;
            bValue = b.Total_Venta;
            break;
          case 'Pais':
            aValue = a.Pais;
            bValue = b.Pais;
            break;
          case 'Metodo_Pago':
            aValue = a.Metodo_Pago;
            bValue = b.Metodo_Pago;
            break;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
        }
        return 0;
      });
    }

    return filtered;
  }, [transactions, searchTerm, filterCategories, filterCountries, filterPayments, filterDateStart, filterDateEnd, sortColumn, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategories(new Set());
    setFilterCountries(new Set());
    setFilterPayments(new Set());
    setFilterDateStart('');
    setFilterDateEnd('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tabla de Transacciones</h1>
        <p className="text-gray-600 mt-2">Vista detallada de todas las transacciones con filtros</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra las transacciones por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-gray-700">Búsqueda</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Producto, ID, País..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories Filter */}
            <div className="border rounded-lg p-3">
              <button
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() =>
                  setExpandedFilters(prev => ({
                    ...prev,
                    categories: !prev.categories,
                  }))
                }
              >
                <span>Categorías ({filterCategories.size})</span>
                {expandedFilters.categories ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedFilters.categories && (
                <div className="mt-3 space-y-2">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterCategories.has(cat)}
                        onChange={(e) => {
                          const newSet = new Set(filterCategories);
                          if (e.target.checked) {
                            newSet.add(cat);
                          } else {
                            newSet.delete(cat);
                          }
                          setFilterCategories(newSet);
                          setCurrentPage(1);
                        }}
                        className="rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">{cat}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Countries Filter */}
            <div className="border rounded-lg p-3">
              <button
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() =>
                  setExpandedFilters(prev => ({
                    ...prev,
                    countries: !prev.countries,
                  }))
                }
              >
                <span>Países ({filterCountries.size})</span>
                {expandedFilters.countries ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedFilters.countries && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {countries.map(country => (
                    <label key={country} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterCountries.has(country)}
                        onChange={(e) => {
                          const newSet = new Set(filterCountries);
                          if (e.target.checked) {
                            newSet.add(country);
                          } else {
                            newSet.delete(country);
                          }
                          setFilterCountries(newSet);
                          setCurrentPage(1);
                        }}
                        className="rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">{country}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Methods Filter */}
            <div className="border rounded-lg p-3">
              <button
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() =>
                  setExpandedFilters(prev => ({
                    ...prev,
                    payments: !prev.payments,
                  }))
                }
              >
                <span>Métodos de Pago ({filterPayments.size})</span>
                {expandedFilters.payments ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedFilters.payments && (
                <div className="mt-3 space-y-2">
                  {paymentMethods.map(method => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterPayments.has(method)}
                        onChange={(e) => {
                          const newSet = new Set(filterPayments);
                          if (e.target.checked) {
                            newSet.add(method);
                          } else {
                            newSet.delete(method);
                          }
                          setFilterPayments(newSet);
                          setCurrentPage(1);
                        }}
                        className="rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">{method}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Filter */}
            <div className="border rounded-lg p-3">
              <button
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() =>
                  setExpandedFilters(prev => ({
                    ...prev,
                    dates: !prev.dates,
                  }))
                }
              >
                <span>Rango de Fechas</span>
                {expandedFilters.dates ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedFilters.dates && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Fecha Inicio</label>
                    <Input
                      type="date"
                      value={filterDateStart}
                      onChange={(e) => {
                        setFilterDateStart(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Fecha Fin</label>
                    <Input
                      type="date"
                      value={filterDateEnd}
                      onChange={(e) => {
                        setFilterDateEnd(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Mostrando {paginatedTransactions.length} de {filteredTransactions.length} resultados
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => {
                        if (sortColumn === 'ID_Transaccion') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('ID_Transaccion');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      ID
                      {sortColumn === 'ID_Transaccion' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => {
                        if (sortColumn === 'Fecha') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('Fecha');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      Fecha
                      {sortColumn === 'Fecha' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => {
                        if (sortColumn === 'Nombre_Producto') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('Nombre_Producto');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      Producto
                      {sortColumn === 'Nombre_Producto' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => {
                        if (sortColumn === 'Categoria') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('Categoria');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      Categoría
                      {sortColumn === 'Categoria' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => {
                        if (sortColumn === 'Cantidad') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('Cantidad');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      Cantidad
                      {sortColumn === 'Cantidad' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => {
                        if (sortColumn === 'Precio_Unitario') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('Precio_Unitario');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center justify-end gap-1 hover:text-blue-600 w-full"
                    >
                      Precio Unit.
                      {sortColumn === 'Precio_Unitario' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => {
                        if (sortColumn === 'Total_Venta') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('Total_Venta');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center justify-end gap-1 hover:text-blue-600 w-full"
                    >
                      Total
                      {sortColumn === 'Total_Venta' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => {
                        if (sortColumn === 'Pais') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('Pais');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      País
                      {sortColumn === 'Pais' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => {
                        if (sortColumn === 'Metodo_Pago') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortColumn('Metodo_Pago');
                          setSortOrder('asc');
                        }
                      }}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      Método Pago
                      {sortColumn === 'Metodo_Pago' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.ID_Transaccion}>
                      <TableCell className="font-medium">
                        {transaction.ID_Transaccion}
                      </TableCell>
                      <TableCell>
                        {dayjs(transaction.Fecha).locale('es').format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell>{transaction.Nombre_Producto}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {transaction.Categoria}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{transaction.Cantidad}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(transaction.Precio_Unitario)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.Total_Venta)}
                      </TableCell>
                      <TableCell>{transaction.Pais}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {transaction.Metodo_Pago}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                      No hay resultados que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredTransactions.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-4">
                <Select value={pageSize.toString()} onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 por página</SelectItem>
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="25">25 por página</SelectItem>
                    <SelectItem value="50">50 por página</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

