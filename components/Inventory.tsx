import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Tag, Layers, X, AlertCircle, DollarSign } from 'lucide-react';
import { ProductApp } from '../types';

interface InventoryProps {
  products: ProductApp[];
  onAddProduct: (product: Omit<ProductApp, 'id'>) => void;
  onAddBatchProducts: (products: Omit<ProductApp, 'id'>[]) => void;
  onEditProduct: (id: string, product: Partial<ProductApp>) => void;
  onDeleteProduct: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onAddBatchProducts, onEditProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', category: '', color: '', size: '', costPrice: '', sellingPrice: '', stock: ''
  });

  const [batchData, setBatchData] = useState({
    name: '', category: '', costPrice: '', sellingPrice: '', stock: ''
  });
  const [colorTags, setColorTags] = useState<string[]>([]);
  const [sizeTags, setSizeTags] = useState<string[]>([]);
  const [currentColor, setCurrentColor] = useState('');
  const [currentSize, setCurrentSize] = useState('');

  const resetForm = () => {
    setFormData({ name: '', category: '', color: '', size: '', costPrice: '', sellingPrice: '', stock: '' });
    setBatchData({ name: '', category: '', costPrice: '', sellingPrice: '', stock: '' });
    setColorTags([]);
    setSizeTags([]);
    setEditingId(null);
  };

  const handleOpenModal = (product?: ProductApp) => {
    resetForm();
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        category: product.category,
        color: product.color,
        size: product.size,
        costPrice: product.costPrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
        stock: product.stock.toString()
      });
    }
    setIsModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: 'color' | 'size') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'color' && currentColor.trim()) {
        if (!colorTags.includes(currentColor.trim())) {
          setColorTags([...colorTags, currentColor.trim()]);
        }
        setCurrentColor('');
      } else if (type === 'size' && currentSize.trim()) {
        if (!sizeTags.includes(currentSize.trim())) {
          setSizeTags([...sizeTags, currentSize.trim()]);
        }
        setCurrentSize('');
      }
    }
  };

  const removeTag = (tag: string, type: 'color' | 'size') => {
    if (type === 'color') setColorTags(colorTags.filter(t => t !== tag));
    else setSizeTags(sizeTags.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEditProduct(editingId, {
        name: formData.name,
        category: formData.category,
        color: formData.color,
        size: formData.size,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        stock: Number(formData.stock)
      });
    } else {
      if (colorTags.length === 0 || sizeTags.length === 0) {
        alert("يرجى إضافة لون واحد وقياس واحد على الأقل");
        return;
      }
      const newProducts: Omit<ProductApp, 'id'>[] = [];
      colorTags.forEach(color => {
        sizeTags.forEach(size => {
            newProducts.push({
                name: batchData.name,
                category: batchData.category,
                color: color,
                size: size,
                costPrice: Number(batchData.costPrice),
                sellingPrice: Number(batchData.sellingPrice),
                stock: Number(batchData.stock)
            });
        });
      });
      onAddBatchProducts(newProducts);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const globalInventoryValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  }, [products]);

  const groupedInventory = useMemo(() => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.color.includes(searchTerm) ||
      p.size.includes(searchTerm)
    );
    const groups: { [key: string]: { name: string; category: string; color: string; totalStock: number; totalCostValue: number; variants: ProductApp[] }} = {};
    filtered.forEach(p => {
      const key = `${p.name}-${p.category}-${p.color}`;
      if (!groups[key]) {
        groups[key] = { name: p.name, category: p.category, color: p.color, totalStock: 0, totalCostValue: 0, variants: [] };
      }
      groups[key].variants.push(p);
      groups[key].totalStock += p.stock;
      groups[key].totalCostValue += (p.stock * p.costPrice);
    });
    return Object.values(groups).sort((a, b) => b.totalStock - a.totalStock);
  }, [products, searchTerm]);

  const getColorStyle = (colorName: string) => {
    const map: {[key: string]: string} = {
      'أحمر': '#ef4444', 'red': '#ef4444', 'أزرق': '#3b82f6', 'blue': '#3b82f6',
      'أخضر': '#22c55e', 'green': '#22c55e', 'أسود': '#000000', 'black': '#000000',
      'أبيض': '#ffffff', 'white': '#ffffff', 'أصفر': '#eab308', 'yellow': '#eab308',
      'وردي': '#ec4899', 'pink': '#ec4899', 'بيج': '#f5f5dc', 'beige': '#f5f5dc',
    };
    return map[colorName.toLowerCase()] || '#9ca3af';
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2"><Layers className="text-primary w-6 h-6" />إدارة المخزون والقطع</h2><p className="text-gray-400 text-xs mt-1">عرض قيمة المخزون وتفاصيل الموديلات</p></div>
        <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-lg shadow-primary/5"><div className="bg-primary p-2 rounded-lg"><DollarSign className="w-5 h-5 text-white" /></div><div><span className="block text-[10px] text-gray-400 uppercase font-bold">إجمالي قيمة التكلفة</span><span className="text-xl font-bold text-white">{globalInventoryValue.toLocaleString()} <small className="text-[10px] font-normal opacity-70">د.ع</small></span></div></div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-primary hover:bg-primaryHover text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-primary/20 transition-all"><Plus className="w-5 h-5" /><span>إضافة منتج جديد</span></button>
      </div>
      <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3"><Search className="text-gray-400 w-5 h-5" /><input type="text" placeholder="ابحث عن موديل، لون، أو تصنيف..." className="bg-transparent border-none outline-none text-white w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-20">
        {groupedInventory.map((group, idx) => (
            <div key={idx} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:border-primary/20 transition-all">
                <div className="bg-[#1a1a1a] p-4 flex flex-wrap justify-between items-center border-b border-border/50 gap-4"><div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full border border-gray-600" style={{backgroundColor: getColorStyle(group.color)}}></div><div><h3 className="text-white font-bold">{group.name} - <span className="text-primary">{group.color}</span></h3><span className="text-gray-500 text-[10px] bg-dark px-2 py-0.5 rounded border border-border">{group.category}</span></div></div><div className="flex gap-4 items-center"><div className="text-center px-4 py-1 border-l border-gray-800"><span className="block text-[10px] text-gray-500">إجمالي القطع</span><span className={`font-bold ${group.totalStock === 0 ? 'text-red-500' : 'text-white'}`}>{group.totalStock}</span></div><div className="text-left"><span className="block text-[10px] text-gray-500">قيمة التكلفة للمجموعة</span><span className="font-bold text-green-500">{group.totalCostValue.toLocaleString()} <small className="text-[10px]">د.ع</small></span></div></div></div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">{group.variants.map(variant => (<div key={variant.id} className={`bg-dark/50 p-3 rounded-xl border transition-all group relative ${variant.stock <= 0 ? 'border-red-900/30' : 'border-border hover:border-primary/40'}`}><div className="flex justify-between items-center mb-1"><span className="text-white font-bold text-sm">{variant.size}</span><span className={`text-[10px] ${variant.stock <= 0 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{variant.stock === 0 ? 'نفذت' : `${variant.stock} قطعة`}</span></div><div className="flex flex-col gap-0.5 mt-1 border-t border-white/5 pt-1"><div className="flex justify-between items-center"><span className="text-[9px] text-gray-600">البيع:</span><span className="text-primary text-xs font-bold">{variant.sellingPrice.toLocaleString()}</span></div><div className="flex justify-between items-center"><span className="text-[9px] text-gray-600">التكلفة:</span><span className="text-gray-400 text-[10px]">{variant.costPrice.toLocaleString()}</span></div></div><div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl"><button onClick={() => handleOpenModal(variant)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg"><Edit2 className="w-4 h-4" /></button><button onClick={() => { if(window.confirm('حذف هذا المقاس؟')) onDeleteProduct(variant.id) }} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 shadow-lg"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>
            </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-primary/30 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-border pb-3">{editingId ? 'تعديل تفاصيل القطعة' : 'إضافة موديل جديد'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editingId ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-gray-400 text-xs">اسم الموديل</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
                  <div><label className="text-gray-400 text-xs">اللون</label><input required value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
                  <div><label className="text-gray-400 text-xs">المقاس</label><input required value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
                  <div><label className="text-gray-400 text-xs">سعر التكلفة</label><input required type="number" inputMode="decimal" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
                  <div><label className="text-gray-400 text-xs">سعر البيع</label><input required type="number" inputMode="decimal" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
                  <div className="col-span-2"><label className="text-gray-400 text-xs">الكمية المتوفرة</label><input required type="number" inputMode="numeric" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white focus:border-primary outline-none" /></div>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2"><label className="text-gray-400 text-xs">اسم الموديل</label><input required placeholder="مثال: فستان كلاسيك" value={batchData.name} onChange={e => setBatchData({...batchData, name: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white outline-none focus:border-primary" /></div>
                      <div><label className="text-gray-400 text-xs">التصنيف</label><input required placeholder="فساتين / بلايز / ..." value={batchData.category} onChange={e => setBatchData({...batchData, category: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white outline-none focus:border-primary" /></div>
                      <div><label className="text-gray-400 text-xs">الكمية لكل مقاس</label><input required type="number" inputMode="numeric" placeholder="مثال: 10" value={batchData.stock} onChange={e => setBatchData({...batchData, stock: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white outline-none focus:border-primary" /></div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-gray-400 text-xs">سعر التكلفة (للقطعة)</label><input required type="number" inputMode="decimal" placeholder="0" value={batchData.costPrice} onChange={e => setBatchData({...batchData, costPrice: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white outline-none focus:border-primary" /></div>
                      <div><label className="text-gray-400 text-xs">سعر البيع (للقطعة)</label><input required type="number" inputMode="decimal" placeholder="0" value={batchData.sellingPrice} onChange={e => setBatchData({...batchData, sellingPrice: e.target.value})} className="w-full bg-dark border border-border rounded-xl p-3 text-white outline-none focus:border-primary" /></div>
                   </div>
                   <div className="space-y-2"><label className="text-gray-400 text-xs">الألوان</label><div className="flex flex-wrap gap-2 p-2 bg-dark border border-border rounded-xl min-h-[50px]">{colorTags.map(t => <span key={t} className="bg-primary/20 text-primary px-3 py-1 rounded-lg flex items-center gap-2 text-sm font-bold">{t}<X className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => removeTag(t, 'color')} /></span>)}<input value={currentColor} onChange={e => setCurrentColor(e.target.value)} onKeyDown={e => handleKeyDown(e, 'color')} placeholder="أضف لون..." className="bg-transparent outline-none text-white flex-1 min-w-[100px]" /></div></div>
                   <div className="space-y-2"><label className="text-gray-400 text-xs">المقاسات</label><div className="flex flex-wrap gap-2 p-2 bg-dark border border-border rounded-xl min-h-[50px]">{sizeTags.map(t => <span key={t} className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg flex items-center gap-2 text-sm font-bold">{t}<X className="w-4 h-4 cursor-pointer hover:text-white" onClick={() => removeTag(t, 'size')} /></span>)}<input value={currentSize} onChange={e => setCurrentSize(e.target.value)} onKeyDown={e => handleKeyDown(e, 'size')} placeholder="أضف مقاس..." className="bg-transparent outline-none text-white flex-1 min-w-[100px]" /></div></div>
                </div>
              )}
              <div className="flex gap-3 pt-6 border-t border-border mt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-colors">إلغاء</button><button type="submit" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primaryHover transition-all">{editingId ? 'حفظ التعديلات' : 'إنشاء المنتجات'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;