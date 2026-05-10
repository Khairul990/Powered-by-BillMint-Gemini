import React, { useRef } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { toJpeg } from 'html-to-image';
import { 
  Printer, 
  X, 
  AlertCircle, 
  MapPin, 
  Mail, 
  Phone, 
  User,
  CheckCircle2,
  FileText,
  FileCheck,
  Image as ImageIcon
} from 'lucide-react';
import { Invoice, InvoiceItem, BusinessSettings, InvoiceTemplateType, DEFAULT_INVOICE_COLUMNS } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion } from 'motion/react';
import InvoicePDF from './InvoicePDF';

interface InvoiceViewProps {
  invoice: Invoice;
  items: InvoiceItem[];
  settings: BusinessSettings | null;
  onClose: () => void;
}

const LargeProfessionalTemplate = ({ invoice, items, settings }: { invoice: Invoice, items: InvoiceItem[], settings: BusinessSettings | null }) => {
  const isDraft = invoice.status === 'Draft';
  const invoiceColumns = settings?.invoiceColumns || DEFAULT_INVOICE_COLUMNS;
  const visibleColumns = [...invoiceColumns].filter(c => c.visible).sort((a,b) => a.order - b.order);

  return (
    <div className="w-full bg-white min-h-[1754px] font-sans text-slate-900 flex flex-col p-12 md:p-16 relative" id="invoice-professional-a4">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -z-10 opacity-50" />
      
      {/* Draft Watermark */}
      {isDraft && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 overflow-hidden z-0 select-none">
          <span className="text-[12rem] font-black uppercase -rotate-45 text-slate-900 tracking-widest">DRAFT</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex justify-between items-start mb-12 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-6">
          {/* Logo Box */}
          <div className="w-32 h-32 border border-slate-200 rounded-[2rem] flex items-center justify-center bg-white shadow-sm p-3 shrink-0">
            {settings?.logoUrl && settings.isPremium ? (
              <img src={settings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Logo</p>
              </div>
            )}
          </div>

          {/* Business Info */}
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-4">
              {settings?.businessName || 'K.B. Embroidery Designor 1118'}
            </h1>
            <div className="space-y-2 text-slate-500 font-medium text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <p className="max-w-[280px] leading-relaxed">
                  {settings?.businessAddress || 'Dhulagor Howrah, Haji Saheb Para, Pin No - 711302'}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <p>{settings?.businessEmail || 'khairul2052007@gmail.com'}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <p>{settings?.businessPhone || '9903591839'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Title & Meta */}
        <div className="text-right flex flex-col items-end pt-2">
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-6">INVOICE</h2>
          <div className="space-y-3 inline-block text-left bg-slate-50 border border-slate-100 rounded-2xl p-5 min-w-[220px]">
            <div className="flex justify-between gap-8 items-baseline border-b border-slate-200/60 pb-2">
              <span className="text-[11px] uppercase tracking-widest font-black text-slate-400">Invoice No.</span>
              <span className="text-base font-black text-slate-900">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between gap-8 items-baseline border-b border-slate-200/60 pb-2">
              <span className="text-[11px] uppercase tracking-widest font-black text-slate-400">Invoice Date</span>
              <span className="text-sm font-bold text-slate-800">{formatDate(invoice.date)}</span>
            </div>
            <div className="flex justify-between gap-8 items-baseline">
              <span className="text-[11px] uppercase tracking-widest font-black text-slate-400">Due Date</span>
              <span className="text-sm font-bold text-slate-800">{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Customer Details Section */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-8 mb-10 shadow-sm relative pdf-page-break-avoid">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
            <User size={18} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">Customer Details</h3>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="border-r border-slate-100 pr-6">
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Customer Name</p>
             <p className="text-lg font-black text-slate-900 leading-tight">{invoice.customerName}</p>
          </div>
          <div className="border-r border-slate-100 pr-6">
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Phone</p>
             <p className="text-base font-bold text-slate-700">{invoice.customerPhone || 'N/A'}</p>
          </div>
          <div>
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Customer ID</p>
             <p className="text-base font-bold text-slate-700">CUST-{invoice.customerId?.slice(-4).toUpperCase() || 'NEW'}</p>
          </div>

          <div className="border-r border-slate-100 pr-6 pt-4 border-t border-slate-50 mt-[-1rem]">
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Address</p>
             <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-[200px]">
                {invoice.customerAddress || 'No address provided'}
             </p>
          </div>
          <div className="border-r border-slate-100 pr-6 pt-4 border-t border-slate-50 mt-[-1rem]">
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Email</p>
             <p className="text-sm font-medium text-slate-600 truncate">{invoice.customerEmail || 'N/A'}</p>
          </div>
          <div className="pt-4 border-t border-slate-50 mt-[-1rem]">
             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Payment Type</p>
             <p className="text-base font-bold text-slate-700">Cash</p>
          </div>
        </div>
      </div>

      {/* 3. Items Table Section */}
      <div className="flex-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0f172a] text-white">
              <th className="py-4 px-3 text-[10px] font-black uppercase tracking-widest text-center border-r border-white/10 w-12">S.N.</th>
              {visibleColumns.map((col, idx) => (
                <th 
                  key={col.id} 
                  className={cn(
                    "py-4 px-3 text-[10px] font-black uppercase tracking-widest border-r border-white/10 last:border-0",
                    col.id === 'name' ? 'text-left' : 'text-center'
                  )}
                >
                  {col.label} {col.type === 'currency' ? '(₹)' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 border-x border-slate-100 border-b">
            {items.map((item, idx) => (
              <tr key={idx} className={cn("hover:bg-slate-50/50 transition-colors pdf-page-break-avoid", idx % 2 === 1 ? "bg-slate-50/20" : "")}>
                <td className="py-4 px-3 text-center text-sm font-bold text-slate-400 border-r border-slate-100">{item.serialNumber || (idx + 1)}</td>
                {visibleColumns.map((col, colIdx) => (
                  <td 
                    key={col.id} 
                    className={cn(
                      "py-4 px-3 text-sm border-r border-slate-100 last:border-0",
                      col.id === 'name' ? 'text-left font-black text-slate-800 break-words max-w-[180px]' : 'text-center font-bold text-slate-600'
                    )}
                  >
                    {col.id === 'name' ? (
                      <div>
                        {item[col.id] || '-'}
                        {item.workCharges && item.workCharges.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.workCharges.map((w, wIdx) => (
                              <span key={wIdx} className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-400">
                                {w.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : col.type === 'currency' ? (item[col.id] || 0).toFixed(2)
                    : item[col.id] || '-'}
                  </td>
                ))}
              </tr>
            ))}
            {/* Pad with empty rows to maintain A4 look if needed, but keeping it dynamic as per instruction */}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Section: Notes & Totals */}
      <div className="mt-8 flex gap-8 items-stretch mb-20 pdf-page-break-avoid w-full">
        {/* Notes Card */}
        <div className="flex-[3] bg-slate-50/40 rounded-3xl p-6 border border-slate-100/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={14} className="text-slate-400" />
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Notes / Terms</h4>
            </div>
            <ul className="space-y-2">
               <li className="flex gap-2 text-[13px] font-medium text-slate-500">
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 shrink-0" />
                 Please check all details before payment.
               </li>
               <li className="flex gap-2 text-[13px] font-medium text-slate-500">
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 shrink-0" />
                 No return after payment.
               </li>
               <li className="flex gap-2 text-[13px] font-medium text-slate-500">
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 shrink-0" />
                 Payment is due by the due date mentioned.
               </li>
               <li className="flex gap-2 text-[13px] font-medium text-slate-500">
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 shrink-0" />
                 Thank you for your business!
               </li>
            </ul>
          </div>
          {invoice.notes && (
            <div className="mt-auto pt-4 border-t border-slate-200/50 text-sm font-medium text-slate-600">
              {invoice.notes}
            </div>
          )}
        </div>

        {/* Totals Table */}
        <div className="flex-[2.5] flex flex-col justify-end">
          <div className="bg-white border text-sm border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400">Subtotal</span>
                <span className="font-black text-slate-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-400">Discount</span>
                <span className="font-black text-slate-900">{formatCurrency(invoice.discount)}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="font-bold text-slate-400">Tax (0%)</span>
                <span className="font-black text-slate-900">₹0.00</span>
              </div>
              
              <div className="flex justify-between items-center p-6 bg-slate-50/80 -mx-6 -mb-6 border-t border-slate-100/80">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Total Amount</span>
                <span className="text-3xl font-black text-slate-900">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Amount Paid</span>
            <span className="text-base font-black text-slate-900">{formatCurrency(invoice.paidAmount)}</span>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl shadow-slate-900/10">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Balance Due</span>
              <span className="text-3xl font-black text-white leading-none">{formatCurrency(invoice.dueAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Signature Section */}
      <div className="mt-auto flex justify-between items-end pr-12 pb-8">
        <div className="pl-12">
           {!settings?.isPremium && (
             <div className="flex items-center gap-2 text-slate-300 select-none grayscale opacity-40">
               <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold text-[10px]">BM</div>
               <p className="text-[10px] font-black tracking-widest uppercase">Powered by BillMint</p>
             </div>
           )}
        </div>
        <div className="text-center w-80">
          <div className="w-full h-24 border-b border-slate-300 mb-4" />
          <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-900">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
};

const InvoiceView = ({ invoice, items, settings, onClose }: InvoiceViewProps) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = React.useState<InvoiceTemplateType>(invoice.templateType || 'Small Bill');

  const downloadRealPDF = async () => {
    try {
      const doc = <InvoicePDF invoice={invoice} items={items} settings={settings} />;
      const asBlob = await pdf(doc).toBlob();
      saveAs(asBlob, `invoice-${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("Real PDF Error:", err);
      handlePrint();
    }
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    try {
      const dataUrl = await toJpeg(invoiceRef.current, {
        quality: 1,
        pixelRatio: 2, // High Quality
        backgroundColor: '#ffffff',
      });
      saveAs(dataUrl, `invoice-${invoice.invoiceNumber}.jpg`);
    } catch (err) {
      console.error("Image Download Error:", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md print:static print:inset-auto print:bg-transparent print:p-0 print:backdrop-blur-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[95vh] print:h-auto print:max-w-full print:rounded-none print:shadow-none print:overflow-visible print:bg-transparent"
      >
        {/* Top Action Bar */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-200/60 flex flex-col sm:flex-row justify-between items-center z-10 sticky top-0 gap-4 backdrop-blur-sm print:hidden">
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button 
              onClick={downloadRealPDF}
              className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black tracking-tight flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all text-sm shadow-xl shadow-emerald-600/10 hover:-translate-y-0.5"
            >
              <FileCheck size={18} /> Download Real PDF
            </button>
            <button 
              onClick={downloadImage}
              className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all text-sm shadow-sm hover:-translate-y-0.5"
            >
              <ImageIcon size={18} className="text-emerald-500" /> Download Photo (HQ)
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all text-sm shadow-sm hover:-translate-y-0.5"
            >
              <Printer size={18} /> Print A4
            </button>
          </div>

          <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] w-full sm:w-auto shadow-inner ring-1 ring-slate-200/50">
            <button
               onClick={() => setSelectedTemplate('Small Bill')}
               className={cn(
                 "flex-1 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                 selectedTemplate === 'Small Bill' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"
               )}
            >
              Small Bill
            </button>
            <button
               onClick={() => setSelectedTemplate('Large Professional')}
               className={cn(
                 "flex-1 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                 selectedTemplate === 'Large Professional' ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"
               )}
            >
              Professional A4
            </button>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {invoice.status === 'Draft' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                <AlertCircle size={14} /> Draft
              </div>
            )}
            <button onClick={onClose} className="p-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Paper Workspace */}
        <div className="flex-1 overflow-auto p-4 md:p-12 bg-slate-100/50 flex justify-center items-start scrollbar-hide print:overflow-visible print:p-0 print:bg-transparent print:block">
          <div className="w-full max-w-full sm:max-w-none overflow-x-auto pb-10 print:pb-0 print:overflow-visible">
            <div 
              ref={invoiceRef}
              className={cn(
                 "mx-auto shadow-2xl relative transition-all bg-white flex-shrink-0 origin-top",
                 "w-[1240px] min-h-[1754px] print:w-full print:min-h-0 print:border-none print:m-0 print:shadow-none print:block print:relative"
              )}
            >
              {selectedTemplate === 'Large Professional' ? (
                <LargeProfessionalTemplate 
                  invoice={invoice}
                  items={items}
                  settings={settings}
                />
              ) : (
                <div className="p-12 font-sans" style={{ borderTop: `12px solid ${settings?.brandColor || '#10b981'}` }}>
                  {/* Traditional Small Bill Fallback/Alternative */}
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 uppercase">{settings?.businessName || 'Business'}</h1>
                      <p className="text-xs text-slate-400 font-bold mt-1 tracking-widest uppercase">Invoice Details</p>
                    </div>
                    <div className="text-right">
                       <p className="text-4xl font-black text-slate-100">#{invoice.invoiceNumber}</p>
                    </div>
                  </div>
                  {/* ... Simple layout for Small Bill ... */}
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-300 mb-1">Customer</p>
                      <p className="font-black text-slate-800">{invoice.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-300 mb-1">Date</p>
                      <p className="font-bold text-slate-800">{formatDate(invoice.date)}</p>
                    </div>
                  </div>
                  <table className="w-full mb-10">
                    <thead className="border-b-2 border-slate-900">
                      <tr>
                        <th className="py-2 text-left text-[10px] font-black uppercase">Item</th>
                        <th className="py-2 text-center text-[10px] font-black uppercase w-20">Qty</th>
                        <th className="py-2 text-right text-[10px] font-black uppercase w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-4 font-bold text-slate-800">{item.name}</td>
                          <td className="py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                          <td className="py-4 text-right font-black text-slate-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end pt-5 border-t-4 border-slate-900">
                     <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Balance</p>
                        <p className="text-4xl font-black text-slate-900">{formatCurrency(invoice.total)}</p>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InvoiceView;

