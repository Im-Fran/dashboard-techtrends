import { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import {
  Search,
  X,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Settings2,
  GripVertical,
  Calendar,
  Tag,
  MapPin,
  CreditCard
} from 'lucide-react';

// Tipo para las columnas
type ColumnKey = 'ID_Transaccion' | 'Fecha' | 'Nombre_Producto' | 'Categoria' | 'Cantidad' | 'Precio_Unitario' | 'Total_Venta' | 'Pais' | 'Metodo_Pago';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  align?: 'left' | 'right' | 'center';
}

const defaultColumns: ColumnConfig[] = [
  { key: 'ID_Transaccion', label: 'ID' },
  { key: 'Fecha', label: 'Fecha' },
  { key: 'Nombre_Producto', label: 'Producto' },
  { key: 'Categoria', label: 'Categoría' },
  { key: 'Cantidad', label: 'Cantidad', align: 'center' },
  { key: 'Precio_Unitario', label: 'Precio Unit.', align: 'right' },
  { key: 'Total_Venta', label: 'Total', align: 'right' },
  { key: 'Pais', label: 'País' },
  { key: 'Metodo_Pago', label: 'Método Pago' },
];

// Keys para localStorage
const STORAGE_KEYS = {
  VISIBLE_COLUMNS: 'table-visible-columns',
  COLUMN_ORDER: 'table-column-order',
};

// Función para cargar columnas visibles desde localStorage
const loadVisibleColumns = (): ColumnKey[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VISIBLE_COLUMNS);
    if (stored) {
      const parsed = JSON.parse(stored) as ColumnKey[];
      // Validar que todas las columnas sean válidas
      const validKeys = defaultColumns.map(col => col.key);
      const filtered = parsed.filter(key => validKeys.includes(key));
      if (filtered.length > 0) {
        return filtered;
      }
    }
  } catch (error) {
    console.error('Error loading visible columns from localStorage:', error);
  }
  return defaultColumns.map(col => col.key);
};

// Función para cargar orden de columnas desde localStorage
const loadColumnOrder = (): ColumnConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COLUMN_ORDER);
    if (stored) {
      const parsed = JSON.parse(stored) as ColumnConfig[];
      // Validar que el orden sea válido
      if (parsed.length === defaultColumns.length) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading column order from localStorage:', error);
  }
  return defaultColumns;
};

