import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, ShoppingBag, Package, TrendingDown, ArrowUp, ArrowDown, Minus, Calendar, Percent, UserCheck, Briefcase, Zap, PieChart as PieIcon, Activity, Bell, Instagram, MessageCircle, Check, Copy } from 'lucide-react';
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

    const cogs = rangeSales.reduce((sum, s) => {
        return sum + (s.items || []).reduce((isum, item) => {
            const product = products.find(p => p.id === item.productId);
            const cost = product ? product.costPrice : (item.price * 0.6); 
            return isum + (cost * item.quantity);
        }, 0);
    }, 0);

    const profit = revenue - cogs - totalExpenses;

    return { revenue, invoicesCount, profit, cogs, totalExpenses };
  };

  // Define Time Ranges
  const now = new Date();
  
  // Follow-up Logic: Sales that need checking (Delivery period passed)
  const followUpReminders = useMemo(() => {
    return sales.filter(sale => {
      if (sale.isReturned) return false;
      
      const saleDate = new Date(sale.date);
      let hoursToAdd = 48; // Default
      
      if (sale.deliveryDuration.includes('24')) hoursToAdd = 24;
      else if (sale.deliveryDuration.includes('48')) hoursToAdd = 48;
      else if (sale.deliveryDuration.includes('3')) hoursToAdd = 72;
      else if (sale.deliveryDuration.includes('4')) hoursToAdd = 96;
      else if (sale.deliveryDuration.includes('5')) hoursToAdd = 120;
      
      const deliveryThreshold = new Date(saleDate.getTime() + hoursToAdd * 60 * 60 * 1000);
      const followUpEndThreshold = new Date(deliveryThreshold.getTime() + 7 * 24 * 60 * 60 * 1000); // Only remind for 1 week after delivery
      
      return now > deliveryThreshold && now < followUpEndThreshold;
    }).slice(0, 5); // Show top 5
  }, [sales]);

  const handleFollowUpAction = (sale: Sale) => {
    const message = `مرحباً حبيبتي، طمنيني وصلت القطعة؟ ان شاء الله طلعت مثل ما تمنيتي وعجبتج باللبس ❤️ نبقى بانتظار طلتج الحلوة بالتاك`;
    navigator.clipboard.writeText(message);
    const username = sale.customerName.replace(/\s+/g, '');
    window.open(`https://ig.me/m/${username}`, '_blank');
  };

  const todayMetrics = calculateMetrics(now, now);
  const yesterdayDate = new Date(now); yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayMetrics = calculateMetrics(yesterdayDate, yesterdayDate);

  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6);
  const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(weekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart); prevWeekEnd.setDate(weekStart.getDate() - 1);
  const weekMetrics = calculateMetrics(weekStart, now);
  const prevWeekMetrics = calculateMetrics(prevWeekStart, prevWeekEnd);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const monthMetrics = calculateMetrics(monthStart, now);
  const prevMonthMetrics = calculateMetrics(prevMonthStart, prevMonthEnd);

  const totalRevenue = sales.filter(s => !s.isReturned).reduce((acc, s) => acc + s.totalAmount, 0);
  const totalCogs = sales.filter(s => !s.isReturned).reduce((sum, s) => {
    return sum + (s.items || []).reduce((isum, item) => {
        const product = products.find(p => p.id === item.productId);
        const cost = product ? product.costPrice : (item.price * 0.6); 
        return isum + (cost * item.quantity);
    }, 0);
  }, 0);
  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalCogs - totalExp;

  const grossMarginPct = totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0;
  const aov = sales.length > 0 ? totalRevenue / sales.filter(s => !s.isReturned).length : 0;
  const roi = (totalCogs + totalExp) > 0 ? (netProfit / (totalCogs + totalExp)) * 100 : 0;
  const expenseRatio = totalRevenue > 0 ? (totalExp / totalRevenue) * 100 : 0;

  const cashFlowData = useMemo(() => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const metrics = calculateMetrics(d, d);
        data.push({
            name: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
            sales: metrics.revenue,
            expenses: metrics.totalExpenses
        });
    }
    return data;
  }, [sales, expenses, products]);

  const PctChange = ({ current, previous }: { current: number, previous: number }) => {
    if (previous === 0) return <span className="text-gray-500 text-[10px] flex items-center gap-1"><Minus className="w-3 h-3" /> N/A</span>;
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    return (
        <span className={`text-[10px] font-bold flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
        </span>
    );
  };

  const InvestorCard = ({ title, value, sub, icon: Icon, trend, color }: any) => (
    <div className="bg-[#1e1e1e] border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-1 h-full bg-${color}-500 opacity-50`}></div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-500`}>
                <Icon className="w-5 h-5" />
            </div>
            {trend && <div className="text-right">{trend}</div>}
        </div>
        <h4 className="text-gray-400 text-xs font-bold mb-1">{title}</h4>
        <div className="text-xl font-black text-white">{value}</div>
        <p className="text-[10px] text-gray-500 mt-1">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 0. Smart Reminders (Follow-ups) */}
      {followUpReminders.length > 0 && (
        <section className="animate-fade-in-down">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="text-primary w-5 h-5 animate-bounce" />
                <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border border-dark"></span>
              </div>
              <h2 className="text-xl font-black text-white">تذكيرات خدمة الزبائن</h2>
            </div>
            <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full font-bold">بانتظار المتابعة: {followUpReminders.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followUpReminders.map(sale => (
              <div key={sale.id} className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 flex flex-col gap-3 group hover:border-primary transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-bold text-sm">{sale.customerName}</h4>
                    <p className="text-[10px] text-gray-400">تاريخ الطلب: {new Date(sale.date).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="bg-black/40 px-2 py-1 rounded-lg text-[10px] text-primary border border-primary/10">
                    مدة التوصيل: {sale.deliveryDuration}
                  </div>
                </div>
                <button 
                  onClick={() => handleFollowUpAction(sale)}
                  className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  <Instagram className="w-4 h-4" />
                  مراسلة واطمئنان (نسخ النص)
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 1. Comparison Reports (Executive Summary) */}
      <section>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="text-primary w-5 h-5" />
            <h2 className="text-xl font-black text-white">ملخص الأداء التنفيذي</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
                    <span className="text-xs text-gray-500">أداء اليوم</span>
                    <PctChange current={todayMetrics.revenue} previous={yesterdayMetrics.revenue} />
                </div>
                <div className="flex justify-between items-end">
                    <div className="text-2xl font-black text-white">{todayMetrics.revenue.toLocaleString()} <small className="text-xs font-normal">د.ع</small></div>
                    <div className="text-[10px] text-green-500 font-bold">صافي الربح: {todayMetrics.profit.toLocaleString()}</div>
                </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
                    <span className="text-xs text-gray-500">أداء الأسبوع</span>
                    <PctChange current={weekMetrics.revenue} previous={prevWeekMetrics.revenue} />
                </div>
                <div className="flex justify-between items-end">
                    <div className="text-2xl font-black text-white">{weekMetrics.revenue.toLocaleString()} <small className="text-xs font-normal">د.ع</small></div>
                    <div className="text-[10px] text-green-500 font-bold">صافي الربح: {weekMetrics.profit.toLocaleString()}</div>
                </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
                    <span className="text-xs text-gray-500">أداء الشهر</span>
                    <PctChange current={monthMetrics.revenue} previous={prevMonthMetrics.revenue} />
                </div>
                <div className="flex justify-between items-end">
                    <div className="text-2xl font-black text-white">{monthMetrics.revenue.toLocaleString()} <small className="text-xs font-normal">د.ع</small></div>
                    <div className="text-[10px] text-green-500 font-bold">صافي الربح: {monthMetrics.profit.toLocaleString()}</div>
                </div>
            </div>
          </div>
      </section>

      {/* 2. Investor Intelligence (Key Performance Indicators) */}
      <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-yellow-500 w-5 h-5" />
            <h2 className="text-xl font-black text-white">مؤشرات الاستثمار والربحية</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InvestorCard 
                title="هامش الربح الإجمالي"
                value={`${grossMarginPct.toFixed(1)}%`}
                sub="الربح بعد خصم تكلفة البضاعة"
                icon={Percent}
                color="blue"
            />
            <InvestorCard 
                title="متوسط قيمة الفاتورة"
                value={`${aov.toLocaleString()} د.ع`}
                sub="معدل صرف الزبون الواحد"
                icon={UserCheck}
                color="purple"
            />
            <InvestorCard 
                title="العائد على الاستثمار"
                value={`${roi.toFixed(1)}%`}
                sub="نسبة الربح للمصاريف الكلية"
                icon={Activity}
                color="green"
            />
            <InvestorCard 
                title="نسبة المصاريف"
                value={`${expenseRatio.toFixed(1)}%`}
                sub="استهلاك المصاريف من الدخل"
                icon={TrendingDown}
                color="red"
            />
          </div>
      </section>

      {/* 3. Operational Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="text-primary w-5 h-5" /> التدفق النقدي (آخر 7 أيام)
              </h3>
              <div className="flex gap-4 text-[10px]">
                  <div className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-400"></span> مبيعات</div>
                  <div className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-400"></span> مصروفات</div>
              </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Value & Health */}
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6">صحة المخزون</h3>
            <div className="flex-1 flex flex-col justify-center gap-8">
                <div className="text-center">
                    <div className="text-gray-500 text-xs mb-1">إجمالي رأس المال في المستودع</div>
                    <div className="text-3xl font-black text-primary">{stats.inventoryValue.toLocaleString()} <small className="text-xs font-normal">د.ع</small></div>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>كفاءة المبيعات للمخزون</span>
                            <span>{((totalRevenue / (stats.inventoryValue || 1)) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: `${Math.min(100, (totalRevenue / (stats.inventoryValue || 1)) * 100)}%` }}></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark/50 p-3 rounded-xl border border-border">
                            <span className="block text-[9px] text-gray-500 uppercase">قطع منتهية</span>
                            <span className="text-lg font-bold text-red-500">{products.filter(p => p.stock === 0).length}</span>
                        </div>
                        <div className="bg-dark/50 p-3 rounded-xl border border-border">
                            <span className="block text-[9px] text-gray-500 uppercase">موديلات نشطة</span>
                            <span className="text-lg font-bold text-blue-500">{new Set(products.map(p => p.name)).size}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </section>

      {/* 4. Top Performing Items */}
      <section className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-white mb-6">أفضل 5 موديلات مبيعاً (من حيث الوحدات)</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {products
                .map(p => {
                    const unitsSold = sales.reduce((acc, sale) => {
                        const item = (sale.items || []).find(i => i.productId === p.id);
                        return acc + (item ? item.quantity : 0);
                    }, 0);
                    return { ...p, unitsSold };
                })
                .sort((a, b) => b.unitsSold - a.unitsSold)
                .slice(0, 5)
                .map((p, idx) => (
                    <div key={idx} className="bg-dark/40 p-4 rounded-xl border border-white/5 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-br-lg">#{idx+1}</div>
                        <div className="text-white font-bold text-sm truncate mb-1">{p.name}</div>
                        <div className="text-[10px] text-gray-500 mb-3">{p.color} | {p.category}</div>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="block text-[9px] text-gray-600 uppercase">تم بيع</span>
                                <span className="text-lg font-black text-white">{p.unitsSold} <small className="text-[9px] font-normal text-gray-500">قطعة</small></span>
                            </div>
                        </div>
                    </div>
                ))
            }
          </div>
      </section>
    </div>
  );
};

export default Dashboard;