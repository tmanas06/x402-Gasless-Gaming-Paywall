// Simple script to generate a random private key for the agent
const crypto = require('crypto');

const privateKey = '0x' + crypto.randomBytes(32).toString('hex');

console.log('\n🔑 Generated Private Key for Agent:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(privateKey);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n⚠️  IMPORTANT: Keep this private key secure!');
console.log('   Add it to your agent/.env file as:');
console.log(`   AGENT_PRIVATE_KEY=${privateKey}\n`);