// Función para exportar a CSV
const exportToCSV = (data: Transaction[], columns: ColumnConfig[], filename: string) => {
  const headers = columns.map(col => col.label).join(',');
  const rows = data.map(transaction => {
    return columns.map(col => {
      let value = transaction[col.key];
      if (col.key === 'Fecha') {
        value = dayjs(value as string).format('DD/MM/YYYY');
      }
      // Escapar valores que contengan comas o comillas
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  }).join('\n');

  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Función para exportar a JSON
const exportToJSON = (data: Transaction[], columns: ColumnConfig[], filename: string) => {
  const filteredData = data.map(transaction => {
    const filtered: any = {};
    columns.forEach(col => {
      filtered[col.key] = transaction[col.key];
    });
    return filtered;
  });

  const json = JSON.stringify(filteredData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

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
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(loadVisibleColumns);
  const [columnOrder, setColumnOrder] = useState<ColumnConfig[]>(loadColumnOrder);
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);

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

  // Guardar columnas visibles en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VISIBLE_COLUMNS, JSON.stringify(visibleColumns));
    } catch (error) {
      console.error('Error saving visible columns to localStorage:', error);
    }
  }, [visibleColumns]);

  // Guardar orden de columnas en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COLUMN_ORDER, JSON.stringify(columnOrder));
    } catch (error) {
      console.error('Error saving column order to localStorage:', error);
    }
  }, [columnOrder]);

  // Funciones para manejar columnas
  const handleColumnVisibilityToggle = (columnKey: ColumnKey) => {
    setVisibleColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(k => k !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(defaultColumns.map(col => col.key));
    setColumnOrder(defaultColumns);
    localStorage.removeItem(STORAGE_KEYS.VISIBLE_COLUMNS);
    localStorage.removeItem(STORAGE_KEYS.COLUMN_ORDER);
  };

  const handleDragStart = (index: number) => {
    setDraggedColumn(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColumn === null || draggedColumn === index) return;

    const newOrder = [...columnOrder];
    const draggedItem = newOrder[draggedColumn];
    newOrder.splice(draggedColumn, 1);
    newOrder.splice(index, 0, draggedItem);

    setColumnOrder(newOrder);
    setDraggedColumn(index);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  const handleExportCSV = () => {
    const visibleColumnConfigs = columnOrder.filter(col => visibleColumns.includes(col.key));
    exportToCSV(filteredTransactions, visibleColumnConfigs, `transacciones-${dayjs().format('YYYY-MM-DD')}.csv`);
  };

  const handleExportJSON = () => {
    const visibleColumnConfigs = columnOrder.filter(col => visibleColumns.includes(col.key));
    exportToJSON(filteredTransactions, visibleColumnConfigs, `transacciones-${dayjs().format('YYYY-MM-DD')}.json`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategories(new Set());
    setFilterCountries(new Set());
    setFilterPayments(new Set());
    setFilterDateStart('');
    setFilterDateEnd('');
    setCurrentPage(1);
  };

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
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (sortColumn === 'Fecha') {
          const aTime = new Date(aValue as string).getTime();
          const bTime = new Date(bValue as string).getTime();
          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterCategories.size > 0) count += filterCategories.size;
    if (filterCountries.size > 0) count += filterCountries.size;
    if (filterPayments.size > 0) count += filterPayments.size;
    if (filterDateStart || filterDateEnd) count += 1;
    return count;
  }, [filterCategories, filterCountries, filterPayments, filterDateStart, filterDateEnd]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tabla de Transacciones</h1>
          <p className="text-gray-600 mt-2">Vista detallada de todas las transacciones con filtros avanzados</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" />
                Columnas
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-3">Columnas visibles</h4>
                  <div className="space-y-2">
                    {defaultColumns.map(col => (
                      <div key={col.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={col.key}
                          checked={visibleColumns.includes(col.key)}
                          onCheckedChange={() => handleColumnVisibilityToggle(col.key)}
                        />
                        <label
                          htmlFor={col.key}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs text-gray-500">
                    Arrastra los encabezados de la tabla para reordenar las columnas
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetColumns}
                    className="w-full"
                  >
                    Restaurar por defecto
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <div className="space-y-2">
                <h4 className="font-medium text-sm mb-3">Exportar datos visibles</h4>
                <Button onClick={handleExportCSV} variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </Button>
                <Button onClick={handleExportJSON} variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar JSON
                </Button>
                <p className="text-xs text-gray-500 pt-2">
                  {filteredTransactions.length} registros • {visibleColumns.length} columnas
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por producto, ID o país..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="whitespace-nowrap"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-600 text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>

            {/* Panel de filtros expandible */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                {/* Categorías */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between">
                      <span className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Categorías
                      </span>
                      {filterCategories.size > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filterCategories.size}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Seleccionar categorías</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {categories.map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <Checkbox
                              checked={filterCategories.has(cat)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(filterCategories);
                                if (checked) {
                                  newSet.add(cat);
                                } else {
                                  newSet.delete(cat);
                                }
                                setFilterCategories(newSet);
                                setCurrentPage(1);
                              }}
                            />
                            <span className="text-sm">{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Países */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Países
                      </span>
                      {filterCountries.size > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filterCountries.size}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Seleccionar países</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {countries.map(country => (
                          <label key={country} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <Checkbox
                              checked={filterCountries.has(country)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(filterCountries);
                                if (checked) {
                                  newSet.add(country);
                                } else {
                                  newSet.delete(country);
                                }
                                setFilterCountries(newSet);
                                setCurrentPage(1);
                              }}
                            />
                            <span className="text-sm">{country}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Métodos de pago */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between">
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Métodos de Pago
                      </span>
                      {filterPayments.size > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filterPayments.size}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Seleccionar métodos</h4>
                      <div className="space-y-2">
                        {paymentMethods.map(method => (
                          <label key={method} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <Checkbox
                              checked={filterPayments.has(method)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(filterPayments);
                                if (checked) {
                                  newSet.add(method);
                                } else {
                                  newSet.delete(method);
                                }
                                setFilterPayments(newSet);
                                setCurrentPage(1);
                              }}
                            />
                            <span className="text-sm">{method}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Rango de fechas */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fechas
                      </span>
                      {(filterDateStart || filterDateEnd) && (
                        <Badge variant="secondary" className="ml-2">1</Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Rango de fechas</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">Desde</label>
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
                          <label className="text-xs font-medium text-gray-600">Hasta</label>
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
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Filtros activos como badges */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {Array.from(filterCategories).map(cat => (
                  <Badge key={cat} variant="secondary" className="gap-1">
                    {cat}
                    <button
                      onClick={() => {
                        const newSet = new Set(filterCategories);
                        newSet.delete(cat);
                        setFilterCategories(newSet);
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {Array.from(filterCountries).map(country => (
                  <Badge key={country} variant="secondary" className="gap-1">
                    {country}
                    <button
                      onClick={() => {
                        const newSet = new Set(filterCountries);
                        newSet.delete(country);
                        setFilterCountries(newSet);
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {Array.from(filterPayments).map(method => (
                  <Badge key={method} variant="secondary" className="gap-1">
                    {method}
                    <button
                      onClick={() => {
                        const newSet = new Set(filterPayments);
                        newSet.delete(method);
                        setFilterPayments(newSet);
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(filterDateStart || filterDateEnd) && (
                  <Badge variant="secondary" className="gap-1">
                    {filterDateStart && dayjs(filterDateStart).format('DD/MM/YYYY')}
                    {filterDateStart && filterDateEnd && ' - '}
                    {filterDateEnd && dayjs(filterDateEnd).format('DD/MM/YYYY')}
                    <button
                      onClick={() => {
                        setFilterDateStart('');
                        setFilterDateEnd('');
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Contador de resultados */}
            <div className="text-sm text-gray-600 flex items-center justify-between">
              <span>
                Mostrando <span className="font-medium">{paginatedTransactions.length}</span> de{' '}
                <span className="font-medium">{filteredTransactions.length}</span> registros
                {filteredTransactions.length !== transactions.length && (
                  <span className="text-gray-500"> (filtrado de {transactions.length} totales)</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnOrder
                    .filter(col => visibleColumns.includes(col.key))
                    .map((col) => (
                      <TableHead
                        key={col.key}
                        className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}
                        draggable
                        onDragStart={() => handleDragStart(columnOrder.indexOf(col))}
                        onDragOver={(e) => handleDragOver(e, columnOrder.indexOf(col))}
                        onDragEnd={handleDragEnd}
                      >
                        <button
                          onClick={() => {
                            if (sortColumn === col.key) {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortColumn(col.key);
                              setSortOrder('asc');
                            }
                          }}
                          className={`flex items-center gap-1 hover:text-blue-600 cursor-pointer ${
                            col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : ''
                          }`}
                        >
                          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                          <span>{col.label}</span>
                          {sortColumn === col.key && (
                            sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          )}
                        </button>
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.ID_Transaccion} className="hover:bg-gray-50">
                      {columnOrder
                        .filter(col => visibleColumns.includes(col.key))
                        .map(col => {
                          const value = transaction[col.key];
                          let displayValue: React.ReactNode = value;

                          // Formatear valores según la columna
                          if (col.key === 'Fecha') {
                            displayValue = dayjs(value as string).locale('es').format('DD/MM/YYYY');
                          } else if (col.key === 'Precio_Unitario' || col.key === 'Total_Venta') {
                            displayValue = formatCurrency(value as number);
                          } else if (col.key === 'Categoria') {
                            displayValue = (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                {value as string}
                              </Badge>
                            );
                          } else if (col.key === 'Metodo_Pago') {
                            displayValue = (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                {value as string}
                              </Badge>
                            );
                          }

                          return (
                            <TableCell
                              key={col.key}
                              className={`
                                ${col.key === 'Total_Venta' ? 'font-medium' : ''}
                                ${col.key === 'ID_Transaccion' ? 'font-medium' : ''}
                                ${col.align === 'right' ? 'text-right' : ''}
                                ${col.align === 'center' ? 'text-center' : ''}
                              `}
                            >
                              {displayValue}
                            </TableCell>
                          );
                        })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-400" />
                        <p>No hay resultados que coincidan con los filtros</p>
                        <Button variant="outline" size="sm" onClick={handleClearFilters}>
                          Limpiar filtros
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t flex items-center justify-between">
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

