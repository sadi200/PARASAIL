require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

const API_BASE_URL = 'https://vendetta-prelaunch-server-dev.jb2iuui22qg9g.ap-south-1.cs.amazonlightsail.com';

const QUESTS = [
  ...[
    '67a0d816790b534bfa5e9c75',
    '67a0d7a0790b534bfa5e9c73',
    '67a0d89e790b534bfa5e9c77',
    '67a0d867790b534bfa5e9c76',
    '67c746d87283886a1dca77c8',
    '67a238c749e9fcab57f1b7f1',
    '67a238ce49e9fcab57f1b7f2',
    '67a0d7f8790b534bfa5e9c74'
  ].map(id => ({ questId: id, additionalData: {} })),
  {
    questId: '67c71c94df489cc09e14b0b9',
    additionalData: { riddle_answer: 'AVATAR' }
  },
  {
    questId: '67c71cd5df489cc09e14b0ba',
    additionalData: { riddle_answer: 'UTOPIA' }
  },
  {
    questId: '67ae1d4b332fe3a3502f5071',
    additionalData: { riddle_answer: 'Leonardo da Vinci' }
  },
  {
    questId: '67acddf212eccb9a01c7a9a4',
    additionalData: { riddle_answer: 'Friedrich Nietzsche' }
  },
  {
    questId: '67a388d088098a8ed02c1b8f',
    additionalData: { series_answer: 'Shadow' }
  },
  {
    questId: '67a498465ba6f56a0a5e586a',
    additionalData: { series_answer: 'storage' }
  },
  {
    questId: '67a600be31f93aadf993839d',
    additionalData: { series_answer: 'card' }
  },
  {
    questId: '67a758e9d5f36034398d99b5',
    additionalData: { series_answer: 'HIDDEN POCKET' }
  },
  {
    questId: '67a8b9151268f7272a1f6182',
    additionalData: { series_answer: 'SPILL' }
  },
  {
    questId: '67a9f24bef4dfa4f13e1aef4',
    additionalData: { series_answer: 'under the files' }
  },
  {
    questId: '67ab6659efc651c73a2ec8b4',
    additionalData: { series_answer: 'LOCKER ROOM' }
  },
  {
    questId: '67bdb81452e88bd3b3e2b983',
    additionalData: { series_answer: 'Welcome to the family' }
  }
];

