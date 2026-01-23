"use client";

import { AnalyticsCard } from "@/components/ui/analytics-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/ui/chart-card";
// import { ForecastingCard } from "@/components/ui/forecasting-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Euro,
  Download,
  Eye,
  Package,
  PieChart as PieChartIcon,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../authContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import { useProductStore } from "../useProductStore";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function BusinessInsightsPage() {
  const { allProducts } = useProductStore();
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate analytics data customized for Hair Salon (Barber)
  const analyticsData = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return {
        totalReferenceTypes: 0,
        totalValue: 0,
        lowStockItems: 0,
        criticalStockItems: 0,
        outOfStockItems: 0,
        averageUnitCost: 0,
        totalUnits: 0,
        categoryDistribution: [],
        statusDistribution: [],
        priceRangeDistribution: [],
        monthlyTrend: [],
        topProducts: [],
        lowStockProducts: [],
        stockUtilization: 0,
        unitsPerReference: 0,
        topCategory: { name: "N/A", value: 0, percentage: 0 },
      };
    }

    // 1. Total de "Tipos" de producto
    const totalReferenceTypes = allProducts.length;

    // 2. Valor Total del Inventario
    const totalValue = allProducts.reduce((sum, product) => {
      return sum + product.price * Number(product.quantity);
    }, 0);

    // 3. Cantidad Total de Unidades
    const totalUnits = allProducts.reduce((sum, product) => {
      return sum + Number(product.quantity);
    }, 0);

    // 4. Coste Medio por Unidad
    const averageUnitCost = totalUnits > 0 ? totalValue / totalUnits : 0;

    // 5. Lógica de Stock Bajo
    const criticalStockItems = allProducts.filter(
      (product) => Number(product.quantity) > 0 && Number(product.quantity) <= 3
    ).length;

    const lowStockItems = allProducts.filter(
      (product) => Number(product.quantity) > 3 && Number(product.quantity) <= 5
    ).length;

    const outOfStockItems = allProducts.filter(
      (product) => Number(product.quantity) === 0
    ).length;

    // 6. Unidades Promedio por Referencia
    const unitsPerReference = totalReferenceTypes > 0 ? totalUnits / totalReferenceTypes : 0;

    // Distribución por Categoría Y CÁLCULO DE CATEGORÍA TOP
    const categoryMap = new Map();
    allProducts.forEach((product) => {
      const category = product.category || "Sin Categoría";
      const current = categoryMap.get(category) || {
        count: 0,
        quantity: 0,
        value: 0,
      };
      categoryMap.set(category, {
        count: current.count + 1,
        quantity: current.quantity + Number(product.quantity),
        value: current.value + product.price * Number(product.quantity),
      });
    });

    const categoryDistribution = Array.from(categoryMap.entries()).map(
      ([name, data]) => ({
        name,
        value: data.value,
        quantity: data.quantity,
        count: data.count,
      })
    );

    // Encontrar la categoría con más valor invertido
    let maxCategory = { name: "Ninguna", value: 0 };
    categoryMap.forEach((data, name) => {
        if (data.value > maxCategory.value) {
            maxCategory = { name: name, value: data.value };
        }
    });
    
    const topCategory = {
        name: maxCategory.name,
        value: maxCategory.value,
        percentage: totalValue > 0 ? (maxCategory.value / totalValue) * 100 : 0
    };


    // Price range distribution
    const priceRanges = [
      { name: "€0-€10", min: 0, max: 10 },
      { name: "€10-€20", min: 10, max: 20 },
      { name: "€20-€50", min: 20, max: 50 },
      { name: "€50+", min: 50, max: Infinity },
    ];

    const priceRangeDistribution = priceRanges.map((range) => ({
      name: range.name,
      value: allProducts.filter((product) => {
        if (range.max === Infinity) return product.price >= range.min;
        return product.price >= range.min && product.price < range.max;
      }).length,
    }));

    // Status distribution
    const statusMap = new Map();
    allProducts.forEach((product) => {
        let status = product.status;
        if (!status) {
            const qty = Number(product.quantity);
            if (qty === 0) status = "Agotado";
            else if (qty <= 3) status = "Crítico";
            else if (qty <= 5) status = "Bajo";
            else status = "Saludable";
        }
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    const statusDistribution = Array.from(statusMap.entries()).map(
      ([name, value]) => ({ name, value })
    );

    // Monthly trend
    const monthlyTrend: Array<{
      month: string;
      products: number;
      monthlyAdded: number;
    }> = [];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const productsByMonth = new Map();
     allProducts.forEach((product) => {
       const date = new Date(product.createdAt);
       const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
       productsByMonth.set(monthKey, (productsByMonth.get(monthKey) || 0) + 1);
     });
     const dataYear = allProducts.length > 0 ? new Date(allProducts[0].createdAt).getUTCFullYear() : new Date().getUTCFullYear();
     let cumulativeProducts = 0;
     months.forEach((month, index) => {
       const monthKey = `${dataYear}-${String(index + 1).padStart(2, "0")}`;
       const productsThisMonth = productsByMonth.get(monthKey) || 0;
       cumulativeProducts += productsThisMonth;
       monthlyTrend.push({ month, products: cumulativeProducts, monthlyAdded: productsThisMonth });
     });


    // Top Products
    const topProducts = allProducts
      .sort((a, b) => (b.price * Number(b.quantity)) - (a.price * Number(a.quantity)))
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        value: product.price * Number(product.quantity),
        quantity: Number(product.quantity),
      }));

    // Low stock products
    const lowStockProducts = allProducts
      .filter((product) => Number(product.quantity) >= 0 && Number(product.quantity) <= 5)
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))
      .slice(0, 6);

    return {
      totalReferenceTypes,
      totalValue,
      lowStockItems,
      criticalStockItems,
      outOfStockItems,
      averageUnitCost,
      totalUnits,
      unitsPerReference,
      topCategory,
      categoryDistribution,
      statusDistribution,
      priceRangeDistribution,
      monthlyTrend,
      topProducts,
      lowStockProducts,
    };
  }, [allProducts]);

  const handleExportAnalytics = () => {
    toast({
      title: "Exportar Inventario",
      description: "Descargando informe de stock...",
    });
  };

  if (!user) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando datos de la barbería...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">
              Control de Stock
            </h1>
            <p className="text-lg text-muted-foreground">
              Visión general de productos de consumo y venta de la barbería
            </p>
          </div>
          <Button onClick={handleExportAnalytics} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>

        {/* Key Metrics - BARBERÍA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Total Unidades"
            value={analyticsData.totalUnits.toLocaleString()}
            icon={Package}
            iconColor="text-blue-600"
            description={`${analyticsData.totalReferenceTypes} tipos de productos`}
          />
          <AnalyticsCard
            title="Valor del Stock"
            value={`€${analyticsData.totalValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`}
            icon={Euro}
            iconColor="text-green-600"
            description="Dinero invertido en material"
          />
          <AnalyticsCard
            title="Stock Bajo (<5)"
            value={analyticsData.lowStockItems}
            icon={AlertTriangle}
            iconColor="text-orange-600"
            description="Productos cerca de agotarse"
          />
           <AnalyticsCard
            title="Stock Crítico (<3)"
            value={analyticsData.criticalStockItems + analyticsData.outOfStockItems}
            icon={ShoppingCart}
            iconColor="text-red-600"
            description="Reponer urgentemente"
          />
        </div>

        {/* Charts and Insights */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="trends">Productos Top</TabsTrigger>
            <TabsTrigger value="alerts">
                 Alertas de Compra
                 {(analyticsData.criticalStockItems + analyticsData.outOfStockItems) > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex justify-center items-center">
                        {analyticsData.criticalStockItems + analyticsData.outOfStockItems}
                    </Badge>
                 )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category Distribution - Value based */}
              <ChartCard title="Dinero invertido por Categoría" icon={PieChartIcon}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value" 
                    >
                      {analyticsData.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

               {/* Price Range */}
               <ChartCard title="Rango de Coste de Productos" icon={BarChart3}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.priceRangeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00C49F" name="Cantidad de productos" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <ChartCard title="Productos con mayor valor acumulado (€ en estantería)" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analyticsData.topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [`€${value.toLocaleString()}`, "Valor Total"]} />
                    <Bar dataKey="value" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <ChartCard title="Productos que necesitan reposición" icon={AlertTriangle}>
              <div className="space-y-4">
                {(analyticsData.lowStockProducts.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsData.lowStockProducts.map((product, index) => (
                      <Card
                        key={index}
                        className={`${
                            Number(product.quantity) <= 3 
                            ? "border-red-200 bg-red-50" 
                            : "border-orange-200 bg-orange-50"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-sm truncate w-32" title={product.name}>
                                {product.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                €{product.price} / ud.
                              </p>
                            </div>
                            <div className="text-right">
                                <span className={`text-2xl font-bold ${Number(product.quantity) <= 3 ? "text-red-600" : "text-orange-600"}`}>
                                    {product.quantity}
                                </span>
                                <p className="text-xs text-muted-foreground">unidades</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">¡Todo en orden! No hay stock bajo mínimos.</p>
                  </div>
                )}
              </div>
            </ChartCard>
          </TabsContent>
        </Tabs>

        {/* Additional Insights -  BARBERÍA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Costes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5" />
                Resumen de Costes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Coste Medio (por unidad)</span>
                <span className="font-bold text-lg">
                  €{analyticsData.averageUnitCost.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este es el precio medio de cada bote/caja que tienes en la barbería.
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Salud */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Salud del Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estado General</span>
                <Badge
                  variant={
                    analyticsData.criticalStockItems > 0 ? "destructive" : "default"
                  }
                >
                  {(analyticsData.criticalStockItems + analyticsData.outOfStockItems) > 0
                    ? `Faltan ${analyticsData.criticalStockItems + analyticsData.outOfStockItems} productos`
                    : "Stock Sano"}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Media de unidades por tipo</span>
                <span className="font-semibold">
                  {analyticsData.unitsPerReference.toFixed(1)} uds.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Inversión Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5" />
                Inversión Principal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mayor Categoría</span>
                <Badge variant="outline" className="font-semibold">
                  {analyticsData.topCategory.name}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Valor Acumulado</span>
                <span className="font-bold text-lg text-primary">
                  €{analyticsData.topCategory.value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                 Representa el <strong>{analyticsData.topCategory.percentage.toFixed(0)}%</strong> de todo tu dinero invertido.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* <ForecastingCard products={allProducts} /> */}
      </div>
    </AuthenticatedLayout>
  );
}