// Web3 和合约实例
let web3;
let currentAccount;
let votingContract;
let bankContract;
let bankExtensionContract;
let isAdvancedVoting = false;
let isAdvancedBank = false;

// 合约 ABI (简化版，实际使用时从编译结果获取)
const VOTING_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_candidateId", "type": "uint256"}],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_candidateId", "type": "uint256"}],
        "name": "getCandidate",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}, {"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "candidatesCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "hasVoted",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "_description", "type": "string"}, {"internalType": "uint256", "name": "_duration", "type": "uint256"}],
        "name": "createProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_proposalId", "type": "uint256"}, {"internalType": "bool", "name": "_support", "type": "bool"}],
        "name": "voteOnProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_proposalId", "type": "uint256"}],
        "name": "getProposal",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "bool", "name": "", "type": "bool"}, {"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "proposalCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

const BASIC_BANK_ABI = [
    {
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBankBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

const ADVANCED_BANK_ABI = [
    {"inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor"},
    {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}], "name": "AccountClosed", "type": "event"},
    {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "newBalance", "type": "uint256"}], "name": "Deposit", "type": "event"},
    {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "interest", "type": "uint256"}], "name": "InterestPaid", "type": "event"},
    {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "loanId", "type": "uint256"}], "name": "LoanApproved", "type": "event"},
    {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "loanId", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "LoanRepaid", "type": "event"},
    {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "borrower", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "loanId", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "collateral", "type": "uint256"}], "name": "LoanRequested", "type": "event"},
    {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256"}, {"indexed": false, "internalType": "uint256", "name": "newBalance", "type": "uint256"}], "name": "Withdrawal", "type": "event"},
    {"constant": false, "inputs": [], "name": "claimInterest", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"},
    {"constant": false, "inputs": [], "name": "closeAccount", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"},
    {"constant": false, "inputs": [], "name": "deposit", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function"},
    {"constant": true, "inputs": [], "name": "getAccountDetails", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "bool", "name": "", "type": "bool"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"constant": true, "inputs": [], "name": "getBalance", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"constant": true, "inputs": [], "name": "getBankBalance", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"constant": true, "inputs": [], "name": "getBankStats", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"constant": true, "inputs": [{"internalType": "uint256", "name": "_index", "type": "uint256"}], "name": "getUserTransaction", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "string", "name": "", "type": "string"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"constant": true, "inputs": [], "name": "getUserTransactionCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"constant": false, "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}, {"internalType": "uint256", "name": "_duration", "type": "uint256"}], "name": "requestLoan", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function"},
    {"constant": false, "inputs": [{"internalType": "uint256", "name": "_loanId", "type": "uint256"}], "name": "repayLoan", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function"},
    {"constant": false, "inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}], "name": "withdraw", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"},
    {"constant": true, "inputs": [], "name": "annualInterestRate", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"}
];

let currentBankABI = BASIC_BANK_ABI;

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保 Web3 库已加载
    setTimeout(() => {
        initializeWeb3();
        setupEventListeners();
        setupTabs();
    }, 100);
});

// 初始化 Web3
async function initializeWeb3() {
    try {
        // 检查 Web3 是否已加载
        if (typeof Web3 === 'undefined') {
            console.error('Web3 library not loaded');
            showToast('Web3 library failed to load, please refresh page', 'error');
            return;
        }
        
        console.log('Web3 version:', Web3.version);
        
        // 连接到 Ganache
        web3 = new Web3('http://127.0.0.1:7545');
        
        // 测试连接
        const blockNumber = await web3.eth.getBlockNumber();
        console.log('Current block number:', blockNumber);
        
        // 获取账户
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            await loadAllAccounts();
            updateAccountInfo();
            updateConnectionStatus(true);
            console.log('Connected successfully, account:', currentAccount);
        } else {
            showToast('No accounts found, please check Ganache', 'error');
        }
    } catch (error) {
        console.error('Web3 initialization failed:', error);
        showToast('Web3 connection failed: ' + error.message, 'error');
    }
}

// 加载所有账户
async function loadAllAccounts() {
    if (!web3) return;
    
    try {
        const accounts = await web3.eth.getAccounts();
        const accountSelector = document.getElementById('account-selector');
        const totalAccountsElement = document.getElementById('total-accounts');
        
        // 清空选择器
        accountSelector.innerHTML = '<option value="">Select Account</option>';
        
        // 添加所有账户到选择器
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const balance = await web3.eth.getBalance(account);
            const ethBalance = parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(4);
            
            const option = document.createElement('option');
            option.value = account;
            option.textContent = `Account ${i + 1}: ${account.slice(0, 6)}...${account.slice(-4)} (${ethBalance} ETH)`;
            
            if (account === currentAccount) {
                option.selected = true;
            }
            
            accountSelector.appendChild(option);
        }
        
        // 显示账户选择器
        accountSelector.classList.remove('hidden');
        totalAccountsElement.textContent = accounts.length;
        
        console.log(`Loaded ${accounts.length} accounts`);
    } catch (error) {
        console.error('Failed to load accounts:', error);
    }
}