const headers = {
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.7',
  'content-type': 'application/json',
  'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'cross-site',
  'Referer': 'https://vendettagame.xyz/',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

function loadProxies() {
  try {
    const proxyData = fs.readFileSync('proxies.txt', 'utf8');
    const proxyList = proxyData.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    console.log(`Loaded ${proxyList.length} proxies from proxies.txt`);
    return proxyList;
  } catch (error) {
    console.error('Error loading proxies:', error.message);
    return [];
  }
}

function createProxyAgent(proxyString) {
  if (!proxyString || proxyString.trim() === '') {
    return null;
  }
  
  proxyString = proxyString.trim();
  
  try {
    let protocol, host, port, username, password;

    if (proxyString.includes('://')) {
      const protocolParts = proxyString.split('://');
      protocol = protocolParts[0].toLowerCase();
      const rest = protocolParts[1];

      if (rest.includes('@')) {
        const authParts = rest.split('@');
        const auth = authParts[0];
        const hostPort = authParts[1];
        
        if (auth.includes(':')) {
          const authSplit = auth.split(':');
          username = authSplit[0];
          password = authSplit[1];
        }
        
        const hostPortSplit = hostPort.split(':');
        host = hostPortSplit[0];
        port = parseInt(hostPortSplit[1], 10);
      } else {
        const hostPortSplit = rest.split(':');
        host = hostPortSplit[0];
        port = parseInt(hostPortSplit[1], 10);
      }
    } 
    else if (proxyString.split(':').length === 4) {
      const parts = proxyString.split(':');
      host = parts[0];
      port = parseInt(parts[1], 10);
      username = parts[2];
      password = parts[3];
      protocol = 'http';
    } 
    else if (proxyString.split(':').length === 2) {
      const parts = proxyString.split(':');
      host = parts[0];
      port = parseInt(parts[1], 10);
      protocol = 'http';
    } else {
      throw new Error(`Unsupported proxy format: ${proxyString}`);
    }

    let proxyAgent;
    if (protocol === 'socks4' || protocol === 'socks5') {
      const proxyOptions = {
        hostname: host,
        port: port,
        protocol: protocol
      };

      if (username && password) {
        proxyOptions.username = username;
        proxyOptions.password = password;
      }

      proxyAgent = new SocksProxyAgent(`${protocol}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`);
    } else if (protocol === 'http' || protocol === 'https') {
      const proxyOptions = `${protocol}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
      proxyAgent = new HttpsProxyAgent(proxyOptions);
    } else {
      throw new Error(`Unsupported proxy protocol: ${protocol}`);
    }

    return proxyAgent;
  } catch (error) {
    console.error(`Error creating proxy agent for ${proxyString}:`, error.message);
    return null;
  }
}

function loadWallets() {
  try {
    const walletsString = process.env.WALLETS || '[]';
    const wallets = JSON.parse(walletsString);
    return wallets.map(pubKey => ({
      publicKey: pubKey,
      profile: null,
      questResults: [],
      lastUpdated: null,
      updatedProfile: null,
      completedQuests: []
    }));
  } catch (error) {
    console.error('Error loading wallets from .env:', error);
    return [];
  }
}

async function getUserProfile(userId, proxyAgent) {
  try {
    const axiosConfig = {
      headers,
      ...(proxyAgent ? { httpsAgent: proxyAgent } : {})
    };
    
    const response = await axios.get(`${API_BASE_URL}/user/leaderboard?user_id=${userId}`, axiosConfig);
    return response.data;
  } catch (error) {
    console.error(`❌ Error getting profile for ${userId.substring(0, 10)}...`, error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

async function getCompletedQuests(userId, proxyAgent) {
  try {
    const axiosConfig = {
      headers,
      ...(proxyAgent ? { httpsAgent: proxyAgent } : {})
    };
    
    const response = await axios.get(`${API_BASE_URL}/quest/completed/all?user_id=${userId}`, axiosConfig);
    return response.data.data.map(quest => ({
      id: quest._id,
      title: quest.title,
      points: quest.point,
      completedAt: quest.completion.completed_at
    }));
  } catch (error) {
    console.error(`❌ Error getting completed quests for ${userId.substring(0, 10)}...`, error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return [];
  }
}

async function completeQuest(userId, quest, proxyAgent) {
  try {
    const axiosConfig = {
      headers,
      ...(proxyAgent ? { httpsAgent: proxyAgent } : {})
    };
    
    const response = await axios.post(`${API_BASE_URL}/quest/redeem`, {
      user_id: userId,
      quest_id: quest.questId,
      additional_data: quest.additionalData
    }, axiosConfig);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`❌ Error completing quest ${quest.questId} for ${userId.substring(0, 10)}...`);
    if (error.response) {
      if (error.response.data && error.response.data.message === "Quest already redeemed") {
        return {
          success: true,
          data: error.response.data,
          alreadyCompleted: true
        };
      }
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

async function processWallet(wallet, proxyAgent) {
  console.log(`\n🔹 Processing wallet: ${wallet.publicKey.substring(0, 15)}...`);
  
  if (proxyAgent) {
    console.log(`Using proxy for this wallet`);
  } else {
    console.log(`No proxy being used for this wallet`);
  }
  
  console.log(`\nGetting initial profile information...`);
  const profile = await getUserProfile(wallet.publicKey, proxyAgent);
  
  if (profile) {
    console.log(`✅ Profile found!`);
    if (profile.user_leaderboard) {
      console.log(`Total Points: ${profile.user_leaderboard.totalPoints || 0}`);
      console.log(`Rank: ${profile.user_leaderboard.rank || 'N/A'}`);
    }
    wallet.profile = profile;
  } else {
    console.log(`❌ Could not retrieve profile`);
  }
  
  console.log(`\nCompleting quests...`);
  const questResults = [];
  
  for (const quest of QUESTS) {
    console.log(`Processing quest ${quest.questId}...`);
    const result = await completeQuest(wallet.publicKey, quest, proxyAgent);
    
    if (result.success) {
      if (result.alreadyCompleted) {
        console.log(`✅ Quest ${quest.questId} was already completed`);
      } else {
        console.log(`✅ Completed quest ${quest.questId}`);
      }
    } else {
      console.log(`❌ Failed to complete quest ${quest.questId}`);
    }
    
    questResults.push({
      questId: quest.questId,
      ...result
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  wallet.questResults = questResults;
  wallet.lastUpdated = new Date().toISOString();
  
  console.log(`\nGetting updated profile information...`);
  const updatedProfile = await getUserProfile(wallet.publicKey, proxyAgent);
  
  if (updatedProfile) {
    console.log(`✅ Updated profile found!`);
    if (updatedProfile.user_leaderboard) {
      console.log(`Updated Total Points: ${updatedProfile.user_leaderboard.totalPoints || 0}`);
      console.log(`Updated Rank: ${updatedProfile.user_leaderboard.rank || 'N/A'}`);
    }
    wallet.updatedProfile = updatedProfile;
  }
  
  console.log(`\nGetting completed quests...`);
  const completedQuests = await getCompletedQuests(wallet.publicKey, proxyAgent);
  if (completedQuests.length > 0) {
    console.log(`✅ Found ${completedQuests.length} completed quests:`);
    completedQuests.forEach((quest, index) => {
      console.log(`  ${index + 1}. ${quest.title} (${quest.points} points)`);
      console.log(`     Completed at: ${new Date(quest.completedAt).toLocaleString()}`);
    });
    wallet.completedQuests = completedQuests;
  }
  
  return wallet;
}

async function main() {
  console.log('Vendetta Auto Task - Airdrop Insiders');
  console.log('----------------------------');
  
  const wallets = loadWallets();
  
  if (wallets.length === 0) {
    console.error('❌ No wallets found in .env. Please add WALLETS variable in .env file!');
    return;
  }
  
  console.log(`Found ${wallets.length} wallets in .env`);
  
  const proxies = loadProxies();
  let currentProxyIndex = 0;
  
  for (let i = 0; i < wallets.length; i++) {
    console.log(`\n[${i+1}/${wallets.length}] Processing wallet...`);
    const wallet = wallets[i];
    
    let proxyAgent = null;
    if (proxies.length > 0) {
      const proxyString = proxies[currentProxyIndex];
      console.log(`Using proxy: ${proxyString}`);
      proxyAgent = createProxyAgent(proxyString);
      
      currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
    } else {
      console.log(`No proxies available, using direct connection`);
    }
    
    await processWallet(wallet, proxyAgent);
    
    if (i < wallets.length - 1) {
      console.log('Waiting 2 seconds before processing next wallet...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n✅ All wallets processed successfully!');
}

main().catch(error => {
  console.error('❌ An error occurred:', error);
});