import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Calendar as CalendarIcon, Package, Calculator, BarChart3, 
  Settings, Search, Plus, Moon, Sun, Cloud, CloudOff, 
  RefreshCw, ArrowLeft, Phone, MessageSquare,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  ChevronRight, X, LogOut, ShieldCheck, ShoppingCart, 
  Truck, Receipt, Wallet, FileText, Download, Store as StoreIcon, Briefcase, History, Scissors, Clock, Book, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { cn } from '../lib/utils';
import { Customer, Product, ModuleKey, Supplier, Store, Staff } from '../types';
import { 
  customerService, productService, invoiceService, supplierService, 
  hrService, storeService, appointmentService, treatmentService, 
  expenseService, staffService, createService
} from '../services/dataService';
import { auditService } from '../services/auditService';
import { aiService } from '../services/aiService';
import { paymentService } from '../services/paymentService';
import { auth, db } from '../firebase';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

// --- SHARED COMPONENTS ---

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'scheduled':
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-600">Agendado</span>;
    case 'confirmed':
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-600">Confirmado</span>;
    case 'completed':
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-600">Finalizado</span>;
    case 'cancelled':
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-600">Cancelado</span>;
    case 'paid':
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-600">Pago</span>;
    default:
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600">{status}</span>;
  }
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <Card className="glass-effect rounded-[2rem] group hover:border-primary/50 transition-all border-none shadow-sm">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn("p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-sm")}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] uppercase font-black tracking-widest text-black/60 dark:text-white/60">{label}</p>
          <h3 className="text-2xl font-black text-black dark:text-white break-all">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationCenter({ products, appointments }: any) {
  const [isOpen, setIsOpen] = useState(false);
  
  const notifications = useMemo(() => {
    const list: any[] = [];
    
    // Low stock
    products.filter((p: any) => p.stock < 5).forEach((p: any) => {
      list.push({
        id: `stock-${p.id}`,
        title: 'Stock Crítico',
        message: `O produto "${p.name}" tem apenas ${p.stock} unidades restantes.`,
        type: 'warning',
        icon: AlertTriangle
      });
    });
    
    // Today's appointments
    const today = new Date().toDateString();
    appointments.filter((a: any) => new Date(a.date).toDateString() === today && a.status === 'scheduled').forEach((a: any) => {
      list.push({
        id: `app-${a.id}`,
        title: 'Agendamento Próximo',
        message: `${a.customerName} agendado para as ${a.time}.`,
        type: 'info',
        icon: Clock
      });
    });
    
    return list;
  }, [products, appointments]);

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)} 
        className="rounded-full h-12 w-12 text-white hover:bg-white/20 relative"
      >
        <Bell size={24} />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-primary" />
        )}
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-[350px] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/10 z-[100] overflow-hidden"
          >
            <div className="p-6 border-b dark:border-white/10 bg-primary/5">
              <h3 className="font-black uppercase tracking-widest text-sm flex items-center justify-between">
                Notificações 
                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{notifications.length}</span>
              </h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic text-sm">Sem notificações relevantes</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors flex gap-4 border-b border-slate-50 last:border-0">
                    <div className={cn("p-2 rounded-xl h-fit", n.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600")}>
                      <n.icon size={18} />
                    </div>
                    <div>
                      <p className="font-black text-sm">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function InvoiceCreator({ onClose, initialData }: { onClose: () => void, initialData?: any }) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>(initialData?.customerId || '');
  const [items, setItems] = useState<any[]>(initialData?.items || []);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [nuit, setNuit] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'emola' | 'card'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    customerService.subscribe(setCustomers);
    productService.subscribe(setProducts);
    treatmentService.subscribe(setTreatments);
    
    if (initialData?.appointmentId && treatments.length > 0) {
       const treatment = treatments.find(t => t.id === initialData.treatmentId);
       if (treatment && items.length === 0) {
         setItems([{ ...treatment, quantity: 1, type: 'treatment' }]);
       }
    }
  }, [initialData, treatments.length]);

  const addItem = (item: any, type: 'product' | 'treatment') => {
    const existing = items.find(i => i.id === item.id && i.type === type);
    if (existing) {
      setItems(items.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { ...item, quantity: 1, type }]);
    }
  };

  const removeItem = (id: string, type: string) => {
    setItems(items.filter(i => !(i.id === id && i.type === type)));
  };

  const subtotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const tax = subtotal * 0.17; // 17% IVA
  const total = subtotal + tax;

  const saveInvoice = async () => {
    if (!selectedCustomer) return alert("Selecione um cliente");
    if (items.length === 0) return alert("Adicione itens");

    const customer = customers.find(c => c.id === selectedCustomer);
    const invoiceData = {
      invoiceNumber: `FT-${Date.now().toString().slice(-6)}`,
      customerId: selectedCustomer,
      customerName: customer?.name || 'Consumidor Final',
      items,
      subtotal,
      tax,
      total,
      status: 'paid',
      paymentMethod,
      date: new Date().toISOString(),
      nuit
    };

    setIsProcessing(true);
    
    // API Payment Simulation for Mobile Money
    if (paymentMethod === 'mpesa' || paymentMethod === 'emola') {
      const result = await paymentService.requestPayment({
        amount: total,
        currency: 'MT',
        provider: paymentMethod,
        phoneNumber: phoneNumber || customer?.phone || '',
        orderId: invoiceData.invoiceNumber
      });

      if (!result.success) {
        setIsProcessing(false);
        return alert(`Falha no Pagamento: ${result.error}`);
      }
      (invoiceData as any).transactionId = result.transactionId;
    }

    await invoiceService.add(invoiceData);
    
    // Auto Thermal print simulation
    paymentService.printThermalReceipt(invoiceData);

    if (initialData?.appointmentId) {
      await appointmentService.update(initialData.appointmentId, { status: 'completed' });
      auditService.log('appointment_completed_via_invoice', { id: initialData.appointmentId });
    }

    auditService.log('invoice_created', { number: invoiceData.invoiceNumber });
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="space-y-6 p-4">
      <DialogHeader>
        <DialogTitle className="text-2xl font-black uppercase tracking-widest">Nova Fatura</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-bold">Cliente</Label>
            <Select onValueChange={setSelectedCustomer}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-bold">NUIT (Opcional)</Label>
            <Input value={nuit} onChange={e => setNuit(e.target.value)} placeholder="NUIT do cliente" className="rounded-xl h-12" />
          </div>

          <div className="space-y-4 border rounded-2xl p-4 bg-white/20 dark:bg-white/5 backdrop-blur-sm">
            <h3 className="font-black text-sm uppercase tracking-widest">Método de Pagamento</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={paymentMethod === 'cash' ? 'default' : 'outline'} 
                className="rounded-xl h-12 gap-2 font-bold"
                onClick={() => setPaymentMethod('cash')}
              >
                <Wallet size={16} /> Numerário
              </Button>
              <Button 
                variant={paymentMethod === 'mpesa' ? 'default' : 'outline'} 
                className="rounded-xl h-12 gap-2 font-bold bg-rose-500 hover:bg-rose-600 text-white border-none"
                onClick={() => setPaymentMethod('mpesa')}
              >
                M-Pesa
              </Button>
              <Button 
                variant={paymentMethod === 'emola' ? 'default' : 'outline'} 
                className="rounded-xl h-12 gap-2 font-bold bg-orange-500 hover:bg-orange-600 text-white border-none"
                onClick={() => setPaymentMethod('emola')}
              >
                E-Mola
              </Button>
              <Button 
                variant={paymentMethod === 'card' ? 'default' : 'outline'} 
                className="rounded-xl h-12 gap-2 font-bold border-indigo-200"
                onClick={() => setPaymentMethod('card')}
              >
                Card
              </Button>
            </div>
            
            {(paymentMethod === 'mpesa' || paymentMethod === 'emola') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 mt-4 pt-4 border-t border-white/10">
                <Label className="text-xs font-black uppercase tracking-widest">Número de Telemóvel (82/84/85/86/87)</Label>
                <Input 
                  value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value)} 
                  placeholder="84XXXXXXX" 
                  className="rounded-xl h-12 bg-white/10 border-white/20"
                />
              </motion.div>
            )}
          </div>

          <div className="space-y-4 border rounded-2xl p-4 bg-white/20 dark:bg-white/5 backdrop-blur-sm">
            <h3 className="font-black text-sm uppercase tracking-widest">Adicionar Itens</h3>
            <Tabs defaultValue="products">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="products" className="font-black uppercase tracking-widest text-[10px]">Produtos</TabsTrigger>
                <TabsTrigger value="treatments" className="font-black uppercase tracking-widest text-[10px]">Serviços</TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="space-y-2 max-h-[200px] overflow-y-auto mt-2">
                {products.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors">
                    <span className="text-sm font-bold">{p.name} ({p.price} MT)</span>
                    <Button size="sm" variant="ghost" onClick={() => addItem(p, 'product')}><Plus size={16} /></Button>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="treatments" className="space-y-2 max-h-[200px] overflow-y-auto mt-2">
                {treatments.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors">
                    <span className="text-sm font-bold">{t.name} ({t.price} MT)</span>
                    <Button size="sm" variant="ghost" onClick={() => addItem(t, 'treatment')}><Plus size={16} /></Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-4 flex flex-col">
          <div className="flex-1 border rounded-2xl p-4 bg-white dark:bg-white/5 overflow-y-auto max-h-[400px]">
            <h3 className="font-black text-sm uppercase tracking-widest mb-4">Resumo da Venda</h3>
            {items.length === 0 ? (
              <p className="text-center text-slate-400 italic py-8">Nenhum item adicionado</p>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={`${item.id}-${item.type}`} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.quantity}x {item.price} MT</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{(item.price * item.quantity).toLocaleString()} MT</span>
                      <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => removeItem(item.id, item.type)}><X size={14} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-bold">{subtotal.toLocaleString()} MT</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">IVA (17%)</span><span className="font-bold">{tax.toLocaleString()} MT</span></div>
            <div className="flex justify-between text-xl font-black text-primary"><span>Total</span><span>{total.toLocaleString()} MT</span></div>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose} className="rounded-xl h-12 px-8" disabled={isProcessing}>Cancelar</Button>
        <Button onClick={saveInvoice} className="rounded-xl h-12 px-12 font-black uppercase tracking-widest flex gap-2" disabled={isProcessing}>
          {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Receipt size={16} />}
          {isProcessing ? 'Processando...' : 'Finalizar Venda'}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function ReportModule({ invoices, expenses, customers, products }: any) {
  const { t } = useTranslation();
  
  const generatePDF = () => {
    window.print();
  };

  const totalRevenue = invoices.reduce((acc: number, inv: any) => acc + inv.total, 0);
  const totalExpenses = expenses.reduce((acc: number, exp: any) => acc + exp.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Calculate top services from invoices
  const serviceCounts: Record<string, number> = {};
  invoices.forEach((inv: any) => {
    inv.items?.forEach((item: any) => {
      if (item.type === 'treatment') {
        serviceCounts[item.name] = (serviceCounts[item.name] || 0) + item.quantity;
      }
    });
  });

  const topServices = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const maxServiceVolume = topServices.length > 0 ? topServices[0][1] : 1;

  const exportExcel = () => {
    const headers = ["Data", "Tipo", "Cliente/Descrição", "Total/Valor", "Status/Categoria"];
    const rows = [
      ...invoices.map((inv: any) => [new Date(inv.date).toLocaleDateString(), "Venda", inv.customerName, inv.total, inv.status]),
      ...expenses.map((exp: any) => [new Date(exp.date).toLocaleDateString(), "Despesa", exp.description, -exp.amount, exp.category])
    ];
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">Relatórios & BI</h2>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2 h-12" onClick={generatePDF}><Download size={20} /> Exportar PDF</Button>
          <Button variant="outline" className="rounded-xl gap-2 h-12" onClick={exportExcel}><FileText size={20} /> Exportar Excel (CSV)</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-effect p-6 rounded-[2rem] border-none shadow-sm">
          <CardDescription className="uppercase font-black text-[10px] mb-2">Margem de Lucro</CardDescription>
          <CardTitle className="text-3xl font-black text-emerald-600">
            {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </CardTitle>
          <p className="text-xs text-slate-500 mt-2">Baseado em receitas e despesas atuais</p>
        </Card>
        <Card className="glass-effect p-6 rounded-[2rem] border-none shadow-sm">
          <CardDescription className="uppercase font-black text-[10px] mb-2">Ticket Médio</CardDescription>
          <CardTitle className="text-3xl font-black text-primary">
            {invoices.length > 0 ? (totalRevenue / invoices.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0} MT
          </CardTitle>
          <p className="text-xs text-slate-500 mt-2">Valor médio por venda</p>
        </Card>
        <Card className="glass-effect p-6 rounded-[2rem] border-none shadow-sm">
          <CardDescription className="uppercase font-black text-[10px] mb-2">Novos Clientes</CardDescription>
          <CardTitle className="text-3xl font-black text-indigo-600">
            {customers.filter((c: any) => c.loyalty === 'New').length}
          </CardTitle>
          <p className="text-xs text-slate-500 mt-2">Clientes registados este mês</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-transparent backdrop-blur-md border border-primary/10 p-8 rounded-[2.5rem] border-none shadow-sm">
          <h3 className="text-lg font-black uppercase tracking-widest mb-6">Top Serviços (Volume)</h3>
          <div className="space-y-4">
            {topServices.length > 0 ? topServices.map(([name, count]) => (
              <div key={name} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{name}</span>
                  <span>{count} un.</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(count / maxServiceVolume) * 100}%` }} />
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-400 py-10 italic">Nenhum dado de serviço disponível</p>
            )}
          </div>
        </Card>

        <Card className="glass-effect p-8 rounded-[2.5rem] border-none shadow-sm print:hidden">
          <h3 className="text-lg font-black uppercase tracking-widest mb-6">Fluxo de Caixa Mensal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Semana 1', receita: totalRevenue * 0.2, despesa: totalExpenses * 0.3 },
              { name: 'Semana 2', receita: totalRevenue * 0.3, despesa: totalExpenses * 0.2 },
              { name: 'Semana 3', receita: totalRevenue * 0.25, despesa: totalExpenses * 0.25 },
              { name: 'Semana 4', receita: totalRevenue * 0.25, despesa: totalExpenses * 0.25 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="receita" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

export function FinanceModule({ invoices, customers, expenses }: any) {
  const { t } = useTranslation();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  
  const today = new Date().toDateString();
  const todayInvoices = invoices.filter((i: any) => new Date(i.date).toDateString() === today);
  const todayRevenue = todayInvoices.reduce((acc: number, inv: any) => acc + (inv.status === 'paid' ? inv.total : 0), 0);
  
  const paymentTotals = useMemo(() => {
    const totals = { mpesa: 0, emola: 0, cash: 0, card: 0 };
    invoices.forEach((inv: any) => {
      if (inv.status === 'paid') {
        const method = inv.paymentMethod || 'cash';
        if (method in totals) totals[method as keyof typeof totals] += inv.total;
      }
    });
    return totals;
  }, [invoices]);

  const totalRevenue = invoices.reduce((acc: number, inv: any) => acc + (inv.status === 'paid' ? inv.total : 0), 0);
  const totalExpenses = expenses.reduce((acc: number, exp: any) => acc + exp.amount, 0);
  const balance = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="bg-primary text-white p-8 rounded-[3rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Caixa de Hoje</p>
          <h2 className="text-5xl font-black">{todayRevenue.toLocaleString()} MT</h2>
          <p className="text-xs mt-2 opacity-80 italic italic-serif">{todayInvoices.length} transações realizadas sob protocolo</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white text-white hover:text-primary rounded-2xl h-14 px-8 font-black uppercase tracking-widest transition-all">Abrir Caixa</Button>
          <Button variant="outline" className="bg-rose-500 border-none hover:bg-rose-600 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest transition-all shadow-lg">Fechar Caixa</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon={TrendingUp} label={t('revenue')} value={`${totalRevenue.toLocaleString()} MT`} />
        <StatCard icon={TrendingDown} label={t('expenses')} value={`${totalExpenses.toLocaleString()} MT`} />
        <StatCard icon={Wallet} label="Saldo" value={`${balance.toLocaleString()} MT`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-3xl glass-effect border-none flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">M-Pesa</p>
          <p className="font-black text-rose-500">{paymentTotals.mpesa.toLocaleString()} MT</p>
        </Card>
        <Card className="p-4 rounded-3xl glass-effect border-none flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">E-Mola</p>
          <p className="font-black text-orange-500">{paymentTotals.emola.toLocaleString()} MT</p>
        </Card>
        <Card className="p-4 rounded-3xl glass-effect border-none flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Cartão</p>
          <p className="font-black text-indigo-500">{paymentTotals.card.toLocaleString()} MT</p>
        </Card>
        <Card className="p-4 rounded-3xl glass-effect border-none flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Numerário</p>
          <p className="font-black text-emerald-500">{paymentTotals.cash.toLocaleString()} MT</p>
        </Card>
      </div>

      <Dialog open={isCreatingInvoice} onOpenChange={setIsCreatingInvoice}>
        <DialogTrigger asChild>
          <Button className="w-full h-16 rounded-[2rem] gap-3 font-black uppercase tracking-widest text-lg shadow-2xl bg-primary hover:bg-primary/90 transition-all gold-glow"><Receipt size={24} /> {t('new_invoice')}</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] bg-zinc-950 border-white/10">
          <InvoiceCreator onClose={() => setIsCreatingInvoice(false)} />
        </DialogContent>
      </Dialog>

      <Card className="glass-effect border-none rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto p-4">
          <Table>
            <TableHeader className="bg-white/30 dark:bg-white/5 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-black uppercase text-[10px] py-4 pl-6">Fatura</TableHead>
                <TableHead className="font-black uppercase text-[10px] py-4">Cliente</TableHead>
                <TableHead className="font-black uppercase text-[10px] py-4">Total</TableHead>
                <TableHead className="font-black uppercase text-[10px] py-4">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] py-4 pr-6 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv: any) => (
                <TableRow key={inv.id} className="border-b hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                  <TableCell className="font-black pl-6">#{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-slate-500 font-bold">{customers.find((c:any) => c.id === inv.customerId)?.name || 'Consumidor Final'}</TableCell>
                  <TableCell className="font-black text-primary">{inv.total.toLocaleString()} MT</TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded-full border", 
                      inv.status === 'paid' ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(inv)} className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                          <FileText size={18} />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="rounded-l-[2.5rem] p-8">
                        <SheetHeader>
                          <SheetTitle className="text-2xl font-black uppercase tracking-widest text-primary">Fatura #{inv.invoiceNumber}</SheetTitle>
                          <SheetDescription>{t('qr_code')}</SheetDescription>
                        </SheetHeader>
                        <div className="mt-12 flex flex-col items-center gap-8">
                          <div className="p-6 bg-white rounded-3xl shadow-xl border-8 border-primary/5">
                            <QRCodeSVG value={`INV-${inv.invoiceNumber}-${inv.total}-MT`} size={200} />
                          </div>
                          <div className="w-full space-y-4">
                            <div className="flex justify-between border-b pb-2"><span className="text-slate-400 text-sm">Subtotal</span><span className="font-bold">{inv.subtotal} MT</span></div>
                            <div className="flex justify-between border-b pb-2"><span className="text-slate-400 text-sm">IVA (17%)</span><span className="font-bold">{inv.tax} MT</span></div>
                            <div className="flex justify-between pt-2"><span className="text-lg font-black">TOTAL</span><span className="text-lg font-black text-primary">{inv.total} MT</span></div>
                          </div>
                          <Button className="w-full rounded-2xl gap-2 h-14 font-bold"><Download size={20} /> Baixar PDF</Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export function StatisticsModule({ invoices, products, customers }: any) {
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [smartInsights, setSmartInsights] = useState<string[]>([]);

  const getPrediction = async () => {
    setLoadingAI(true);
    const data = await aiService.predictSales(invoices.slice(0, 10));
    setPrediction(data);
    
    // Simulate smart insights
    setTimeout(() => {
      setSmartInsights([
        "O volume de serviços de 'Barba' aumentou 15% esta semana.",
        "Sexta-feira é o seu dia com maior potencial de faturação perdida por falta de vagas.",
        "3 clientes VIP não visitam o salão há mais de 15 dias. Sugerimos contacto direto.",
        "O stock de 'Shampoo Dunamis' deve ser reposto nos próximos 3 dias."
      ]);
      setLoadingAI(false);
    }, 1500);
  };

  const salesData = useMemo(() => [
    { name: 'Seg', vendas: 4000 }, { name: 'Ter', vendas: 3000 }, { name: 'Qua', vendas: 2000 },
    { name: 'Qui', vendas: 2780 }, { name: 'Sex', vendas: 1890 }, { name: 'Sáb', vendas: 2390 }, { name: 'Dom', vendas: 3490 },
  ], []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-effect rounded-[2rem] h-[400px] p-6">
          <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
            <CardTitle className="font-black text-sm uppercase tracking-widest">Vendas Semanais</CardTitle>
            <Button variant="outline" size="sm" onClick={getPrediction} disabled={loadingAI}>
              {loadingAI ? <RefreshCw className="animate-spin" size={14} /> : <TrendingUp size={14} />} {t('prediction')}
            </Button>
          </CardHeader>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={prediction.length > 0 ? prediction : salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey={prediction.length > 0 ? "predictedSales" : "vendas"} stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-effect rounded-[2rem] h-[400px] p-6">
          <CardHeader className="p-0 mb-6"><CardTitle className="font-black text-sm uppercase tracking-widest">Distribuição de Receita</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={[{ name: 'Cabelo', value: 400 }, { name: 'Estética', value: 300 }, { name: 'Produtos', value: 300 }]} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {['#f59e0b', '#d97706', '#fbbf24'].map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon={TrendingUp} label="Crescimento" value="+24%" color="text-primary" />
        <StatCard icon={Users} label={t('total_customers')} value={customers.length} color="text-primary" />
        <StatCard icon={AlertTriangle} label={t('stock_critical')} value={products.filter((p:any) => p.stock < 5).length} color="text-primary" />
      </div>

      {smartInsights.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[3rem] border border-indigo-100 dark:border-indigo-800"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-200">Insights Inteligentes da IA</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {smartInsights.map((insight, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/50 dark:bg-white/5 p-4 rounded-2xl border border-indigo-100/50">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function CalendarModule({ appointments, customers, treatments, staff, onCheckout }: any) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [newApp, setNewApp] = useState({ customerId: '', treatmentId: '', professionalId: '', time: '09:00', notes: '' });
  
  const filteredAppointments = appointments.filter((a: any) => {
    if (!selectedDate) return false;
    const appDate = new Date(a.date);
    return appDate.toDateString() === selectedDate.toDateString();
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    await appointmentService.update(id, { status });
    auditService.log('appointment_status_updated', { id, status });
  };

  const handleAdd = async () => {
    if (newApp.customerId && newApp.treatmentId && newApp.professionalId && selectedDate) {
      const customer = customers.find((c:any) => c.id === newApp.customerId);
      const treatment = treatments.find((t:any) => t.id === newApp.treatmentId);
      const professional = staff.find((s:any) => s.id === newApp.professionalId);

      await appointmentService.add({
        ...newApp,
        customerName: customer?.name || '',
        treatmentName: treatment?.name || '',
        professionalName: professional?.name || '',
        date: selectedDate.toISOString(),
        status: 'scheduled'
      });
      auditService.log('appointment_added', { customer: customer?.name, time: newApp.time });
      setIsAdding(false);
      setNewApp({ customerId: '', treatmentId: '', professionalId: '', time: '09:00', notes: '' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="glass-effect p-6 rounded-[2rem] h-fit">
        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border-none" />
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="w-full mt-6 h-14 rounded-2xl gap-2 font-bold shadow-lg"><Plus size={20} /> Agendar</Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] p-8">
            <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-widest">Novo Agendamento</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select onValueChange={(v) => setNewApp({...newApp, customerId: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>{customers.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serviço</Label>
                  <Select onValueChange={(v) => setNewApp({...newApp, treatmentId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                    <SelectContent>{treatments.map((t:any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select onValueChange={(v) => setNewApp({...newApp, professionalId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                    <SelectContent>{staff.map((s:any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={newApp.time} onChange={e => setNewApp({...newApp, time: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={newApp.notes} onChange={e => setNewApp({...newApp, notes: e.target.value})} placeholder="Observações..." className="rounded-xl" />
              </div>
            </div>
            <DialogFooter><Button onClick={handleAdd} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Confirmar Agendamento</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
      
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-black uppercase tracking-widest text-black dark:text-white">
          {selectedDate?.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        {filteredAppointments.length === 0 ? (
          <div className="glass-effect p-12 rounded-[2rem] text-center text-slate-400 italic">Nenhum agendamento para este dia.</div>
        ) : (
          filteredAppointments.sort((a:any, b:any) => a.time.localeCompare(b.time)).map((a: any) => (
            <Card key={a.id} className="glass-effect border-none rounded-2xl overflow-hidden">
              <div className="flex">
                <div className="w-24 bg-primary/10 flex flex-col items-center justify-center p-4 border-r border-primary/10">
                  <Clock size={20} className="text-primary mb-1" />
                  <span className="font-black text-primary">{a.time}</span>
                </div>
                <div className="p-6 flex-1 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg">{customers.find((c:any) => c.id === a.customerId)?.name || 'Cliente'}</h3>
                    <div className="flex flex-wrap gap-4 mt-1">
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Scissors size={14} className="text-primary" /> {treatments.find((t:any) => t.id === a.treatmentId)?.name || 'Serviço'}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <Users size={14} className="text-slate-400" /> {staff.find((s:any) => s.id === a.professionalId)?.name || 'Qualquer'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <div className="flex gap-1 ml-4">
                      {a.status === 'scheduled' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-500" onClick={() => handleUpdateStatus(a.id, 'confirmed')}><CheckCircle2 size={16} /></Button>
                      )}
                      {(a.status === 'scheduled' || a.status === 'confirmed') && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" title="Finalizar e Cobrar" onClick={() => onCheckout(a)}><Wallet size={16} /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => handleUpdateStatus(a.id, 'cancelled')}><X size={16} /></Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function CustomerModule({ customers }: { customers: Customer[] }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', hairType: '', allergies: '', email: '' });

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async () => {
    if (newCustomer.name && newCustomer.phone) {
      await customerService.add({ ...newCustomer, loyalty: 'New', points: 0 });
      auditService.log('customer_added', { name: newCustomer.name });
      setIsAdding(false);
      setNewCustomer({ name: '', phone: '', hairType: '', allergies: '', email: '' });
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <Input placeholder="Buscar cliente por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="h-16 rounded-[2rem] bg-white/50 dark:bg-white/5 border-none glass-effect pl-16 text-lg focus:border-none ring-offset-0 focus-visible:ring-1 transition-all" />
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="h-16 px-10 rounded-[2rem] gap-2 font-black uppercase tracking-widest shadow-lg"><Plus size={24} /> {t('new')}</Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] p-8">
            <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-widest">Novo Cliente</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome Completo</Label><Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Ex: João Silva" /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="Ex: 841234567" /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="Ex: joao@email.com" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo de Cabelo</Label><Input value={newCustomer.hairType} onChange={e => setNewCustomer({...newCustomer, hairType: e.target.value})} placeholder="Ex: Cacheado" /></div>
                <div className="space-y-2"><Label>Alergias</Label><Input value={newCustomer.allergies} onChange={e => setNewCustomer({...newCustomer, allergies: e.target.value})} placeholder="Ex: Nenhuma" /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAdd} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Gravar Cliente</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => (
          <Card key={c.id} className="glass-effect rounded-[2.5rem] p-8 border-none shadow-sm group hover:border-primary/50 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/20">
                {c.name[0]}
              </div>
              <div className="text-right">
                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", c.loyalty === 'VIP' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500")}>
                  {c.loyalty}
                </span>
                <p className="text-[10px] uppercase font-black text-slate-400 mt-2">{c.points} Pontos</p>
              </div>
            </div>
            
            <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white mb-2">{c.name}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600" onClick={() => openWhatsApp(c.phone)}>
                  <MessageSquare size={18} />
                </Button>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-black text-slate-400">Telemóvel</p>
                  <p className="font-bold text-sm">{c.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Perfil</p>
                  <p className="font-bold text-xs">{c.hairType || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400">Alergias</p>
                  <p className="font-bold text-xs text-rose-500">{c.allergies || 'Nenhuma'}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ProductModule({ products, isManager, isAdmin }: { products: Product[], isManager: boolean, isAdmin?: boolean }) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: 0, stock: 0 });

  const handleAdd = async () => {
    if (newProduct.name && newProduct.price > 0) {
      await productService.add(newProduct);
      auditService.log('product_added', { name: newProduct.name });
      setIsAdding(false);
      setNewProduct({ name: '', category: '', price: 0, stock: 0 });
    }
  };

  const handleQuickSale = async (product: Product) => {
    if (product.stock > 0) {
      const price = product.price;
      const subtotal = price / 1.17;
      const tax = price - subtotal;
      
      await productService.update(product.id!, { stock: product.stock - 1 });
      await invoiceService.add({
        invoiceNumber: `VD-${Date.now().toString().slice(-6)}`,
        customerId: 'internal',
        customerName: 'Venda de Balcão',
        items: [{ ...product, quantity: 1, type: 'product' }],
        subtotal,
        tax,
        total: price,
        status: 'paid',
        paymentMethod: 'cash',
        date: new Date().toISOString()
      });
      auditService.log('quick_sale', { product: product.name });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">Inventário & Marketplace</h2>
        {isManager && (
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl gap-2 font-bold shadow-lg"><Plus size={20} /> {t('new')}</Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] p-8">
              <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-widest">Novo Produto</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nome do Produto</Label><Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ex: Shampoo Dunamis" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Categoria</Label><Input value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="Ex: Cabelo" /></div>
                  <div className="space-y-2"><Label>Preço (MT)</Label><Input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} /></div>
                </div>
                <div className="space-y-2"><Label>Stock Inicial</Label><Input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} /></div>
              </div>
              <DialogFooter><Button onClick={handleAdd} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Adicionar ao Stock</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => (
          <Card key={p.id} className="glass-effect rounded-[2.5rem] overflow-hidden group border-none shadow-sm pb-4 transition-all hover:scale-[1.02]">
            <div className="h-40 bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors relative">
              <Package size={48} className="text-primary opacity-20" />
              {p.stock < 5 && (
                <div className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg animate-pulse">Stock Crítico</div>
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-xs text-slate-500">{p.category}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-primary">{p.price.toLocaleString()} MT</div>
                  <div className="text-[10px] uppercase font-black text-slate-400">Preço Unit.</div>
                </div>
              </div>
              <div className="flex flex-col gap-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", p.stock < 5 ? "bg-rose-500" : "bg-emerald-500")} />
                    <span className="text-xs font-bold text-slate-600">{p.stock} em stock</span>
                  </div>
                  {isManager && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => productService.update(p.id, { stock: Math.max(0, p.stock - 1) })}>
                        <TrendingDown size={14} className="text-rose-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => productService.update(p.id, { stock: p.stock + 1 })}>
                        <TrendingUp size={14} className="text-emerald-500" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => handleQuickSale(p)}
                  disabled={p.stock <= 0}
                  className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2"
                >
                  <ShoppingCart size={14} /> Venda Rápida
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TreatmentModule({ treatments, isManager }: { treatments: any[], isManager?: boolean }) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newTreatment, setNewTreatment] = useState({ name: '', price: 0, duration: 30 });

  const handleAdd = async () => {
    if (newTreatment.name && newTreatment.price > 0) {
      await treatmentService.add(newTreatment);
      auditService.log('treatment_added', { name: newTreatment.name });
      setIsAdding(false);
      setNewTreatment({ name: '', price: 0, duration: 30 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">Serviços & Tratamentos</h2>
        {isManager && (
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl gap-2 font-bold shadow-lg"><Plus size={20} /> {t('new')}</Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-8">
              <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-widest">Novo Serviço</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Nome do Serviço</Label><Input value={newTreatment.name} onChange={e => setNewTreatment({...newTreatment, name: e.target.value})} placeholder="Ex: Corte Moderno" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Preço (MT)</Label><Input type="number" value={newTreatment.price} onChange={e => setNewTreatment({...newTreatment, price: Number(e.target.value)})} /></div>
                  <div className="space-y-2"><Label>Duração (min)</Label><Input type="number" value={newTreatment.duration} onChange={e => setNewTreatment({...newTreatment, duration: Number(e.target.value)})} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAdd} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Gravar Serviço</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {treatments.map(tr => (
          <Card key={tr.id} className="glass-effect rounded-[2.5rem] p-8 hover:y-[-4px] transition-all cursor-pointer group border-none shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform"><Scissors size={24} /></div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white mb-2">{tr.name}</h3>
            <p className="text-xs text-slate-500 mb-6 flex items-center gap-2"><Clock size={12} /> {tr.duration} min</p>
            <div className="text-2xl font-black text-primary">{tr.price} MT</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ExpenseModule({ expenses, isManager }: { expenses: any[], isManager?: boolean }) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'Geral' });

  const handleAdd = async () => {
    if (newExpense.description && newExpense.amount > 0) {
      await expenseService.add({ ...newExpense, date: new Date().toISOString() });
      auditService.log('expense_added', { description: newExpense.description, amount: newExpense.amount });
      setIsAdding(false);
      setNewExpense({ description: '', amount: 0, category: 'Geral' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">Registo de Despesas</h2>
        {isManager && (
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl gap-2 font-bold shadow-lg"><Plus size={20} /> {t('new')}</Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-8">
              <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-widest">Nova Despesa</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Descrição</Label><Input value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="Ex: Renda do Salão" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Valor (MT)</Label><Input type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} /></div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select onValueChange={v => setNewExpense({...newExpense, category: v})}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Geral">Geral</SelectItem>
                        <SelectItem value="Stock">Stock</SelectItem>
                        <SelectItem value="Salários">Salários</SelectItem>
                        <SelectItem value="Utilidades">Utilidades</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAdd} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Gravar Despesa</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Card className="glass-effect border-none rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/30 dark:bg-white/5">
              <TableRow>
                <TableHead className="font-black uppercase text-[10px]">Data</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Descrição</TableHead>
                <TableHead className="font-black uppercase text-[10px]">Categoria</TableHead>
                <TableHead className="font-black uppercase text-[10px] text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map(exp => (
                <TableRow key={exp.id}>
                  <TableCell className="text-xs text-slate-500">{new Date(exp.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-bold">{exp.description}</TableCell>
                  <TableCell><span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold uppercase">{exp.category}</span></TableCell>
                  <TableCell className="text-right font-black text-rose-500">-{exp.amount.toLocaleString()} MT</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export function HRModule({ records, staff, invoices }: { records: any[], staff: Staff[], invoices: any[] }) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: 'operator', commission: 10, status: 'active' as const });

  // Calculate real performance (gamification)
  const staffStats = useMemo(() => {
    return staff.map(s => {
      const sales = invoices.filter(inv => inv.professionalId === s.id && inv.status === 'paid');
      const totalVolume = sales.reduce((acc, current) => acc + current.total, 0);
      const points = Math.floor(totalVolume / 100);
      return { ...s, totalVolume, points, efficiency: Math.min(100, 70 + (sales.length * 2)) };
    });
  }, [staff, invoices]);

  const handleAdd = async () => {
    if (newStaff.name) {
      await staffService.add(newStaff);
      auditService.log('staff_added', { name: newStaff.name });
      setIsAdding(false);
      setNewStaff({ name: '', role: 'operator', commission: 10, status: 'active' });
    }
  };

  const toggleStatus = async (s: Staff) => {
    const nextStatus: Staff['status'] = s.status === 'active' ? 'on_break' : s.status === 'on_break' ? 'inactive' : 'active';
    await staffService.update(s.id, { status: nextStatus });
    auditService.log('staff_status_changed', { name: s.name, status: nextStatus });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">Gestão de Equipa</h2>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl gap-2 font-bold shadow-lg"><Plus size={20} /> {t('new')}</Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] p-8">
            <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-widest">Novo Colaborador</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Nome Completo</Label><Input value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="Ex: Maria Santos" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Select onValueChange={v => setNewStaff({...newStaff, role: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" value={newStaff.commission} onChange={e => setNewStaff({...newStaff, commission: Number(e.target.value)})} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAdd} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Gravar Colaborador</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-effect p-6 rounded-[2rem]">
            <h3 className="font-black text-sm uppercase tracking-widest mb-6">Comissões da Equipa</h3>
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px]">Colaborador</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Cargo</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Comissão</TableHead>
                  <TableHead className="font-black uppercase text-[10px] text-right">Total Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffStats.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-bold">{s.name}</TableCell>
                    <TableCell><span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase">{s.role}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{s.efficiency}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${s.efficiency}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-primary">{s.totalVolume.toLocaleString()} MT</span>
                        <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
                          🏆 {s.points} Pts
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-effect p-6 rounded-[2rem]">
            <h3 className="font-black text-sm uppercase tracking-widest mb-6">Controle de Turnos</h3>
            <div className="space-y-4">
              {staff.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => toggleStatus(s)}
                  className="w-full flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">{s.name[0]}</div>
                    <span className="font-bold text-sm">{s.name}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase",
                    s.status === 'active' ? "text-emerald-500" : s.status === 'on_break' ? "text-amber-500" : "text-slate-400"
                  )}>
                    {s.status === 'active' ? "Em Serviço" : s.status === 'on_break' ? "Em Pausa" : "Ausente"}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function SupplierModule({ suppliers }: { suppliers: Supplier[] }) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', category: '', email: '' });

  const handleAdd = async () => {
    if (newSupplier.name && newSupplier.contact) {
      await supplierService.add(newSupplier);
      auditService.log('supplier_added', { name: newSupplier.name });
      setIsAdding(false);
      setNewSupplier({ name: '', contact: '', category: '', email: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">Gestão de Fornecedores</h2>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl gap-2 font-bold shadow-lg"><Plus size={20} /> {t('new')}</Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] p-8">
            <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-widest">Novo Fornecedor</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Nome da Empresa</Label><Input value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="Ex: Cosméticos Lda" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Contacto</Label><Input value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} placeholder="Ex: 841234567" /></div>
                <div className="space-y-2"><Label>Categoria</Label><Input value={newSupplier.category} onChange={e => setNewSupplier({...newSupplier, category: e.target.value})} placeholder="Ex: Produtos Capilares" /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} placeholder="Ex: fornecedor@email.com" /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Gravar Fornecedor</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(s => (
          <Card key={s.id} className="glass-effect rounded-[2.5rem] p-8 hover:border-primary/50 transition-all group border-none shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 transition-transform"><Truck size={24} /></div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white mb-1">{s.name}</h3>
            <p className="text-xs text-slate-500 mb-6">{s.category}</p>
            <div className="space-y-2 pt-4 border-t">
              <p className="text-xs flex items-center gap-2"><Phone size={14} className="text-primary" /> {s.contact}</p>
              {s.email && <p className="text-xs flex items-center gap-2 text-slate-500"><MessageSquare size={14} /> {s.email}</p>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StoreModule({ stores }: { stores: Store[] }) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', location: '', manager: '', phone: '' });

  const handleAdd = async () => {
    if (newStore.name && newStore.location) {
      await storeService.add(newStore);
      auditService.log('store_added', { name: newStore.name });
      setIsAdding(false);
      setNewStore({ name: '', location: '', manager: '', phone: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">Gestão de Lojas</h2>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 rounded-xl gap-2 font-bold shadow-lg"><Plus size={20} /> {t('new')}</Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] p-8">
            <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-widest">Nova Loja</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Nome da Loja</Label><Input value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} placeholder="Ex: Dunamis Maputo" /></div>
              <div className="space-y-2"><Label>Localização</Label><Input value={newStore.location} onChange={e => setNewStore({...newStore, location: e.target.value})} placeholder="Ex: Av. 24 de Julho" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Gerente</Label><Input value={newStore.manager} onChange={e => setNewStore({...newStore, manager: e.target.value})} placeholder="Ex: Ana Maria" /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={newStore.phone} onChange={e => setNewStore({...newStore, phone: e.target.value})} placeholder="Ex: 841234567" /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleAdd} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Gravar Loja</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stores.map(s => (
          <Card key={s.id} className="glass-effect rounded-[2.5rem] p-8 flex items-center gap-6 hover:border-primary/50 transition-all border-none shadow-sm group">
            <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:scale-110 transition-transform"><StoreIcon size={32} /></div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white mb-1">{s.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{s.location}</p>
              <div className="flex gap-6">
                <div><p className="text-[10px] uppercase font-black text-slate-400">Gerente</p><p className="font-bold text-sm">{s.manager}</p></div>
                <div><p className="text-[10px] uppercase font-black text-slate-400">Contacto</p><p className="font-bold text-sm">{s.phone}</p></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SettingsModule({ profile, auditLogs }: { profile: any, auditLogs: any[] }) {
  const { t, i18n } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(profile?.displayName || '');
  const [newPin, setNewPin] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setMessage(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilizador não autenticado");

      // Update Firebase Auth Profile
      await updateProfile(user, { displayName: newDisplayName });
      
      // Update Firestore User Document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName
      });

      if (newPin) {
        if (newPin.length < 6) throw new Error("O PIN deve ter pelo menos 6 caracteres.");
        await updatePassword(user, newPin);
      }

      auditService.log('profile_updated', { uid: user.uid, displayName: newDisplayName });
      setMessage({ type: 'success', text: 'Perfil e PIN atualizados com sucesso!' });
      setNewPin('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-widest text-black dark:text-white">Configurações</h2>
        <p className="text-slate-500">Gerencie sua conta e preferências do sistema</p>
      </div>

      <Card className="glass-effect p-8 rounded-[2.5rem] space-y-8 max-w-2xl mx-auto border-none shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-black/5 dark:border-white/5">
            <div className="w-20 h-20 rounded-3xl bg-primary text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/30">
              {profile?.displayName?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome de Exibição</Label>
                <Input 
                  value={newDisplayName} 
                  onChange={e => setNewDisplayName(e.target.value)} 
                  className="h-12 rounded-xl bg-white/50 dark:bg-white/5 border-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Novo PIN / Palavra-passe</Label>
              <Input 
                type="password"
                value={newPin} 
                onChange={e => setNewPin(e.target.value)} 
                placeholder="Deixe em branco para não alterar"
                className="h-12 rounded-xl bg-white/50 dark:bg-white/5 border-none"
              />
            </div>

            {message && (
              <div className={cn(
                "p-4 rounded-xl text-xs font-bold flex items-center gap-2",
                message.type === 'success' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
              )}>
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {message.text}
              </div>
            )}

            <Button 
              onClick={handleUpdateProfile} 
              disabled={isUpdating}
              className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              {isUpdating ? <RefreshCw className="animate-spin" size={18} /> : 'Guardar Alterações'}
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
          <div className="space-y-2">
            <Label className="font-black uppercase text-[10px] tracking-widest text-slate-400">Idioma do Sistema</Label>
            <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português (Moçambique)</SelectItem>
                <SelectItem value="en">English (Global)</SelectItem>
                <SelectItem value="es">Español (Internacional)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-400">Segurança</h4>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-14 rounded-2xl justify-between group">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-primary" />
                    <span>Logs de Acesso</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-widest">Histórico de Acessos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {auditLogs.filter(log => log.action === 'user_created' || log.action === 'login').map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-sm">{log.userEmail}</p>
                        <p className="text-[10px] text-slate-400">{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] font-black uppercase text-primary">{log.action}</span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p className="text-center text-slate-400 italic">Nenhum log disponível.</p>}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-14 rounded-2xl justify-between group">
                  <div className="flex items-center gap-3">
                    <History className="text-primary" />
                    <span>Histórico de Auditoria</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-widest">Auditoria do Sistema</DialogTitle>
                </DialogHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-black">Data</TableHead>
                      <TableHead className="text-[10px] uppercase font-black">Ação</TableHead>
                      <TableHead className="text-[10px] uppercase font-black">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-[10px]">{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</TableCell>
                        <TableCell><span className="text-[10px] font-bold uppercase">{log.action}</span></TableCell>
                        <TableCell className="text-xs">{JSON.stringify(log.details)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="pt-8 border-t border-black/5 dark:border-white/5 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Versão do Sistema</p>
          <p className="font-mono text-xs">v2.4.5-PRO (Enterprise Edition)</p>
        </div>
      </Card>
    </div>
  );
}

export function CalculatorModule() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleKey = (key: string) => {
    if (key === 'C') {
      setDisplay('0');
      setEquation('');
    } else if (key === '=') {
      try {
        // Simple eval replacement for basic math
        const safeEval = (str: string) => {
          return new Function('return ' + str.replace('x', '*').replace('÷', '/'))();
        };
        const result = safeEval(equation);
        setDisplay(String(result));
        setEquation(String(result));
      } catch {
        setDisplay('Erro');
      }
    } else {
      setEquation(prev => prev === '0' ? key : prev + key);
      setDisplay(prev => prev === '0' ? key : prev + key);
    }
  };

  return (
    <div className="flex items-center justify-center py-10">
      <Card className="glass-effect p-8 rounded-[3rem] w-full max-w-sm shadow-xl border-none">
        <div className="bg-white/40 dark:bg-black/20 p-6 rounded-2xl mb-6 text-right font-mono border backdrop-blur-md">
          <div className="text-xs text-slate-400 mb-1 h-4">{equation}</div>
          <div className="text-4xl font-black truncate">{display}</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['C', '÷', 'x', '<', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'].map(k => (
            <Button
              key={k}
              variant="outline"
              className={cn(
                "h-14 rounded-xl font-bold text-lg transition-all active:scale-95",
                ['÷', 'x', '-', '+', '=', 'C'].includes(k) ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-white/50 dark:bg-white/5",
                k === '=' ? "bg-primary text-white hover:bg-primary/90 col-span-1" : ""
              )}
              onClick={() => k === '<' ? setEquation(prev => prev.slice(0, -1)) : handleKey(k)}
            >
              {k}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function UserGuideModule() {
  const sections = [
    {
      title: "Início & Dashboard",
      icon: BarChart3,
      content: "O dashboard central permite acesso rápido a todos os módulos. Use o grid responsivo para navegar. Se estiver no telemóvel, as colunas ajustar-se-ão automaticamente."
    },
    {
      title: "Ponto de Venda (POS)",
      icon: Wallet,
      content: "No módulo Financeiro, pode criar novas faturas clicando em 'Nova Venda'. Selecione produtos ou serviços, defina o cliente e emita a fatura profissional com QR Code."
    },
    {
      title: "Agenda Avançada",
      icon: CalendarIcon,
      content: "Clique em qualquer dia para ver os agendamentos. Use o botão '+' para marcar novos serviços, selecionando o profissional e o horário disponível."
    },
    {
      title: "Controle de Stock",
      icon: Package,
      content: "Gerencie produtos em 'Produtos'. O sistema avisará quando o stock estiver abaixo do mínimo configurado através de alertas visuais âmbar."
    },
    {
      title: "Equipa & RH",
      icon: Briefcase,
      content: "Gerencie colaboradores em 'Equipa'. Pode alternar o status de cada profissional (Em Serviço, Em Pausa ou Ausente) clicando nos seus cards."
    },
    {
      title: "Relatórios & BI",
      icon: FileText,
      content: "Acompanhe a saúde do negócio em 'Relatórios'. Exporte dados em PDF para impressão ou análise externa."
    },
    {
      title: "Fornecedores & Logística",
      icon: Truck,
      content: "Registe os seus fornecedores habituais no módulo 'Inventário'. Mantenha os contactos de cosméticos e materiais sempre à mão."
    },
    {
      title: "Gestão de Multilojas",
      icon: StoreIcon,
      content: "Se o seu negócio tem várias unidades, use o módulo 'Lojas' para cadastrar cada localização e os seus respetivos gerentes."
    },
    {
      title: "Configurações & Perfil",
      icon: Settings,
      content: "Personalize o seu perfil, escolha o idioma do sistema e audite o histórico de acessos em 'Configurações'."
    }
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-40">
      <div className="text-center space-y-4 pt-10">
        <div className="inline-block p-4 rounded-3xl bg-amber-100 text-amber-600 mb-2 shadow-sm">
          <Book size={48} />
        </div>
        <h2 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter">Guia do Utilizador</h2>
        <p className="text-slate-500 max-w-lg mx-auto">Tudo o que precisa de saber para dominar o sistema Dunamis Soft Pro.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, i) => (
          <Card key={i} className="glass-effect p-8 rounded-[2.5rem] border-none shadow-sm hover:border-primary/50 transition-all group">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-sm">
                <section.icon size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{section.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{section.content}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="glass-effect p-10 rounded-[2.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <Scissors size={200} />
        </div>
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl font-black uppercase tracking-tighter">Precisa de Ajuda?</h3>
          <p className="text-white/70 dark:text-slate-500 max-w-lg">A nossa equipa de suporte está disponível para o ajudar com qualquer dúvida ou questão técnica.</p>
          <div className="flex gap-4 pt-4">
            <a href="https://wa.me/258827043290" target="_blank" rel="noreferrer">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest px-8 rounded-xl h-14">Contactar Suporte</Button>
            </a>
            <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white font-black uppercase tracking-widest px-8 rounded-xl h-14 dark:border-slate-200 dark:text-slate-900">FAQ & Ajuda</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
