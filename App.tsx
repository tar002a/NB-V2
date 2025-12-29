import React, { useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import SalesLog from './components/SalesLog';
import Customers from './components/Customers';
import Expenses from './components/Expenses';
import Login from './components/Login';
import { View, Sale, Customer, Expense, CartItem, DashboardStats, ProductApp } from './types';
import { supabase } from './lib/supabase';
import { Database, Copy, Check, Menu, LogOut, ShieldAlert, Loader2 } from 'lucide-react';

// Whitelist Configuration
const ALLOWED_EMAILS = [
  'tttarek93@gmail.com',
  'tarakji_muzna@gmail.com'
];

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [isPasswordAuth, setIsPasswordAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // App View State
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [dbError, setDbError] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data State
  const [products, setProducts] = useState<ProductApp[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- Auth & Initial Data Loading ---
  useEffect(() => {
    const localAuth = localStorage.getItem('pos_auth_token');
    if (localAuth === 'verified') {
        setIsPasswordAuth(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthorized = useMemo(() => {
    if (isPasswordAuth) return true;
    if (session?.user?.email && ALLOWED_EMAILS.includes(session.user.email)) return true;
    return false;
  }, [isPasswordAuth, session]);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePasswordLoginSuccess = () => {
    localStorage.setItem('pos_auth_token', 'verified');
    setIsPasswordAuth(true);
  };

  const handleSignOut = async () => {
    if (session) await supabase.auth.signOut();
    localStorage.removeItem('pos_auth_token');
    setIsPasswordAuth(false);
    setProducts([]);
    setSales([]);
    setCustomers([]);
    setExpenses([]);
    setIsInitialLoad(true);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);
    setDbError(false);
    try {
      // Fetch Products
      const { data: productsData, error: prodError } = await supabase.from('products').select('*');
      if (prodError) throw prodError;
      
      const mappedProducts: ProductApp[] = (productsData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        color: p.color,
        size: p.size,
        costPrice: p.cost_price,
        sellingPrice: p.selling_price,
        stock: p.stock
      }));
      setProducts(mappedProducts);

      // Fetch Customers
      const { data: customersData, error: custError } = await supabase.from('customers').select('*');
      if (custError) throw custError;
      const mappedCustomers: Customer[] = (customersData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        totalSpent: c.total_spent,
        last_purchase: c.last_purchase
      }));
      setCustomers(mappedCustomers);

      // Fetch Sales
      const { data: salesData, error: salesError } = await supabase.from('sales').select('*').order('date', { ascending: false });
      if (salesError) throw salesError;
      const mappedSales: Sale[] = (salesData || []).map((s: any) => ({
        id: s.id,
        date: s.date,
        customerName: s.customer_name,
        customerPhone: s.customer_phone,
        deliveryDuration: s.delivery_duration,
        items: s.items,
        totalAmount: s.total_amount,
        isReturned: s.is_returned
      }));
      setSales(mappedSales);

      // Fetch Expenses
      const { data: expensesData, error: expError } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (expError) throw expError;
      setExpenses(expensesData || []);

      setIsInitialLoad(false);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error?.code === '42P01') {
        setDbError(true);
      } else {
         showToast('خطأ في تحميل البيانات: ' + (error?.message || 'حدث خطأ غير معروف'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const stats: DashboardStats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySalesTotal = sales
      .filter(s => new Date(s.date).toDateString() === today && !s.isReturned)
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const totalRevenue = sales.filter(s => !s.isReturned).reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCostOfSold = sales.filter(s => !s.isReturned).reduce((sum, s) => {
      return sum + s.items.reduce((isum, item) => {
         const product = products.find(p => p.id === item.productId);
         const cost = product ? product.costPrice : (item.price * 0.6); 
         return isum + (cost * item.quantity);
      }, 0);
    }, 0);
    
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalCostOfSold - totalExp;
    const inventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);

    return {
      todaySales: todaySalesTotal,
      netProfit,
      totalExpenses: totalExp,
      inventoryValue
    };
  }, [sales, products, expenses]);


  const handleCompleteSale = async (cartItems: CartItem[], customerDetails: any) => {
    const totalAmount = cartItems.reduce((sum, i) => sum + (i.sellingPrice * i.quantity), 0);
    const saleDate = new Date().toISOString();
    
    const newSalePayload = {
      customer_name: customerDetails.name,
      customer_phone: customerDetails.phone,
      delivery_duration: customerDetails.deliveryDuration,
      total_amount: totalAmount,
      date: saleDate,
      items: cartItems.map(i => ({
        productId: i.id,
        productName: i.name,
        quantity: i.quantity,
        price: i.sellingPrice,
        total: i.sellingPrice * i.quantity,
        color: i.color,
        size: i.size
      }))
    };

    try {
      const { error: saleError } = await supabase.from('sales').insert(newSalePayload);
      if (saleError) throw saleError;

      for (const item of cartItems) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await supabase.from('products').update({ stock: product.stock - item.quantity }).eq('id', item.id);
        }
      }

      const existingCustomer = customers.find(c => c.phone === customerDetails.phone);
      if (existingCustomer) {
        await supabase.from('customers').update({
          total_spent: existingCustomer.totalSpent + totalAmount,
          last_purchase: saleDate,
          name: customerDetails.name,
          address: customerDetails.address
        }).eq('id', existingCustomer.id);
      } else {
        await supabase.from('customers').insert({
          name: customerDetails.name,
          phone: customerDetails.phone,
          address: customerDetails.address,
          total_spent: totalAmount,
          last_purchase: saleDate
        });
      }

      showToast('تمت عملية البيع بنجاح', 'success');
      fetchData(); 

    } catch (error: any) {
      showToast('خطأ في إتمام البيع: ' + error.message, 'error');
    }
  };

  const handleUpdateSale = async (saleId: string, updatedData: any) => {
    const oldSale = sales.find(s => s.id === saleId);
    if (!oldSale) return;

    try {
      // 1. Revert Old Stock
      for (const item of oldSale.items) {
          const { data: p } = await supabase.from('products').select('stock').eq('id', item.productId).single();
          if (p) {
              await supabase.from('products').update({ stock: p.stock + item.quantity }).eq('id', item.productId);
          }
      }

      // 2. Update Sale Record
      const { error: updateError } = await supabase.from('sales').update({
          customer_name: updatedData.customerName,
          customer_phone: updatedData.customerPhone,
          delivery_duration: updatedData.deliveryDuration,
          items: updatedData.items,
          total_amount: updatedData.totalAmount
      }).eq('id', saleId);
      
      if (updateError) throw updateError;

      // 3. Apply New Stock
      for (const item of updatedData.items) {
          const { data: p } = await supabase.from('products').select('stock').eq('id', item.productId).single();
          if (p) {
              await supabase.from('products').update({ stock: p.stock - item.quantity }).eq('id', item.productId);
          }
      }

      // 4. Update Customer Stats
      const diff = updatedData.totalAmount - oldSale.totalAmount;
      const { data: cust } = await supabase.from('customers').select('total_spent').eq('phone', updatedData.customerPhone).single();
      if (cust) {
          await supabase.from('customers').update({ total_spent: cust.total_spent + diff }).eq('phone', updatedData.customerPhone);
      }

      showToast('تم تحديث الفاتورة بنجاح', 'success');
      fetchData();
    } catch (error: any) {
      showToast('خطأ في التحديث: ' + error.message, 'error');
    }
  };

  const handleReturnSale = async (saleId: string, reason: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    try {
        const { error: updateError } = await supabase.from('sales').update({ is_returned: true }).eq('id', saleId);
        if (updateError) throw updateError;
        for (const item of sale.items) {
            const { data: prodData } = await supabase.from('products').select('stock').eq('id', item.productId).single();
            if (prodData) {
                await supabase.from('products').update({ stock: prodData.stock + item.quantity }).eq('id', item.productId);
            }
        }
        showToast('تم استرجاع الفاتورة وإعادة المخزون', 'success');
        fetchData();
    } catch (error: any) {
        showToast('خطأ: ' + error.message, 'error');
    }
  };

  const handleAddProduct = async (product: Omit<ProductApp, 'id'>) => {
    try {
      const { error } = await supabase.from('products').insert({
        name: product.name,
        category: product.category,
        color: product.color,
        size: product.size,
        cost_price: product.costPrice,
        selling_price: product.sellingPrice,
        stock: product.stock
      });
      if (error) throw error;
      showToast('تم إضافة المنتج', 'success');
      fetchData();
    } catch (error: any) {
      showToast('خطأ: ' + error.message, 'error');
    }
  };

  const handleBatchAddProducts = async (newProducts: Omit<ProductApp, 'id'>[]) => {
    try {
        const payload = newProducts.map(product => ({
            name: product.name,
            category: product.category,
            color: product.color,
            size: product.size,
            cost_price: product.costPrice,
            selling_price: product.sellingPrice,
            stock: product.stock
        }));
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        showToast(`تم إضافة ${newProducts.length} قطعة بنجاح`, 'success');
        fetchData();
    } catch (error: any) {
        showToast('خطأ: ' + error.message, 'error');
    }
  };

  const handleEditProduct = async (id: string, updates: Partial<ProductApp>) => {
    try {
      const payload: any = {};
      if(updates.name) payload.name = updates.name;
      if(updates.category) payload.category = updates.category;
      if(updates.color) payload.color = updates.color;
      if(updates.size) payload.size = updates.size;
      if(updates.costPrice !== undefined) payload.cost_price = updates.costPrice;
      if(updates.sellingPrice !== undefined) payload.selling_price = updates.sellingPrice;
      if(updates.stock !== undefined) payload.stock = updates.stock;
      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error) throw error;
      showToast('تم تحديث المنتج', 'success');
      fetchData();
    } catch (error: any) {
      showToast('خطأ: ' + error.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      showToast('تم حذف المنتج', 'success');
      fetchData();
    } catch (error: any) {
      showToast('خطأ: ' + error.message, 'error');
    }
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const { error } = await supabase.from('expenses').insert({
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date
      });
      if (error) throw error;
      showToast('تم تسجيل المصروف', 'success');
      fetchData();
    } catch (error: any) {
      showToast('خطأ: ' + error.message, 'error');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      showToast('تم حذف المصروف', 'success');
      fetchData();
    } catch (error: any) {
      showToast('خطأ: ' + error.message, 'error');
    }
  };

  const DBSetupGuide = () => {
    const [copied, setCopied] = useState(false);
    const sqlScript = `
-- Create Tables for POS
create extension if not exists "uuid-ossp";
create table if not exists products ( id uuid primary key default uuid_generate_v4(), name text not null, category text, color text, size text, cost_price numeric default 0, selling_price numeric default 0, stock integer default 0, created_at timestamp with time zone default timezone('utc'::text, now()) );
create table if not exists customers ( id uuid primary key default uuid_generate_v4(), name text not null, phone text, address text, total_spent numeric default 0, last_purchase timestamp with time zone, created_at timestamp with time zone default timezone('utc'::text, now()) );
create table if not exists sales ( id uuid primary key default uuid_generate_v4(), date timestamp with time zone default timezone('utc'::text, now()), customer_name text, customer_phone text, delivery_duration text, items jsonb, total_amount numeric default 0, is_returned boolean default false, created_at timestamp with time zone default timezone('utc'::text, now()) );
create table if not exists expenses ( id uuid primary key default uuid_generate_v4(), description text not null, amount numeric default 0, category text, date timestamp with time zone default timezone('utc'::text, now()), created_at timestamp with time zone default timezone('utc'::text, now()) );
create table if not exists app_config ( id uuid primary key default uuid_generate_v4(), key text unique not null, value text not null );
insert into app_config (key, value) values ('admin_password', 'ADMIN') on conflict (key) do nothing;
alter table products enable row level security; alter table customers enable row level security; alter table sales enable row level security; alter table expenses enable row level security; alter table app_config enable row level security;
create policy "Enable all access" on products for all using (true) with check (true); create policy "Enable all access" on customers for all using (true) with check (true); create policy "Enable all access" on sales for all using (true) with check (true); create policy "Enable all access" on expenses for all using (true) with check (true); create policy "Enable all access" on app_config for all using (true) with check (true);
`;
    const handleCopy = () => {
      navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
        <div className="bg-card w-full max-w-3xl rounded-2xl border border-red-500/50 p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-white mb-2">قاعدة البيانات غير مهيئة</h2>
            <p className="text-gray-400 mb-6">انسخ الكود والصقه في SQL Editor الخاص بـ Supabase</p>
            <pre className="bg-dark p-4 rounded-lg text-xs text-green-400 overflow-x-auto max-h-60 mb-4">{sqlScript}</pre>
            <button onClick={handleCopy} className="bg-primary text-white px-6 py-2 rounded-lg font-bold mb-4">{copied ? 'تم النسخ' : 'نسخ الكود'}</button>
            <button onClick={() => window.location.reload()} className="block w-full text-center text-gray-400 hover:text-white underline">تم الإعداد، تحديث الصفحة</button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    // Only show big loader on initial entry
    if (loading && isInitialLoad) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-primary">
          <Loader2 className="animate-spin h-12 w-12 mb-4" />
          <p>جاري تهيئة النظام...</p>
        </div>
      );
    }

    if (dbError) return <DBSetupGuide />;

    switch(currentView) {
      case View.DASHBOARD: return <Dashboard stats={stats} sales={sales} products={products} expenses={expenses} />;
      case View.POS: return <POS products={products} customers={customers} onCompleteSale={handleCompleteSale} />;
      case View.INVENTORY: return <Inventory products={products} onAddProduct={handleAddProduct} onAddBatchProducts={handleBatchAddProducts} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />;
      case View.SALES: return <SalesLog sales={sales} onReturnSale={handleReturnSale} onUpdateSale={handleUpdateSale} />;
      case View.RETURNS: return <SalesLog sales={sales} onReturnSale={handleReturnSale} onUpdateSale={handleUpdateSale} viewMode="RETURNS_ONLY" />;
      case View.CUSTOMERS: return <Customers customers={customers} />;
      case View.EXPENSES: return <Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      default: return <Dashboard stats={stats} sales={sales} products={products} expenses={expenses} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="animate-spin h-16 w-16 text-primary" />
      </div>
    );
  }

  if (!isAuthorized && !session) return <Login onLoginSuccess={handlePasswordLoginSuccess} />;

  return (
    <div className="flex bg-[#121212] min-h-screen font-sans text-gray-100 overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={handleViewChange} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} currentUser={isPasswordAuth ? 'Admin' : session?.user.email} />
      
      <main className="flex-1 overflow-y-auto h-screen relative w-full">
        <header className="sticky top-0 z-20 bg-[#121212]/80 backdrop-blur-md p-4 md:p-6 border-b border-[#2a2a2a] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg"><Menu className="w-6 h-6" /></button>
            <h1 className="text-xl md:text-2xl font-bold text-white truncate">
              {currentView === View.DASHBOARD && 'لوحة المعلومات'}
              {currentView === View.POS && 'نقطة البيع'}
              {currentView === View.INVENTORY && 'المخزون والمنتجات'}
              {currentView === View.SALES && 'سجل المبيعات'}
              {currentView === View.RETURNS && 'إدارة المرتجعات'}
              {currentView === View.CUSTOMERS && 'العملاء'}
              {currentView === View.EXPENSES && 'المصاريف التشغيلية'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {loading && !isInitialLoad && <Loader2 className="animate-spin w-4 h-4 text-primary" title="جاري التحديث..." />}
             <button onClick={handleSignOut} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="p-4 md:p-6 h-[calc(100vh-80px)] overflow-y-auto">
          {renderContent()}
        </div>
      </main>

      {toast && (
        <div className={`fixed top-6 left-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-down ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          <span className="font-bold">{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default App;