// 切换账户
async function switchAccount() {
    const accountSelector = document.getElementById('account-selector');
    const selectedAccount = accountSelector.value;
    
    if (selectedAccount && selectedAccount !== currentAccount) {
        currentAccount = selectedAccount;
        await updateAccountInfo();
        showToast(`Switched to account: ${currentAccount.slice(0, 10)}...`);
        
        // 如果有合约已加载，刷新其信息
        if (votingContract) {
            await refreshVotingResults();
        }
        if (bankContract) {
            await refreshBankInfo();
        }
    }
}

// 刷新账户列表
async function refreshAccounts() {
    if (!web3) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    await loadAllAccounts();
    showToast('Accounts refreshed successfully');
}

// 更新账户信息
async function updateAccountInfo() {
    if (!currentAccount || !web3) return;
    
    try {
        // 更新账户地址显示
        document.getElementById('current-account').textContent = 
            currentAccount.slice(0, 6) + '...' + currentAccount.slice(-4);
        
        // 更新余额
        const balance = await web3.eth.getBalance(currentAccount);
        const balanceInEth = web3.utils.fromWei(balance, 'ether');
        document.getElementById('eth-balance').textContent = 
            parseFloat(balanceInEth).toFixed(4) + ' ETH';
        
        // 更新网络信息
        const networkId = await web3.eth.net.getId();
        document.getElementById('network-id').textContent = `网络 ${networkId}`;
        
    } catch (error) {
        console.error('更新账户信息失败:', error);
    }
}

// 更新连接状态
function updateConnectionStatus(connected) {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    
    if (connected) {
        statusText.textContent = 'Connected';
        statusIndicator.className = 'w-3 h-3 rounded-full ml-2 bg-green-500';
    } else {
        statusText.textContent = 'Disconnected';
        statusIndicator.className = 'w-3 h-3 rounded-full ml-2 bg-red-500';
    }
}

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('connect-wallet').addEventListener('click', connectWallet);
    document.getElementById('refresh-accounts').addEventListener('click', refreshAccounts);
    document.getElementById('account-selector').addEventListener('change', switchAccount);
    document.getElementById('scan-contracts').addEventListener('click', scanContracts);
    
    // 投票系统按钮
    document.getElementById('deploy-voting').addEventListener('click', () => deployVotingContract(false));
    document.getElementById('deploy-voting-advanced').addEventListener('click', () => deployVotingContract(true));
    document.getElementById('load-voting').addEventListener('click', loadVotingContract);
    document.getElementById('vote-button').addEventListener('click', castVote);
    document.getElementById('refresh-votes').addEventListener('click', refreshVotingResults);
    
    // 银行系统按钮
    document.getElementById('deploy-bank').addEventListener('click', () => deployBankContract(false));
    document.getElementById('deploy-bank-advanced').addEventListener('click', () => deployBankContract(true));
    document.getElementById('load-bank').addEventListener('click', loadBankContract);
    document.getElementById('deposit-button').addEventListener('click', deposit);
    document.getElementById('withdraw-button').addEventListener('click', withdraw);
    document.getElementById('refresh-bank').addEventListener('click', refreshBankInfo);
    
    // 高级功能事件监听器
    document.getElementById('create-proposal').addEventListener('click', createProposal);
    document.getElementById('refresh-proposals').addEventListener('click', refreshProposals);
    document.getElementById('calculate-interest').addEventListener('click', calculateInterest);
    document.getElementById('refresh-extensions').addEventListener('click', refreshExtensions);
}

// 设置标签页
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // 更新按钮状态
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
                btn.classList.add('text-gray-600');
            });
            button.classList.remove('text-gray-600');
            button.classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
            
            // 显示对应内容
            tabContents.forEach(content => content.classList.add('hidden'));
            const targetPanel = document.getElementById(targetTab + '-panel');
            if (targetPanel) {
                targetPanel.classList.remove('hidden');
            }
        });
    });
}

