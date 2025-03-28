// script.js

// ----------------------
// Persistent State Helpers
// ----------------------
function loadState() {
  const state = localStorage.getItem("stakesGameState");
  return state ? JSON.parse(state) : null;
}

function saveState(state) {
  localStorage.setItem("stakesGameState", JSON.stringify(state));
}

// ----------------------
// Initialize Game State
// ----------------------
let currentUser = loadState() || {
  username: "",
  balance: 1000,
  bank: 0,
  springTokens: 0,
  luck: 1,
  level: 1,
  title: "",
  pet: "",
  inventory: ["herb", "herb", "herb", "bottle", "iron ore", "iron ore", "iron ore", "iron ore", "iron ore", "leather strap", "wood plank", "wood plank", "wood plank", "wood plank", "wood plank", "wood plank", "wood plank", "wood plank", "wood plank", "wood plank", "iron nail"],
  achievements: [],
  jobs: { active: "", totalWorked: 0 },
  family: { status: "None", proposals: [] },
  gambling: { lastBet: 0, totalBetsWon: 0 },
  progress: { springQuests: 0, dailyChallenges: 0, eggsCollected: 0 },
  betCount: 0,
  location: "Town Square",
  strength: 5,
  defense: 5,
  skills: ["Punch"],
  house: "None",
  party: []
};

if (currentUser.username) saveState(currentUser);

// ----------------------
// DOM Elements
// ----------------------
const messagesDiv = document.getElementById('messages');
const commandInput = document.getElementById('commandInput');
const sendButton = document.getElementById('sendButton');
const container = document.getElementById('container');
const loginModal = document.getElementById("loginModal");
const loginInput = document.getElementById("loginInput");
const loginSubmit = document.getElementById("loginSubmit");
const themeToggle = document.getElementById('themeToggle');
const questList = document.getElementById('quests');

// ----------------------
// Login Modal
// ----------------------
if (!currentUser.username) {
  loginModal.style.display = "flex";
} else {
  container.classList.remove("hidden");
}

loginSubmit.addEventListener("click", () => {
  const username = loginInput.value.trim();
  if (!username) {
    alert("Please enter a username.");
    return;
  }
  currentUser.username = username;
  saveState(currentUser);
  loginModal.style.display = "none";
  container.classList.remove("hidden");
  addMessage(`Welcome, ${currentUser.username}!`, "system");
});

// ----------------------
// Theme Toggle
// ----------------------
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle("light-theme");
});

