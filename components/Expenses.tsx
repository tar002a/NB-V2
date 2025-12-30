import React, { useState } from 'react';
import { Plus, DollarSign, Calendar, Tag, Trash2 } from 'lucide-react';
import { Expense } from '../types';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('تشغيلية');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onAddExpense({ description, amount: Number(amount), category, date: new Date().toISOString() });
    setDescription('');
    setAmount('');
  };

  const categories = ['تشغيلية', 'رواتب', 'تسويق', 'صيانة', 'أخرى'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1">
        <div className="bg-card p-6 rounded-xl border border-border sticky top-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus className="bg-primary rounded-full text-white p-1 w-6 h-6" />تسجيل مصروف</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">المبلغ</label>
              <div className="relative">
                <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-dark border border-border rounded-lg p-3 pl-10 text-white outline-none focus:border-primary" placeholder="0.00" />
                <DollarSign className="absolute left-3 top-3.5 text-gray-500 w-4 h-4" />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">الوصف</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-dark border border-border rounded-lg p-3 text-white outline-none focus:border-primary h-24 resize-none" placeholder="تفاصيل المصروف..." />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">التصنيف</label>
              <div className="flex flex-wrap gap-2">{categories.map(cat => (<button key={cat} type="button" onClick={() => setCategory(cat)} className={`text-sm px-3 py-1 rounded-full border transition-all ${category === cat ? 'bg-primary border-primary text-white' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}>{cat}</button>))}</div>
            </div>
            <button type="submit" className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 mt-2">حفظ السجل</button>
          </form>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xl font-bold text-white">سجل المصروفات الأخير</h3>
        <div className="space-y-3">
          {expenses.length === 0 ? (<div className="text-center text-gray-500 py-10 bg-card rounded-xl border border-border">لا توجد مصروفات مسجلة</div>) : (
            expenses.slice().reverse().map(expense => (
              <div key={expense.id} className="bg-card p-4 rounded-xl border border-border flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="bg-red-500/10 p-3 rounded-lg text-red-500"><DollarSign className="w-6 h-6" /></div>
                  <div><h4 className="text-white font-bold mb-1">{expense.description}</h4><div className="flex items-center gap-3 text-xs text-gray-500"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(expense.date).toLocaleDateString('ar-EG')}</span><span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {expense.category}</span></div></div>
                </div>
                <div className="flex items-center gap-4"><div className="text-xl font-bold text-red-400">-{expense.amount} د.ع</div><button onClick={() => { if(window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) onDeleteExpense(expense.id) }} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-dark rounded-lg hover:bg-red-900/10" title="حذف"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;