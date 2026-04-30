import React, { useState, useEffect, useMemo, createContext, useContext, Component, ReactNode } from 'react';
import { 
  Users, Calendar, Package, Calculator, BarChart3, 
  Settings, Search, Plus, Moon, Sun, Cloud, CloudOff, 
  RefreshCw, ArrowLeft, Phone, MessageSquare,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  ChevronRight, X, LogOut, ShieldCheck, ShoppingCart, 
  Truck, Receipt, Wallet, FileText, Download, Store, Briefcase, History, Scissors, Clock, Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

import { 
  auth, db, googleProvider, handleFirestoreError, OperationType 
} from './firebase';
import { 
  signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser,
  signInWithEmailAndPassword, createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  collection, onSnapshot, query, addDoc, serverTimestamp, doc, getDoc, setDoc 
} from 'firebase/firestore';

import { cn } from './lib/utils';
import { Customer, Product, ModuleKey } from './types';
import { 
  customerService, productService, invoiceService, supplierService, 
  hrService, storeService, appointmentService, treatmentService, 
  expenseService, staffService, createService
} from './services/dataService';
import { auditService } from './services/auditService';
import { aiService } from './services/aiService';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

import { Background } from './components/Background';
import { 
  CustomerModule, ProductModule, TreatmentModule, ExpenseModule, 
  HRModule, SupplierModule, CalculatorModule, FinanceModule, 
  StatisticsModule, CalendarModule, ReportModule, StoreModule, SettingsModule, UserGuideModule, InvoiceCreator, NotificationCenter
} from './components/Modules';

// --- CONTEXT ---
interface AuthContextType {
  user: FirebaseUser | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, profile: null, loading: true, isAdmin: false, isManager: false 
});

// --- SESSION TIMEOUT ---
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        } else {
          const defaultProfile = {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName || u.email?.split('@')[0],
            role: u.email === 'florindoninepence@gmail.com' ? 'admin' : 'reception',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, defaultProfile);
          setProfile(defaultProfile);
          auditService.log('user_created', { email: u.email });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Activity tracking for session timeout
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => setLastActivity(Date.now());
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, updateActivity));

    const checkTimeout = setInterval(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        signOut(auth);
        auditService.log('session_timeout', { uid: user.uid });
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(checkTimeout);
    };
  }, [user, lastActivity]);

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager' || isAdmin;
  const isReception = profile?.role === 'reception' || isManager;
  const isBarber = profile?.role === 'barber' || isReception;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- ERROR BOUNDARY ---
class ErrorBoundary extends Component<any, any> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-rose-50">
          <Card className="max-w-md w-full text-center border-2 border-rose-200">
            <CardHeader>
              <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
              <CardTitle className="text-rose-800">Ops! Algo deu errado.</CardTitle>
              <CardDescription className="text-rose-600">
                {error?.message?.startsWith('{') 
                  ? "Erro de permissão no banco de dados. Contate o administrador." 
                  : "Ocorreu um erro inesperado na aplicação."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.reload()} variant="destructive">Recarregar App</Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// --- AUTH SCREEN ---
function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.code === 'auth/user-not-found' ? 'Utilizador não encontrado' : (err.code === 'auth/wrong-password' ? 'Palavra-passe incorreta' : err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden relative">
      <Background />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative z-10"
      >
        <Card className="glass-effect border-white/5 bg-white/5 backdrop-blur-3xl overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardHeader className="text-center pb-2">
            <motion.div 
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.2)]"
            >
              <Scissors className="text-primary" size={40} />
            </motion.div>
            <CardTitle className="text-4xl font-black text-white uppercase tracking-tighter italic">Dunamis</CardTitle>
            <CardDescription className="text-white/60 font-medium tracking-widest uppercase text-[10px] mt-1">Management Suite Pro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wider ml-1">Email Corporativo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><Users size={16} /></span>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-white/5 border-white/10 text-white pl-10 h-12 focus:border-primary/50 transition-all rounded-xl"
                    placeholder="ex: gestor@dunamis.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs font-bold uppercase tracking-wider ml-1">Palavra-passe</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><ShieldCheck size={16} /></span>
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="bg-white/5 border-white/10 text-white pl-10 h-12 focus:border-primary/50 transition-all rounded-xl"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
                  <AlertTriangle size={14} />
                  {error}
                </motion.div>
              )}
              <Button type="submit" className="w-full h-12 font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 rounded-xl" disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" size={18} /> : (isRegistering ? 'Criar Nova Conta' : 'Iniciar Sessão')}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center px-8"><span className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-slate-950 px-4 text-white/30">Métodos Alternativos</span></div>
            </div>

            <Button variant="outline" className="w-full h-12 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all rounded-xl gap-3 font-bold" onClick={handleGoogleLogin}>
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              Gestor Google Login
            </Button>

            <div className="text-center space-y-1">
              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck size={10} className="text-primary" /> 2FA Ativo via Google/Microsoft
              </p>
              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                {isRegistering ? 'Já possui acesso?' : 'Não possui credenciais?'}
              </p>
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-primary text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                {isRegistering ? 'Voltar ao Login' : 'Solicitar ao Administrador'}
              </button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center mt-8 text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">Built for Excellence • 2024</p>
      </motion.div>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AppContentWrapper />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}