// ----------------------
// Command Parsing (supports quotes)
// ----------------------
function parseCommand(input) {
  const regex = /[^\s"]+|"([^"]*)"/gi;
  const args = [];
  let match;
  while ((match = regex.exec(input)) !== null) {
    args.push(match[1] ? match[1] : match[0]);
  }
  return args;
}

// ----------------------
// Chat Input Handling
// ----------------------
sendButton.addEventListener('click', sendCommand);
commandInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendCommand();
});

function sendCommand() {
  const input = commandInput.value.trim();
  if (!input) return;
  addMessage(`> ${input}`, 'user');
  processCommand(input);
  commandInput.value = "";
  saveState(currentUser);
}

function addMessage(message, type) {
  const msgElem = document.createElement("div");
  msgElem.className = `message ${type}`;
  msgElem.innerText = message;
  messagesDiv.appendChild(msgElem);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ----------------------
// Command Processing
// ----------------------
function processCommand(input) {
  const args = parseCommand(input);
  const command = args[0].toLowerCase();
  let response = "";

  // Economy Commands
  if (command === '-info') {
    response = formatUserInfo(currentUser);
  } else if (command === '-balance' || command === '-bal') {
    response = `Balance: ${currentUser.balance} Gcoins`;
  } else if (command === '-dep' || command === '-deposit') {
    if (args[1])
      response = handleDeposit(currentUser, args[1]);
    else
      response = "Usage: -dep <amount/all/half>";
  } else if (command === '-with' || command === '-withdraw') {
    if (args[1])
      response = handleWithdraw(currentUser, args[1]);
    else
      response = "Usage: -with <amount/all/half>";
  } else if (command === '-pay') {
    if (args.length >= 3) {
      const targetUser = args[1].replace('@','');
      const amount = parseInt(args[2]);
      response = handlePay(currentUser, targetUser, amount);
    } else {
      response = "Usage: -pay <@user> <amount>";
    }
  } else if (command === '-daily') {
    currentUser.balance += 200;
    response = "You collected your daily bonus of 200 Gcoins!";
  } else if (command === '-beg') {
    let begAmount = Math.floor(Math.random() * 50) + 10;
    currentUser.balance += begAmount;
    response = `You begged and received ${begAmount} Gcoins!`;

  // Jobs Commands
  } else if (command === '-jobs') {
    response = "Available jobs: Farmer, Miner, Fisher. Use -work <job> to work.";
  } else if (command === '-work') {
    if (args[1])
      response = handleWork(currentUser, args[1]);
    else
      response = "Usage: -work <job>";
  } else if (command === '-rob') {
    response = "Robbing feature not implemented.";

  // Gambling Commands
  } else if (command === '-gamble') {
    if (args[1])
      response = handleGamble(currentUser, parseInt(args[1]));
    else
      response = "Usage: -gamble <amount>";
  } else if (command === '-roulette') {
    response = "Roulette feature not implemented.";
  } else if (command === '-bet') {
    if (args[1])
      response = handleBet(currentUser, args[1]);
    else
      response = "Usage: -bet <amount/all/half>";

  // Shop & Items Commands
  } else if (command === '-shop') {
    response = "Shop Items: bodyguard, flower crown, bunny ears. Use -buy <item> [amount] to purchase.";
  } else if (command === '-buy') {
    if (["bodyguard", "flower", "bunny"].includes(args[1])) {
      let item = args[1] === 'flower' ? "flower crown" : args[1] === 'bunny' ? "bunny ears" : args[1];
      let amount = args[2] ? parseInt(args[2]) : 1;
      response = handleBuy(currentUser, item, amount);
    } else {
      response = "Usage: -buy <item> [amount] (e.g., -buy bodyguard 1)";
    }
  } else if (command === '-inventory' || command === '-inv') {
    response = "Inventory: " + (currentUser.inventory.length ? currentUser.inventory.join(", ") : "Empty");

  // Family Commands (Placeholders)
  } else if (command === '-family') {
    response = "Family Status: " + currentUser.family.status;
  } else if (command === '-propose') {
    response = "Propose feature not implemented.";
  } else if (command === '-decline') {
    response = "Decline feature not implemented.";
  } else if (command === '-divorce') {
    response = "Divorce feature not implemented.";
  } else if (command === '-adopt') {
    response = "Adopt feature not implemented.";
  } else if (command === '-disown') {
    response = "Disown feature not implemented.";
  } else if (command === '-delete') {
    response = "Delete account feature not implemented.";
  } else if (command === '-runaway') {
    response = "Runaway feature not implemented.";

  // World & Exploration
  } else if (command === '-explore') {
    response = "You explore the area and discover a hidden treasure chest containing 150 Gcoins!";
    currentUser.balance += 150;
  } else if (command === '-travel') {
    if (args[1])
      response = `You travel to ${args.slice(1).join(" ")}. New adventures await!`;
    else
      response = "Usage: -travel <location>";
  } else if (command === '-quest') {
    response = "You accepted a quest! Check your Quest Log for details.";
    addQuest("Gather 10 herbs for the local alchemist.");
  } else if (command === '-battle') {
    response = "You challenged another player to battle. (PvP combat not fully implemented.)";

  // Combat & Skills
  } else if (command === '-attack') {
    if (args[1])
      response = `You attack ${args[1]} and deal ${Math.floor(Math.random() * currentUser.strength) + 1} damage!`;
    else
      response = "Usage: -attack <@user>";
  } else if (command === '-defend') {
    response = "You defend and boost your defense for the next attack!";
  } else if (command === '-train') {
    currentUser.strength += 1;
    currentUser.defense += 1;
    response = "You train hard; your strength and defense increased by 1!";
  } else if (command === '-skills') {
    response = "Your skills: " + (currentUser.skills.length ? currentUser.skills.join(", ") : "None");
  } else if (command === '-levelup') {
    currentUser.level += 1;
    response = `Congratulations! You leveled up to level ${currentUser.level}.`;

  // Special Items & Crafting
  } else if (command === '-use') {
    if (args[1])
      response = `You used ${args.slice(1).join(" ")}. (Effect not implemented.)`;
    else
      response = "Usage: -use <item>";
  } else if (command === '-craft') {
    if (args[1])
      response = craftItemCommand(currentUser, args.slice(1).join(" "));
    else
      response = "Usage: -craft <item>";
  } else if (command === '-upgrade') {
    if (args[1])
      response = `You upgraded ${args.slice(1).join(" ")}. (Upgrade system not implemented.)`;
    else
      response = "Usage: -upgrade <item>";
  } else if (command === '-equip') {
    if (args[1])
      response = `You equipped ${args.slice(1).join(" ")}. (Equip system not implemented.)`;
    else
      response = "Usage: -equip <item>";

  // Achievements & Rewards
  } else if (command === '-achievements') {
    response = "Achievements: " + (currentUser.achievements.length ? currentUser.achievements.join(", ") : "None");
  } else if (command === '-claim') {
    response = "Claim rewards feature not implemented.";
  } else if (command === '-rank') {
    response = `Your rank is #${Math.floor(Math.random() * 100) + 1} based on your stats.`;

  // Housing & Properties
  } else if (command === '-house') {
    response = `Your house: ${currentUser.house}`;
  } else if (command === '-buyhouse') {
    if (args[1])
      response = `You purchased a house in ${args.slice(1).join(" ")}!`;
    else
      response = "Usage: -buyhouse <location>";
  } else if (command === '-decorate') {
    response = "Decorate feature not implemented.";
  } else if (command === '-visit') {
    if (args[1])
      response = `You visited ${args[1]}'s house. (Visit not fully implemented.)`;
    else
      response = "Usage: -visit <@user>";

  // Events & Challenges
  } else if (command === '-event') {
    response = getEventInfo();
  } else if (command === '-challenge') {
    if (args[1])
      response = `You challenged ${args[1]} to a contest! (Challenge not implemented.)`;
    else
      response = "Usage: -challenge <@user>";
  } else if (command === '-leaderboard' && args[1] === 'events') {
    response = "Event Leaderboard:\n1. GarrettWins - 120 tokens\n2. Player2 - 110 tokens\n3. Player3 - 100 tokens";

  // Social & Fun
  } else if (command === '-party') {
    response = "You started a party! Invite friends to join.";
  } else if (command === '-invite') {
    if (args[1])
      response = `You invited ${args[1]} to your party.`;
    else
      response = "Usage: -invite <@user>";
  } else if (command === '-chat') {
    response = "Chat feature is integrated into the game.";
  } else if (command === '-friend') {
    if (args[1])
      response = `Friend request sent to ${args[1]}.`;
    else
      response = "Usage: -friend <@user>";
  } else if (command === '-unfriend') {
    if (args[1])
      response = `You removed ${args[1]} from your friend list.`;
    else
      response = "Usage: -unfriend <@user>";
  } else if (command === '-emote') {
    response = "You performed a fun emote! (e.g., dancing, waving)";

  // Miscellaneous
  } else if (command === '-report') {
    if (args[1])
      response = `You reported ${args[1]} for rule violations.`;
    else
      response = "Usage: -report <@user>";
  } else if (command === '-feedback') {
    if (args.length > 1)
      response = `Feedback received: "${args.slice(1).join(" ")}"`;
    else
      response = "Usage: -feedback <message>";
  } else if (command === '-status') {
    response = "Game Status: All systems operational.";
  } else if (command === '-help') {
    response = getTutorial();
  } else {
    response = "Unknown command. Type -help for available commands.";
  }
  
  addMessage(response, 'system');
  triggerVisualEffects(response);
  saveState(currentUser);
}

// ----------------------
// Crafting Command Helper ----------------------
function craftItemCommand(user, itemName) {
  itemName = itemName.toLowerCase();
  if (itemName === "healing potion") {
    if (user.inventory.filter(x => x === "herb").length >= 3 &&
        user.inventory.filter(x => x === "bottle").length >= 1) {
      for (let i = 0; i < 3; i++) removeItem(user.inventory, "herb");
      removeItem(user.inventory, "bottle");
      user.inventory.push("Healing Potion");
      return "You crafted a Healing Potion!";
    } else {
      return "Not enough materials to craft a Healing Potion.";
    }
  } else if (itemName === "iron sword") {
    if (user.inventory.filter(x => x === "iron ore").length >= 5 &&
        user.inventory.filter(x => x === "leather strap").length >= 1) {
      for (let i = 0; i < 5; i++) removeItem(user.inventory, "iron ore");
      removeItem(user.inventory, "leather strap");
      user.inventory.push("Iron Sword");
      return "You crafted an Iron Sword!";
    } else {
      return "Not enough materials to craft an Iron Sword.";
    }
  } else if (itemName === "wooden shield") {
    if (user.inventory.filter(x => x === "wood plank").length >= 10 &&
        user.inventory.filter(x => x === "iron nail").length >= 1) {
      for (let i = 0; i < 10; i++) removeItem(user.inventory, "wood plank");
      removeItem(user.inventory, "iron nail");
      user.inventory.push("Wooden Shield");
      return "You crafted a Wooden Shield!";
    } else {
      return "Not enough materials to craft a Wooden Shield.";
    }
  } else {
    return "Unknown crafting item.";
  }
}

function removeItem(inventory, item) {
  const index = inventory.indexOf(item);
  if (index !== -1) {
    inventory.splice(index, 1);
  }
}

// ----------------------
// Utility Functions ----------------------
function formatUserInfo(user) {
  return `**Player Info - ${user.username}**
---------------------------------------------------------
💸 Balance: ${user.balance} Gcoins
💰 Bank: ${user.bank} Gcoins
🧧 Spring Tokens: ${user.springTokens}
🌿 Luck: ${user.luck}
🔮 Level: ${user.level}
👑 Title: ${user.title || "None"}
🐰 Pet: ${user.pet || "None"}
🛒 Inventory: ${user.inventory.length ? user.inventory.join(", ") : "Empty"}
🏆 Achievements: ${user.achievements.length ? user.achievements.join(", ") : "None"}
⚙️ Jobs: Active: ${user.jobs.active || "None"}, Total Worked: ${user.jobs.totalWorked}
⚖️ Family Status: ${user.family.status}
🎯 Progress: Spring Quests: ${user.progress.springQuests}, Daily Challenges: ${user.progress.dailyChallenges}, Eggs Collected: ${user.progress.eggsCollected}
🎲 Gambling: Last Bet: ${user.gambling.lastBet}, Bets Won: ${user.gambling.totalBetsWon}
🌍 Location: ${user.location}
💪 Strength: ${user.strength} | 🛡️ Defense: ${user.defense}
🏠 House: ${user.house}`;
}

function handleDeposit(user, amountStr) {
  let amount;
  if (amountStr.toLowerCase() === "all") {
    amount = user.balance;
  } else if (amountStr.toLowerCase() === "half") {
    amount = Math.floor(user.balance / 2);
  } else {
    amount = parseInt(amountStr);
  }
  if (isNaN(amount) || amount <= 0) return "Invalid deposit amount.";
  if (amount > user.balance) return "Insufficient balance.";
  user.balance -= amount;
  user.bank += amount;
  return `Deposited ${amount} Gcoins. New Balance: ${user.balance}, Bank: ${user.bank}`;
}

function handleWithdraw(user, amountStr) {
  let amount;
  if (amountStr.toLowerCase() === "all") {
    amount = user.bank;
  } else if (amountStr.toLowerCase() === "half") {
    amount = Math.floor(user.bank / 2);
  } else {
    amount = parseInt(amountStr);
  }
  if (isNaN(amount) || amount <= 0) return "Invalid withdraw amount.";
  if (amount > user.bank) return "Insufficient bank balance.";
  user.bank -= amount;
  user.balance += amount;
  return `Withdrew ${amount} Gcoins. New Balance: ${user.balance}, Bank: ${user.bank}`;
}

function handlePay(user, targetUsername, amount) {
  if (isNaN(amount) || amount <= 0) return "Invalid amount.";
  if (amount > user.balance) return "Insufficient balance.";
  user.balance -= amount;
  return `Paid ${amount} Gcoins to @${targetUsername}. New Balance: ${user.balance}`;
}

function handleWork(user, job) {
  const rewards = { farmer: 100, miner: 150, fisher: 80 };
  const reward = rewards[job.toLowerCase()] || 50;
  user.balance += reward;
  user.jobs.active = job;
  user.jobs.totalWorked++;
  return `You worked as a ${job} and earned ${reward} Gcoins!`;
}

function handleGamble(user, amount) {
  if (isNaN(amount) || amount <= 0) return "Invalid gamble amount.";
  if (amount > user.balance) return "Insufficient balance.";
  user.gambling.lastBet = amount;
  let chance = 0.5 + (user.luck - 1) * 0.02;
  let win = Math.random() < chance;
  if (win) {
    user.balance += amount;
    user.gambling.totalBetsWon++;
    return `You gambled ${amount} Gcoins and won! New Balance: ${user.balance}`;
  } else {
    user.balance -= amount;
    return `You gambled ${amount} Gcoins and lost. New Balance: ${user.balance}`;
  }
}

function handleBet(user, betOption) {
  let betAmount;
  if (betOption.toLowerCase() === "all") {
    betAmount = user.balance;
  } else if (betOption.toLowerCase() === "half") {
    betAmount = Math.floor(user.balance / 2);
  } else {
    betAmount = parseInt(betOption);
  }
  if (isNaN(betAmount) || betAmount <= 0) return "Invalid bet amount.";
  if (betAmount > user.balance) return "Insufficient balance for bet.";
  user.gambling.lastBet = betAmount;
  let chance = 0.5 + (user.luck - 1) * 0.02;
  chance = Math.min(Math.max(chance, 0), 1);
  let win = Math.random() < chance;
  user.betCount = (user.betCount || 0) + 1;
  if (win) {
    user.balance += betAmount;
    user.gambling.totalBetsWon++;
    let msg = `You bet ${betAmount} Gcoins and won! New Balance: ${user.balance}`;
    if (user.betCount >= 10) {
      user.luck += 0.1;
      user.level++;
      user.betCount = 0;
      msg += "\nYou've leveled up and gained extra luck!";
    }
    return msg;
  } else {
    user.balance -= betAmount;
    return `You bet ${betAmount} Gcoins and lost. New Balance: ${user.balance}`;
  }
}

function handleBuy(user, item, amount) {
  amount = amount || 1;
  const prices = { bodyguard: 500, "flower crown": 300, "bunny ears": 200 };
  if (!prices[item]) return "Item not available.";
  const cost = prices[item] * amount;
  if (user.balance < cost) return "Insufficient balance.";
  user.balance -= cost;
  for (let i = 0; i < amount; i++) {
    user.inventory.push(item);
  }
  return `Bought ${amount} ${item}(s) for ${cost} Gcoins.`;
}

function getEventInfo() {
  // Event set for March 27, 2025 (can be adjusted)
  const currentDate = new Date();
  const eventDate = new Date("2025-03-27");
  let eventActive = currentDate.toDateString() === eventDate.toDateString();
  return `🌸 Spring Blossom Event 🌸
Duration: April 1 - April 30
${eventActive ? "Event is ACTIVE!" : "Event is not active yet."}
Quests:
- Spring Bloom: Plant flowers in Spring Meadows.
- Pollinator's Path: Help bees pollinate.
- Festival Fun: Join the Spring Carnival.
Rewards:
- Earn Spring Tokens for quests.
- Exclusive badges & titles for top players.
Use -quest to start a quest and -event for more info.`;
}

function getTutorial() {
  return `Available Commands:
Economy:
- -info
- -balance (-bal)
- -deposit (-dep) <amount>
- -withdraw (-with) <amount>
- -pay <@user> <amount>
- -daily
- -beg

Jobs:
- -jobs
- -work <job>
- -rob <@user>

Gambling:
- -gamble <amount>
- -roulette
- -bet <amount/all/half>

Shop & Items:
- -shop
- -buy <item> [amount]
- -inventory (-inv)

Family:
- -family [@user]
- -propose <@user>
- -decline <@user>
- -divorce
- -adopt <@user>
- -disown <@user>
- -delete
- -runaway

World & Exploration:
- -explore
- -travel <location>
- -quest
- -battle

Combat & Skills:
- -attack <@user>
- -defend
- -train
- -skills
- -levelup

Special Items:
- -use <item>
- -craft <item>
- -upgrade <item>
- -equip <item>

Achievements:
- -achievements
- -claim
- -rank

Housing:
- -house
- -buyhouse <location>
- -decorate
- -visit <@user>

Events:
- -event
- -challenge <@user>
- -leaderboard events

Social:
- -party
- -invite <@user>
- -chat
- -friend <@user>
- -unfriend <@user>
- -emote

Miscellaneous:
- -report <@user>
- -feedback <message>
- -help
- -status`;
}

// ----------------------
// Quest Log Helper
// ----------------------
function addQuest(questText) {
  const li = document.createElement("li");
  li.textContent = questText;
  questList.appendChild(li);
}

// ----------------------
// Event Checker (every minute)
// ----------------------
setInterval(() => {
  const eventInfo = getEventInfo();
  if (eventInfo.includes("ACTIVE") && !container.classList.contains("spring-event")) {
    container.classList.add("spring-event");
    addMessage("The Spring Event has started!", "system");
    setTimeout(() => {
      container.classList.remove("spring-event");
    }, 3000);
  }
}, 60000);

// ----------------------
// Visual Effects
// ----------------------
function triggerVisualEffects(response) {
  const clearEffects = () => {
    container.classList.remove('spring-event', 'bet-win', 'bet-lose');
  };

  if (response.includes("Spring Blossom Event")) {
    container.classList.add('spring-event');
    setTimeout(clearEffects, 3000);
  } else if (response.includes("won!") && response.includes("bet")) {
    container.classList.add('bet-win');
    playSound("betWinSound");
    setTimeout(clearEffects, 2000);
  } else if (response.includes("lost") && response.includes("bet")) {
    container.classList.add('bet-lose');
    playSound("betLoseSound");
    setTimeout(clearEffects, 2000);
  }
}

function playSound(soundId) {
  const sound = document.getElementById(soundId);
  if (sound) {
    sound.currentTime = 0;
    sound.play();
  }
}
