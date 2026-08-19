import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Upload, 
  FileText, 
  Download, 
  Search, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Receipt,
  Printer,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { PagePermissions } from '../services/permissionsService';

interface Transaction {
  id: string;
  type: 'Inward' | 'Outward';
  category: 'Membership Fee' | 'Event Fee' | 'Donation' | 'Equipment' | 'Logistics' | 'Refreshments' | 'Refund' | 'Other';
  description: string;
  amount: number;
  date: string;
  attachmentName?: string;
  attachmentData?: string; // Simulated uploaded document Base64 / URL
  loggedBy: string;
}

interface Budget {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  category: string;
}

export const FinancePage: React.FC<{ 
  isAdmin: boolean; 
  userRole?: string; 
  pagePermissions?: PagePermissions[];
}> = ({ 
  isAdmin, 
  userRole = 'Treasurer', 
  pagePermissions 
}) => {
  const currentRole = isAdmin ? 'Administrator' : userRole;

    const [activeTab, setActiveTab] = useState<'ledger' | 'budget' | 'handover'>('ledger');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states - Transactions
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txType, setTxType] = useState<'Inward' | 'Outward'>('Inward');
  const [txCategory, setTxCategory] = useState<Transaction['category']>('Membership Fee');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txFileName, setTxFileName] = useState('');
  const [txFileData, setTxFileData] = useState('');

  // Form states - Budget Allocation
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [budgetName, setBudgetName] = useState('');
  const [budgetAllocated, setBudgetAllocated] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('Expedition');

  // Audit Logs / Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Inward' | 'Outward'>('All');

  // Real-time listener for Transactions
  useEffect(() => {
    const qTx = query(collection(db, 'finance_transactions'), orderBy('date', 'desc'));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach(doc => {
        txs.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txs);
      setLoading(false);
    });

    return () => {
      unsubTx();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTxFileName(file.name);
      // Read file content as base64 for simulation
      const reader = new FileReader();
      reader.onload = () => {
        setTxFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txDesc.trim()) return;

    // MANDATORY FIELD REQUIREMENT CHECK: Receipt attachment is strictly mandatory
    if (!txFileName) {
      alert('⚠️ Mandatory Receipt Required: For audit purposes, please upload a supporting invoice, receipt, or agreement document.');
      return;
    }

    const nextTx = {
      type: txType,
      category: txCategory,
      description: txDesc.trim(),
      amount: parseFloat(txAmount),
      date: txDate || new Date().toISOString().split('T')[0],
      attachmentName: txFileName,
      attachmentData: txFileData || 'data:text/plain;base64,U2ltdWxhdGVkIHJlY2VpcHQgYXR0YWNobWVudA==',
      loggedBy: currentRole
    };

    try {
      await addDoc(collection(db, 'finance_transactions'), nextTx);
      setIsAddTxOpen(false);
      setTxAmount('');
      setTxDesc('');
      setTxFileName('');
      setTxFileData('');
    } catch (err) { console.error("Error", err); alert("Action failed."); }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetName.trim() || !budgetAllocated) return;

    const bData = {
      name: budgetName.trim(),
      allocated: parseFloat(budgetAllocated),
      spent: 0,
      category: budgetCategory
    };

    try {
      await addDoc(collection(db, 'finance_budgets'), bData);
      setIsAddBudgetOpen(false);
      setBudgetName('');
      setBudgetAllocated('');
    } catch (err) { console.error("Error", err); alert("Action failed."); }
  };

  // Math Metrics
  const totalInward = transactions.filter(t => t.type === 'Inward').reduce((sum, t) => sum + t.amount, 0);
  const totalOutward = transactions.filter(t => t.type === 'Outward').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalInward - totalOutward;

  const q = (searchQuery || '').toLowerCase();
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = !q ||
                          Boolean(t.description && t.description.toLowerCase().includes(q)) || 
                          Boolean(t.category && t.category.toLowerCase().includes(q)) ||
                          Boolean(t.attachmentName && t.attachmentName.toLowerCase().includes(q));
    const matchesFilter = selectedFilter === 'All' || t.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const currentRolesList = [
    'Treasurer',
    'Council Treasurer',
    'Quartermaster',
    'Normal Rover Member',
    'Administrator'
  ];

  const roleLower = (currentRole || '').toLowerCase();
  const isAdvisor = roleLower.includes('advisor') || 
                    roleLower.includes('administrator') || 
                    roleLower.includes('ziyad');

  const hasRolePermission = pagePermissions?.some(p => 
    p.memberId && p.memberId.toLowerCase() === roleLower && p.grantedPages?.includes('finance')
  );

  const actualHasAccess = isAdvisor || hasRolePermission;

  // Auto-redirect if tab is handover but member has no access
  useEffect(() => {
    if (!actualHasAccess && activeTab === 'handover') {
      setActiveTab('ledger');
    }
  }, [actualHasAccess, activeTab]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner with Role Swapping Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold text-[#0f1e36]">Finance & Asset Treasury</h1>
          </div>
          <p className="text-xs text-slate-500">Log transactions, manage budgets, and generate end-of-term audit reports.</p>
        </div>

        
      </div>

      {/* Role Access Security Guard Info Banner for Normal Members */}
      {!actualHasAccess && (
        <div className="bg-[#fff9db] border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-950">Read-Only Transparent Ledger</h4>
              <p className="text-[11px] text-amber-800 leading-relaxed max-w-xl">
                As a normal member, you can review aggregate budgets and view general transaction headings. Detailed receipt attachments, auditor profiles, and handover transition logs are strictly restricted to council members.
              </p>
            </div>
          </div>
        </div>
      )}


        {/* Key Metric Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Inward Fund Logs</span>
              <p className="text-xl font-black text-emerald-600">{totalInward.toLocaleString()} MVR</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenditures</span>
              <p className="text-xl font-black text-rose-600">{totalOutward.toLocaleString()} MVR</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Net Account Balance</span>
              <p className={`text-xl font-black ${netBalance >= 0 ? 'text-[#1e40af]' : 'text-red-600'}`}>{netBalance.toLocaleString()} MVR</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 gap-1.5 bg-slate-100/55 p-1 rounded-xl max-w-lg">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ledger'
                ? 'bg-white text-[#1e40af] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Transaction Ledger
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'budget'
                ? 'bg-white text-[#1e40af] shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Coins className="w-4 h-4" />
            Budgets & Limits
          </button>
          {actualHasAccess && (
            <button
              onClick={() => setActiveTab('handover')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'handover'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Printer className="w-4 h-4" />
              Handovers & Audit
            </button>
          )}
        </div>

        {/* Tab 1: Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Inward & Outward Register</h2>
                <p className="text-xs text-slate-500">Mandatory verification checks and invoice attachment requirements.</p>
              </div>
              {actualHasAccess && (
                <button
                  onClick={() => setIsAddTxOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Log Transaction
                </button>
              )}
            </div>

            {/* Filtering & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs, categories, or invoice files..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                {['All', 'Inward', 'Outward'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFilter(f as any)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      selectedFilter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Date / Logged</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Document Vault</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="p-4 space-y-0.5">
                        <span className="font-bold text-slate-900">{tx.date}</span>
                        <span className="text-[10px] text-slate-400 block">
                          By: {actualHasAccess ? tx.loggedBy : 'Council Officer'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          tx.type === 'Inward' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">{tx.description}</td>
                      <td className="p-4">
                        {actualHasAccess ? (
                          tx.attachmentName ? (
                            <a 
                              href={tx.attachmentData} 
                              download={tx.attachmentName}
                              className="text-blue-700 font-semibold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="max-w-[150px] truncate">{tx.attachmentName}</span>
                            </a>
                          ) : (
                            <span className="text-red-500 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Missing
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            🔒 Locked (Council Only)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-black text-slate-900">
                        <span className={tx.type === 'Inward' ? 'text-emerald-600' : 'text-rose-600'}>
                          {tx.type === 'Inward' ? '+' : '-'} {tx.amount.toLocaleString()} MVR
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Budgets */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Budget Limits & Activity Limits</h2>
                <p className="text-xs text-slate-500">Track current allocations against recorded expenditures in real-time.</p>
              </div>
              {actualHasAccess && (
                <button
                  onClick={() => setIsAddBudgetOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Budget Limit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((b) => {
                const percentSpent = Math.min(100, Math.round((b.spent / b.allocated) * 100));
                const isOverBudget = b.spent > b.allocated;

                return (
                  <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-[#1e40af] uppercase tracking-wider bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5">{b.category}</span>
                        <h3 className="text-sm font-bold text-slate-900 mt-2">{b.name}</h3>
                      </div>
                      {isOverBudget ? (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Limit Blown
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Normal
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Real-time spend: <strong>{b.spent.toLocaleString()} MVR</strong></span>
                        <span className="text-slate-800 font-bold">Limit: {b.allocated.toLocaleString()} MVR</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? 'bg-red-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`} 
                          style={{ width: `${percentSpent}%` }} 
                        />
                      </div>
                      <p className="text-[10px] text-right font-bold text-slate-400">{percentSpent}% of total allocation consumed</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Handovers */}
        {activeTab === 'handover' && actualHasAccess && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl">
            <div className="space-y-2">
              <h2 className="text-base font-bold text-slate-900">Term-End Handover & Audit Log Generator</h2>
              <p className="text-xs text-slate-500">
                Generate complete compiled ledger books and closing balance sheets to facilitate seamless handover transitions for the incoming Rover Council.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>Handover Summary Snapshot:</strong>
              </p>
              <div className="grid grid-cols-2 gap-4 pt-1.5 font-semibold text-[#0f1e36]">
                <div>Annual Inward Flow: <span className="text-emerald-600 font-bold">{totalInward.toLocaleString()} MVR</span></div>
                <div>Annual Expenditure Flow: <span className="text-rose-600 font-bold">{totalOutward.toLocaleString()} MVR</span></div>
                <div>Accounts Audited: <span className="text-slate-600 font-bold">{transactions.length} Verified Entries</span></div>
                <div>Closing Treasury Balance: <span className="text-[#1e40af] font-bold">{netBalance.toLocaleString()} MVR</span></div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => alert('📄 Generating official Handover Treasury Report PDF containing ' + transactions.length + ' audited lines...')}
                className="px-4 py-2.5 bg-[#1e40af] text-white hover:bg-[#1e3a8a] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" /> Export Ledger PDF
              </button>
              <button
                type="button"
                onClick={() => alert('📊 Generating verified audit trail CSV for Council archives...')}
                className="px-4 py-2.5 bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Export Audit CSV
              </button>
            </div>
          </div>
        )}


      {/* Log Transaction Modal */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Log Treasury Transaction</h2>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Inward">Inward (Fund Credit)</option>
                    <option value="Outward">Outward (Fund Debit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Membership Fee">Membership Fee</option>
                    <option value="Event Fee">Event Fee</option>
                    <option value="Donation">Donation</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Refreshments">Refreshments</option>
                    <option value="Refund">Refund</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Particulars</label>
                <input
                  type="text"
                  required
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="e.g. Paid campsite booking fee for Rover Squire Hike"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (MVR)</label>
                  <input
                    type="number"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Receipt File Upload Field - MANDATORY */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-600" /> Supporting Receipt / Invoice (MANDATORY)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600">
                      {txFileName ? `Selected: ${txFileName}` : 'Drag & drop file or click to upload'}
                    </p>
                    <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTxOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-700"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Allocation Limit Modal */}
      {isAddBudgetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Define Budget Allocation</h2>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Title / Purpose</label>
                <input
                  type="text"
                  required
                  value={budgetName}
                  onChange={(e) => setBudgetName(e.target.value)}
                  placeholder="e.g. National Scout Jamboree Contingent Logistics"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allocated Capital (MVR)</label>
                  <input
                    type="number"
                    required
                    value={budgetAllocated}
                    onChange={(e) => setBudgetAllocated(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={budgetCategory}
                    onChange={(e) => setBudgetCategory(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Expedition">Expedition</option>
                    <option value="Media">Media & Publicity</option>
                    <option value="Training">Training & Badges</option>
                    <option value="General">General Expenses</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBudgetOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-700"
                >
                  Allocate Fund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
