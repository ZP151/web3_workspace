const fs = require("fs");
const path = require("path");

/**
 * Clean Deployment Data
 * Removes deployment artifacts and address files for fresh deployment
 */
async function cleanDeployment(options = {}) {
  console.log("🧹 Cleaning Deployment Data");
  console.log("=".repeat(40));

  const {
    cleanAddresses = true,
    cleanArtifacts = true,
    cleanCache = true,
    targetNetwork = null // null means all networks
  } = options;

  try {
    // 1. Clean address file
    if (cleanAddresses) {
      const addressFilePath = path.join(__dirname, "../../src/contracts/addresses.json");
      
      if (fs.existsSync(addressFilePath)) {
        if (targetNetwork) {
          // Clean specific network
          try {
            const addressData = fs.readFileSync(addressFilePath, "utf8");
            const addresses = JSON.parse(addressData);
            
            if (addresses[targetNetwork]) {
              delete addresses[targetNetwork];
              fs.writeFileSync(addressFilePath, JSON.stringify(addresses, null, 2));
              console.log(`✅ Cleaned addresses for network: ${targetNetwork}`);
            } else {
              console.log(`⚠️ No addresses found for network: ${targetNetwork}`);
            }
          } catch (error) {
            console.log("❌ Failed to clean specific network addresses:", error.message);
          }
        } else {
          // Clean all addresses
          fs.unlinkSync(addressFilePath);
          console.log("✅ Removed addresses.json file");
        }
      } else {
        console.log("⚠️ No addresses.json file found");
      }
    }

    // 2. Clean artifacts
    if (cleanArtifacts) {
      const artifactsPath = path.join(__dirname, "../../artifacts");
      
      if (fs.existsSync(artifactsPath)) {
        try {
          fs.rmSync(artifactsPath, { recursive: true, force: true });
          console.log("✅ Removed artifacts directory");
        } catch (error) {
          console.log("❌ Failed to remove artifacts:", error.message);
        }
      } else {
        console.log("⚠️ No artifacts directory found");
      }
    }

    // 3. Clean cache
    if (cleanCache) {
      const cachePath = path.join(__dirname, "../../cache");
      
      if (fs.existsSync(cachePath)) {
        try {
          fs.rmSync(cachePath, { recursive: true, force: true });
          console.log("✅ Removed cache directory");
        } catch (error) {
          console.log("❌ Failed to remove cache:", error.message);
        }
      } else {
        console.log("⚠️ No cache directory found");
      }
    }

    // 4. Clean typechain files (if exists)
    const typechainPath = path.join(__dirname, "../../typechain-types");
    if (fs.existsSync(typechainPath)) {
      try {
        fs.rmSync(typechainPath, { recursive: true, force: true });
        console.log("✅ Removed typechain-types directory");
      } catch (error) {
        console.log("❌ Failed to remove typechain-types:", error.message);
      }
    }

    console.log("\n🎉 Cleanup completed successfully!");
    console.log("💡 You can now run a fresh deployment");

  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    cleanAddresses: true,
    cleanArtifacts: true,
    cleanCache: true,
    targetNetwork: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case "--network":
        options.targetNetwork = args[i + 1];
        i++; // Skip next argument
        break;
      case "--no-addresses":
        options.cleanAddresses = false;
        break;
      case "--no-artifacts":
        options.cleanArtifacts = false;
        break;
      case "--no-cache":
        options.cleanCache = false;
        break;
      case "--help":
        console.log(`
Usage: node clean-deployment.js [options]

Options:
  --network <chainId>   Clean only specific network (e.g., --network 31337)
  --no-addresses       Skip cleaning address file
  --no-artifacts       Skip cleaning artifacts directory
  --no-cache          Skip cleaning cache directory
  --help              Show this help message

Examples:
  node clean-deployment.js                    # Clean everything
  node clean-deployment.js --network 31337    # Clean only Hardhat network
  node clean-deployment.js --no-artifacts     # Clean all except artifacts
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Run directly if this script is executed
if (require.main === module) {
  const options = parseArgs();
  
  cleanDeployment(options)
    .then(() => {
      console.log("\n✅ Cleanup script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Cleanup script failed:", error);
      process.exit(1);
    });
}

module.exports = { cleanDeployment }; 