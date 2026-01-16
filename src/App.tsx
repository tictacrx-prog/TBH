import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Leaf,
  Receipt,
  Calculator,
  Plus,
  TrendingUp,
  TrendingDown,
  Package,
  Globe,
  Trash2,
  DollarSign,
  PieChart,
  AlertCircle,
  ArrowUpRight,
  Settings as SettingsIcon,
  ShoppingBag,
  Tag,
  X,
  Download,
  Upload,
  Info,
  History,
  Layers,
  Archive,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Search,
  Calendar,
  ShieldCheck,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { Transaction, Plant, Category, Source, BusinessState } from './types';

const INITIAL_STATE: BusinessState = {
  transactions: [],
  plants: [],
  settings: {
    vaTaxRate: 5.75,
    fedTaxRate: 15.3,
    palmstreetFeeRate: 10
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INVENTORY' | 'TRANSACTIONS' | 'TAXES' | 'SETTINGS' | 'GUIDE'>('DASHBOARD');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<BusinessState>(() => {
    const saved = localStorage.getItem('flora_ledger_v3');
    try {
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      return INITIAL_STATE;
    }
  });

  useEffect(() => {
    localStorage.setItem('flora_ledger_v3', JSON.stringify(data));
  }, [data]);

  const totals = useMemo(() => {
    const income = data.transactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const operatingExpenses = data.transactions
      .filter(t => t.type === 'EXPENSE' && !['COGS', 'FEES', 'SHIPPING', 'PLANT_PURCHASE', 'IMPORT_FEE'].includes(t.category))
      .reduce((acc, t) => acc + t.amount, 0);

    const cogs = data.transactions
      .filter(t => t.category === 'COGS')
      .reduce((acc, t) => acc + t.amount, 0);

    const platformFees = data.transactions
      .filter(t => t.category === 'FEES')
      .reduce((acc, t) => acc + t.amount, 0);

    const shippingCosts = data.transactions
      .filter(t => t.category === 'SHIPPING')
      .reduce((acc, t) => acc + t.amount, 0);

    // Profit calculation: Revenue - COGS (Allocated Basis) - Operating Expenses - Shipping - Fees
    const grossProfit = income - cogs - platformFees - shippingCosts;
    const netProfitBeforeTax = grossProfit - operatingExpenses;
    
    const taxableProfit = netProfitBeforeTax > 0 ? netProfitBeforeTax * 0.9235 : 0;
    const fedTax = taxableProfit * (data.settings.fedTaxRate / 100);
    const vaTax = netProfitBeforeTax > 0 ? netProfitBeforeTax * (data.settings.vaTaxRate / 100) : 0;

    return {
      income,
      operatingExpenses,
      cogs,
      platformFees,
      shippingCosts,
      profit: netProfitBeforeTax,
      vaTax,
      fedTax,
      totalTax: vaTax + fedTax,
      net: netProfitBeforeTax - (vaTax + fedTax)
    };
  }, [data]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const id = crypto.randomUUID();
    setData(prev => ({
      ...prev,
      transactions: [{ ...t, id }, ...prev.transactions]
    }));
  };

  const deleteTransaction = (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  const addPlant = (p: Omit<Plant, 'id' | 'initialBasis' | 'remainingBasis'>) => {
    const id = crypto.randomUUID();
    const totalCost = p.purchasePrice + p.importFees;
    const newPlant: Plant = { ...p, id, initialBasis: totalCost, remainingBasis: totalCost };
    
    setData(prev => ({ ...prev, plants: [newPlant, ...prev.plants] }));

    if (p.purchasePrice > 0) {
      addTransaction({
        date: p.purchaseDate,
        type: 'EXPENSE',
        category: 'PLANT_PURCHASE', // Capital asset purchase, not immediate COGS
        description: `Asset Purchase: ${p.name}`,
        amount: p.purchasePrice,
        source: p.source,
        linkedPlantId: id
      });
    }
    if (p.importFees > 0) {
      addTransaction({
        date: p.purchaseDate,
        type: 'EXPENSE',
        category: 'IMPORT_FEE',
        description: `Import/Phyto: ${p.name}`,
        amount: p.importFees,
        source: 'OVERSEAS',
        linkedPlantId: id
      });
    }
  };

  const recordSale = (saleData: { plantId?: string, name: string, amount: number, basis: number, source: Source, date: string }) => {
    addTransaction({
      date: saleData.date,
      type: 'INCOME',
      category: 'SALE',
      description: saleData.name,
      amount: saleData.amount,
      source: saleData.source,
      linkedPlantId: saleData.plantId
    });

    if (saleData.source === 'PALMSTREET') {
      const fee = saleData.amount * (data.settings.palmstreetFeeRate / 100);
      addTransaction({
        date: saleData.date,
        type: 'EXPENSE',
        category: 'FEES',
        description: `Palmstreet Fee: ${saleData.name}`,
        amount: fee,
        source: 'PALMSTREET',
        isPalmstreetFee: true
      });
    }

    if (saleData.basis > 0) {
      addTransaction({
        date: saleData.date,
        type: 'EXPENSE',
        category: 'COGS',
        description: `Basis Allocation: ${saleData.name}`,
        amount: saleData.basis,
        source: 'OTHER',
        linkedPlantId: saleData.plantId
      });
    }
  };

  const updatePlantStatus = (id: string, status: Plant['status']) => {
    setData(prev => ({
      ...prev,
      plants: prev.plants.map(p => p.id === id ? { ...p, status } : p)
    }));
  };

  const getPlantMetrics = (plantId: string) => {
    const plantTransactions = data.transactions.filter(t => t.linkedPlantId === plantId);
    const basisUsed = plantTransactions.filter(t => t.category === 'COGS').reduce((acc, t) => acc + t.amount, 0);
    const revenue = plantTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    return { basisUsed, revenue };
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#2f81f7]/30 overflow-hidden">
      <aside className="w-72 border-r border-[#30363d] flex flex-col bg-[#010409] z-20 shrink-0 shadow-2xl">
        <div className="p-8 flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab('DASHBOARD')}>
          <div className="bg-[#238636] p-2.5 rounded-xl transition-all group-hover:rotate-12 group-hover:scale-110">
            <Leaf className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-none tracking-tighter italic">Flora<span className="text-[#2f81f7]">Ledger</span></h1>
            <p className="text-[9px] text-[#2f81f7] uppercase font-black tracking-widest mt-1 animate-pulse">Operational</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <NavItem active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<LayoutDashboard size={20} />} label="Control Center" />
          <NavItem active={activeTab === 'INVENTORY'} onClick={() => setActiveTab('INVENTORY')} icon={<Package size={20} />} label="Mother Assets" />
          <NavItem active={activeTab === 'TRANSACTIONS'} onClick={() => setActiveTab('TRANSACTIONS')} icon={<Receipt size={20} />} label="Financial Ledger" />
          <NavItem active={activeTab === 'TAXES'} onClick={() => setActiveTab('TAXES')} icon={<Calculator size={20} />} label="Tax Reserves" />
          <div className="my-6 border-t border-[#30363d] mx-2 opacity-50"></div>
          <NavItem active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={<SettingsIcon size={20} />} label="Settings" />
          <NavItem active={activeTab === 'GUIDE'} onClick={() => setActiveTab('GUIDE')} icon={<HelpCircle size={20} />} label="Standalone Setup" />
        </nav>

        <div className="p-6 border-t border-[#30363d] bg-[#0d1117]/50 space-y-4">
          <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] rounded-2xl p-4 border border-[#30363d] shadow-inner">
            <p className="text-[10px] font-black text-[#8b949e] uppercase mb-1 tracking-tighter">Liquid Capital (Net)</p>
            <p className="text-xl font-black text-white font-mono tracking-tighter">${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="flex items-center gap-2 px-2">
             <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
             <span className="text-[9px] font-bold text-[#484f58] uppercase">Local Node Sync Active</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#0d1117] scroll-smooth">
        <div className="max-w-6xl mx-auto p-12">
          <header className="flex justify-between items-end mb-12">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#2f81f7] text-[10px] font-black uppercase tracking-[0.2em]">
                <div className="w-6 h-[2px] bg-[#2f81f7]" />
                {activeTab === 'GUIDE' ? 'Setup Guide' : activeTab}
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">Business Intelligence</h2>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-[#2f81f7] hover:bg-[#4d94ff] rounded-2xl text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-[#2f81f7]/20 transform hover:translate-y-[-2px] transition-all active:translate-y-0"
              >
                <Plus size={18} /> New Entry
              </button>
            </div>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === 'DASHBOARD' && <Dashboard totals={totals} data={data} />}
            {activeTab === 'INVENTORY' && (
              <Inventory 
                data={data} 
                addPlant={addPlant} 
                recordSale={recordSale} 
                updatePlantStatus={updatePlantStatus} 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                getPlantMetrics={getPlantMetrics}
              />
            )}
            {activeTab === 'TRANSACTIONS' && <Transactions data={data} deleteTransaction={deleteTransaction} />}
            {activeTab === 'TAXES' && <Taxes totals={totals} settings={data.settings} />}
            {activeTab === 'SETTINGS' && (
              <Settings 
                settings={data.settings} 
                updateSettings={(s: any) => setData(prev => ({ ...prev, settings: s }))}
                clearData={() => { if(confirm('Permanently delete all business data?')) setData(INITIAL_STATE); }}
                data={data}
                setData={setData}
              />
            )}
            {activeTab === 'GUIDE' && <DeploymentGuide />}
          </div>
        </div>
      </main>

      {isModalOpen && <TransactionModal 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addTransaction} 
        plants={data.plants}
      />}
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-sm font-bold border ${active ? 'bg-gradient-to-r from-[#21262d] to-transparent text-white border-[#30363d] shadow-sm shadow-black/20' : 'text-[#8b949e] border-transparent hover:text-white hover:bg-[#161b22]'}`}
    >
      <span className={active ? 'text-[#2f81f7]' : 'text-[#484f58]'}>{icon}</span>
      {label}
    </button>
  );
}

function Dashboard({ totals, data }: any) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Gross Revenue" value={totals.income} icon={<TrendingUp className="text-[#3fb950]" />} trend="Inflow" />
        <StatCard label="Basis Allocation (COGS)" value={totals.cogs} icon={<Layers className="text-[#2f81f7]" />} trend="Tax Shield" />
        <StatCard label="Direct Expenses" value={totals.operatingExpenses + totals.platformFees + totals.shippingCosts} icon={<TrendingDown className="text-[#f85149]" />} trend="Leakage" />
        <StatCard label="Pre-Tax Profit" value={totals.profit} icon={<DollarSign className="text-[#a371f7]" />} color="text-[#a371f7]" trend="Net Margin" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-[32px] p-10">
          <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-3 italic uppercase tracking-tighter">
            <PieChart size={24} className="text-[#2f81f7]" /> Revenue Breakdown
          </h3>
          <div className="space-y-10">
            <LeakageRow label="Marketplace Fees" amount={totals.platformFees} color="bg-[#f85149]" total={totals.income} />
            <LeakageRow label="Shipping & Logistics" amount={totals.shippingCosts} color="bg-[#d29922]" total={totals.income} />
            <LeakageRow label="Inventory Basis (COGS)" amount={totals.cogs} color="bg-[#2f81f7]" total={totals.income} />
            <LeakageRow label="Operating Costs" amount={totals.operatingExpenses} color="bg-[#8b949e]" total={totals.income} />
            <div className="pt-6 border-t border-[#30363d]">
              <LeakageRow label="Net Retained Cash" amount={totals.net} color="bg-[#3fb950]" total={totals.income} />
            </div>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-[32px] p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase italic">
              <Globe size={22} className="text-[#2f81f7]" /> Global Imports
            </h3>
            <span className="px-2 py-1 bg-[#238636]/10 text-[#3fb950] text-[10px] font-black rounded-lg">Live Status</span>
          </div>
          
          <div className="space-y-4 flex-1">
            {data.plants.filter((p: any) => p.source === 'OVERSEAS' && p.status !== 'ARCHIVED').slice(0, 4).map((p: any) => (
              <div key={p.id} className="p-5 bg-[#0d1117] rounded-2xl border border-[#30363d] group hover:border-[#2f81f7] transition-all cursor-default">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-black text-white text-sm truncate max-w-[140px]">{p.name}</p>
                  <span className="text-[9px] bg-[#238636]/10 text-[#238636] px-2 py-0.5 rounded-full font-bold">{p.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#484f58] font-bold uppercase tracking-widest">Total Entry Basis</span>
                  <span className="font-mono text-xs text-[#2f81f7] font-bold">${p.initialBasis.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {data.plants.filter((p: any) => p.source === 'OVERSEAS' && p.status !== 'ARCHIVED').length === 0 && (
              <div className="text-center py-16 flex flex-col items-center justify-center flex-1 opacity-50">
                <div className="bg-[#0d1117] w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-[#30363d]">
                   <Globe className="text-[#30363d]" size={32} />
                </div>
                <p className="text-xs text-[#8b949e] font-bold uppercase tracking-widest">No overseas imports logged</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-[#30363d]">
             <p className="text-[10px] text-[#484f58] font-bold uppercase leading-relaxed">
               * Import expenses are automatically linked to biological asset basis.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeakageRow({ label, amount, color, total }: any) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${color}`} />
           <span className="text-[#8b949e] font-black uppercase tracking-tight">{label}</span>
        </div>
        <span className="text-white font-mono font-bold">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[#484f58] ml-2">{percentage.toFixed(1)}%</span></span>
      </div>
      <div className="h-2.5 bg-[#0d1117] rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 ease-out shadow-lg shadow-${color}/20`} style={{ width: `${Math.max(2, Math.min(100, percentage))}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = 'text-white', trend }: any) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] p-8 rounded-[32px] group hover:border-[#8b949e] transition-all relative overflow-hidden">
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { size: 100 })}
      </div>
      <div className="flex justify-between items-start mb-6">
        <div className="p-3.5 bg-[#0d1117] rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform border border-[#30363d] shadow-inner">{icon}</div>
        <span className="text-[10px] font-black text-[#8b949e] uppercase bg-[#0d1117] px-3 py-1.5 rounded-xl border border-[#30363d]">{trend}</span>
      </div>
      <p className="text-[#8b949e] text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
      <p className={`text-3xl font-black ${color} mt-2 font-mono tracking-tighter`}>${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
    </div>
  );
}

