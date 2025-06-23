import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Zap, Eye, ChevronUp, ChevronDown, History } from 'lucide-react';

interface LoansTabProps {
  address: string;
  onTakeFlashLoan: (amount: string) => Promise<void>;
  onRepayFlashLoan: (amount: string) => Promise<void>;
  onRequestLoan?: (amount: string) => Promise<void>;
  onRepayLoan?: (loanId: number, amount: string) => Promise<void>;
  onFullRepayment?: (loanId: number) => Promise<void>;
  getFlashLoanStatus?: (userAddress: string) => Promise<any>;
  getUserLoans?: (userAddress: string) => Promise<any[]>;
  getLoanRepaymentAmount?: (userAddress: string, loanId: number) => Promise<any>;
  getLoanStatus?: (userAddress: string, loanId: number) => Promise<any>;
  isLoading: boolean;
}

export default function LoansTab({
  address,
  onTakeFlashLoan,
  onRepayFlashLoan,
  onRequestLoan,
  onRepayLoan,
  onFullRepayment,
  getFlashLoanStatus,
  getUserLoans,
  getLoanRepaymentAmount,
  getLoanStatus,
  isLoading
}: LoansTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('regular');
  const [loanAmount, setLoanAmount] = useState('');
  const [flashLoanAmount, setFlashLoanAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [flashLoanStatus, setFlashLoanStatus] = useState<any>(null);
  const [userLoans, setUserLoans] = useState<any[]>([]);
  const [loanHistory, setLoanHistory] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [activeViewTab, setActiveViewTab] = useState('active');
  const [expandedLoans, setExpandedLoans] = useState<Set<string | number>>(new Set());
  const [loanDetails, setLoanDetails] = useState<Map<number, any>>(new Map());
  
  // 加载贷款数据
  useEffect(() => {
    const loadLoanData = async () => {
      if (!address) return;
      
      if (getFlashLoanStatus) {
        try {
          const flashStatus = await getFlashLoanStatus(address);
          console.log('🔍 Flash loan status loaded:', flashStatus);
          setFlashLoanStatus(flashStatus);
        } catch (error) {
          console.error('Failed to load flash loan status:', error);
        }
      }
      
      if (getUserLoans) {
        try {
          const loans = await getUserLoans(address);
          const activeLoans = loans.filter(loan => loan.isActive);
          const historyLoans = loans.filter(loan => !loan.isActive);
          setUserLoans(activeLoans);
          setLoanHistory(historyLoans);
        } catch (error) {
          console.error('Failed to load user loans:', error);
        }
      }
    };
    
    loadLoanData();
  }, [address, getFlashLoanStatus, getUserLoans]);

  // 闪电贷倒计时
  useEffect(() => {
    if (!flashLoanStatus || !flashLoanStatus.isActive) {
      setTimeLeft(0);
      return;
    }

    const updateCountdown = () => {
      const timestamp = flashLoanStatus[3] || flashLoanStatus.timestamp;
      if (timestamp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const startTime = Number(timestamp);
        const deadline = startTime + 3600;
        const remaining = deadline - currentTime;
        
        if (startTime > currentTime) {
          setTimeLeft(3600);
        } else {
          setTimeLeft(Math.max(0, remaining));
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [flashLoanStatus]);

  const subTabs = [
    { id: 'regular', name: 'Regular Loans', icon: CreditCard },
    { id: 'flash', name: 'Flash Loans', icon: Zap },
  ];

  // 计算贷款信息
  const getEnhancedLoanInfo = (loan: any, loanIndex: number) => {
    const details = loanDetails.get(loanIndex);
    
    let paidPrincipal = 0;
    let paidInterest = 0;
    let remainingPrincipal = Number(loan.amount) / 1e18;
    let unpaidInterest = 0;
    let totalOwed = remainingPrincipal;

    if (details) {
      remainingPrincipal = Number(details[1]) / 1e18;
      const totalInterest = Number(details[2]) / 1e18;
      unpaidInterest = Number(details[3]) / 1e18;
      totalOwed = Number(details[4]) / 1e18;
      
      paidPrincipal = (Number(loan.amount) / 1e18) - remainingPrincipal;
      paidInterest = totalInterest - unpaidInterest;
    } else if (loan.paidAmount !== undefined && loan.paidInterest !== undefined) {
      paidPrincipal = Number(loan.paidAmount) / 1e18;
      paidInterest = Number(loan.paidInterest) / 1e18;
      remainingPrincipal = (Number(loan.amount) / 1e18) - paidPrincipal;
      totalOwed = remainingPrincipal;
    }
    
    return {
      originalAmount: Number(loan.amount) / 1e18,
      remainingPrincipal,
      paidPrincipal,
      paidInterest,
      unpaidInterest,
      totalInterest: unpaidInterest + paidInterest,
      totalOwed,
      collateral: Number(loan.collateral) / 1e18,
      interestRate: (Number(loan.interestRate) || 850) / 100,
      startTime: Number(loan.startTime),
      isActive: loan.isActive
    };
  };

  // 切换贷款详情
  const toggleLoanDetails = async (loanIndex: number, isHistory = false) => {
    const newExpanded = new Set(expandedLoans);
    const key = isHistory ? `h_${loanIndex}` : loanIndex;
    
    console.log(`🔍 Toggling loan details: contract[${loanIndex}], key: ${key}, isHistory: ${isHistory}`);
    
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
      console.log(`📤 Collapsing loan ${loanIndex}`);
    } else {
      newExpanded.add(key);
      console.log(`📥 Expanding loan ${loanIndex}`);
      if (getLoanStatus && address && !isHistory) {
        try {
          const status = await getLoanStatus(address, loanIndex);
          const newDetails = new Map(loanDetails);
          newDetails.set(loanIndex, status);
          setLoanDetails(newDetails);
        } catch (error) {
          console.error('Failed to get loan details:', error);
        }
      }
    }
    setExpandedLoans(newExpanded);
  };

  // 渲染贷款卡片
  const renderLoanCard = (loan: any, index: number, isHistory = false) => {
    // 使用contractIndex进行合约调用，如果没有则回退到index
    const contractIndex = loan.contractIndex !== undefined ? loan.contractIndex : index;
    
    const loanInfo = getEnhancedLoanInfo(loan, contractIndex);
    // 关键修复：key 应该基于 contractIndex，而不是 index，确保与 toggleLoanDetails 一致
    const key = isHistory ? `h_${contractIndex}` : contractIndex;
    const isExpanded = expandedLoans.has(key);
    
    console.log(`🔍 Rendering loan display[${index}] → contract[${contractIndex}], active: ${loan.isActive}, key: ${key}`);
    
    return (
      <div key={`${isHistory ? 'history' : 'active'}_${index}`} className="p-4 bg-white rounded border">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                {isHistory ? `📜 Loan #${contractIndex} (Completed)` : `Loan #${contractIndex}`}
                <span className="text-xs text-gray-500 ml-1">(Contract #{contractIndex})</span>
              </div>
              <Button
                onClick={() => toggleLoanDetails(contractIndex, isHistory)}
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Details
                {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>Original: {loanInfo.originalAmount.toFixed(4)} ETH</div>
              <div>
                {isHistory ? 'Completed' : 'Remaining'}: 
                <span className={`font-medium ml-1 ${isHistory ? 'text-green-600' : 'text-blue-600'}`}>
                  {isHistory ? '0.0000' : loanInfo.remainingPrincipal.toFixed(4)} ETH
                </span>
              </div>
              <div>Collateral: {loanInfo.collateral.toFixed(4)} ETH</div>
              <div>Interest Rate: {loanInfo.interestRate}%</div>
              {!isHistory && (
                <div className="col-span-2 font-medium text-red-600">
                  Total Owed: {loanInfo.totalOwed > 0 ? 
                    (loanInfo.totalOwed < 0.001 ? 
                      `${loanInfo.totalOwed.toFixed(12)} ETH (微量)` : 
                      `${loanInfo.totalOwed.toFixed(6)} ETH`) : 
                    '0.000000 ETH'
                  }
                </div>
              )}
              {(loanInfo.paidPrincipal > 0 || isHistory) && (
                <div className="col-span-2 text-green-600 font-medium">
                  ✅ Paid: {loanInfo.paidPrincipal.toFixed(4)} ETH principal + {loanInfo.paidInterest.toFixed(6)} ETH interest
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="mt-3 p-3 bg-gray-50 rounded border-t">
                <h6 className="text-xs font-medium text-gray-800 mb-2 flex items-center">
                  <History className="h-3 w-3 mr-1" />
                  {isHistory ? 'Loan Summary' : 'Repayment History & Details'}
                </h6>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-700">Principal Status:</div>
                    <div>Original Amount: {loanInfo.originalAmount.toFixed(6)} ETH</div>
                    <div className="text-green-600">Paid Principal: {loanInfo.paidPrincipal.toFixed(6)} ETH</div>
                    <div className={isHistory ? "text-green-600" : "text-blue-600"}>
                      Remaining: {loanInfo.remainingPrincipal.toFixed(6)} ETH
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-gray-700">Interest Status:</div>
                    <div>Total Interest: {loanInfo.totalInterest.toFixed(6)} ETH</div>
                    <div className="text-green-600">Paid Interest: {loanInfo.paidInterest.toFixed(6)} ETH</div>
                    {!isHistory && (
                      <div className="text-orange-600">Unpaid Interest: {loanInfo.unpaidInterest.toFixed(6)} ETH</div>
                    )}
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <div className="text-gray-600">Start Time: {new Date(loanInfo.startTime * 1000).toLocaleString()}</div>
                    <div className="text-gray-600">
                      Duration: {Math.floor((Date.now() / 1000 - loanInfo.startTime) / 86400)} days
                    </div>
                    {isHistory && (
                      <div className="text-green-600 font-medium">✅ Status: Fully Repaid</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="ml-4 space-y-2 min-w-[140px]">
            <div className={`text-xs px-2 py-1 rounded text-center ${
              isHistory ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {isHistory ? '✅ Completed' : '🔥 Active'}
            </div>
            
            {!isHistory && onRepayLoan && (
              <div className="space-y-2">
                <div className="p-2 bg-green-50 rounded text-xs text-green-700 mb-2">
                  ✅ Partial & full repayment supported
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Custom Amount:</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    className="w-full p-2 text-xs border rounded"
                    id={`repay-${contractIndex}`}
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById(`repay-${contractIndex}`) as HTMLInputElement;
                      if (input && input.value && parseFloat(input.value) > 0) {
                        const userAmount = parseFloat(input.value);
                        const totalOwed = loanInfo.totalOwed;
                        const maxAllowed = totalOwed + 0.01;
                        
                        if (userAmount > maxAllowed) {
                          const shouldUseFull = confirm(
                            `⚠️ Amount too large!\n\n` +
                            `You entered: ${userAmount.toFixed(6)} ETH\n` +
                            `Total owed: ${totalOwed.toFixed(6)} ETH\n` +
                            `Maximum allowed: ${maxAllowed.toFixed(6)} ETH\n\n` +
                            `Do you want to pay the full amount instead?`
                          );
                          
                          if (shouldUseFull) {
                            onRepayLoan(contractIndex, totalOwed.toFixed(8));
                          }
                          input.value = '';
                          return;
                        }
                        
                        onRepayLoan(contractIndex, input.value);
                        input.value = '';
                      } else {
                        alert('Please enter a valid repayment amount greater than 0');
                      }
                    }}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    Partial Repay
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    console.log(`🔧 Smart repayment: display[${index}] → contract[${contractIndex}]`);
                    
                    if (onFullRepayment) {
                      onFullRepayment(contractIndex);
                    } else if (onRepayLoan && getLoanRepaymentAmount) {
                      // 回退到原有逻辑（如果新函数不可用）
                      getLoanRepaymentAmount(address, contractIndex)
                        .then(repaymentInfo => {
                          if (repaymentInfo) {
                            let finalAmount = repaymentInfo.totalRepayment;
                            if (finalAmount > 0 && finalAmount < 0.01) {
                              finalAmount = Math.max(finalAmount + 0.001, 0.01);
                            }
                            onRepayLoan(contractIndex, finalAmount.toFixed(8));
                          } else {
                            let fallbackAmount = loanInfo.totalOwed;
                            if (fallbackAmount > 0 && fallbackAmount < 0.01) {
                              fallbackAmount = Math.max(fallbackAmount + 0.001, 0.01);
                            }
                            onRepayLoan(contractIndex, fallbackAmount.toFixed(8));
                          }
                        })
                        .catch(error => {
                          console.error('Error getting repayment amount:', error);
                          let fallbackAmount = loanInfo.totalOwed;
                          if (fallbackAmount > 0 && fallbackAmount < 0.01) {
                            fallbackAmount = Math.max(fallbackAmount + 0.001, 0.01);
                          }
                          onRepayLoan(contractIndex, fallbackAmount.toFixed(8));
                        });
                    }
                  }}
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-xs"
                >
                  🔧 Smart Full Repayment
                  <div className="text-xs">
                    {loanInfo.totalOwed < 0.01 && loanInfo.totalOwed > 0 ? (
                      <span className="text-yellow-200 font-semibold">
                        Auto Micro Clear
                      </span>
                    ) : (
                      `${loanInfo.totalOwed.toFixed(6)} ETH + Buffer`
                    )}
                  </div>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleRequestLoan = async () => {
    if (!loanAmount) {
      alert('Please enter a loan amount');
      return;
    }
    
    const amountNum = parseFloat(loanAmount);
    if (isNaN(amountNum) || amountNum < 0.1) {
      alert('Minimum loan amount is 0.1 ETH');
      return;
    }
    
    if (onRequestLoan) {
      await onRequestLoan(loanAmount);
      setLoanAmount('');
      
      // 刷新贷款数据
      if (getUserLoans && address) {
        try {
          const loans = await getUserLoans(address);
          const activeLoans = loans.filter(loan => loan.isActive);
          const historyLoans = loans.filter(loan => !loan.isActive);
          setUserLoans(activeLoans);
          setLoanHistory(historyLoans);
        } catch (error) {
          console.error('Failed to refresh user loans:', error);
        }
      }
    }
  };

  const handleTakeFlashLoan = async () => {
    if (!flashLoanAmount) return;
    await onTakeFlashLoan(flashLoanAmount);
    setFlashLoanAmount('');
    
    if (getFlashLoanStatus && address) {
      try {
        const flashStatus = await getFlashLoanStatus(address);
        setFlashLoanStatus(flashStatus);
      } catch (error) {
        console.error('Failed to refresh flash loan status:', error);
      }
    }
  };

  const handleRepayFlashLoan = async () => {
    if (!repayAmount) return;
    await onRepayFlashLoan(repayAmount);
    setRepayAmount('');
    
    if (getFlashLoanStatus && address) {
      try {
        const flashStatus = await getFlashLoanStatus(address);
        setFlashLoanStatus(flashStatus);
      } catch (error) {
        console.error('Failed to refresh flash loan status:', error);
      }
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">💳 Loan Center</h3>
      
      {/* Sub Navigation */}
      <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`${
              activeSubTab === tab.id
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            } flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Regular Loans Tab */}
      {activeSubTab === 'regular' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Loan Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="1.0"
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <Button
            onClick={handleRequestLoan}
            disabled={!loanAmount || isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Apply for Loan'}
          </Button>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">📋 Regular Loan Features</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Interest rate: 8.5% annually</li>
              <li>• Collateral required: 150% of loan amount</li>
              <li>• Flexible repayment terms</li>
              <li>• Credit building opportunities</li>
            </ul>
          </div>

          {/* 贷款显示区域 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-medium text-gray-800">📋 Your Loans</h5>
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setActiveViewTab('active')}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    activeViewTab === 'active'
                      ? 'bg-green-100 text-green-700 font-medium'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Active ({userLoans.length})
                </button>
                <button
                  onClick={() => setActiveViewTab('history')}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    activeViewTab === 'history'
                      ? 'bg-gray-100 text-gray-700 font-medium'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  History ({loanHistory.length})
                </button>
              </div>
            </div>

            {/* 活跃贷款 */}
            {activeViewTab === 'active' && (
              userLoans && userLoans.length > 0 ? (
                <div className="space-y-3">
                  {userLoans.map((loan: any, index: number) => renderLoanCard(loan, index, false))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 text-center py-8">
                  🎯 No active loans. Apply for a loan above to get started!
                </div>
              )
            )}

            {/* 贷款历史 */}
            {activeViewTab === 'history' && (
              loanHistory && loanHistory.length > 0 ? (
                <div className="space-y-3">
                  {loanHistory.map((loan: any, index: number) => renderLoanCard(loan, index, true))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 text-center py-8">
                  📜 No loan history yet. Complete a loan to see it here!
                </div>
              )
            )}
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h5 className="font-medium text-green-800 mb-2">✅ Loan Requirements & Terms</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Minimum loan amount: 0.1 ETH</li>
              <li>• Must provide 150% collateral</li>
              <li>• Interest rate: 8.5% annually</li>
              <li>• <strong>Partial repayment supported</strong> - pay any amount anytime</li>
              <li>• Interest accrues over time</li>
              <li>• Interest is paid first, then principal</li>
            </ul>
          </div>
        </div>
      )}

      {/* Flash Loans Tab */}
      {activeSubTab === 'flash' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Flash Loan Amount (ETH)</label>
            <input
              type="number"
              step="0.01"
              value={flashLoanAmount}
              onChange={(e) => setFlashLoanAmount(e.target.value)}
              placeholder="1.0"
              className="w-full p-3 border rounded-lg"
            />
          </div>

          <Button
            onClick={handleTakeFlashLoan}
            disabled={!flashLoanAmount || isLoading}
            className="w-full"
          >
            Take Flash Loan
          </Button>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-3">Repay Flash Loan</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Repayment Amount (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="1.0005"
                  className="w-full p-3 border rounded-lg"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Include 0.05% fee in repayment amount
                </div>
              </div>

              <Button
                onClick={handleRepayFlashLoan}
                disabled={!repayAmount || isLoading}
                className="w-full"
                variant="outline"
              >
                Repay Flash Loan
              </Button>
            </div>
          </div>

          {/* 闪电贷状态显示 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-800 mb-2">⚡ Flash Loan Status</h5>
            {flashLoanStatus && flashLoanStatus[4] === true ? (
              <div className="p-3 bg-orange-100 rounded border border-orange-200">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-orange-800">Active Flash Loan</div>
                    <div className="text-xs text-orange-700">
                      Amount: {(Number(flashLoanStatus[1]) / 1e18).toFixed(4)} ETH
                    </div>
                    <div className="text-xs text-orange-700">
                      Fee: {(Number(flashLoanStatus[2]) / 1e18).toFixed(6)} ETH
                    </div>
                    <div className="text-xs text-orange-700">
                      Total to repay: {((Number(flashLoanStatus[1]) + Number(flashLoanStatus[2])) / 1e18).toFixed(6)} ETH
                    </div>
                    <div className={`text-xs font-semibold ${timeLeft > 1800 ? 'text-green-700' : timeLeft > 300 ? 'text-yellow-700' : 'text-red-700'}`}>
                      {timeLeft > 0 ? (
                        `⏰ ${Math.floor(timeLeft / 60)}min ${(timeLeft % 60)}sec remaining`
                      ) : (
                        '⚠️ Expired - Repay Now!'
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      onClick={() => {
                        const totalRepay = ((Number(flashLoanStatus[1]) + Number(flashLoanStatus[2])) / 1e18).toString();
                        setRepayAmount(totalRepay);
                      }}
                      size="sm"
                      className="mb-2 bg-red-600 hover:bg-red-700"
                    >
                      Auto Fill Repay Amount
                    </Button>
                    <div className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                      Must Repay Soon!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">No active flash loan</div>
            )}
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h5 className="font-medium text-yellow-800 mb-2">⚡ Flash Loan Features</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Instant loans without collateral</li>
              <li>• Must be repaid within 1 hour</li>
              <li>• 0.05% fee on loan amount</li>
              <li>• Perfect for arbitrage opportunities</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
} 