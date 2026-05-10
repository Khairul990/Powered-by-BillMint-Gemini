import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, GripVertical, Eye, EyeOff, Trash2, Edit2, Check, Lock } from 'lucide-react';
import { InvoiceColumn, ColumnType } from '../types';

interface ColumnBuilderProps {
  columns: InvoiceColumn[];
  onSave: (columns: InvoiceColumn[]) => void;
  onClose: () => void;
  isPremium?: boolean;
}

const SYSTEM_COLUMNS = ['name', 'quantity', 'price', 'total'];

export const ColumnBuilderModal: React.FC<ColumnBuilderProps> = ({ columns, onSave, onClose, isPremium }) => {
  const [localColumns, setLocalColumns] = useState<InvoiceColumn[]>([...columns].sort((a, b) => a.order - b.order));
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddColumn = () => {
    if (!isPremium && localColumns.length >= 8) {
      alert("Free plan is limited to 8 columns. Upgrade to Premium for unlimited Custom Columns.");
      return;
    }
    const newCol: InvoiceColumn = {
      id: `custom_${Date.now()}`,
      label: 'New Column',
      type: 'text',
      visible: true,
      order: localColumns.length + 1
    };
    setLocalColumns([...localColumns, newCol]);
    setEditingId(newCol.id);
  };

  const updateColumn = (id: string, updates: Partial<InvoiceColumn>) => {
    setLocalColumns(localColumns.map(col => col.id === id ? { ...col, ...updates } : col));
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === localColumns.length - 1) return;
    
    const newCols = [...localColumns];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // swap logic
    const temp = newCols[index];
    newCols[index] = newCols[swapIndex];
    newCols[swapIndex] = temp;
    
    // update order numbers
    newCols.forEach((col, i) => col.order = i + 1);
    
    setLocalColumns(newCols);
  };

  const removeColumn = (id: string) => {
    if (SYSTEM_COLUMNS.includes(id)) return; // Cannot delete base items
    setLocalColumns(localColumns.filter(col => col.id !== id).map((col, i) => ({ ...col, order: i + 1 })));
  };

  const handleSave = () => {
    onSave(localColumns);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-6 md:p-8 max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Invoice Table Layout</h2>
            <p className="text-slate-400 font-medium mt-1 text-sm">Customize columns for your invoice table.</p>
          </div>
          <button type="button" onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] mb-6 space-y-3 pr-2 custom-scrollbar">
          {localColumns.map((col, index) => (
            <div key={col.id} className={`flex items-center gap-3 p-4 bg-white border rounded-2xl transition-all ${col.visible ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
              <div className="flex flex-col gap-1 text-slate-300">
                <button type="button" onClick={() => moveColumn(index, 'up')} disabled={index === 0} className="hover:text-slate-600 disabled:opacity-30">
                  <span className="text-xs">▲</span>
                </button>
                <button type="button" onClick={() => moveColumn(index, 'down')} disabled={index === localColumns.length - 1} className="hover:text-slate-600 disabled:opacity-30">
                  <span className="text-xs">▼</span>
                </button>
              </div>
              
              <div className="flex-1 min-w-0 flex items-center gap-4">
                {editingId === col.id ? (
                  <input 
                    type="text" 
                    value={col.label}
                    autoFocus
                    onChange={(e) => updateColumn(col.id, { label: e.target.value })}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                    className="flex-1 bg-slate-50 border border-emerald-500 rounded-xl px-3 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                ) : (
                  <div className="flex-1 flex flex-col cursor-pointer" onClick={() => setEditingId(col.id)}>
                    <span className="font-bold text-slate-800 truncate">{col.label}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {col.type} {SYSTEM_COLUMNS.includes(col.id) && '(System)'}
                    </span>
                  </div>
                )}
              </div>

              {!SYSTEM_COLUMNS.includes(col.id) && editingId === col.id && (
                <select 
                  value={col.type} 
                  onChange={(e) => updateColumn(col.id, { type: e.target.value as ColumnType })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 outline-none"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="currency">Currency</option>
                  <option value="date">Date</option>
                  <option value="quantity">Quantity</option>
                </select>
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                {editingId === col.id ? (
                    <button type="button" onClick={() => setEditingId(null)} className="p-2.5 text-emerald-500 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
                        <Check size={16} />
                    </button>
                ) : (
                    <button type="button" onClick={() => setEditingId(col.id)} className="p-2.5 text-slate-400 bg-slate-50 rounded-xl hover:text-slate-600 hover:bg-slate-100 transition-colors">
                        <Edit2 size={16} />
                    </button>
                )}
                
                <button 
                  type="button"
                  onClick={() => updateColumn(col.id, { visible: !col.visible })} 
                  className={`p-2.5 rounded-xl transition-colors ${col.visible ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                >
                  {col.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                
                {!SYSTEM_COLUMNS.includes(col.id) && (
                  <button type="button" onClick={() => removeColumn(col.id)} className="p-2.5 text-rose-400 bg-rose-50 rounded-xl hover:text-rose-600 hover:bg-rose-100 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 shrink-0">
          <button 
            type="button"
            onClick={handleAddColumn}
            className="flex-1 py-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-slate-100 transition-all hover:border-slate-300"
          >
            <Plus size={18} /> Add Custom Column
            {!isPremium && <Lock size={14} className="text-slate-400 ml-1" />}
          </button>
          
          <button 
            type="button"
            onClick={handleSave}
            className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all outline-none"
          >
            <Check size={18} /> Save Layout
          </button>
        </div>
      </motion.div>
    </div>
  );
};