function AppContentWrapper() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <Background />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 90, 180, 270, 360]
            }} 
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <RefreshCw className="text-primary/50" size={64} />
          </motion.div>
          <p className="text-white/20 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Sincronizando Dados...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <AppContent />;
}

function AppContent() {
  const { user, profile, loading, isAdmin, isManager } = useContext(AuthContext);
  const [isDark, setIsDark] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const { t, i18n } = useTranslation();
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [hrRecords, setHrRecords] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubC = customerService.subscribe(setCustomers);
    const unsubP = productService.subscribe(setProducts);
    const unsubI = invoiceService.subscribe(setInvoices);
    const unsubH = hrService.subscribe(setHrRecords);
    const unsubA = appointmentService.subscribe(setAppointments);
    const unsubT = treatmentService.subscribe(setTreatments);
    const unsubE = expenseService.subscribe(setExpenses);
    const unsubS = staffService.subscribe(setStaff);
    const unsubSup = supplierService.subscribe(setSuppliers);
    const unsubSto = storeService.subscribe(setStores);
    const unsubLog = createService('audit_logs').subscribe(setAuditLogs);

    return () => { 
      unsubC(); unsubP(); unsubI(); unsubH(); 
      unsubA(); unsubT(); unsubE(); unsubS();
      unsubSup(); unsubSto(); unsubLog();
    };
  }, [user]);

  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen relative flex flex-col font-sans">
      <Background />
      <div className="min-h-screen flex flex-col relative z-10 w-full overflow-hidden">
        
        <header className="px-6 py-6 flex justify-between items-center z-10 bg-primary/80 text-white shadow-xl rounded-b-[2.5rem] backdrop-blur-md border-b border-white/10 mx-2 mt-2">
          <div className="flex items-center gap-4">
            {activeModule && (
              <Button variant="ghost" size="icon" onClick={() => setActiveModule(null)} className="rounded-full h-10 w-10 text-white hover:bg-white/20">
                <ArrowLeft size={20} />
              </Button>
            )}
            <h1 
              className="text-2xl md:text-3xl font-black text-white tracking-tighter cursor-pointer flex items-center gap-2 relative"
              onClick={() => setActiveModule(null)}
            >
              <Scissors 
                size={48} 
                className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-30 transform -rotate-12 pointer-events-none text-black/40" 
              />
              <span className="relative z-10">DUNAMIS</span> 
              <span className="relative z-10 text-white/80 font-cursive font-normal text-xl md:text-2xl">Soft Pro</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <NotificationCenter products={products} appointments={appointments} />
            <div className="hidden sm:flex items-center gap-2 bg-white/20 p-1 rounded-full border border-white/10">
              <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
                <SelectTrigger className="w-[80px] bg-transparent border-none text-[10px] uppercase font-black text-white outline-none ring-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">PT</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="es">ES</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" onClick={() => setIsDark(!isDark)} className="rounded-full text-white hover:bg-white/20">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            
            <div className="flex items-center gap-2 pl-4 border-l border-white/20">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold leading-none text-white">{profile?.displayName}</p>
                <p className="text-[10px] text-white/60 uppercase font-black tracking-widest">{profile?.role}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut(auth)} className="rounded-full text-white hover:bg-white/20"><LogOut size={20} /></Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-4 max-w-7xl mx-auto w-full relative">
          <AnimatePresence>
            {installPrompt && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 glass-effect rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-primary/20 bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-full text-primary">
                    <Download size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Para melhor experiência e fluidez clique em: <span className="text-primary font-black uppercase tracking-widest text-[10px]">instalar</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setInstallPrompt(null)} className="text-slate-400">Depois</Button>
                  <Button onClick={handleInstallClick} className="rounded-xl h-10 px-6 font-black uppercase tracking-widest text-xs gap-2">
                    <Download size={14} /> Instalar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!activeModule ? (
              <DashboardGrid onSelect={setActiveModule} />
            ) : (
              <ModuleContainer 
                module={activeModule} 
                customers={customers}
                products={products}
                invoices={invoices}
                hrRecords={hrRecords}
                appointments={appointments}
                treatments={treatments}
                expenses={expenses}
                staff={staff}
                suppliers={suppliers}
                stores={stores}
                auditLogs={auditLogs}
                isManager={isManager}
                isAdmin={isAdmin}
                profile={profile}
                onCheckout={(app: any) => {
                  setCheckoutData({
                    appointmentId: app.id,
                    customerId: app.customerId,
                    treatmentId: app.treatmentId
                  });
                }}
              />
            )}
          </AnimatePresence>
        </main>

        <Dialog open={!!checkoutData} onOpenChange={(open) => !open && setCheckoutData(null)}>
          <DialogContent className="max-w-4xl rounded-[2.5rem] p-4 max-h-[90vh] overflow-y-auto">
            <InvoiceCreator onClose={() => setCheckoutData(null)} initialData={checkoutData} />
          </DialogContent>
        </Dialog>

        <footer className="p-4 flex justify-end items-center gap-2 text-xs text-slate-400">
          <span>{t('developed_by')}</span>
          <a href="https://wa.me/258827043290" target="_blank" rel="noopener noreferrer" className="text-secondary font-bold hover:underline">9TECH</a>
        </footer>
      </div>
    </div>
  );
}

