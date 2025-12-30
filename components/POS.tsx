import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, ShoppingBag, ArrowLeft, Copy, Instagram, Check, X, Edit2, UserCheck, User, Filter, Clock, Printer, ShoppingBasket, Truck, Phone } from 'lucide-react';
import { ProductApp, CartItem, Customer } from '../types';

interface POSProps {
  products: ProductApp[];
  customers: Customer[];
  onCompleteSale: (items: CartItem[], customerDetails: any) => void;
}

const POS: React.FC<POSProps> = ({ products, customers, onCompleteSale }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Size Picker State
  const [sizePickerGroup, setSizePickerGroup] = useState<any | null>(null);

  // Price Editing State
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // Checkout State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryDuration, setDeliveryDuration] = useState('48 ساعة');
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [mobileView, setMobileView] = useState<'PRODUCTS' | 'CART'>('PRODUCTS');
  
  const [foundCustomerMsg, setFoundCustomerMsg] = useState('');
  
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [addedNote, setAddedNote] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const deliveryOptions = ['24 ساعة', '48 ساعة', '3 ايام', '4 ايام', '5 ايام'];

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['الكل', ...Array.from(cats)];
  }, [products]);

  const groupedProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.size.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const groups: { [key: string]: { 
      name: string, 
      color: string, 
      category: string, 
      price: number,
      totalStock: number,
      variants: ProductApp[] 
    }} = {};

    filtered.forEach(p => {
      const key = `${p.name}-${p.color}`;
      if (!groups[key]) {
        groups[key] = {
          name: p.name,
          color: p.color,
          category: p.category,
          price: p.sellingPrice,
          totalStock: 0,
          variants: []
        };
      }
      groups[key].variants.push(p);
      groups[key].totalStock += p.stock;
    });

    return Object.values(groups).sort((a, b) => b.totalStock - a.totalStock);
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: ProductApp, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; 
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setAddedNote(`تمت إضافة: ${product.name} (${product.size})`);
    setTimeout(() => setAddedNote(null), 2000);
    setSizePickerGroup(null);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= item.stock) return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updatePrice = (id: string) => {
    const newPriceValue = Number(tempPrice);
    if (isNaN(newPriceValue)) return;
    
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, sellingPrice: newPriceValue } : item
    ));
    setEditingPriceId(null);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCustomerName(name);
    const existing = customers.find(c => c.name.trim() === name.trim());
    if (existing) {
      setCustomerPhone(existing.phone);
      setCustomerAddress(existing.address || '');
      setFoundCustomerMsg('عميل مسجل ✅');
    } else {
      setFoundCustomerMsg('');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const arabicDigitsMap: { [key: string]: string } = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    value = value.replace(/[٠-٩]/g, (d) => arabicDigitsMap[d] || d);
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomerPhone(numericValue.slice(0, 11));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) { alert("يرجى إدخال اسم الزبونة"); return; }
    if (customerPhone.length < 11) { alert("رقم الهاتف يجب أن يكون 11 رقم"); return; }

    const orderId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const currentOrderDetails = {
        id: orderId,
        cart: [...cart],
        customer: { name: customerName, phone: customerPhone, address: customerAddress, deliveryDuration: deliveryDuration },
        total: cartTotal, date: new Date().toLocaleDateString('ar-EG'), time: new Date().toLocaleTimeString('ar-EG')
    };
    onCompleteSale(cart, currentOrderDetails.customer);
    setLastOrder(currentOrderDetails);
    setShowReceipt(true);
    setCopiedMsg(false);
    setCart([]); setCustomerName(''); setCustomerPhone(''); setCustomerAddress('');
    setIsCheckoutMode(false); setMobileView('PRODUCTS');
  };

  const copyForInstagram = () => {
    if (!lastOrder) return;
    const itemsText = lastOrder.cart.map((i: any) => `القطعة: ${i.name}\nاللون: ${i.color} | القياس: ${i.size}\nالعدد: ${i.quantity}\nالسعر: ${i.sellingPrice.toLocaleString()}`).join('\n---\n');
    const fullText = `🌸 تم تثبيت طلبج بنجاح حبيبتي\n\n📄 تفاصيل الطلب:\n${itemsText}\nالتوصيل: مجاني 🎁\nالمجموع الكلي: ${lastOrder.total.toLocaleString()} د.ع\n\n📍 معلومات التوصيل:\nالعنوان: ${lastOrder.customer.address || 'لم يتم تحديده'}\nالرقم: ${lastOrder.customer.phone}\n\n✨ ملاحظة مهمة: من يوصل المندوب، ضروري تفتحين الطلب وتقيسين القطعة وتتأكدين منها قبل الدفع. هذا حقج حتى تضمنين قياسج وموديلج 100%.\n\n🚚 مدة التوصيل: خلال ${lastOrder.customer.deliveryDuration} إن شاء الله.\n\nتتهنين بيها مقدماً، وشكراً لثقتج بـ نواعم بوتيك 🤍`;
    navigator.clipboard.writeText(fullText);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 3000);
  };

  const openInstagramChat = () => {
    if (!lastOrder) return;
    const username = lastOrder.customer.name.replace(/\s+/g, '');
    window.open(`https://ig.me/m/${username}`, '_blank');
  };

  const getColorHex = (colorName: string) => {
    const map: {[key: string]: string} = {
      'أحمر': '#ef4444', 'red': '#ef4444', 'أزرق': '#3b82f6', 'blue': '#3b82f6',
      'أخضر': '#22c55e', 'green': '#22c55e', 'أسود': '#000000', 'black': '#000000',
      'أبيض': '#ffffff', 'white': '#ffffff', 'أصفر': '#eab308', 'yellow': '#eab308',
      'وردي': '#ec4899', 'pink': '#ec4899', 'بيج': '#f5f5dc', 'beige': '#f5f5dc',
    };
    return map[colorName.toLowerCase()] || '#9ca3af';
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 relative overflow-hidden">
      <div className={`flex-1 flex flex-col gap-4 h-full overflow-hidden ${mobileView === 'CART' ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex flex-col gap-4 bg-card/50 backdrop-blur-sm p-4 rounded-2xl border border-border">
            <div className="relative">
                <Search className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="بحث باسم الموديل أو اللون..." className="w-full bg-dark border border-border rounded-xl py-2.5 pr-10 pl-4 text-white outline-none focus:border-primary transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-dark text-gray-400 hover:text-white border border-border'}`}>{cat}</button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-24">
                {groupedProducts.map((group, idx) => (
                    <div key={idx} onClick={() => setSizePickerGroup(group)} className="group bg-gradient-to-br from-[#1e1e1e] to-[#1a1a1a] rounded-2xl border border-border p-3 cursor-pointer hover:border-primary/50 transition-all flex flex-col gap-2 relative shadow-sm hover:shadow-primary/5">
                        <div className="flex justify-between items-start">
                             <span className="text-[10px] text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-white/5 truncate max-w-[70%]">{group.category}</span>
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${group.totalStock <= 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{group.totalStock <= 0 ? 'نفذ' : group.totalStock}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center py-2 text-center">
                             <div className="w-10 h-10 mb-2 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 group-hover:scale-110 transition-transform">{group.name.charAt(0)}</div>
                             <h3 className="text-white font-bold text-sm leading-tight h-10 overflow-hidden">{group.name}</h3>
                        </div>
                        <div className="bg-black/20 rounded-xl p-2 flex flex-col gap-1">
                            <div className="flex items-center justify-center gap-2">
                                <span className="w-3 h-3 rounded-full border border-gray-600" style={{backgroundColor: getColorHex(group.color)}}></span>
                                <span className="text-[10px] font-bold text-gray-300">{group.color}</span>
                            </div>
                            <div className="text-center text-primary font-bold text-sm border-t border-white/5 pt-1">{group.price.toLocaleString()} د.ع</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {cart.length > 0 && mobileView === 'PRODUCTS' && (
          <button onClick={() => setMobileView('CART')} className="md:hidden fixed bottom-20 left-6 right-6 bg-primary text-white py-4 rounded-2xl shadow-2xl flex items-center justify-between px-6 animate-fade-in-up z-40">
            <div className="flex items-center gap-3">
               <div className="relative">
                 <ShoppingBasket className="w-6 h-6" />
                 <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary">{cartItemCount}</span>
               </div>
               <span className="font-bold">عرض السلة</span>
            </div>
            <span className="font-bold">{cartTotal.toLocaleString()} د.ع</span>
          </button>
        )}
      </div>

      <div className={`w-full md:w-[400px] bg-card flex flex-col rounded-2xl border border-border h-full fixed md:relative inset-0 z-[60] md:z-auto transition-transform duration-300 ${mobileView === 'CART' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-border bg-primary/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <button onClick={() => setMobileView('PRODUCTS')} className="md:hidden p-1.5 bg-white/10 rounded-lg text-white"><ArrowLeft className="w-5 h-5" /></button>
                <h2 className="font-bold text-white">سلة المشتريات</h2>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{cartItemCount} قطعة</span>
                {cart.length > 0 && <button onClick={() => { if(window.confirm('تفريغ السلة؟')) setCart([]) }} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#181818]">
            {cart.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3 opacity-40">
                  <ShoppingBag className="w-16 h-16" />
                  <p>السلة فارغة</p>
               </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2 shadow-sm relative group/item">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm">{item.name}</h4>
                                <span className="text-[10px] text-gray-500 bg-dark px-1.5 py-0.5 rounded">{item.color} | {item.size}</span>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-gray-600 hover:text-red-500 p-1 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            {editingPriceId === item.id ? (
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        inputMode="decimal"
                                        className="w-20 bg-dark border border-primary text-xs text-white p-1 rounded outline-none" 
                                        value={tempPrice}
                                        onChange={e => setTempPrice(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={() => updatePrice(item.id)} className="p-1 bg-green-600 rounded text-white"><Check className="w-3 h-3" /></button>
                                    <button onClick={() => setEditingPriceId(null)} className="p-1 bg-red-600 rounded text-white"><X className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-primary font-bold">{item.sellingPrice.toLocaleString()} <small className="text-[9px] font-normal">د.ع</small></span>
                                    <button onClick={() => { setEditingPriceId(item.id); setTempPrice(item.sellingPrice.toString()); }} className="p-1 text-gray-500 hover:text-primary transition-colors opacity-0 group-hover/item:opacity-100"><Edit2 className="w-3 h-3" /></button>
                                </div>
                            )}
                            <div className="flex items-center bg-dark rounded-lg p-1 border border-border">
                                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                                <span className="w-8 text-center text-white text-xs font-bold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
        <div className="p-4 bg-card border-t border-border shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
            {isCheckoutMode ? (
                <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute right-3 top-3.5 text-gray-500 w-4 h-4" />
                      <input value={customerName} onChange={handleCustomerNameChange} placeholder="اسم الزبونة (انستغرام)" className="w-full bg-dark border border-gray-700 rounded-xl py-3 pr-10 pl-4 text-white focus:border-primary outline-none" />
                      {foundCustomerMsg && <span className="absolute left-3 top-3.5 text-green-500 text-[10px] font-bold">{foundCustomerMsg}</span>}
                    </div>
                    <div className="relative">
                      <Phone className="absolute right-3 top-3.5 text-gray-500 w-4 h-4" />
                      <input 
                        type="tel" 
                        inputMode="numeric"
                        value={customerPhone} 
                        onChange={handlePhoneChange} 
                        placeholder="رقم الهاتف (11 رقم)" 
                        className={`w-full bg-dark border rounded-xl py-3 pr-10 pl-4 text-white focus:border-primary outline-none transition-colors ${customerPhone.length > 0 && customerPhone.length < 11 ? 'border-red-500/50' : 'border-gray-700'}`} 
                        maxLength={11} 
                      />
                      <div className="absolute left-3 top-3.5 flex items-center gap-1"><span className={`text-[9px] font-bold ${customerPhone.length === 11 ? 'text-green-500' : 'text-gray-500'}`}>{customerPhone.length}/11</span></div>
                    </div>
                    <div className="relative">
                      <Truck className="absolute right-3 top-3.5 text-gray-500 w-4 h-4" />
                      <select value={deliveryDuration} onChange={e => setDeliveryDuration(e.target.value)} className="w-full bg-dark border border-gray-700 rounded-xl py-3 pr-10 pl-4 text-white focus:border-primary outline-none appearance-none">
                        {deliveryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="relative">
                      <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="العنوان بالتفصيل" className="w-full bg-dark border border-gray-700 rounded-xl py-3 px-4 text-white focus:border-primary outline-none" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsCheckoutMode(false)} className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold transition-colors">عودة</button>
                        <button onClick={handleCheckout} disabled={customerPhone.length < 11} className="flex-[2] bg-green-600 disabled:bg-gray-800 disabled:text-gray-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-900/20 hover:bg-green-500 transition-colors">تأكيد العملية</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-end"><span className="text-gray-400 text-sm">المجموع النهائي</span><div className="text-left"><span className="text-2xl font-bold text-white">{cartTotal.toLocaleString()}</span><small className="text-xs text-primary mr-1">د.ع</small></div></div>
                    <button onClick={() => setIsCheckoutMode(true)} disabled={cart.length === 0} className="group w-full bg-primary disabled:bg-gray-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primaryHover transition-all"><CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" /> استكمال الطلب</button>
                </div>
            )}
        </div>
      </div>

      {sizePickerGroup && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSizePickerGroup(null)}>
            <div className="bg-[#1e1e1e] w-full max-w-sm rounded-3xl border border-gray-800 p-6 flex flex-col gap-6 animate-fade-in-up shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center"><div><h3 className="text-white font-bold text-xl">{sizePickerGroup.name}</h3><div className="flex items-center gap-2 mt-1"><span className="w-3 h-3 rounded-full border border-white/10" style={{backgroundColor: getColorHex(sizePickerGroup.color)}}></span><span className="text-gray-400 text-sm font-bold">{sizePickerGroup.color}</span></div></div><button onClick={() => setSizePickerGroup(null)} className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6" /></button></div>
                <div className="bg-dark/50 p-4 rounded-2xl border border-border"><p className="text-[10px] text-gray-500 mb-3 uppercase tracking-widest font-black">اختر المقاس المطلوب</p><div className="grid grid-cols-2 gap-3">{sizePickerGroup.variants.map((v: any) => (<button key={v.id} onClick={(e) => addToCart(v, e)} disabled={v.stock <= 0} className={`group relative py-4 rounded-2xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${v.stock <= 0 ? 'bg-gray-900/40 border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-dark border-gray-700 text-white hover:border-primary hover:text-primary active:scale-95 shadow-sm'}`}><span className="text-lg">{v.size}</span><span className={`text-[10px] font-normal ${v.stock <= 3 ? 'text-red-500' : 'opacity-60'}`}>{v.stock <= 0 ? 'منتهي' : `متوفر: ${v.stock}`}</span></button>))}</div></div>
            </div>
        </div>
      )}

      {addedNote && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade-in-down"><Check className="w-5 h-5" /><span className="font-bold">{addedNote}</span></div>)}

      {showReceipt && lastOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 p-4 animate-fade-in" onClick={() => setShowReceipt(false)}>
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-green-500/10 text-center border-b border-green-500/20"><div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="text-white w-6 h-6" /></div><h2 className="text-xl font-black text-white">تم تأكيد الطلب بنجاح</h2><p className="text-green-500 text-xs mt-1 font-bold">#{lastOrder.id}</p></div>
            <div className="p-6 bg-[#121212]">
                <div className="flex flex-wrap gap-2 justify-between items-center mb-4"><span className="text-xs text-gray-500 font-bold uppercase tracking-wider">خيارات انستغرام</span><div className="flex gap-2"><button onClick={openInstagramChat} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-all border border-white/10"><Instagram className="w-3.5 h-3.5" />فتح المحادثة</button><button onClick={copyForInstagram} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copiedMsg ? 'bg-green-600 text-white' : 'bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30'}`}>{copiedMsg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copiedMsg ? 'تم النسخ' : 'نسخ التفاصيل'}</button></div></div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-gray-400 whitespace-pre-wrap leading-relaxed max-h-[25vh] overflow-y-auto scrollbar-hide">
{`🌸 تم تثبيت طلبج بنجاح حبيبتي\n\n📄 تفاصيل الطلب:\n${lastOrder.cart.map((i: any) => `القطعة: ${i.name}\nاللون: ${i.color} | القياس: ${i.size}\nالعدد: ${i.quantity}\nالسعر: ${i.sellingPrice.toLocaleString()}`).join('\n---\n')}\nالتوصيل: مجاني 🎁\nالمجموع الكلي: ${lastOrder.total.toLocaleString()} د.ع\n\n📍 معلومات التوصيل:\nالعنوان: ${lastOrder.customer.address}\nالرقم: ${lastOrder.customer.phone}\n\n✨ ملاحظة مهمة: من يوصل المندوب، ضروري تفتحين الطلب وتقيسين القطعة وتتأكدين منها قبل الدفع. هذا حقج حتى تضمنين قياسج وموديلج 100%.\n\n🚚 مدة التوصيل: خلال ${lastOrder.customer.deliveryDuration} إن شاء الله.\n\nتتهنين بيها مقدماً، وشكراً لثقتج بـ نواعم بوتيك 🤍`}
                </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 bg-[#1a1a1a] border-t border-border"><button onClick={() => setShowReceipt(false)} className="bg-gray-800 text-white py-4 rounded-2xl font-bold hover:bg-gray-700 transition-colors">إغلاق</button><button onClick={() => setShowReceipt(false)} className="bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primaryHover transition-colors">فاتورة جديدة</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;