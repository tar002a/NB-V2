import React, { useState } from 'react';
import { Search, User, Phone, MapPin, ShoppingBag, Clock } from 'lucide-react';
import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
}

const Customers: React.FC<CustomersProps> = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white">قاعدة بيانات العملاء</h2>

      <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
        <Search className="text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="بحث بالاسم أو رقم الهاتف..."
          className="bg-transparent border-none outline-none text-white w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-4">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gray-800 p-3 rounded-full group-hover:bg-primary group-hover:text-white transition-colors text-gray-400">
                <User className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-500">إجمالي المشتريات</p>
                <p className="text-primary font-bold text-lg">{customer.totalSpent.toLocaleString()} د.ع</p>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">{customer.name}</h3>
            
            <div className="space-y-2 mt-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{customer.address || 'لا يوجد عنوان'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>آخر شراء: {new Date(customer.lastPurchase).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <button className="text-xs text-primary hover:text-white transition-colors">عرض التفاصيل</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Customers;