function LoginScreen({ isDark, setIsDark }: any) {
  const { t } = useTranslation();
  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4", isDark ? "dark bg-[#0a0a0a]" : "bg-background")}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="max-w-md w-full text-center shadow-2xl rounded-[2.5rem] p-8 glass-effect">
          <div className="w-20 h-20 bg-primary rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">DUNAMIS SOFT</h1>
          <p className="text-slate-500 mb-8">Professional Management System</p>
          <Button onClick={() => signInWithPopup(auth, googleProvider)} className="w-full py-6 rounded-2xl gap-3 text-lg" variant="outline">
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            {t('login_google')}
          </Button>
          <Button variant="ghost" onClick={() => setIsDark(!isDark)} className="mt-6 text-slate-400">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}

function DashboardGrid({ onSelect }: { onSelect: (m: ModuleKey) => void }) {
  const { t } = useTranslation();
  const { profile } = useContext(AuthContext);
  
  const allModules = [
    { key: 'calendar', icon: Calendar, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager', 'reception', 'barber'] },
    { key: 'customers', icon: Users, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager', 'reception', 'barber'] },
    { key: 'finance', icon: Wallet, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager', 'reception'] },
    { key: 'treatments', icon: Scissors, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager', 'reception', 'barber'] },
    { key: 'products', icon: Package, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager', 'reception', 'barber'] },
    { key: 'expenses', icon: TrendingDown, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager'] },
    { key: 'hr', icon: Briefcase, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager'] },
    { key: 'statistics', icon: BarChart3, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager'] },
    { key: 'stores', icon: Store, color: 'bg-primary text-white border-2 border-white', roles: ['admin'] },
    { key: 'reports', icon: FileText, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager'] },
    { key: 'calculator', icon: Calculator, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager', 'reception', 'barber'] },
    { key: 'inventory', icon: Truck, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager'] },
    { key: 'settings', icon: Settings, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager'] },
    { key: 'guide', icon: Book, color: 'bg-primary text-white border-2 border-white', roles: ['admin', 'manager', 'reception', 'barber'] },
  ] as const;

  const modules = allModules.filter(m => m.roles.includes(profile?.role || 'barber'));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {modules.map(m => (
        <Button
          key={m.key}
          variant="outline"
          onClick={() => onSelect(m.key as ModuleKey)}
          className="h-44 rounded-[3rem] flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-all border-none bg-white/5 dark:bg-white/5 backdrop-blur-xl shadow-xl shadow-orange-500/5 group"
        >
          <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg", m.color)}>
            <m.icon size={32} />
          </div>
          <span className="font-black uppercase tracking-tighter text-xs md:text-sm text-black">{t(m.key)}</span>
        </Button>
      ))}
    </div>
  );
}

function ModuleContainer({ module, customers, products, invoices, hrRecords, appointments, treatments, expenses, staff, suppliers, stores, isManager, isAdmin, profile, auditLogs, onCheckout }: any) {
  switch(module) {
    case 'calendar': return <CalendarModule appointments={appointments} customers={customers} treatments={treatments} staff={staff} onCheckout={onCheckout} />;
    case 'customers': return <CustomerModule customers={customers} />;
    case 'products': return <ProductModule products={products} isManager={isManager} isAdmin={isAdmin} />;
    case 'finance': return <FinanceModule invoices={invoices} customers={customers} expenses={expenses} />;
    case 'treatments': return <TreatmentModule treatments={treatments} isManager={isManager} />;
    case 'expenses': return <ExpenseModule expenses={expenses} isManager={isManager} />;
    case 'statistics': return <StatisticsModule invoices={invoices} products={products} customers={customers} />;
    case 'hr': return <HRModule records={hrRecords} staff={staff} invoices={invoices} />;
    case 'reports': return <ReportModule invoices={invoices} expenses={expenses} customers={customers} products={products} />;
    case 'calculator': return <CalculatorModule />;
    case 'inventory': return <SupplierModule suppliers={suppliers} />;
    case 'stores': return <StoreModule stores={stores} />;
    case 'settings': return <SettingsModule profile={profile} auditLogs={auditLogs} />;
    case 'guide': return <UserGuideModule />;
    default: return <div className="glass-effect p-12 rounded-[3rem] text-center"><p className="text-slate-400 italic">Módulo em desenvolvimento...</p></div>;
  }
}

// --- MODULES ---




