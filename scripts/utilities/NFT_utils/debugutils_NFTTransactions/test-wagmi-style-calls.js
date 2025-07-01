const { createPublicClient, http } = require('viem');
const fs = require('fs');

// Load contract addresses
const addresses = JSON.parse(fs.readFileSync('./src/contracts/addresses.json', 'utf8'));

// Load contract ABIs
const nftABI = JSON.parse(fs.readFileSync('./artifacts/contracts/PlatformNFT.sol/PlatformNFT.json', 'utf8'));
const marketplaceABI = JSON.parse(fs.readFileSync('./artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json', 'utf8'));

async function testWagmiStyleCalls() {
    console.log('🧪 Testing Wagmi/Viem-style Contract Calls');
    console.log('==========================================');

    // Setup public client (same as Wagmi frontend)
    const publicClient = createPublicClient({
        transport: http('http://localhost:8546'),
        chain: {
            id: 31338,
            name: 'Anvil Local',
            network: 'anvil',
            nativeCurrency: {
                decimals: 18,
                name: 'Ether',
                symbol: 'ETH',
            },
            rpcUrls: {
                public: { http: ['http://127.0.0.1:8546'] },
                default: { http: ['http://127.0.0.1:8546'] },
            },
        }
    });

    const chainId = 31338;
    const contractAddress = addresses[chainId]?.PlatformNFT;
    const marketplaceAddress = addresses[chainId]?.NFTMarketplace;

    console.log(`📋 Using contracts:`);
    console.log(`   NFT: ${contractAddress}`);
    console.log(`   Marketplace: ${marketplaceAddress}`);

    if (!contractAddress || !marketplaceAddress) {
        console.error('❌ Contract addresses not found for chain', chainId);
        return;
    }

    try {
        // Test connection first
        const chainIdResult = await publicClient.getChainId();
        console.log(`🔗 Connected to chain ID: ${chainIdResult}`);

        // Test marketplace calls exactly like frontend
        console.log('\n🏪 Testing Marketplace Calls (Wagmi/Viem Style)');
        
        console.log('📊 Getting listing count...');
        const listingCount = await publicClient.readContract({
            address: marketplaceAddress,
            abi: marketplaceABI.abi,
            functionName: 'getListingCount',
        });
        console.log(`📊 Listing Count: ${listingCount}`);

        console.log('\n📋 Fetching individual listings...');
        const listingPromises = [];
        for (let i = 0; i < Number(listingCount); i++) {
            console.log(`🔍 Fetching listing ${i}...`);
            listingPromises.push(
                publicClient.readContract({
                    address: marketplaceAddress,
                    abi: marketplaceABI.abi,
                    functionName: 'getListing',
                    args: [BigInt(i)]
                }).then(listingResult => {
                    console.log(`✅ Listing ${i} fetched successfully:`, listingResult);
                    const [tokenId, seller, price, listingType, status] = listingResult;
                    return { tokenId, seller, price, listingType, status, listingId: i };
                })
                .catch(err => {
                    console.warn(`❌ Could not fetch listing #${i}:`, err.message);
                    console.warn(`   Full error:`, err);
                    return null;
                })
            );
        }

        const settledListings = await Promise.all(listingPromises);
        const validListings = settledListings.filter(l => l !== null);

        console.log(`\n📋 Valid Listings Found: ${validListings.length}`);

        const listingsMap = new Map();
        validListings.forEach((listing, index) => {
            console.log(`\n✅ Processing Listing ${index}:`);
            console.log(`   Token ID: ${listing.tokenId}`);
            console.log(`   Seller: ${listing.seller}`);
            console.log(`   Price: ${listing.price} wei`);
            console.log(`   Listing Type: ${Number(listing.listingType) === 0 ? 'FIXED_PRICE' : 'AUCTION'}`);
            console.log(`   Status: ${listing.status} (type: ${typeof listing.status})`);
            console.log(`   Status === 0: ${listing.status === 0}`);
            console.log(`   Status === 0n: ${listing.status === 0n}`);
            console.log(`   Number(status): ${Number(listing.status)}`);
            console.log(`   Number(status) === 0: ${Number(listing.status) === 0}`);

            // Frontend logic
            if (listing && Number(listing.status) === 0) {
                listingsMap.set(Number(listing.tokenId), {
                    listingId: listing.listingId,
                    tokenId: Number(listing.tokenId),
                    price: (Number(listing.price) / 10**18).toString(), // Convert wei to ETH
                    isListed: true,
                    listingType: Number(listing.listingType) === 0 ? 'FIXED_PRICE' : 'AUCTION',
                    seller: listing.seller,
                });
                console.log(`   ✅ Added to listings map!`);
            } else {
                console.log(`   ❌ Not added (status check failed)`);
            }
        });

        console.log(`\n📊 Final Results:`);
        console.log(`   Active listings in map: ${listingsMap.size}`);
        
        for (const [tokenId, listing] of listingsMap) {
            console.log(`   Token ${tokenId}: ${listing.price} ETH (${listing.listingType})`);
        }

        // Test NFT calls
        console.log('\n🎨 Testing NFT Calls');
        const totalSupply = await publicClient.readContract({
            address: contractAddress,
            abi: nftABI.abi,
            functionName: 'totalSupply',
        });
        console.log(`Total Supply: ${totalSupply}`);

        console.log('\n🔍 Testing individual NFT data...');
        for (let i = 1; i <= Math.min(Number(totalSupply), 5); i++) {
            try {
                const owner = await publicClient.readContract({
                    address: contractAddress,
                    abi: nftABI.abi,
                    functionName: 'ownerOf',
                    args: [BigInt(i)],
                });
                
                const tokenURI = await publicClient.readContract({
                    address: contractAddress,
                    abi: nftABI.abi,
                    functionName: 'tokenURI',
                    args: [BigInt(i)],
                });
                
                const listingInfo = listingsMap.get(i);
                
                console.log(`\nToken ${i}:`);
                console.log(`   Owner: ${owner}`);
                console.log(`   Listed: ${listingInfo ? 'YES' : 'NO'}`);
                if (listingInfo) {
                    console.log(`   Price: ${listingInfo.price} ETH`);
                    console.log(`   Type: ${listingInfo.listingType}`);
                }
            } catch (e) {
                console.log(`❌ Token ${i}: ${e.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error during testing:', error);
        console.error('Full error details:', error.stack);
    }
}

testWagmiStyleCalls().catch(console.error); 