import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, FileText, RotateCcw, Users, DollarSign, Shirt, X } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, currentUser }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: View.POS, label: 'نقطة البيع', icon: ShoppingBag },
    { id: View.INVENTORY, label: 'المخزون', icon: Package },
    { id: View.SALES, label: 'سجل المبيعات', icon: FileText },
    { id: View.RETURNS, label: 'المرتجعات', icon: RotateCcw },
    { id: View.CUSTOMERS, label: 'العملاء', icon: Users },
    { id: View.EXPENSES, label: 'المصروفات', icon: DollarSign },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 right-0 z-50
        w-64 bg-card border-l md:border-e border-border h-screen flex flex-col 
        transform transition-transform duration-300 ease-in-out shrink-0
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full">
              <Shirt className="text-primary w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">نواعم</h1>
              <p className="text-xs text-primary font-semibold tracking-widest uppercase">BOUTIQUE</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-gradient-to-br from-gray-800 to-black p-4 rounded-xl border border-border">
            <p className="text-xs text-gray-500 mb-1">المستخدم الحالي</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                {currentUser ? currentUser.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="text-sm font-semibold text-gray-200 truncate max-w-[140px]">
                {currentUser || 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;