import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingBag, Package, TrendingDown, ArrowUp, ArrowDown, Minus, Calendar } from 'lucide-react';
import { DashboardStats, ProductApp, Sale, Expense } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  sales: Sale[];
  products: ProductApp[];
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, sales, products, expenses }) => {
  
  // Helper: Calculate Metrics for a specific date range
  const calculateMetrics = (startDate: Date, endDate: Date) => {
    // Normalize dates to remove time part for accurate daily comparison
    const start = new Date(startDate);
    start.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(23,59,59,999);

    const rangeSales = sales.filter(s => {
        const d = new Date(s.date);
        return d >= start && d <= end && !s.isReturned;
    });

    const rangeExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
    });

    const revenue = rangeSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const invoicesCount = rangeSales.length;
    const totalExpenses = rangeExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Calculate Cost of Goods Sold for this range
    const cogs = rangeSales.reduce((sum, s) => {
        return sum + s.items.reduce((isum, item) => {
            const product = products.find(p => p.id === item.productId);
            // If product found use cost price, else assume 60% of selling price as cost fallback
            const cost = product ? product.costPrice : (item.price * 0.6); 
            return isum + (cost * item.quantity);
        }, 0);
    }, 0);

    const profit = revenue - cogs - totalExpenses;

    return { revenue, invoicesCount, profit };
  };

  // Define Time Ranges
  const now = new Date();
  
  // 1. Today vs Yesterday
  const todayStart = new Date(now);
  const yesterdayStart = new Date(now); yesterdayStart.setDate(now.getDate() - 1);
  const todayMetrics = calculateMetrics(todayStart, todayStart);
  const yesterdayMetrics = calculateMetrics(yesterdayStart, yesterdayStart);

  // 2. This Week (Last 7 Days) vs Previous Week
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6);
  const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(weekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart); prevWeekEnd.setDate(weekStart.getDate() - 1);
  const weekMetrics = calculateMetrics(weekStart, now);
  const prevWeekMetrics = calculateMetrics(prevWeekStart, prevWeekEnd);

  // 3. This Month vs Previous Month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const monthMetrics = calculateMetrics(monthStart, now);
  const prevMonthMetrics = calculateMetrics(prevMonthStart, prevMonthEnd);

  // Helper component for percentage change
  const PctChange = ({ current, previous }: { current: number, previous: number }) => {
    if (previous === 0) return <span className="text-gray-500 text-[10px] flex items-center gap-1"><Minus className="w-3 h-3" /> لا توجد بيانات سابقة</span>;
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    const isNeutral = change === 0;

    if (isNeutral) return <span className="text-gray-400 text-[10px] flex items-center gap-1"><Minus className="w-3 h-3" /> 0%</span>;

    return (
        <span className={`text-[10px] font-bold flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
        </span>
    );
  };

  // Comparison Card Component
  const ComparisonCard = ({ title, current, previous, dateLabel }: any) => (
    <div className="bg-[#1a1a1a] rounded-xl border border-border p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-border pb-2">
            <h4 className="text-primary font-bold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {title}
            </h4>
            <span className="text-[10px] text-gray-500">{dateLabel}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-800 divide-x-reverse">
            {/* Sales */}
            <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">المبيعات</span>
                <span className="text-white font-bold text-sm">{current.revenue.toLocaleString()}</span>
                <PctChange current={current.revenue} previous={previous.revenue} />
            </div>
            {/* Invoices */}
            <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">الفواتير</span>
                <span className="text-white font-bold text-sm">{current.invoicesCount}</span>
                <PctChange current={current.invoicesCount} previous={previous.invoicesCount} />
            </div>
             {/* Profit */}
             <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">الأرباح</span>
                <span className={`font-bold text-sm ${current.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {current.profit.toLocaleString()}
                </span>
                <PctChange current={current.profit} previous={previous.profit} />
            </div>
        </div>
    </div>
  );

  // Process sales data for charts
  const salesByDay = sales.slice(-7).map(sale => ({
    name: new Date(sale.date).toLocaleDateString('ar-EG', { weekday: 'short' }),
    amount: sale.totalAmount
  }));

  const topProducts = products
    .map(p => {
      // Calculate total sold for this product
      const totalSold = sales.reduce((acc, sale) => {
        const item = sale.items.find(i => i.productId === p.id);
        return acc + (item ? item.quantity : 0);
      }, 0);
      return { name: p.name, sales: totalSold };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const StatCard = ({ title, value, sub, icon: Icon, colorClass }: any) => (
    <div className="bg-card p-6 rounded-2xl border border-border flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Financial Reports Section */}
      <div>
          <h2 className="text-2xl font-bold text-white mb-4">التقارير المالية المقارنة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComparisonCard 
                title="أداء اليوم" 
                current={todayMetrics} 
                previous={yesterdayMetrics} 
                dateLabel="مقارنة بالأمس"
            />
             <ComparisonCard 
                title="أداء الأسبوع (7 أيام)" 
                current={weekMetrics} 
                previous={prevWeekMetrics} 
                dateLabel="مقارنة بـ 7 أيام سابقة"
            />
             <ComparisonCard 
                title="أداء الشهر الحالي" 
                current={monthMetrics} 
                previous={prevMonthMetrics} 
                dateLabel="مقارنة بالشهر السابق"
            />
          </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 pt-4 border-t border-dashed border-gray-800">نظرة عامة شاملة</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="مبيعات اليوم" 
          value={`${stats.todaySales.toLocaleString()} د.ع`} 
          sub="إجمالي المبيعات المحققة"
          icon={ShoppingBag}
          colorClass="bg-blue-600/20 text-blue-500"
        />
        <StatCard 
          title="صافي الربح الكلي" 
          value={`${stats.netProfit.toLocaleString()} د.ع`} 
          sub="بعد خصم التكاليف والمصاريف"
          icon={DollarSign}
          colorClass="bg-green-600/20 text-green-500"
        />
        <StatCard 
          title="إجمالي المصروفات" 
          value={`${stats.totalExpenses.toLocaleString()} د.ع`} 
          sub="المصاريف التشغيلية"
          icon={TrendingDown}
          colorClass="bg-red-600/20 text-red-500"
        />
        <StatCard 
          title="قيمة المخزون" 
          value={`${stats.inventoryValue.toLocaleString()} د.ع`} 
          sub="بسعر التكلفة"
          icon={Package}
          colorClass="bg-primary/20 text-primary"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales Trend */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-4">اتجاه المبيعات (آخر 7 عمليات)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                  itemStyle={{ color: '#B76E79' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#B76E79" strokeWidth={3} dot={{ fill: '#B76E79' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-4">المنتجات الأكثر مبيعاً</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                <XAxis type="number" stroke="#666" />
                <YAxis dataKey="name" type="category" width={100} stroke="#666" fontSize={12} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                   cursor={{fill: '#ffffff10'}}
                />
                <Bar dataKey="sales" fill="#B76E79" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;