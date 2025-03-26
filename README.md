# Vendetta Auto Bot

Automation bot for completing quests in the Vendetta game to earn points and improve your rank on the leaderboard. Supports HTTP, HTTPS, SOCKS4, and SOCKS5 proxies.

## Description

This bot automatically completes all available quests for your wallet(s) in the Vendetta game, including:
- Regular quests
- Riddle quests with pre-filled answers
- Series quests with pre-filled answers

The bot processes multiple wallets sequentially and provides detailed logs of the operations performed.

## Features

- Complete all available quests automatically
- Support for multiple wallets
- Proxy support (HTTP, HTTPS, SOCKS4, SOCKS5)
- Detailed logging of quest completion status
- Tracking of wallet profile information before and after quest completion
- Display of updated total points and rank

## Prerequisites

- Node.js (v16 or higher recommended)
- NPM or Yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sadi200/PARASAIL.git
```

2. Navigate to the project directory:
```bash
cd PARASAIL
```

3. Install dependencies:
```bash
npm install
```

4. Create a `.env` file in the root directory with your wallet addresses:
```
WALLETS=["0xWALLETADDRESS1","0xWALLETADDRESS2"]
```

5. (Optional) Create a `proxies.txt` file with your proxies (one per line):
```
http://username:password@host:port
socks5://username:password@host:port
host:port
host:port:username:password
```

## Proxy Support

The bot supports various proxy formats:

- Standard URL format: `protocol://username:password@host:port`
- Host:port format: `host:port`
- Host:port:username:password format: `host:port:username:password`

Supported protocols:
- HTTP
- HTTPS
- SOCKS4
- SOCKS5

If no protocol is specified, HTTP is used by default.

## Usage

Run the bot:

```bash
npm start
```

The bot will:
1. Load proxies from proxies.txt (if available)
2. Rotate through proxies for each wallet (round-robin)
3. Fetch initial profile information for each wallet
4. Complete all available quests
5. Fetch updated profile information
6. Display a summary of completed quests and points earned

## Configuration

You can modify the `QUESTS` array in `index.js` to add or remove quests, or update the riddle/series answers if needed.

## Example Output

```
Vendetta Auto Task - Airdrop Insiders
----------------------------
Found 2 wallets in .env
Loaded 5 proxies from proxies.txt

[1/2] Processing wallet...

🔹 Processing wallet: BwXKxH5n8Rx6B...
Using proxy: http://123.45.67.89:8080

Getting initial profile information...
✅ Profile found!
Total Points: 0
Rank: 10245

Completing quests...
Processing quest 67a0d816790b534bfa5e9c75...
✅ Completed quest 67a0d816790b534bfa5e9c75
...

Getting updated profile information...
✅ Updated profile found!
Updated Total Points: 675
Updated Rank: 3211

Getting completed quests...
✅ Found 21 completed quests:
  1. First Contact (50 points)
     Completed at: 3/23/2025, 4:15:30 PM

Waiting 2 seconds before processing next wallet...
...
```