function Inventory({ data, addPlant, recordSale, updatePlantStatus, searchQuery, setSearchQuery, getPlantMetrics }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [saleModal, setSaleModal] = useState<string | null>(null);
  const [newPlant, setNewPlant] = useState<Omit<Plant, 'id' | 'initialBasis' | 'remainingBasis'>>({
    name: '', purchasePrice: 0, purchaseDate: new Date().toISOString().split('T')[0], source: 'ONLINE', importFees: 0, status: 'MOTHER'
  });

  const filteredPlants = data.plants.filter((p: Plant) => 
    p.status !== 'ARCHIVED' && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#161b22] to-transparent p-10 rounded-[32px] border border-[#30363d] flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2">
          <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Biological Assets</h3>
          <p className="text-sm text-[#8b949e] font-medium">Cost-basis tracking for mother plants and cuttings.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#484f58]" size={18} />
             <input 
              type="text"
              placeholder="Search varieties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:border-[#2f81f7] outline-none transition-all placeholder:text-[#484f58]"
             />
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="px-8 py-4 rounded-2xl bg-[#238636] hover:bg-[#2ea043] text-white font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-[#238636]/10">
            {showAdd ? <X size={20} /> : <Plus size={20} />}
            {showAdd ? 'Cancel Registration' : 'Register New Asset'}
          </button>
        </div>
      </div>

      {showAdd && (
        <form 
          onSubmit={(e) => { e.preventDefault(); if(!newPlant.name) return; addPlant(newPlant); setShowAdd(false); }}
          className="bg-[#161b22] border-2 border-[#2f81f7]/40 p-12 rounded-[32px] grid grid-cols-1 md:grid-cols-3 gap-10 animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden"
        >
          <div className="md:col-span-2">
            <InputGroup label="Plant Variety / Description" value={newPlant.name} onChange={(v: any) => setNewPlant({...newPlant, name: v})} placeholder="e.g. Monstera Albo Mint (Select Cuttings)" />
          </div>
          <InputGroup label="Acquisition Date" type="date" value={newPlant.purchaseDate} onChange={(v: any) => setNewPlant({...newPlant, purchaseDate: v})} />
          <InputGroup label="Base Asset Price ($)" type="number" value={newPlant.purchasePrice} onChange={(v: any) => setNewPlant({...newPlant, purchasePrice: parseFloat(v) || 0})} />
          <InputGroup label="Import / Phyto Fees ($)" type="number" value={newPlant.importFees} onChange={(v: any) => setNewPlant({...newPlant, importFees: parseFloat(v) || 0})} />
          
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.2em]">Acquisition Channel</label>
            <select value={newPlant.source} onChange={e => setNewPlant({...newPlant, source: e.target.value as any})} className="w-full bg-[#0d1117] border-2 border-[#30363d] rounded-2xl p-4 text-sm font-bold focus:border-[#2f81f7] outline-none text-white">
              <option value="ONLINE">Online Vendor</option>
              <option value="PALMSTREET">Palmstreet</option>
              <option value="OVERSEAS">Overseas Import</option>
              <option value="LOCAL">Local Trade/Sale</option>
            </select>
          </div>

          <div className="md:col-span-3 pt-6 border-t border-[#30363d]">
            <button type="submit" className="w-full bg-[#2f81f7] py-6 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-[#2f81f7]/20 hover:bg-[#4d94ff] transition-all">
              Document Asset in Ledger
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPlants.map((p: Plant) => {
           const { basisUsed, revenue } = getPlantMetrics(p.id);
           const currentRemainingBasis = Math.max(0, p.initialBasis - basisUsed);
           const isBreakeven = revenue >= p.initialBasis;
           const roi = ((revenue - p.initialBasis) / p.initialBasis) * 100;

           return (
            <div key={p.id} className="bg-[#161b22] border border-[#30363d] rounded-[32px] overflow-hidden group flex flex-col hover:border-[#484f58] transition-all hover:shadow-2xl">
              <div className="p-10 border-b border-[#30363d] bg-gradient-to-br from-[#1c2128] to-[#161b22]">
                <div className="flex justify-between items-start mb-8">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${p.status === 'MOTHER' ? 'bg-[#238636]/10 text-[#238636] border-[#238636]/20' : 'bg-[#a371f7]/10 text-[#a371f7] border-[#a371f7]/20'}`}>
                    {p.status}
                  </span>
                  <button onClick={() => updatePlantStatus(p.id, 'ARCHIVED')} className="p-2.5 bg-[#0d1117] rounded-xl text-[#484f58] hover:text-[#f85149] border border-transparent hover:border-[#f85149]/30 transition-all shadow-inner" title="Archive">
                    <Archive size={16} />
                  </button>
                </div>
                <h4 className="text-3xl font-black text-white leading-[1.1] mb-3 tracking-tighter">{p.name}</h4>
                <div className="flex items-center gap-3 text-xs font-bold text-[#8b949e]">
                  <div className="flex items-center gap-1.5 bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#30363d] shadow-inner">
                    <Calendar size={12} className="text-[#2f81f7]" /> {p.purchaseDate}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#30363d] shadow-inner">
                    <Globe size={12} className="text-[#3fb950]" /> {p.source}
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8 flex-1">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-[#0d1117] rounded-2xl border border-[#30363d] shadow-inner">
                    <p className="text-[10px] font-black text-[#484f58] uppercase mb-1.5 tracking-tighter">Initial Basis</p>
                    <p className="text-xl font-black text-white font-mono">${p.initialBasis.toFixed(2)}</p>
                  </div>
                  <div className="p-5 bg-[#0d1117] rounded-2xl border border-[#30363d] shadow-inner">
                    <p className="text-[10px] font-black text-[#484f58] uppercase mb-1.5 tracking-tighter">Held Basis</p>
                    <p className={`text-xl font-black font-mono ${currentRemainingBasis > 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>${currentRemainingBasis.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-widest">Breakeven Velocity</span>
                      {isBreakeven && <CheckCircle2 size={12} className="text-[#3fb950]" />}
                    </div>
                    <span className="text-white text-[10px] font-mono font-bold">{isBreakeven ? `+${roi.toFixed(1)}% ROI` : `${Math.min(100, (revenue/p.initialBasis)*100).toFixed(0)}%` }</span>
                  </div>
                  <div className="h-3 bg-[#0d1117] rounded-full overflow-hidden shadow-inner border border-[#30363d]">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${isBreakeven ? 'bg-gradient-to-r from-[#238636] to-[#3fb950]' : 'bg-gradient-to-r from-[#2f81f7] to-[#58a6ff]'}`} 
                      style={{ width: `${Math.min(100, (revenue / p.initialBasis) * 100)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-[#484f58] uppercase tracking-tighter">
                    <span>Revenue: ${revenue.toFixed(2)}</span>
                    <span>Basis Allocated: ${basisUsed.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  disabled={currentRemainingBasis <= 0}
                  onClick={() => setSaleModal(p.id)} 
                  className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-lg ${currentRemainingBasis <= 0 ? 'bg-transparent border-[#30363d] text-[#484f58] cursor-not-allowed opacity-50' : 'bg-[#21262d] border-[#30363d] hover:bg-[#30363d] hover:border-[#2f81f7] text-white hover:shadow-[#2f81f7]/5'}`}
                >
                  <CreditCard size={18} className={currentRemainingBasis > 0 ? "text-[#3fb950]" : ""} /> Record Prop Sale
                </button>
              </div>

              {saleModal === p.id && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                  <div className="w-full max-w-md">
                    <CuttingSaleModal 
                      plant={p} 
                      remainingBasis={currentRemainingBasis}
                      onClose={() => setSaleModal(null)} 
                      onConfirm={recordSale} 
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredPlants.length === 0 && (
          <div className="md:col-span-3 text-center py-32 bg-[#161b22]/30 border-2 border-dashed border-[#30363d] rounded-[40px] shadow-inner">
            <div className="w-20 h-20 bg-[#0d1117] border border-[#30363d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
               <Leaf size={40} className="text-[#30363d]" />
            </div>
            <p className="text-xl font-black text-white uppercase italic mb-2 tracking-tighter">No Varieties Identified</p>
            <p className="text-sm text-[#8b949e] font-medium">Start by registering your mother stock to track biological growth and profit.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CuttingSaleModal({ plant, remainingBasis, onClose, onConfirm }: any) {
  const [sale, setSale] = useState({ name: '', amount: 0, basis: 0, source: 'PALMSTREET' as Source, date: new Date().toISOString().split('T')[0] });
  return (
    <div className="bg-[#1c2128] border-2 border-[#30363d] rounded-[40px] p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-10">
        <h5 className="text-3xl font-black text-white uppercase italic tracking-tighter">Sale Initiation</h5>
        <button onClick={onClose} className="p-3 hover:bg-[#30363d] rounded-full text-[#8b949e] transition-colors"><X size={24} /></button>
      </div>
      <div className="space-y-8">
        <div className="p-6 bg-[#0d1117] border border-[#30363d] rounded-[24px] shadow-inner">
          <p className="text-[10px] font-black text-[#2f81f7] uppercase mb-2 tracking-[0.2em]">Asset Origin</p>
          <p className="text-lg font-black text-white truncate">{plant.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
            <p className="text-xs text-[#3fb950] font-black uppercase tracking-widest">Pool Availability: ${remainingBasis.toFixed(2)}</p>
          </div>
        </div>

        <InputGroup label="Prop Memo / ID" value={sale.name} onChange={(v: any) => setSale({...sale, name: v})} placeholder="e.g. 1-node mid-cut (rooted)" />
        
        <div className="grid grid-cols-2 gap-6">
          <InputGroup label="Gross Sale ($)" value={sale.amount} type="number" onChange={(v: any) => setSale({...sale, amount: parseFloat(v) || 0})} />
          <InputGroup 
            label="Allocate Basis ($)" 
            value={sale.basis} 
            type="number" 
            onChange={(v: any) => setSale({...sale, basis: Math.min(remainingBasis, parseFloat(v) || 0)})} 
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.2em]">Sales Channel</label>
          <select value={sale.source} onChange={e => setSale({...sale, source: e.target.value as any})} className="w-full bg-[#0d1117] border-2 border-[#30363d] rounded-2xl p-4 text-sm font-bold text-white outline-none">
            <option value="PALMSTREET">Palmstreet</option>
            <option value="LOCAL">Direct / Local</option>
            <option value="ONLINE">Online Store</option>
            <option value="OTHER">Other Channel</option>
          </select>
        </div>

        <button 
          onClick={() => { if(!sale.name || sale.amount <= 0) return; onConfirm({ ...sale, plantId: plant.id }); onClose(); }}
          className="w-full py-6 bg-[#3fb950] rounded-2xl text-white text-sm font-black uppercase tracking-[0.3em] hover:bg-[#2ea043] transition-all shadow-xl shadow-[#3fb950]/10"
        >Confirm & Deplete Basis</button>
      </div>
    </div>
  );
}

function Transactions({ data, deleteTransaction }: any) {
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const filtered = data.transactions.filter((t: any) => filter === 'ALL' || t.type === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-2 p-2 bg-[#161b22] border border-[#30363d] rounded-[24px] w-fit shadow-inner">
          <button onClick={() => setFilter('ALL')} className={`px-8 py-3.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-[#2f81f7] text-white shadow-xl' : 'text-[#8b949e] hover:text-white hover:bg-[#0d1117]'}`}>Master Flux</button>
          <button onClick={() => setFilter('INCOME')} className={`px-8 py-3.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${filter === 'INCOME' ? 'bg-[#238636] text-white shadow-xl' : 'text-[#8b949e] hover:text-white hover:bg-[#0d1117]'}`}>Revenue</button>
          <button onClick={() => setFilter('EXPENSE')} className={`px-8 py-3.5 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${filter === 'EXPENSE' ? 'bg-[#f85149] text-white shadow-xl' : 'text-[#8b949e] hover:text-white hover:bg-[#0d1117]'}`}>Expenses</button>
        </div>
        <p className="text-xs font-black text-[#484f58] uppercase tracking-[0.3em]">{filtered.length} Indexed Logs</p>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-[32px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#1c2128] text-[#8b949e] uppercase text-[10px] tracking-widest font-black">
              <tr>
                <th className="px-10 py-8 border-b border-[#30363d]">Timestamp</th>
                <th className="px-10 py-8 border-b border-[#30363d]">Description</th>
                <th className="px-10 py-8 border-b border-[#30363d]">Channel</th>
                <th className="px-10 py-8 border-b border-[#30363d] text-right">Amount</th>
                <th className="px-10 py-8 border-b border-[#30363d]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {filtered.map((t: any) => (
                <tr key={t.id} className="hover:bg-[#21262d] group transition-all duration-300">
                  <td className="px-10 py-8 text-[#8b949e] font-mono text-xs">{t.date}</td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className={`p-3 rounded-2xl border ${t.type === 'INCOME' ? 'bg-[#238636]/10 text-[#238636] border-[#238636]/20' : 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20'}`}>
                        {t.type === 'INCOME' ? <ShoppingBag size={20} /> : <Receipt size={20} />}
                      </div>
                      <div>
                        <div className="font-black text-white group-hover:text-[#2f81f7] transition-colors leading-tight mb-1">{t.description}</div>
                        <div className="flex items-center gap-2">
                           <div className={`w-1.5 h-1.5 rounded-full ${t.type === 'INCOME' ? 'bg-[#3fb950]' : 'bg-[#f85149]'}`} />
                           <span className="text-[10px] text-[#484f58] font-black uppercase tracking-widest">{t.category.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[10px] font-black bg-[#0d1117] border border-[#30363d] px-4 py-2 rounded-xl text-[#c9d1d9] tracking-tighter shadow-inner uppercase">{t.source}</span>
                  </td>
                  <td className={`px-10 py-8 text-right font-mono font-black text-lg ${t.type === 'INCOME' ? 'text-[#3fb950]' : 'text-white'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-10 py-8 text-right">
                     <button onClick={() => deleteTransaction(t.id)} className="text-[#30363d] hover:text-[#f85149] p-3 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 active:scale-95 border border-transparent hover:border-[#f85149]/30 rounded-xl hover:bg-[#0d1117] shadow-inner">
                       <Trash2 size={20} />
                     </button>
                  </td>
                </tr>
              ))} 
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <History size={60} className="mx-auto text-[#1c2128] mb-6" />
                    <p className="text-[#484f58] font-black uppercase tracking-[0.4em] text-xs">Zero entries documented</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Taxes({ totals, settings }: any) {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="bg-gradient-to-br from-[#161b22] to-[#010409] border-2 border-[#30363d] rounded-[48px] p-16 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2f81f7]/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <h3 className="text-5xl font-black text-white mb-6 uppercase italic tracking-tighter">Tax Liability Reservoir</h3>
          <p className="text-[#8b949e] text-lg mb-16 flex items-center gap-3">
            <ShieldCheck className="text-[#3fb950]" /> Verified logic for <span className="text-white font-bold px-2 py-1 bg-[#1c2128] rounded-lg">Virginia-Based</span> sole proprietorships.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="space-y-12">
              <TaxRow label="Virginia State Income" rate={settings.vaTaxRate} amount={totals.vaTax} color="text-[#2f81f7]" />
              <TaxRow label="Federal Self-Employment" rate={settings.fedTaxRate} amount={totals.fedTax} color="text-[#a371f7]" description="Standard 15.3% on 92.35% of net profit" />
              
              <div className="pt-12 border-t-2 border-[#30363d] flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-white font-black uppercase text-xs tracking-[0.3em]">Total Reserve Requirement</span>
                  <p className="text-[11px] text-[#484f58] font-bold uppercase tracking-tight">Allocated for quarterly estimations</p>
                </div>
                <span className="text-6xl font-black text-[#f85149] tracking-tighter font-mono shadow-sm">-${totals.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="bg-[#0d1117]/80 backdrop-blur-md p-10 rounded-[32px] space-y-8 border border-[#30363d] shadow-2xl">
              <div className="flex items-center gap-4 border-b border-[#30363d] pb-6">
                <div className="p-3 bg-[#2f81f7]/10 rounded-xl">
                  <AlertCircle className="text-[#2f81f7]" size={24} />
                </div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Strategic Directives</h4>
              </div>
              <div className="space-y-8">
                <AdviceItem title="Leverage Basis Allocation" text="Every dollar of basis allocated to a cutting sale is a dollar you don't pay income tax on. This is the single most effective way to lower your tax liability legally." />
                <AdviceItem title="Deduct Phyto & Import" text="These costs are capitalized into your asset basis. FloraLedger automates this when you register an import, ensuring you recover those costs tax-free over time." />
                <AdviceItem title="Marketplace Leakage" text="Palmstreet's 10% cut is an operating expense. We track this per-sale to ensure your taxable net is as low as possible while remaining accurate." />
                <AdviceItem title="The SE Tax Shield" text="Federal Self-Employment tax only applies to your actual profit after all expenses and basis deductions. Accurate tracking saves you thousands." />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdviceItem({ title, text }: { title: string, text: string }) {
  return (
    <div className="group">
      <p className="text-xs font-black text-white mb-2 tracking-widest uppercase transition-colors group-hover:text-[#2f81f7]">• {title}</p>
      <p className="text-[12px] leading-relaxed text-[#8b949e] font-medium">{text}</p>
    </div>
  );
}

function TransactionModal({ onClose, onAdd, plants }: any) {
  const [t, setT] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0], type: 'EXPENSE', category: 'SUPPLIES', description: '', amount: 0, source: 'LOCAL'
  });

  const categories = [
    { id: 'SALE', label: 'Revenue (Income)', type: 'INCOME' },
    { id: 'PLANT_PURCHASE', label: 'Inventory (Asset)', type: 'EXPENSE' },
    { id: 'SUPPLIES', label: 'Supplies (Deductible)', type: 'EXPENSE' },
    { id: 'SHIPPING', label: 'Logistics / Shipping', type: 'EXPENSE' },
    { id: 'FEES', label: 'Platform Fees', type: 'EXPENSE' },
    { id: 'IMPORT_FEE', label: 'Import / Phyto Fees', type: 'EXPENSE' },
    { id: 'OTHER', label: 'Other Misc Expense', type: 'EXPENSE' },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-[#161b22] border-2 border-[#30363d] w-full max-w-2xl rounded-[48px] p-12 space-y-10 shadow-[0_0_100px_rgba(47,129,247,0.1)] animate-in zoom-in-95">
        <div className="flex justify-between items-center">
          <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Manual Log</h3>
          <button onClick={onClose} className="p-3 hover:bg-[#30363d] rounded-full transition-colors text-[#8b949e]"><X size={28} /></button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <InputGroup label="Log Date" type="date" value={t.date} onChange={(v: any) => setT({...t, date: v})} />
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.3em]">Flux Vector</label>
            <select 
              value={t.type} 
              onChange={e => setT({...t, type: e.target.value as any})} 
              className="w-full bg-[#0d1117] border-2 border-[#30363d] rounded-[20px] p-5 text-sm font-bold focus:border-[#2f81f7] outline-none transition-all text-white"
            >
              <option value="EXPENSE">Expense (-)</option>
              <option value="INCOME">Income (+)</option>
            </select>
          </div>
        </div>

        <InputGroup label="Transaction Memo" value={t.description} onChange={(v: any) => setT({...t, description: v})} placeholder="e.g. Bulk Boxes & Heat Packs" />

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.3em]">Category Mapping</label>
            <select 
              value={t.category} 
              onChange={e => setT({...t, category: e.target.value as any})} 
              className="w-full bg-[#0d1117] border-2 border-[#30363d] rounded-[20px] p-5 text-sm font-bold focus:border-[#2f81f7] outline-none transition-all text-white"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <InputGroup label="Amount ($)" type="number" value={t.amount} onChange={(v: any) => setT({...t, amount: parseFloat(v) || 0})} />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.3em]">Log Channel</label>
          <select value={t.source} onChange={e => setT({...t, source: e.target.value as any})} className="w-full bg-[#0d1117] border-2 border-[#30363d] rounded-[20px] p-5 text-sm font-bold focus:border-[#2f81f7] outline-none text-white">
            <option value="PALMSTREET">Palmstreet</option>
            <option value="OVERSEAS">Overseas Supplier</option>
            <option value="ONLINE">Online Purchase</option>
            <option value="LOCAL">Local Source</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <button 
          onClick={() => { if(!t.description || t.amount <= 0) return; onAdd(t); onClose(); }}
          className="w-full bg-[#2f81f7] py-6 rounded-2xl text-white font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-[#2f81f7]/20 hover:bg-[#4d94ff] transition-all active:scale-[0.98]"
        >Execute Log Entry</button>
      </div>
    </div>
  );
}

function DeploymentGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border-2 border-[#30363d] rounded-[48px] p-16 shadow-2xl">
        <h3 className="text-5xl font-black text-white mb-8 uppercase italic tracking-tighter">Standalone Portability</h3>
        <p className="text-[#8b949e] text-lg mb-12 leading-relaxed font-medium">
          FloraLedger is built to be your private, self-contained business engine. You can use it anywhere without needing a complex backend.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <GuideCard 
            icon={<Globe className="text-[#2f81f7]" size={40} />} 
            title="Option 1: Cloud Hosting" 
            text="Deploy this application to a service like Vercel or Netlify. This allows you to access your business ledger from your phone or tablet while you are in the greenhouse."
            steps={["Copy this source code", "Push to a GitHub Repository", "Deploy to Vercel (Free Forever)"]}
          />
          <GuideCard 
            icon={<ExternalLink className="text-[#3fb950]" size={40} />} 
            title="Option 2: Local HTML" 
            text="You can run this as a single file on your desktop. Your data remains 100% private and is stored in your browser's persistent storage."
            steps={["Save current view as HTML", "Open file in any browser", "No internet connection required"]}
          />
        </div>

        <div className="mt-16 bg-[#0d1117] p-10 rounded-[32px] border border-[#30363d] shadow-inner">
           <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-[#2f81f7]/10 rounded-xl">
                <BookOpen className="text-[#2f81f7]" size={28} />
              </div>
              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Protocol for Survival</h4>
           </div>
           <ul className="space-y-8">
              <li className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-2xl bg-[#238636]/10 text-[#3fb950] flex items-center justify-center text-sm font-black shrink-0 border border-[#238636]/20 shadow-inner">01</div>
                <div>
                  <p className="text-white font-black uppercase text-xs tracking-widest mb-1">The Basis Habit</p>
                  <p className="text-sm text-[#8b949e] leading-relaxed">Every time you sell a cutting, deplete the 'Held Basis' pool of the mother plant. This is the difference between high taxes and a profitable business.</p>
                </div>
              </li>
              <li className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-2xl bg-[#238636]/10 text-[#3fb950] flex items-center justify-center text-sm font-black shrink-0 border border-[#238636]/20 shadow-inner">02</div>
                <div>
                  <p className="text-white font-black uppercase text-xs tracking-widest mb-1">Weekly Backups</p>
                  <p className="text-sm text-[#8b949e] leading-relaxed">Use the JSON Export feature in Settings every Sunday. Store these files in your personal Google Drive or iCloud for ultimate safety.</p>
                </div>
              </li>
              <li className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-2xl bg-[#238636]/10 text-[#3fb950] flex items-center justify-center text-sm font-black shrink-0 border border-[#238636]/20 shadow-inner">03</div>
                <div>
                  <p className="text-white font-black uppercase text-xs tracking-widest mb-1">Clean Audits</p>
                  <p className="text-sm text-[#8b949e] leading-relaxed">Keep your CSV exports ready for your tax advisor. It separates 'Capital Assets' (Mother Plants) from 'Cost of Goods Sold' (Cuttings) automatically.</p>
                </div>
              </li>
           </ul>
        </div>
      </div>
    </div>
  );
}

function GuideCard({ icon, title, text, steps }: any) {
  return (
    <div className="bg-[#0d1117] p-10 rounded-[40px] border border-[#30363d] space-y-8 group hover:border-[#2f81f7] transition-all shadow-xl">
      <div className="p-5 bg-[#161b22] border border-[#30363d] rounded-[24px] w-fit group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <div className="space-y-4">
        <h4 className="text-2xl font-black text-white leading-tight uppercase italic">{title}</h4>
        <p className="text-sm leading-relaxed text-[#8b949e] font-medium">{text}</p>
      </div>
      <div className="space-y-3 pt-4">
        {steps.map((step: string, i: number) => (
          <div key={i} className="flex items-center gap-3 text-[11px] font-black text-[#2f81f7] uppercase tracking-[0.2em]">
            <ArrowUpRight size={14} /> {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings({ settings, updateSettings, clearData, data, setData }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Source'];
    const rows = data.transactions.map((t: any) => [
      t.date, t.type, t.category, t.description, t.amount, t.source
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `flora_ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `flora_ledger_backup_${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.transactions && imported.plants && imported.settings) {
          if (confirm('Importing will overwrite current data. Proceed?')) {
            setData(imported);
            alert('Data imported successfully.');
          }
        } else {
          alert('Invalid file format.');
        }
      } catch (err) {
        alert('Error parsing JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="bg-[#161b22] border border-[#30363d] p-12 rounded-[40px] space-y-12 shadow-2xl">
        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Tax Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <InputGroup label="VA Tax Rate (%)" type="number" value={settings.vaTaxRate} onChange={(v: any) => updateSettings({...settings, vaTaxRate: parseFloat(v)})} />
          <InputGroup label="Palmstreet Fee (%)" type="number" value={settings.palmstreetFeeRate} onChange={(v: any) => updateSettings({...settings, palmstreetFeeRate: parseFloat(v)})} />
          <InputGroup label="Fed SE Tax Rate (%)" type="number" value={settings.fedTaxRate} onChange={(v: any) => updateSettings({...settings, fedTaxRate: parseFloat(v)})} />
        </div>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] p-12 rounded-[40px] space-y-8 shadow-2xl">
        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Data Portability</h3>
        <p className="text-sm text-[#8b949e] font-medium">Secure your ledger data. CSV is optimized for external accounting; JSON is optimized for internal app migration.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={exportToCSV} className="flex items-center justify-center gap-3 py-5 bg-[#0d1117] border border-[#30363d] rounded-[20px] text-white font-black text-[10px] uppercase tracking-widest hover:border-[#2f81f7] transition-all shadow-inner">
            <Download size={18} /> CSV Export
          </button>
          <button onClick={exportJSON} className="flex items-center justify-center gap-3 py-5 bg-[#0d1117] border border-[#30363d] rounded-[20px] text-white font-black text-[10px] uppercase tracking-widest hover:border-[#2f81f7] transition-all shadow-inner">
            <Layers size={18} /> JSON Backup
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-3 py-5 bg-[#0d1117] border border-[#30363d] rounded-[20px] text-white font-black text-[10px] uppercase tracking-widest hover:border-[#2f81f7] transition-all shadow-inner">
            <Upload size={18} /> JSON Restore
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])}
          />
        </div>
      </div>
      
      <div className="bg-[#161b22]/50 border-2 border-dashed border-[#f85149]/20 p-12 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-inner">
        <div className="space-y-1 text-center md:text-left">
          <h4 className="font-black text-[#f85149] uppercase italic text-lg tracking-tighter">Factory Reset</h4>
          <p className="text-xs text-[#8b949e] font-medium">Permanently destroy all locally indexed ledger data.</p>
        </div>
        <button onClick={clearData} className="bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/30 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#f85149] hover:text-white transition-all shadow-xl shadow-[#f85149]/10">
          Reset Ledger
        </button>
      </div>
    </div>
  );
}

function InputGroup({ label, type = 'text', value, onChange, className = "", placeholder = "" }: any) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.3em]">{label}</label>
      <input 
        type={type} 
        value={value} 
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-[#0d1117] border-2 border-[#30363d] rounded-[20px] p-5 text-sm font-bold text-white focus:border-[#2f81f7] outline-none transition-all placeholder:text-[#30363d] shadow-inner"
      />
    </div>
  );
}

function TaxRow({ label, rate, amount, color, description }: any) {
  return (
    <div className="flex justify-between items-end group transition-all">
      <div className="transition-transform group-hover:translate-x-2">
        <p className="text-white font-black text-2xl tracking-tighter italic uppercase">{label}</p>
        <p className="text-xs text-[#8b949e] font-black uppercase tracking-[0.2em] mt-1">Configured Rate: {rate}%</p>
        {description && <p className="text-[11px] text-[#484f58] font-bold mt-2 uppercase tracking-tight">{description}</p>}
      </div>
      <div className="text-right">
        <p className={`text-3xl font-black font-mono transition-all group-hover:scale-110 ${color}`}>+${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
  );
}