// 连接钱包
async function connectWallet() {
    try {
        if (typeof Web3 === 'undefined') {
            showToast('Web3 library not loaded, please refresh page', 'error');
            return;
        }
        
        if (typeof window.ethereum !== 'undefined') {
            // 如果有 MetaMask
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.ethereum);
            showToast('MetaMask connected successfully');
        } else {
            // 使用 Ganache
            web3 = new Web3('http://127.0.0.1:7545');
            showToast('Ganache connected successfully');
        }
        
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
            currentAccount = accounts[0];
            updateAccountInfo();
            updateConnectionStatus(true);
        } else {
            showToast('No accounts found', 'error');
        }
        
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        showToast('Failed to connect wallet: ' + error.message, 'error');
    }
}

// 扫描合约
async function scanContracts() {
    if (!web3) {
        showToast('请先连接钱包', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const currentBlock = await web3.eth.getBlockNumber();
        const contractsList = document.getElementById('contracts-list');
        contractsList.innerHTML = '<p class="text-gray-600">扫描中...</p>';
        
        const contracts = [];
        const startBlock = Math.max(0, Number(currentBlock) - 20);
        
        console.log(`Scanning blocks ${startBlock} to ${currentBlock}`);
        
        for (let i = startBlock; i <= currentBlock; i++) {
            const block = await web3.eth.getBlock(i);
            
            if (block && block.transactions && block.transactions.length > 0) {
                for (const txHash of block.transactions) {
                    try {
                        const receipt = await web3.eth.getTransactionReceipt(txHash);
                        
                        if (receipt && receipt.contractAddress) {
                            const balance = await web3.eth.getBalance(receipt.contractAddress);
                            contracts.push({
                                address: receipt.contractAddress,
                                balance: web3.utils.fromWei(balance, 'ether'),
                                block: i,
                                txHash: txHash
                            });
                        }
                    } catch (err) {
                        console.warn('Failed to get transaction receipt:', txHash, err);
                    }
                }
            }
        }
        
        // 显示结果
        contractsList.innerHTML = '';
        if (contracts.length === 0) {
            contractsList.innerHTML = '<p class="text-gray-600">No contracts found</p>';
        } else {
            contractsList.innerHTML = `<p class="text-green-600 mb-4">Found ${contracts.length} contracts:</p>`;
            
            contracts.forEach((contract, index) => {
                const contractDiv = document.createElement('div');
                contractDiv.className = 'contract-card bg-white p-4 rounded border mb-2';
                contractDiv.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-mono text-sm text-gray-600">Contract ${index + 1}</p>
                            <p class="font-mono text-xs">${contract.address}</p>
                            <p class="text-sm text-gray-500">Block: ${contract.block}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold">${parseFloat(contract.balance).toFixed(4)} ETH</p>
                            <p class="text-xs text-gray-500">Balance</p>
                        </div>
                    </div>
                `;
                contractsList.appendChild(contractDiv);
            });
        }
        
    } catch (error) {
        console.error('扫描合约失败:', error);
        document.getElementById('contracts-list').innerHTML = 
            '<p class="text-red-600">扫描失败: ' + error.message + '</p>';
    } finally {
        showLoading(false);
    }
}

// ============ 投票系统功能 ============

// 部署投票合约
async function deployVotingContract(advanced = false) {
    if (!web3 || !currentAccount) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch('/api/deploy/voting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                account: currentAccount,
                advanced: advanced
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (advanced && result.contractType === 'factory') {
                // 工厂模式：需要创建一个投票实例
                const factoryABI = [
                    {
                        "inputs": [{"internalType": "uint256", "name": "_duration", "type": "uint256"}],
                        "name": "createVoting",
                        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "votingCount",
                        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [{"internalType": "uint256", "name": "_votingId", "type": "uint256"}],
                        "name": "getVotingContract",
                        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                        "stateMutability": "view",
                        "type": "function"
                    }
                ];
                
                const factoryContract = new web3.eth.Contract(factoryABI, result.contractAddress);
                
                // 创建一个24小时的投票
                const createResult = await factoryContract.methods.createVoting(24 * 3600).send({
                    from: currentAccount,
                    gas: 3000000
                });
                
                // 从事件中获取新创建的投票合约地址
                let votingAddress;
                if (createResult.events && createResult.events.VotingCreated) {
                    votingAddress = createResult.events.VotingCreated.returnValues.contractAddress;
                } else {
                    // 通过工厂合约的方法获取最新创建的合约地址
                    const newCount = await factoryContract.methods.votingCount().call();
                    votingAddress = await factoryContract.methods.getVotingContract(newCount - 1).call();
                }
                votingContract = new web3.eth.Contract(VOTING_ABI, votingAddress);
                isAdvancedVoting = true;
                
                showToast(`Advanced voting contract created successfully! Address: ` + votingAddress.slice(0, 10) + '...');
                document.getElementById('voting-address').textContent = 
                    votingAddress.slice(0, 10) + '...' + votingAddress.slice(-6);
                
                // 显示高级功能
                document.getElementById('proposals-section').classList.remove('hidden');
            } else {
                // 基础模式：直接使用返回的地址
                votingContract = new web3.eth.Contract(VOTING_ABI, result.contractAddress);
                const contractType = advanced ? 'Advanced' : 'Basic';
                showToast(`${contractType} voting contract deployed successfully! Address: ` + result.contractAddress.slice(0, 10) + '...');
                document.getElementById('voting-address').textContent = 
                    result.contractAddress.slice(0, 10) + '...' + result.contractAddress.slice(-6);
            }
            
            document.getElementById('voting-interface').classList.remove('hidden');
            await loadCandidates();
        } else {
            showToast('Deployment failed: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Failed to deploy voting contract:', error);
        showToast('Deployment failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 加载现有投票合约
async function loadVotingContract() {
    const contractAddress = prompt('Please enter voting contract address:');
    if (!contractAddress) return;
    
    try {
        votingContract = new web3.eth.Contract(VOTING_ABI, contractAddress);
        
        // 测试合约是否有效
        await votingContract.methods.candidatesCount().call();
        
        document.getElementById('voting-interface').classList.remove('hidden');
        document.getElementById('voting-address').textContent = 
            contractAddress.slice(0, 10) + '...' + contractAddress.slice(-6);
        await loadCandidates();
        showToast('Voting contract loaded successfully');
    } catch (error) {
        console.error('Failed to load voting contract:', error);
        showToast('Loading failed, please check contract address', 'error');
    }
}

// 加载候选人列表
async function loadCandidates() {
    if (!votingContract) return;
    
    try {
        const candidatesCount = await votingContract.methods.candidatesCount().call();
        const candidatesList = document.getElementById('candidates-list');
        const candidateSelect = document.getElementById('candidate-select');
        
        candidatesList.innerHTML = '';
        candidateSelect.innerHTML = '<option value="">选择候选人</option>';
        
        if (candidatesCount == 0) {
            candidatesList.innerHTML = '<p class="text-gray-500">No candidates available</p>';
            return;
        }
        
        for (let i = 0; i < candidatesCount; i++) {
            const candidate = await votingContract.methods.getCandidate(i).call();
            const name = candidate[0];
            const votes = candidate[1];
            
            // 添加到候选人列表
            const candidateDiv = document.createElement('div');
            candidateDiv.className = 'candidate-card bg-white p-3 rounded border mb-2';
            candidateDiv.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-medium">${name}</span>
                    <span class="text-blue-600 font-semibold">${votes} 票</span>
                </div>
            `;
            candidatesList.appendChild(candidateDiv);
            
            // 添加到选择框
            const option = document.createElement('option');
            option.value = i;
            option.textContent = name;
            candidateSelect.appendChild(option);
        }
        
        await refreshVotingResults();
    } catch (error) {
        console.error('加载候选人失败:', error);
        showToast('加载候选人失败', 'error');
    }
}

// 投票
async function castVote() {
    const candidateId = document.getElementById('candidate-select').value;
    if (!candidateId) {
        showToast('请选择候选人', 'error');
        return;
    }
    
    if (!votingContract || !currentAccount) {
        showToast('请先加载投票合约', 'error');
        return;
    }
    
    showLoading(true);
    try {
        // 检查是否已投票
        const hasVoted = await votingContract.methods.hasVoted(currentAccount).call();
        if (hasVoted) {
            showToast('You have already voted with this account!', 'error');
            showLoading(false);
            return;
        }
        
        await votingContract.methods.vote(candidateId).send({
            from: currentAccount,
            gas: 200000
        });
        
        showToast('Vote cast successfully!');
        await loadCandidates();
        document.getElementById('candidate-select').value = '';
    } catch (error) {
        console.error('Voting failed:', error);
        if (error.message.includes('revert')) {
            if (error.message.includes('already voted')) {
                showToast('Voting failed: You have already voted with this account', 'error');
            } else {
                showToast('Voting failed: ' + error.message, 'error');
            }
        } else {
            showToast('Voting failed: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

// 刷新投票结果
async function refreshVotingResults() {
    if (!votingContract) return;
    
    try {
        const candidatesCount = await votingContract.methods.candidatesCount().call();
        const resultsDiv = document.getElementById('voting-results');
        
        if (candidatesCount == 0) {
            resultsDiv.innerHTML = '<p class="text-gray-500">暂无投票结果</p>';
            return;
        }
        
        let totalVotes = 0;
        const candidates = [];
        
        for (let i = 0; i < candidatesCount; i++) {
            const candidate = await votingContract.methods.getCandidate(i).call();
            const votes = parseInt(candidate[1]);
            totalVotes += votes;
            candidates.push({ name: candidate[0], votes });
        }
        
        resultsDiv.innerHTML = '';
        candidates.forEach(candidate => {
            const percentage = totalVotes > 0 ? (candidate.votes / totalVotes * 100).toFixed(1) : 0;
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'mb-3';
            resultDiv.innerHTML = `
                <div class="flex justify-between text-sm mb-1">
                    <span>${candidate.name}</span>
                    <span>${candidate.votes} 票 (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            `;
            resultsDiv.appendChild(resultDiv);
        });
        
    } catch (error) {
        console.error('刷新投票结果失败:', error);
    }
}

// ============ 银行系统功能 ============

// 部署银行合约
async function deployBankContract(advanced = false) {
    if (!web3 || !currentAccount) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const response = await fetch('/api/deploy/bank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                account: currentAccount,
                advanced: advanced,
                withExtensions: advanced
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (advanced && result.contractType === 'factory') {
                // 工厂模式：需要创建一个银行实例
                const factoryABI = [
                    {
                        "inputs": [{"internalType": "bool", "name": "_withExtensions", "type": "bool"}],
                        "name": "createBank",
                        "outputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "address", "name": "", "type": "address"}],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [],
                        "name": "bankCount",
                        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [{"internalType": "uint256", "name": "_bankId", "type": "uint256"}],
                        "name": "getBankContract",
                        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                        "stateMutability": "view",
                        "type": "function"
                    }
                ];
                
                const factoryContract = new web3.eth.Contract(factoryABI, result.contractAddress);
                
                // 创建一个带扩展的银行
                const createResult = await factoryContract.methods.createBank(true).send({
                    from: currentAccount,
                    gas: 3000000
                });
                
                // 从事件中获取新创建的银行合约地址
                let bankAddress;
                if (createResult.events && createResult.events.BankCreated) {
                    bankAddress = createResult.events.BankCreated.returnValues.coreContract;
                } else {
                    // 通过工厂合约的方法获取最新创建的合约地址
                    const newCount = await factoryContract.methods.bankCount().call();
                    bankAddress = await factoryContract.methods.getBankContract(newCount - 1).call();
                }
                currentBankABI = BASIC_BANK_ABI; // 使用基础ABI，因为核心合约是简化的
                bankContract = new web3.eth.Contract(currentBankABI, bankAddress);
                isAdvancedBank = true;
                
                showToast(`Advanced bank contract created successfully! Address: ` + bankAddress.slice(0, 10) + '...');
                document.getElementById('bank-address').textContent = 
                    bankAddress.slice(0, 10) + '...' + bankAddress.slice(-6);
                
                // 显示高级功能
                document.getElementById('bank-extensions-section').classList.remove('hidden');
            } else {
                // 基础模式：直接使用返回的地址
                currentBankABI = advanced ? ADVANCED_BANK_ABI : BASIC_BANK_ABI;
                bankContract = new web3.eth.Contract(currentBankABI, result.contractAddress);
                const contractType = advanced ? 'Advanced' : 'Basic';
                showToast(`${contractType} bank contract deployed successfully! Address: ` + result.contractAddress.slice(0, 10) + '...');
                document.getElementById('bank-address').textContent = 
                    result.contractAddress.slice(0, 10) + '...' + result.contractAddress.slice(-6);
            }
            
            document.getElementById('banking-interface').classList.remove('hidden');
            await refreshBankInfo();
        } else {
            showToast('Deployment failed: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Failed to deploy bank contract:', error);
        showToast('Deployment failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 加载现有银行合约
async function loadBankContract() {
    const contractAddress = prompt('请输入银行合约地址:');
    if (!contractAddress) return;
    
    try {
        bankContract = new web3.eth.Contract(BANK_ABI, contractAddress);
        
        // 测试合约是否有效
        await bankContract.methods.getBankBalance().call();
        
        document.getElementById('banking-interface').classList.remove('hidden');
        document.getElementById('bank-address').textContent = 
            contractAddress.slice(0, 10) + '...' + contractAddress.slice(-6);
        await refreshBankInfo();
        showToast('银行合约加载成功');
    } catch (error) {
        console.error('加载银行合约失败:', error);
        showToast('加载失败，请检查合约地址', 'error');
    }
}

// 存款功能
async function deposit() {
    const amount = document.getElementById('deposit-amount').value;
    if (!amount || amount <= 0) {
        showToast('请输入有效的存款金额', 'error');
        return;
    }
    
    if (!bankContract || !currentAccount) {
        showToast('请先加载银行合约', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const amountWei = web3.utils.toWei(amount, 'ether');
        
        await bankContract.methods.deposit().send({
            from: currentAccount,
            value: amountWei,
            gas: 200000
        });
        
        showToast(`成功存入 ${amount} ETH`);
        document.getElementById('deposit-amount').value = '';
        await refreshBankInfo();
        await updateAccountInfo();
    } catch (error) {
        console.error('存款失败:', error);
        showToast('存款失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 取款功能
async function withdraw() {
    const amount = document.getElementById('withdraw-amount').value;
    if (!amount || amount <= 0) {
        showToast('请输入有效的取款金额', 'error');
        return;
    }
    
    if (!bankContract || !currentAccount) {
        showToast('请先加载银行合约', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const amountWei = web3.utils.toWei(amount, 'ether');
        
        await bankContract.methods.withdraw(amountWei).send({
            from: currentAccount,
            gas: 200000
        });
        
        showToast(`成功取出 ${amount} ETH`);
        document.getElementById('withdraw-amount').value = '';
        await refreshBankInfo();
        await updateAccountInfo();
    } catch (error) {
        console.error('取款失败:', error);
        if (error.message.includes('revert')) {
            showToast('取款失败：余额不足或金额无效', 'error');
        } else {
            showToast('取款失败: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

// 刷新银行信息
async function refreshBankInfo() {
    if (!bankContract || !currentAccount) return;
    
    try {
        const userBalance = await bankContract.methods.getBalance().call({ from: currentAccount });
        const totalBalance = await bankContract.methods.getBankBalance().call();
        
        document.getElementById('bank-balance').textContent = 
            parseFloat(web3.utils.fromWei(userBalance, 'ether')).toFixed(4) + ' ETH';
        document.getElementById('total-bank-balance').textContent = 
            parseFloat(web3.utils.fromWei(totalBalance, 'ether')).toFixed(4) + ' ETH';
            
    } catch (error) {
        console.error('刷新银行信息失败:', error);
        showToast('刷新银行信息失败', 'error');
    }
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    // 设置颜色
    let bgColor = 'bg-green-600';
    if (type === 'error') bgColor = 'bg-red-600';
    if (type === 'info') bgColor = 'bg-blue-600';
    
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded shadow-lg ${bgColor} text-white`;
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// 显示/隐藏加载指示器
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (!loading) return;
    
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// ============ 高级功能：提案系统 ============

async function createProposal() {
    const description = document.getElementById('proposal-description').value;
    const duration = document.getElementById('proposal-duration').value;
    
    if (!description || !duration) {
        showToast('请填写提案描述和持续时间', 'error');
        return;
    }
    
    if (!votingContract || !currentAccount || !isAdvancedVoting) {
        showToast('请先部署高级投票合约', 'error');
        return;
    }
    
    showLoading(true);
    try {
        const durationSeconds = parseInt(duration) * 3600; // 转换为秒
        
        await votingContract.methods.createProposal(description, durationSeconds).send({
            from: currentAccount,
            gas: 300000
        });
        
        showToast('提案创建成功！');
        document.getElementById('proposal-description').value = '';
        await refreshProposals();
    } catch (error) {
        console.error('创建提案失败:', error);
        showToast('创建提案失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function refreshProposals() {
    if (!votingContract || !isAdvancedVoting) return;
    
    try {
        const proposalCount = await votingContract.methods.proposalCount().call();
        const proposalsList = document.getElementById('proposals-list');
        
        proposalsList.innerHTML = '';
        
        if (proposalCount == 0) {
            proposalsList.innerHTML = '<p class="text-gray-500">暂无提案</p>';
            return;
        }
        
        for (let i = 0; i < proposalCount; i++) {
            const proposal = await votingContract.methods.getProposal(i).call();
            const description = proposal[0];
            const forVotes = proposal[1];
            const againstVotes = proposal[2];
            const isActive = proposal[3];
            const deadline = proposal[4];
            
            const proposalDiv = document.createElement('div');
            proposalDiv.className = 'proposal-card bg-white p-3 rounded border mb-2';
            proposalDiv.innerHTML = `
                <div class="mb-2">
                    <strong>${description}</strong>
                    <span class="text-xs ${isActive ? 'text-green-600' : 'text-red-600'} ml-2">
                        ${isActive ? '活跃' : '已结束'}
                    </span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-green-600">支持: ${forVotes}</span>
                    <span class="text-red-600">反对: ${againstVotes}</span>
                </div>
                ${isActive ? `
                    <div class="mt-2 flex gap-2">
                        <button onclick="voteOnProposal(${i}, true)" class="flex-1 bg-green-500 text-white py-1 px-2 rounded text-xs">
                            支持
                        </button>
                        <button onclick="voteOnProposal(${i}, false)" class="flex-1 bg-red-500 text-white py-1 px-2 rounded text-xs">
                            反对
                        </button>
                    </div>
                ` : ''}
            `;
            proposalsList.appendChild(proposalDiv);
        }
    } catch (error) {
        console.error('刷新提案失败:', error);
        showToast('刷新提案失败', 'error');
    }
}

async function voteOnProposal(proposalId, support) {
    if (!votingContract || !currentAccount) {
        showToast('请先连接钱包', 'error');
        return;
    }
    
    showLoading(true);
    try {
        await votingContract.methods.voteOnProposal(proposalId, support).send({
            from: currentAccount,
            gas: 200000
        });
        
        showToast(`提案投票成功！您${support ? '支持' : '反对'}该提案`);
        await refreshProposals();
    } catch (error) {
        console.error('提案投票失败:', error);
        if (error.message.includes('Already voted')) {
            showToast('您已经对该提案投过票了', 'error');
        } else {
            showToast('提案投票失败: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

// ============ 高级功能：银行扩展 ============

async function calculateInterest() {
    if (!bankContract || !currentAccount || !isAdvancedBank) {
        showToast('请先部署高级银行合约', 'error');
        return;
    }
    
    try {
        // 这里应该调用扩展合约的利息计算功能
        // 由于我们使用的是简化的核心合约，这里只是演示
        const balance = await bankContract.methods.getBalance().call({ from: currentAccount });
        const balanceEth = parseFloat(web3.utils.fromWei(balance, 'ether'));
        
        // 模拟5%年利率计算
        const simulatedInterest = balanceEth * 0.05 / 365; // 日利息
        
        document.getElementById('accrued-interest').textContent = simulatedInterest.toFixed(6) + ' ETH';
        showToast('利息计算完成');
    } catch (error) {
        console.error('计算利息失败:', error);
        showToast('计算利息失败: ' + error.message, 'error');
    }
}

async function refreshExtensions() {
    if (!isAdvancedBank) {
        document.getElementById('extension-info').innerHTML = 
            '<p class="text-sm text-gray-600">当前使用基础银行合约，无扩展功能。</p>';
        return;
    }
    
    document.getElementById('extension-info').innerHTML = `
        <div class="text-sm">
            <p class="text-green-600 mb-1">✅ 高级银行功能已启用</p>
            <p class="text-gray-600">• 5% 年利率</p>
            <p class="text-gray-600">• 利息自动计算</p>
            <p class="text-gray-600">• 扩展合约支持</p>
        </div>
    `;
}

// 页面加载完成后的检查
window.addEventListener('load', function() {
    console.log('页面加载完成');
    if (typeof Web3 !== 'undefined') {
        console.log('Web3 库加载成功，版本:', Web3.version);
    } else {
        console.error('Web3 库未加载');
        showToast('Web3 库未加载，请检查网络连接', 'error');
    }
}); 