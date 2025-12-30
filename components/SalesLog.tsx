import React, { useState } from 'react';
import { FileText, RotateCcw, Search, ChevronDown, ChevronUp, AlertTriangle, Instagram, Edit2, X, Check, Trash2, Plus, Minus } from 'lucide-react';
import { Sale } from '../types';

interface SalesLogProps {
  sales: Sale[];
  onReturnSale: (saleId: string, reason: string) => void;
  onUpdateSale?: (saleId: string, updatedData: any) => void;
  viewMode?: 'ALL' | 'RETURNS_ONLY';
}

const SalesLog: React.FC<SalesLogProps> = ({ sales, onReturnSale, onUpdateSale, viewMode = 'ALL' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returningId, setReturningId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredSales = sales
    .filter(s => viewMode === 'RETURNS_ONLY' ? s.isReturned : true)
    .filter(s => {
       const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.customerPhone.includes(searchTerm);
       const saleDate = new Date(s.date);
       let matchesDate = true;
       if (startDate) { const start = new Date(startDate); start.setHours(0,0,0,0); matchesDate = matchesDate && saleDate >= start; }
       if (endDate) { const end = new Date(endDate); end.setHours(23,59,59,999); matchesDate = matchesDate && saleDate <= end; }
       return matchesSearch && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleReturn = (id: string) => {
    if(!returnReason) return alert("الرجاء ذكر سبب الإرجاع");
    onReturnSale(id, returnReason);
    setReturningId(null); setReturnReason('');
  };

  const openInstagram = (name: string) => {
    const username = name.replace(/\s+/g, '');
    window.open(`https://ig.me/m/${username}`, '_blank');
  };

  const handleOpenEdit = (sale: Sale) => { setEditingSale({ ...sale, items: [...sale.items] }); setIsEditModalOpen(true); };

  const handleUpdateItem = (idx: number, field: string, value: any) => {
    const newItems = [...editingSale.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    if (field === 'price' || field === 'quantity') { newItems[idx].total = Number(newItems[idx].price) * Number(newItems[idx].quantity); }
    const newTotal = newItems.reduce((sum: number, i: any) => sum + i.total, 0);
    setEditingSale({ ...editingSale, items: newItems, totalAmount: newTotal });
  };

  const handleRemoveItem = (idx: number) => {
    if (editingSale.items.length <= 1) return alert("لا يمكن حذف آخر قطعة");
    const newItems = editingSale.items.filter((_: any, i: number) => i !== idx);
    const newTotal = newItems.reduce((sum: number, i: any) => sum + i.total, 0);
    setEditingSale({ ...editingSale, items: newItems, totalAmount: newTotal });
  };

  const handleSaveEdit = () => { if (onUpdateSale && editingSale) { onUpdateSale(editingSale.id, editingSale); setIsEditModalOpen(false); } };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{viewMode === 'RETURNS_ONLY' ? 'سجل المرتجعات' : 'سجل المبيعات'}</h2>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="bg-card p-3 rounded-xl border border-border flex items-center gap-3 flex-1"><Search className="text-gray-400 w-5 h-5" /><input type="text" placeholder="بحث..." className="bg-transparent border-none outline-none text-white w-full text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <div className="flex gap-2 bg-card p-2 rounded-xl border border-border overflow-x-auto">
            <div className="flex items-center gap-2 px-2 bg-dark rounded-lg border border-gray-700 min-w-[140px]"><span className="text-[10px] text-gray-400">من:</span><input type="date" className="bg-transparent text-white text-xs outline-none py-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="flex items-center gap-2 px-2 bg-dark rounded-lg border border-gray-700 min-w-[140px]"><span className="text-[10px] text-gray-400">إلى:</span><input type="date" className="bg-transparent text-white text-xs outline-none py-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredSales.map(sale => (
            <div key={sale.id} className={`bg-card rounded-xl border ${sale.isReturned ? 'border-red-500/30 bg-red-900/10' : 'border-border'} overflow-hidden transition-all`}>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/5 gap-4 sm:gap-0" onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${sale.isReturned ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>{sale.isReturned ? <RotateCcw className="w-5 h-5" /> : <FileText className="w-5 h-5" />}</div>
                    <div><h4 className="text-white font-bold flex items-center gap-2">{sale.customerName}{sale.isReturned && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">مرتجع</span>}</h4><p className="text-xs text-gray-400">#{sale.id.slice(0, 8)} | {new Date(sale.date).toLocaleString('ar-EG')}</p></div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-2 sm:pl-0"><div className="text-left"><p className="text-xs text-gray-500">الإجمالي</p><p className={`font-bold ${sale.isReturned ? 'text-red-400 line-through' : 'text-white'}`}>{sale.totalAmount.toLocaleString()} د.ع</p></div>{expandedSale === sale.id ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}</div>
                </div>
                {expandedSale === sale.id && (
                <div className="border-t border-border bg-dark/30 p-4 animate-fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 text-sm text-gray-400"><div><span className="block text-gray-500 text-xs mb-1">رقم الهاتف</span><div className="flex items-center gap-2"><span>{sale.customerPhone}</span><button onClick={(e) => { e.stopPropagation(); openInstagram(sale.customerName); }} className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded hover:opacity-90"><Instagram className="w-3 h-3" /> مراسلة</button></div></div><div><span className="block text-gray-500 text-xs mb-1">مدة التوصيل</span>{sale.deliveryDuration}</div><div className="flex justify-end items-center gap-2">{!sale.isReturned && (<button onClick={() => handleOpenEdit(sale)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /> تعديل</button>)}</div></div>
                    <div className="overflow-x-auto"><table className="w-full text-sm text-right text-gray-300 mb-4 min-w-[500px]"><thead className="text-gray-500 border-b border-gray-800"><tr><th className="pb-2">المنتج</th><th className="pb-2">الكمية</th><th className="pb-2">السعر</th><th className="pb-2">الإجمالي</th></tr></thead><tbody>{sale.items.map((item, idx) => (<tr key={idx} className="border-b border-gray-800/50"><td className="py-2"><span className="block text-white">{item.productName}</span><span className="text-xs text-gray-500">{item.color} | {item.size}</span></td><td className="py-2">{item.quantity}</td><td className="py-2">{item.price.toLocaleString()}</td><td className="py-2 text-primary">{item.total.toLocaleString()}</td></tr>))}</tbody></table></div>
                    {!sale.isReturned && viewMode === 'ALL' && (<div className="mt-4 pt-4 border-t border-border">{returningId === sale.id ? (<div className="flex gap-2"><input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="سبب الإرجاع..." className="flex-1 bg-dark border border-border rounded px-3 py-2 text-sm text-white outline-none" /><button onClick={() => handleReturn(sale.id)} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold">تأكيد</button></div>) : (<button onClick={() => setReturningId(sale.id)} className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> استرجاع</button>)}</div>)}
                </div>
                )}
            </div>
        ))}
      </div>

      {isEditModalOpen && editingSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
          <div className="bg-[#1e1e1e] w-full max-w-2xl rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-blue-600/10 border-b border-blue-600/20 flex justify-between items-center"><div><h3 className="text-xl font-bold text-white flex items-center gap-2"><Edit2 className="text-blue-500 w-5 h-5" /> تعديل الفاتورة</h3></div><button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-full"><X /></button></div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-xs text-gray-500 font-bold">اسم الزبونة</label><input value={editingSale.customerName} onChange={e => setEditingSale({...editingSale, customerName: e.target.value})} className="w-full bg-dark border border-border rounded-xl px-4 py-2.5 text-white" /></div>
                <div className="space-y-1"><label className="text-xs text-gray-500 font-bold">رقم الهاتف</label><input type="tel" inputMode="numeric" value={editingSale.customerPhone} onChange={e => setEditingSale({...editingSale, customerPhone: e.target.value})} className="w-full bg-dark border border-border rounded-xl px-4 py-2.5 text-white" /></div>
              </div>
              <div className="space-y-3">
                <div className="bg-dark/40 border border-border rounded-2xl overflow-hidden">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-black/20 text-gray-500"><tr><th className="p-3 text-xs">القطعة</th><th className="p-3 text-xs">الكمية</th><th className="p-3 text-xs">السعر</th><th className="p-3 text-xs">الإجمالي</th><th className="p-3"></th></tr></thead>
                    <tbody className="divide-y divide-gray-800">
                      {editingSale.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-3"><span className="block text-white font-bold text-xs">{item.productName}</span></td>
                          <td className="p-3"><div className="flex items-center gap-2"><button onClick={() => handleUpdateItem(idx, 'quantity', Math.max(1, item.quantity - 1))} className="p-1 bg-gray-800 rounded"><Minus className="w-3 h-3" /></button><span className="w-4 text-center text-white text-xs">{item.quantity}</span><button onClick={() => handleUpdateItem(idx, 'quantity', item.quantity + 1)} className="p-1 bg-gray-800 rounded"><Plus className="w-3 h-3" /></button></div></td>
                          <td className="p-3"><input type="number" inputMode="decimal" value={item.price} onChange={e => handleUpdateItem(idx, 'price', e.target.value)} className="w-20 bg-dark border border-gray-800 rounded p-1 text-xs text-white" /></td>
                          <td className="p-3 text-blue-400 font-bold text-xs">{item.total.toLocaleString()}</td>
                          <td className="p-3"><button onClick={() => handleRemoveItem(idx)} className="text-red-500/40 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-blue-600/5 p-4 rounded-2xl border border-blue-600/10 flex justify-between items-center"><span className="text-gray-400 text-sm">المجموع الجديد</span><span className="text-xl font-black text-white">{editingSale.totalAmount.toLocaleString()} د.ع</span></div>
            </div>
            <div className="p-6 bg-[#1a1a1a] border-t border-border grid grid-cols-2 gap-4"><button onClick={() => setIsEditModalOpen(false)} className="bg-gray-800 text-white py-4 rounded-2xl font-bold">إلغاء</button><button onClick={handleSaveEdit} className="bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"><Check className="w-5 h-5" /> حفظ التغييرات</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLog;