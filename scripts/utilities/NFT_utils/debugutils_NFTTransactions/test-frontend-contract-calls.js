const { ethers } = require('ethers');
const fs = require('fs');

// Load contract addresses
const addresses = JSON.parse(fs.readFileSync('./src/contracts/addresses.json', 'utf8'));

// Load contract ABIs
const nftABI = JSON.parse(fs.readFileSync('./artifacts/contracts/PlatformNFT.sol/PlatformNFT.json', 'utf8'));
const marketplaceABI = JSON.parse(fs.readFileSync('./artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json', 'utf8'));

async function testFrontendCalls() {
    console.log('🧪 Testing Frontend-style Contract Calls');
    console.log('==========================================');

    // Setup provider (same as frontend)
    const provider = new ethers.JsonRpcProvider('http://localhost:8546');
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

    const nftContract = new ethers.Contract(contractAddress, nftABI.abi, provider);
    const marketplaceContract = new ethers.Contract(marketplaceAddress, marketplaceABI.abi, provider);

    try {
        // Test marketplace calls exactly like frontend
        console.log('\n🏪 Testing Marketplace Calls (Frontend Style)');
        
        const listingCount = await marketplaceContract.getListingCount();
        console.log(`📊 Listing Count: ${listingCount}`);

        const listingPromises = [];
        for (let i = 0; i < Number(listingCount); i++) {
            listingPromises.push(
                marketplaceContract.getListing(BigInt(i))
                    .then(listingResult => {
                        const [tokenId, seller, price, listingType, status] = listingResult;
                        return { tokenId, seller, price, listingType, status, listingId: i };
                    })
                    .catch(err => {
                        console.warn(`Could not fetch listing #${i}, it might be invalid.`, err.shortMessage || err.message);
                        return null;
                    })
            );
        }

        const settledListings = await Promise.all(listingPromises);
        const validListings = settledListings.filter(l => l !== null);

        console.log(`\n📋 Valid Listings Found: ${validListings.length}`);

        const listingsMap = new Map();
        validListings.forEach((listing, index) => {
            console.log(`\n✅ Listing ${index}:`);
            console.log(`   Token ID: ${listing.tokenId}`);
            console.log(`   Seller: ${listing.seller}`);
            console.log(`   Price: ${ethers.formatEther(listing.price)} ETH`);
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
                    price: ethers.formatEther(listing.price),
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
        const totalSupply = await nftContract.totalSupply();
        console.log(`Total Supply: ${totalSupply}`);

        for (let i = 1; i <= Math.min(Number(totalSupply), 5); i++) {
            try {
                const owner = await nftContract.ownerOf(BigInt(i));
                const tokenURI = await nftContract.tokenURI(BigInt(i));
                const listingInfo = listingsMap.get(i);
                
                console.log(`\nToken ${i}:`);
                console.log(`   Owner: ${owner}`);
                console.log(`   Listed: ${listingInfo ? 'YES' : 'NO'}`);
                if (listingInfo) {
                    console.log(`   Price: ${listingInfo.price} ETH`);
                    console.log(`   Type: ${listingInfo.listingType}`);
                }
            } catch (e) {
                console.log(`❌ Token ${i}: ${e.shortMessage || e.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error during testing:', error);
    }
}

testFrontendCalls().catch(console.error); 