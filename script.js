document.addEventListener("DOMContentLoaded", function() {
  // ----------------------
  // Persistent Data Helpers
  // ----------------------
  function loadAccounts() {
    const accounts = localStorage.getItem("fpGameAccounts");
    return accounts ? JSON.parse(accounts) : {};
  }
  function saveAccounts(accounts) {
    localStorage.setItem("fpGameAccounts", JSON.stringify(accounts));
  }
  function loadTradeChat() {
    const messages = localStorage.getItem("tradeChatMessages");
    return messages ? JSON.parse(messages) : [];
  }
  function saveTradeChat(messages) {
    localStorage.setItem("tradeChatMessages", JSON.stringify(messages));
  }
  function loadMarketplace() {
    const market = localStorage.getItem("marketListings");
    return market ? JSON.parse(market) : [];
  }
  function saveMarketplace(listings) {
    localStorage.setItem("marketListings", JSON.stringify(listings));
  }
  function loadThemeSettings() {
    const settings = localStorage.getItem("themeSettings");
    return settings ? JSON.parse(settings) : { background: "", primaryColor: "#2c2c2c" };
  }
  function saveThemeSettings(settings) {
    localStorage.setItem("themeSettings", JSON.stringify(settings));
  }

  // ----------------------
  // Global State
  // ----------------------
  let accounts = loadAccounts();
  let currentUser = null; // Set on login/signup

  // ----------------------
  // Default Account Template
  // ----------------------
  function getDefaultAccount(username) {
    return {
      username: username,
      password: "",
      balance: 1000,
      bank: 0,
      inventory: ["herb", "bottle", "iron ore", "wood plank"],
      customItems: [],
      achievements: [],
      shop: null,
      luck: 1,
      level: 1,
      betCount: 0,
      questsCompleted: 0,
      jobsCompleted: 0,
      battlesWon: 0,
      trades: 0,
      rpsWins: 0,
      gambling: { totalBetsWon: 0 }
    };
  }

  // ----------------------
  // Sample Data: Crafting Recipes and Shop Items
  // ----------------------
  const craftingRecipes = [
    { item: "Healing Potion", ingredients: { herb: 3, bottle: 1 }, successRate: 0.8 },
    { item: "Iron Sword", ingredients: { "iron ore": 5, "leather strap": 1 }, successRate: 0.7 },
    { item: "Wooden Shield", ingredients: { "wood plank": 10, "iron nail": 1 }, successRate: 0.75 }
  ];
  let shopItems = [
    { name: "Bodyguard", category: "Accessory", price: 500 },
    { name: "Flower Crown", category: "Accessory", price: 300 },
    { name: "Bunny Ears", category: "Accessory", price: 200 },
    { name: "Healing Potion", category: "Consumable", price: 50 },
    { name: "Custom Background", category: "Customization", price: 1000 }
  ];

  // ----------------------
  // DOM Elements
  // ----------------------
  const messagesDiv = document.getElementById("messages");
  const commandInput = document.getElementById("commandInput");
  const sendButton = document.getElementById("sendButton");
  const container = document.getElementById("container");
  const tradeChatSection = document.getElementById("tradeChat");
  const tradeMessagesDiv = document.getElementById("tradeMessages");
  const tradeInput = document.getElementById("tradeInput");
  const tradeSendButton = document.getElementById("tradeSendButton");

  const authModal = document.getElementById("authModal");
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const loginSubmit = document.getElementById("loginSubmit");
  const signupUsername = document.getElementById("signupUsername");
  const signupPassword = document.getElementById("signupPassword");
  const signupConfirmPassword = document.getElementById("signupConfirmPassword");
  const signupSubmit = document.getElementById("signupSubmit");

  const themeToggle = document.getElementById("themeToggle");
  const switchChat = document.getElementById("switchChat");
  const viewLeaderboard = document.getElementById("viewLeaderboard");
  const openMarket = document.getElementById("openMarket");
  const questList = document.getElementById("quests");
  const marketModal = document.getElementById("marketModal");
  const marketListingsDiv = document.getElementById("marketListings");
  const closeMarket = document.getElementById("closeMarket");

  const customizeThemeBtn = document.getElementById("customizeThemeBtn");
  const customizeHUD = document.getElementById("customizeHUD");
  const bgUpload = document.getElementById("bgUpload");
  const primaryColorInput = document.getElementById("primaryColor");
  const saveThemeBtn = document.getElementById("saveThemeBtn");
  const closeCustomizeHUD = document.getElementById("closeCustomizeHUD");

  // ----------------------
  // Additional Global State for Guilds & Leaderboards
  // ----------------------
  let guilds = {}; // { guildName: { leader: username, members: [] } }
  let leaderboards = { wealth: [], level: [] };

  function updateLeaderboards() {
    leaderboards.wealth = Object.values(accounts).sort((a, b) => (b.balance + b.bank) - (a.balance + a.bank));
    leaderboards.level = Object.values(accounts).sort((a, b) => b.level - a.level);
  }
  function getLeaderboard(category) {
    updateLeaderboards();
    let board = leaderboards[category];
    if (!board || board.length === 0) return "No data available.";
    let output = `🏆 ${category.charAt(0).toUpperCase() + category.slice(1)} Leaderboard:\n`;
    board.slice(0, 5).forEach((acc, index) => {
      if (category === "wealth") {
        output += `${index + 1}. ${acc.username} - ${acc.balance + acc.bank} Gcoins\n`;
      } else if (category === "level") {
        output += `${index + 1}. ${acc.username} - Level ${acc.level}\n`;
      }
    });
    return output;
  }

  // ----------------------
  // Additional Social Commands: Guild, Friend, Party
  // ----------------------
  function handleGuildCommand(args) {
    if (args[1] && args[1].toLowerCase() === "create" && args[2]) {
      let guildName = args.slice(2).join(" ");
      if (guilds[guildName]) {
        return `❌ Guild "${guildName}" already exists.`;
      } else {
        guilds[guildName] = { leader: currentUser.username, members: [currentUser.username] };
        return `✅ Guild "${guildName}" created. You are the leader!`;
      }
    } else if (args[1] && args[1].toLowerCase() === "join" && args[2]) {
      let guildName = args.slice(2).join(" ");
      if (!guilds[guildName]) {
        return `❌ Guild "${guildName}" does not exist.`;
      } else {
        if (!guilds[guildName].members.includes(currentUser.username)) {
          guilds[guildName].members.push(currentUser.username);
          return `✅ You joined guild "${guildName}".`;
        } else {
          return `ℹ️ You are already in guild "${guildName}".`;
        }
      }
    } else {
      return "Usage: -guild create <name> OR -guild join <name>";
    }
  }

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
  // Chat Input Handling (Main Chat)
  // ----------------------
  sendButton.addEventListener("click", sendCommand);
  commandInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendCommand();
  });
  function sendCommand() {
    const input = commandInput.value.trim();
    if (!input) return;
    addMessage(`> ${input}`, "user");
    processCommand(input);
    commandInput.value = "";
    saveAccounts(accounts);
  }

  // ----------------------
  // Trade Chat Handling
  // ----------------------
  tradeSendButton.addEventListener("click", sendTradeMessage);
  tradeInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendTradeMessage();
  });
  function sendTradeMessage() {
    const message = tradeInput.value.trim();
    if (!message) return;
    const tradeMsg = `${currentUser.username}: ${message}`;
    addTradeMessage(tradeMsg);
    tradeInput.value = "";
    let tradeMessages = loadTradeChat();
    tradeMessages.push(tradeMsg);
    saveTradeChat(tradeMessages);
  }
  function loadTradeChatMessages() {
    tradeMessagesDiv.innerHTML = "";
    const tradeMessages = loadTradeChat();
    tradeMessages.forEach((msg) => {
      const msgElem = document.createElement("div");
      msgElem.className = "message system";
      msgElem.innerText = msg;
      tradeMessagesDiv.appendChild(msgElem);
    });
    tradeMessagesDiv.scrollTop = tradeMessagesDiv.scrollHeight;
  }
  function addTradeMessage(message) {
    const msgElem = document.createElement("div");
    msgElem.className = "message system";
    msgElem.innerText = message;
    tradeMessagesDiv.appendChild(msgElem);
    tradeMessagesDiv.scrollTop = tradeMessagesDiv.scrollHeight;
  }

  // ----------------------
  // Message Display Helper with Markdown Formatting
  // ----------------------
  function addMessage(message, type) {
    const msgElem = document.createElement("div");
    msgElem.className = `message ${type}`;
    msgElem.innerHTML = message
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
    messagesDiv.appendChild(msgElem);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // ----------------------
  // Marketplace Display
  // ----------------------
  function displayMarketplace() {
    const listings = loadMarketplace();
    marketListingsDiv.innerHTML = "";
    if (listings.length === 0) {
      marketListingsDiv.innerHTML = "<p>No listings available.</p>";
    } else {
      listings.forEach((listing) => {
        const listingElem = document.createElement("div");
        listingElem.className = "message system";
        listingElem.innerHTML = `<strong>${listing.seller}</strong> sells <em>${listing.item}</em> (Qty: ${listing.quantity}) for ${listing.price} Gcoins.`;
        marketListingsDiv.appendChild(listingElem);
      });
    }
    marketModal.classList.remove("hidden");
  }

  // ----------------------
  // Theme Customization HUD Handlers
  // ----------------------
  customizeThemeBtn.addEventListener("click", () => {
    customizeHUD.classList.remove("hidden");
  });
  closeCustomizeHUD.addEventListener("click", () => {
    customizeHUD.classList.add("hidden");
  });
  saveThemeBtn.addEventListener("click", () => {
    let settings = { background: "", primaryColor: primaryColorInput.value };
    if (bgUpload.files && bgUpload.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        settings.background = e.target.result;
        applyTheme(settings);
        saveThemeSettings(settings);
        customizeHUD.classList.add("hidden");
      };
      reader.readAsDataURL(bgUpload.files[0]);
    } else {
      applyTheme(settings);
      saveThemeSettings(settings);
      customizeHUD.classList.add("hidden");
    }
  });
  function applyTheme(settings) {
    if (settings.background) {
      document.body.style.backgroundImage = `url(${settings.background})`;
      document.body.style.backgroundSize = "cover";
    } else {
      document.body.style.backgroundImage = "";
    }
    container.style.background = settings.primaryColor;
  }
  function loadThemeFromStorage() {
    let settings = loadThemeSettings();
    if (settings) {
      applyTheme(settings);
    }
  }
  function updateThemeHUD() {
    let settings = loadThemeSettings();
    if (settings) {
      primaryColorInput.value = settings.primaryColor || "#2c2c2c";
    }
  }

  // ----------------------
  // Chat Switch (Main Chat <-> Trade Chat)
  // ----------------------
  let inTradeChat = false;
  switchChat.addEventListener("click", () => {
    inTradeChat = !inTradeChat;
    if (inTradeChat) {
      document.getElementById("chatArea").classList.add("hidden");
      tradeChatSection.classList.remove("hidden");
    } else {
      tradeChatSection.classList.add("hidden");
      document.getElementById("chatArea").classList.remove("hidden");
    }
  });

  // ----------------------
  // Additional Social Commands: Guild, Friend, Party
  // ----------------------
  function handleGuildCommand(args) {
    if (args[1] && args[1].toLowerCase() === "create" && args[2]) {
      let guildName = args.slice(2).join(" ");
      if (guilds[guildName]) {
        return `❌ Guild "${guildName}" already exists.`;
      } else {
        guilds[guildName] = { leader: currentUser.username, members: [currentUser.username] };
        return `✅ Guild "${guildName}" created. You are the leader!`;
      }
    } else if (args[1] && args[1].toLowerCase() === "join" && args[2]) {
      let guildName = args.slice(2).join(" ");
      if (!guilds[guildName]) {
        return `❌ Guild "${guildName}" does not exist.`;
      } else {
        if (!guilds[guildName].members.includes(currentUser.username)) {
          guilds[guildName].members.push(currentUser.username);
          return `✅ You joined guild "${guildName}".`;
        } else {
          return `ℹ️ You are already in guild "${guildName}".`;
        }
      }
    } else {
      return "Usage: -guild create <name> OR -guild join <name>";
    }
  }

  // ----------------------
  // Authentication: Tabs
  // ----------------------
  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
  });
  signupTab.addEventListener("click", () => {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  });

  // ----------------------
  // Authentication: Login & Signup
  // ----------------------
  accounts = loadAccounts();
  loginSubmit.addEventListener("click", () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }
    if (!accounts[username]) {
      alert("Account not found. Please sign up.");
      return;
    }
    if (accounts[username].password !== password) {
      alert("Incorrect password.");
      return;
    }
    currentUser = accounts[username];
    authModal.classList.add("hidden");
    container.classList.remove("hidden");
    addMessage(`<span class="highlight">Welcome back, ${currentUser.username}!</span>`, "system");
    loadTradeChatMessages();
    loadThemeFromStorage();
    updateThemeHUD();
  });
  signupSubmit.addEventListener("click", () => {
    const username = signupUsername.value.trim();
    const password = signupPassword.value.trim();
    const confirmPassword = signupConfirmPassword.value.trim();
    if (!username || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (accounts[username]) {
      alert("Username already exists.");
      return;
    }
    currentUser = getDefaultAccount(username);
    currentUser.password = password;
    accounts[username] = currentUser;
    saveAccounts(accounts);
    authModal.classList.add("hidden");
    container.classList.remove("hidden");
    addMessage(`<span class="highlight">Account created. Welcome, ${currentUser.username}!</span>`, "system");
    loadTradeChatMessages();
    loadThemeFromStorage();
    updateThemeHUD();
  });

  // ----------------------
  // Theme Toggle
  // ----------------------
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
  });

  // ----------------------
  // Command Parsing
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
  // Command Processing
  // ----------------------
  function processCommand(input) {
    const args = parseCommand(input);
    const command = args[0].toLowerCase();
    let response = "";

    // Economy Commands
    if (command === "-info") {
      response = formatUserInfo(currentUser) + `<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-balance" || command === "-bal") {
      response = `💰 Wallet: ${currentUser.balance} Gcoins<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-dep" || command === "-deposit") {
      if (args[1])
        response = handleDeposit(currentUser, args[1]);
      else response = "Usage: -dep <amount/all/half>";
    } else if (command === "-with" || command === "-withdraw") {
      if (args[1])
        response = handleWithdraw(currentUser, args[1]);
      else response = "Usage: -with <amount/all/half>";
    } else if (command === "-pay") {
      if (args.length >= 3) {
        const targetUser = args[1].replace("@", "");
        const amount = parseInt(args[2]);
        response = handlePay(currentUser, targetUser, amount);
      } else response = "Usage: -pay <@user> <amount>";
    } else if (command === "-daily") {
      currentUser.balance += 200;
      response = "🌅 You collected your daily bonus of 200 Gcoins!";
    } else if (command === "-beg") {
      let begAmount = Math.floor(Math.random() * 50) + 10;
      currentUser.balance += begAmount;
      response = `🙏 You begged and received ${begAmount} Gcoins!`;
    }
    // Jobs Commands
    else if (command === "-jobs") {
      response = "👷 Available jobs: Farmer, Miner, Fisher. Use -work <job> to work.";
    } else if (command === "-work") {
      if (args[1]) response = handleWork(currentUser, args[1]);
      else response = "Usage: -work <job>";
    } else if (command === "-rob") {
      response = "🚫 Robbing feature not implemented.";
    }
    // Gambling Commands
    else if (command === "-gamble") {
      if (args[1]) response = handleGamble(currentUser, parseInt(args[1]));
      else response = "Usage: -gamble <amount>";
    } else if (command === "-roulette") {
      response = playMiniGame("roulette");
    } else if (command === "-bet") {
      if (args[1]) response = handleBet(currentUser, args[1]);
      else response = "Usage: -bet <amount/all/half>";
    } else if (command === "-toss") {
      response = playMiniGame("toss");
    } else if (command === "-dice") {
      response = playMiniGame("dice");
    }
    // Shop & Items Commands
    else if (command === "-shop") {
      let shopList = "🛍 Shop Items:<br>";
      shopItems.forEach((item) => {
        shopList += `• <strong>${item.name}</strong> (${item.category}) - ${item.price} Gcoins<br>`;
      });
      response = shopList;
    } else if (command === "-buy") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleBuy(currentUser, itemName, amount);
      } else response = "Usage: -buy <item> [amount]";
    } else if (command === "-sell") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleSell(currentUser, itemName, amount);
      } else response = "Usage: -sell <item> [amount]";
    } else if (command === "-inventory" || command === "-inv") {
      response = "📦 Inventory: " + (currentUser.inventory.length ? currentUser.inventory.join(", ") : "Empty");
    } else if (command === "-iteminfo") {
      if (args[1]) {
        let itemName = args.slice(1).join(" ");
        response = getItemInfo(currentUser, itemName);
      } else response = "Usage: -iteminfo <item>";
    } else if (command === "-sortinv") {
      currentUser.inventory.sort();
      response = "✅ Your inventory has been sorted alphabetically.";
    } else if (command === "-filterinv") {
      if (args[1]) {
        let keyword = args[1].toLowerCase();
        let filtered = currentUser.inventory.filter((item) => item.toLowerCase().includes(keyword));
        response = "🔍 Filtered Inventory: " + (filtered.length ? filtered.join(", ") : "No items found.");
      } else response = "Usage: -filterinv <keyword>";
    }
    // Crafting Commands
    else if (command === "-craftables") {
      response = getCraftablesList();
    } else if (command === "-craft") {
      if (args[1]) {
        if (args[1].toLowerCase() === "custom") {
          response = handleCustomItem(currentUser, args.slice(2).join(" "));
        } else {
          response = craftItemCommand(currentUser, args.slice(1).join(" "));
        }
      } else response = "Usage: -craft <item> or -craft custom <item details>";
    }
    // Custom Item Creation Command
    else if (command === "-customitem") {
      if (args.length >= 3) {
        response = handleCustomItemCreation(currentUser, args.slice(1).join(" "));
      } else {
        response = 'Usage: -customitem "Item Name" effect:"Effect description" cost:<amount>';
      }
    }
    // Trade Command
    else if (command === "-trade") {
      if (args.length >= 4) {
        const targetUser = args[1].replace("@", "");
        const tradeItem = args[2];
        const tradeAmount = parseInt(args[3]);
        response = handleTrade(currentUser, targetUser, tradeItem, tradeAmount);
      } else {
        response = "Usage: -trade <@user> <item> <amount>";
      }
    }
    // Lore/Hints Command
    else if (command === "-lore") {
      response = getLoreInfo();
    }
    // Customization/Guild Command
    else if (command === "-customize") {
      response = "🎨 Customize: Change your avatar or join a guild. (Feature implemented)";
    }
    // Quest Command
    else if (command === "-quest") {
      response = "📝 New Quest: Gather 10 herbs for the local alchemist.";
      addQuest("Gather 10 herbs for the local alchemist.");
      currentUser.questsCompleted = (currentUser.questsCompleted || 0) + 1;
    }
    // Explore Command
    else if (command === "-explore") {
      response = "🧭 You explored a mysterious forest and found 150 Gcoins and rare herbs!";
      currentUser.balance += 150;
      currentUser.inventory.push("rare herb");
    }
    // Battle Command
    else if (command === "-battle") {
      response = "⚔️ You engaged in battle and won 300 Gcoins!";
      currentUser.balance += 300;
      currentUser.battlesWon = (currentUser.battlesWon || 0) + 1;
    }
    // Mini-Game Command
    else if (command === "-mini") {
      if (args[1]) {
        response = playMiniGame(args[1]);
      } else {
        response = "Usage: -mini <game> (e.g., -mini rps)";
      }
    }
    // Guild Commands
    else if (command === "-guild") {
      response = handleGuildCommand(args);
    }
    // Friend Commands
    else if (command === "-friend") {
      if (args[1]) {
        response = `✅ Friend request sent to ${args[1]}. (Simulated)`;
      } else {
        response = "Usage: -friend <@user>";
      }
    } else if (command === "-unfriend") {
      if (args[1]) {
        response = `✅ ${args[1]} removed from your friend list. (Simulated)`;
      } else {
        response = "Usage: -unfriend <@user>";
      }
    }
    // Party Commands
    else if (command === "-party") {
      response = "🎉 Party created! Invite friends using -invite <@user>.";
    } else if (command === "-invite") {
      if (args[1]) {
        response = `✅ ${args[1]} invited to your party. (Simulated)`;
      } else {
        response = "Usage: -invite <@user>";
      }
    }
    // Achievements Command
    else if (command === "-achievements") {
      response = "🏆 Achievements: " + (currentUser.achievements.length ? currentUser.achievements.join(", ") : "None");
    }
    // Stats Command
    else if (command === "-stats") {
      response = `📊 Stats:<br>
⭐ Level: ${currentUser.level}<br>
🍀 Luck: ${currentUser.luck.toFixed(1)}<br>
✅ Bets Won: ${currentUser.gambling.totalBetsWon || 0}<br>
📈 Jobs Completed: ${currentUser.jobsCompleted || 0}<br>
⚔️ Battles Won: ${currentUser.battlesWon || 0}<br>
🤝 Trades: ${currentUser.trades || 0}<br>
🤖 RPS Wins: ${currentUser.rpsWins || 0}`;
    }
    // Leaderboard Command
    else if (command === "-leaderboard") {
      response = getLeaderboard("wealth");
    }
    // Rank Command
    else if (command === "-rank") {
      response = `Your rank is #${Math.floor(Math.random() * 100) + 1} (simulated)`;
    }
    // Help Command (Enhanced UI)
    else if (command === "-help") {
      response = getTutorial();
    } else {
      response = "❓ Unknown command. Type -help for available commands.";
    }
    
    addMessage(response, "system");
    triggerVisualEffects(response);
    saveAccounts(accounts);
  }

  // ----------------------
  // Crafting Helper Functions
  // ----------------------
  function craftItemCommand(user, itemName) {
    itemName = itemName.toLowerCase();
    let recipe = craftingRecipes.find(r => r.item.toLowerCase() === itemName);
    if (!recipe) return "📜 No recipe found for that item.";
    for (let ingredient in recipe.ingredients) {
      let count = user.inventory.filter(i => i.toLowerCase() === ingredient.toLowerCase()).length;
      if (count < recipe.ingredients[ingredient]) return `❌ Not enough ${ingredient} to craft ${recipe.item}.`;
    }
    for (let ingredient in recipe.ingredients) {
      for (let i = 0; i < recipe.ingredients[ingredient]; i++) {
        removeItem(user.inventory, ingredient);
      }
    }
    if (Math.random() < recipe.successRate) {
      user.inventory.push(recipe.item);
      playSound("craftSuccessSound");
      return `✨ Success! You crafted a ${recipe.item}.`;
    } else {
      playSound("craftFailSound");
      return `⚠️ Crafting failed. The materials were wasted.`;
    }
  }
  function handleCustomItem(user, details) {
    let cost = 500;
    if (user.balance < cost) return "💸 Not enough balance to craft a custom item.";
    user.balance -= cost;
    if (Math.random() < 0.5) {
      let newItem = `Custom ${details}`;
      user.customItems.push(newItem);
      user.inventory.push(newItem);
      playSound("craftSuccessSound");
      return `✨ Success! You crafted your custom item: ${newItem}.`;
    } else {
      playSound("craftFailSound");
      return "⚠️ Crafting failed. The materials were wasted.";
    }
  }
  // Custom Item Creation now costs 1,000,000 Gcoins
  function handleCustomItemCreation(user, paramString) {
    let nameMatch = paramString.match(/"([^"]+)"/);
    let effectMatch = paramString.match(/effect:"([^"]+)"/i);
    let costMatch = paramString.match(/cost:(\d+)/i);
    if (!nameMatch || !effectMatch || !costMatch) {
      return 'Error: Use -customitem "Item Name" effect:"Effect description" cost:<amount>';
    }
    let itemName = nameMatch[1];
    let effectDesc = effectMatch[1];
    let cost = parseInt(costMatch[1]);
    if (cost < 1000000) return "⚠️ The cost is too low for a custom item. Minimum cost is 1,000,000 Gcoins.";
    if (user.balance < cost) return "💸 Not enough balance to create a custom item.";
    user.balance -= cost;
    let customItem = {
      name: itemName,
      effect: effectDesc,
      uses: 1,
      cooldown: 3,
      custom: true
    };
    user.customItems.push(customItem);
    user.inventory.push(itemName);
    shopItems.push({ name: itemName, category: "Custom", price: cost * 2 });
    playSound("craftSuccessSound");
    return `✨ Success! You created a custom item: "${itemName}" with effect: "${effectDesc}". It now appears in the shop.`;
  }

  // ----------------------
  // Inventory & Item Info Helpers
  // ----------------------
  function getItemInfo(user, itemName) {
    let custom = user.customItems.find(item => (typeof item === "object" && item.name.toLowerCase() === itemName.toLowerCase()));
    if (custom) {
      return `📦 <strong>Custom Item:</strong> ${custom.name}<br>Effect: ${custom.effect}<br>Uses: ${custom.uses}<br>Cooldown: ${custom.cooldown} turns`;
    }
    let shopItem = shopItems.find(it => it.name.toLowerCase() === itemName.toLowerCase());
    if (shopItem) {
      return `🛍 <strong>Shop Item:</strong> ${shopItem.name}<br>Category: ${shopItem.category}<br>Price: ${shopItem.price} Gcoins`;
    }
    return "❓ Item not found.";
  }
  function removeItem(inventory, item) {
    const index = inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
    if (index !== -1) {
      inventory.splice(index, 1);
    }
  }

  // ----------------------
  // Visual Effects & Sound
  // ----------------------
  function triggerVisualEffects(response) {
    const clearEffects = () => {
      container.classList.remove("spring-event", "bet-win", "bet-lose");
    };
    if (response.includes("Spring Blossom Event")) {
      container.classList.add("spring-event");
      setTimeout(clearEffects, 3000);
    } else if (response.includes("won!") && response.includes("bet")) {
      container.classList.add("bet-win");
      playSound("betWinSound");
      setTimeout(clearEffects, 2000);
    } else if (response.includes("lost") && response.includes("bet")) {
      container.classList.add("bet-lose");
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

  // ----------------------
  // Mini-Games
  // ----------------------
  function playMiniGame(gameName) {
    if (gameName.toLowerCase() === "rps") {
      const choices = ["rock", "paper", "scissors"];
      let playerChoice = prompt("Rock, paper, or scissors?").toLowerCase();
      if (!choices.includes(playerChoice)) return "Invalid choice.";
      let botChoice = choices[Math.floor(Math.random() * 3)];
      let result = "";
      if (playerChoice === botChoice) {
        result = "It's a tie!";
      } else if (
        (playerChoice === "rock" && botChoice === "scissors") ||
        (playerChoice === "paper" && botChoice === "rock") ||
        (playerChoice === "scissors" && botChoice === "paper")
      ) {
        currentUser.balance += 100;
        currentUser.rpsWins = (currentUser.rpsWins || 0) + 1;
        result = `You win! You earned 100 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        result = `You lose! Bot chose ${botChoice}.`;
      }
      return result;
    } else if (gameName.toLowerCase() === "toss") {
      let guess = prompt("Heads or Tails?").toLowerCase();
      if (!["heads", "tails"].includes(guess)) return "Invalid guess.";
      let outcome = Math.random() < 0.5 ? "heads" : "tails";
      if (guess === outcome) {
        currentUser.balance += 50;
        return `Correct! It was ${outcome}. You earned 50 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `Wrong! It was ${outcome}.`;
      }
    } else if (gameName.toLowerCase() === "dice") {
      let guess = parseInt(prompt("Guess a number between 1 and 6:"));
      if (isNaN(guess) || guess < 1 || guess > 6) return "Invalid guess.";
      let roll = Math.floor(Math.random() * 6) + 1;
      if (guess === roll) {
        currentUser.balance += 150;
        return `Exact match! You guessed ${guess} and the dice rolled ${roll}. You earned 150 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `You guessed ${guess} but the dice rolled ${roll}.`;
      }
    } else if (gameName.toLowerCase() === "roulette") {
      let guess = parseInt(prompt("Pick a number between 0 and 9:"));
      if (isNaN(guess) || guess < 0 || guess > 9) return "Invalid number.";
      let result = Math.floor(Math.random() * 10);
      if (guess === result) {
        currentUser.balance += 200;
        return `🎯 Jackpot! You guessed ${guess} and it landed exactly on ${result}. You earned 200 Gcoins. New Balance: ${currentUser.balance}`;
      } else if (Math.abs(guess - result) === 1) {
        currentUser.balance += 100;
        return `Close! You guessed ${guess} and the result was ${result}. You earned 100 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `No luck. You guessed ${guess} but the result was ${result}.`;
      }
    }
    return "Mini-game not available.";
  }

  // ----------------------
  // Add Quest Helper
  // ----------------------
  function addQuest(questText) {
    const li = document.createElement("li");
    li.textContent = questText;
    questList.appendChild(li);
  }

  // ----------------------
  // Help Command (Enhanced Appearance)
  // ----------------------
  function getTutorial() {
    return `
<strong>📚 Available Commands:</strong><br><br>
<strong>Economy:</strong><br>
• -info – Show your account info (Wallet & Bank)<br>
• -balance (-bal) – Show your current Gcoins<br>
• -deposit (-dep) &lt;amount&gt; – Deposit coins into your bank<br>
• -withdraw (-with) &lt;amount&gt; – Withdraw coins from your bank<br>
• -pay &lt;@user&gt; &lt;amount&gt; – Pay another user<br>
• -daily – Collect your daily bonus<br>
• -beg – Beg for coins<br><br>
<strong>Jobs:</strong><br>
• -jobs – List available jobs<br>
• -work &lt;job&gt; – Work a job (Farmer, Miner, Fisher)<br>
• -rob &lt;@user&gt; – Rob a user<br><br>
<strong>Gambling:</strong><br>
• -gamble &lt;amount&gt; – Gamble coins<br>
• -roulette – Play roulette<br>
• -bet &lt;amount/all/half&gt; – Bet coins (every 10 bets increases luck & levels up)<br>
• -toss – Play a coin toss<br>
• -dice – Play a dice game<br><br>
<strong>Shop & Items:</strong><br>
• -shop – View shop items<br>
• -buy &lt;item&gt; [amount] – Buy an item<br>
• -sell &lt;item&gt; [amount] – Sell an item<br>
• -inventory (-inv) – View your inventory<br>
• -iteminfo &lt;item&gt; – Get info about an item<br>
• -sortinv – Sort your inventory alphabetically<br>
• -filterinv &lt;keyword&gt; – Filter your inventory<br><br>
<strong>Crafting:</strong><br>
• -craftables – List crafting recipes<br>
• -craft &lt;item&gt; – Craft an item<br>
• -craft custom &lt;item details&gt; – Craft a custom item (alternative method)<br><br>
<strong>Custom Items:</strong><br>
• -customitem "Item Name" effect:"Effect description" cost:&lt;amount&gt; – Create a custom item (costs at least 1,000,000 Gcoins)<br><br>
<strong>Trade:</strong><br>
• -trade &lt;@user&gt; &lt;item&gt; &lt;amount&gt; – Trade items with a user<br><br>
<strong>Lore:</strong><br>
• -lore – Get lore & hints<br><br>
<strong>Customization:</strong><br>
• -customize – Change your avatar or join a guild<br><br>
<strong>Quests & Exploration:</strong><br>
• -quest – Start a new quest<br>
• -explore – Explore a new area<br>
• -battle – Engage in battle<br><br>
<strong>Mini-Games:</strong><br>
• -mini &lt;game&gt; – Play a mini-game (e.g., rps, toss, dice, roulette)<br><br>
<strong>Social:</strong><br>
• -guild create/join &lt;name&gt; – Create or join a guild<br>
• -friend &lt;@user&gt; – Send a friend request<br>
• -unfriend &lt;@user&gt; – Remove a friend<br>
• -party – Create a party<br>
• -invite &lt;@user&gt; – Invite someone to your party<br><br>
<strong>Achievements & Stats:</strong><br>
• -achievements – View your achievements<br>
• -stats – View your detailed stats<br>
• -leaderboard – View the wealth leaderboard<br>
• -rank – View your rank<br><br>
<strong>Help:</strong><br>
• -help – Show this help message<br>
`;
  }

  // ----------------------
  // Format User Info Helper
  // ----------------------
  function formatUserInfo(user) {
    return `
<strong>👤 Player Info - ${user.username}</strong><br>
---------------------------------------------------------<br>
💰 Wallet: ${user.balance} Gcoins<br>
🏦 Bank: ${user.bank} Gcoins<br>
📦 Inventory: ${user.inventory.join(", ")}<br>
🛠 Custom Items: ${user.customItems.length ? user.customItems.map(ci => typeof ci === "string" ? ci : ci.name).join(", ") : "None"}<br>
⭐ Level: ${user.level} | 🍀 Luck: ${user.luck.toFixed(1)}
`;
  }

  // ----------------------
  // Command Processing
  // ----------------------
  function processCommand(input) {
    const args = parseCommand(input);
    const command = args[0].toLowerCase();
    let response = "";

    if (command === "-info") {
      response = formatUserInfo(currentUser) + `<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-balance" || command === "-bal") {
      response = `💰 Wallet: ${currentUser.balance} Gcoins<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-dep" || command === "-deposit") {
      if (args[1])
        response = handleDeposit(currentUser, args[1]);
      else response = "Usage: -dep <amount/all/half>";
    } else if (command === "-with" || command === "-withdraw") {
      if (args[1])
        response = handleWithdraw(currentUser, args[1]);
      else response = "Usage: -with <amount/all/half>";
    } else if (command === "-pay") {
      if (args.length >= 3) {
        const targetUser = args[1].replace("@", "");
        const amount = parseInt(args[2]);
        response = handlePay(currentUser, targetUser, amount);
      } else response = "Usage: -pay <@user> <amount>";
    } else if (command === "-daily") {
      currentUser.balance += 200;
      response = "🌅 You collected your daily bonus of 200 Gcoins!";
    } else if (command === "-beg") {
      let begAmount = Math.floor(Math.random() * 50) + 10;
      currentUser.balance += begAmount;
      response = `🙏 You begged and received ${begAmount} Gcoins!`;
    } else if (command === "-jobs") {
      response = "👷 Available jobs: Farmer, Miner, Fisher. Use -work <job> to work.";
    } else if (command === "-work") {
      if (args[1]) response = handleWork(currentUser, args[1]);
      else response = "Usage: -work <job>";
    } else if (command === "-rob") {
      response = "🚫 Robbing feature not implemented.";
    } else if (command === "-gamble") {
      if (args[1]) response = handleGamble(currentUser, parseInt(args[1]));
      else response = "Usage: -gamble <amount>";
    } else if (command === "-roulette") {
      response = playMiniGame("roulette");
    } else if (command === "-bet") {
      if (args[1]) response = handleBet(currentUser, args[1]);
      else response = "Usage: -bet <amount/all/half>";
    } else if (command === "-toss") {
      response = playMiniGame("toss");
    } else if (command === "-dice") {
      response = playMiniGame("dice");
    } else if (command === "-shop") {
      let shopList = "🛍 Shop Items:<br>";
      shopItems.forEach((item) => {
        shopList += `• <strong>${item.name}</strong> (${item.category}) - ${item.price} Gcoins<br>`;
      });
      response = shopList;
    } else if (command === "-buy") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleBuy(currentUser, itemName, amount);
      } else response = "Usage: -buy <item> [amount]";
    } else if (command === "-sell") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleSell(currentUser, itemName, amount);
      } else response = "Usage: -sell <item> [amount]";
    } else if (command === "-inventory" || command === "-inv") {
      response = "📦 Inventory: " + (currentUser.inventory.length ? currentUser.inventory.join(", ") : "Empty");
    } else if (command === "-iteminfo") {
      if (args[1]) {
        let itemName = args.slice(1).join(" ");
        response = getItemInfo(currentUser, itemName);
      } else response = "Usage: -iteminfo <item>";
    } else if (command === "-sortinv") {
      currentUser.inventory.sort();
      response = "✅ Your inventory has been sorted alphabetically.";
    } else if (command === "-filterinv") {
      if (args[1]) {
        let keyword = args[1].toLowerCase();
        let filtered = currentUser.inventory.filter((item) => item.toLowerCase().includes(keyword));
        response = "🔍 Filtered Inventory: " + (filtered.length ? filtered.join(", ") : "No items found.");
      } else response = "Usage: -filterinv <keyword>";
    } else if (command === "-craftables") {
      response = getCraftablesList();
    } else if (command === "-craft") {
      if (args[1]) {
        if (args[1].toLowerCase() === "custom") {
          response = handleCustomItem(currentUser, args.slice(2).join(" "));
        } else {
          response = craftItemCommand(currentUser, args.slice(1).join(" "));
        }
      } else response = "Usage: -craft <item> or -craft custom <item details>";
    } else if (command === "-customitem") {
      if (args.length >= 3) {
        response = handleCustomItemCreation(currentUser, args.slice(1).join(" "));
      } else {
        response = 'Usage: -customitem "Item Name" effect:"Effect description" cost:<amount>';
      }
    } else if (command === "-trade") {
      if (args.length >= 4) {
        const targetUser = args[1].replace("@", "");
        const tradeItem = args[2];
        const tradeAmount = parseInt(args[3]);
        response = handleTrade(currentUser, targetUser, tradeItem, tradeAmount);
      } else {
        response = "Usage: -trade <@user> <item> <amount>";
      }
    } else if (command === "-lore") {
      response = getLoreInfo();
    } else if (command === "-customize") {
      response = "🎨 Customize: Change your avatar or join a guild. (Feature implemented)";
    } else if (command === "-quest") {
      response = "📝 New Quest: Gather 10 herbs for the local alchemist.";
      addQuest("Gather 10 herbs for the local alchemist.");
      currentUser.questsCompleted = (currentUser.questsCompleted || 0) + 1;
    } else if (command === "-explore") {
      response = "🧭 You explored a mysterious forest and found 150 Gcoins and rare herbs!";
      currentUser.balance += 150;
      currentUser.inventory.push("rare herb");
    } else if (command === "-battle") {
      response = "⚔️ You engaged in battle and won 300 Gcoins!";
      currentUser.balance += 300;
      currentUser.battlesWon = (currentUser.battlesWon || 0) + 1;
    } else if (command === "-mini") {
      if (args[1]) {
        response = playMiniGame(args[1]);
      } else {
        response = "Usage: -mini <game> (e.g., -mini rps)";
      }
    } else if (command === "-guild") {
      response = handleGuildCommand(args);
    } else if (command === "-friend") {
      if (args[1]) {
        response = `✅ Friend request sent to ${args[1]}. (Simulated)`;
      } else {
        response = "Usage: -friend <@user>";
      }
    } else if (command === "-unfriend") {
      if (args[1]) {
        response = `✅ ${args[1]} removed from your friend list. (Simulated)`;
      } else {
        response = "Usage: -unfriend <@user>";
      }
    } else if (command === "-party") {
      response = "🎉 Party created! Invite friends using -invite <@user>.";
    } else if (command === "-invite") {
      if (args[1]) {
        response = `✅ ${args[1]} invited to your party. (Simulated)`;
      } else {
        response = "Usage: -invite <@user>";
      }
    } else if (command === "-achievements") {
      response = "🏆 Achievements: " + (currentUser.achievements.length ? currentUser.achievements.join(", ") : "None");
    } else if (command === "-stats") {
      response = `📊 Stats:<br>
⭐ Level: ${currentUser.level}<br>
🍀 Luck: ${currentUser.luck.toFixed(1)}<br>
✅ Bets Won: ${currentUser.gambling.totalBetsWon || 0}<br>
📈 Jobs Completed: ${currentUser.jobsCompleted || 0}<br>
⚔️ Battles Won: ${currentUser.battlesWon || 0}<br>
🤝 Trades: ${currentUser.trades || 0}<br>
🤖 RPS Wins: ${currentUser.rpsWins || 0}`;
    } else if (command === "-leaderboard") {
      response = getLeaderboard("wealth");
    } else if (command === "-rank") {
      response = `Your rank is #${Math.floor(Math.random() * 100) + 1} (simulated)`;
    } else if (command === "-help") {
      response = getTutorial();
    } else {
      response = "❓ Unknown command. Type -help for available commands.";
    }
    
    addMessage(response, "system");
    triggerVisualEffects(response);
    saveAccounts(accounts);
  }

  // ----------------------
  // Crafting Helper Functions
  // ----------------------
  function craftItemCommand(user, itemName) {
    itemName = itemName.toLowerCase();
    let recipe = craftingRecipes.find(r => r.item.toLowerCase() === itemName);
    if (!recipe) return "📜 No recipe found for that item.";
    for (let ingredient in recipe.ingredients) {
      let count = user.inventory.filter(i => i.toLowerCase() === ingredient.toLowerCase()).length;
      if (count < recipe.ingredients[ingredient]) return `❌ Not enough ${ingredient} to craft ${recipe.item}.`;
    }
    for (let ingredient in recipe.ingredients) {
      for (let i = 0; i < recipe.ingredients[ingredient]; i++) {
        removeItem(user.inventory, ingredient);
      }
    }
    if (Math.random() < recipe.successRate) {
      user.inventory.push(recipe.item);
      playSound("craftSuccessSound");
      return `✨ Success! You crafted a ${recipe.item}.`;
    } else {
      playSound("craftFailSound");
      return `⚠️ Crafting failed. The materials were wasted.`;
    }
  }
  function handleCustomItem(user, details) {
    let cost = 500;
    if (user.balance < cost) return "💸 Not enough balance to craft a custom item.";
    user.balance -= cost;
    if (Math.random() < 0.5) {
      let newItem = `Custom ${details}`;
      user.customItems.push(newItem);
      user.inventory.push(newItem);
      playSound("craftSuccessSound");
      return `✨ Success! You crafted your custom item: ${newItem}.`;
    } else {
      playSound("craftFailSound");
      return "⚠️ Crafting failed. The materials were wasted.";
    }
  }
  function handleCustomItemCreation(user, paramString) {
    let nameMatch = paramString.match(/"([^"]+)"/);
    let effectMatch = paramString.match(/effect:"([^"]+)"/i);
    let costMatch = paramString.match(/cost:(\d+)/i);
    if (!nameMatch || !effectMatch || !costMatch) {
      return 'Error: Use -customitem "Item Name" effect:"Effect description" cost:<amount>';
    }
    let itemName = nameMatch[1];
    let effectDesc = effectMatch[1];
    let cost = parseInt(costMatch[1]);
    if (cost < 1000000) return "⚠️ The cost is too low for a custom item. Minimum cost is 1,000,000 Gcoins.";
    if (user.balance < cost) return "💸 Not enough balance to create a custom item.";
    user.balance -= cost;
    let customItem = {
      name: itemName,
      effect: effectDesc,
      uses: 1,
      cooldown: 3,
      custom: true
    };
    user.customItems.push(customItem);
    user.inventory.push(itemName);
    shopItems.push({ name: itemName, category: "Custom", price: cost * 2 });
    playSound("craftSuccessSound");
    return `✨ Success! You created a custom item: "${itemName}" with effect: "${effectDesc}". It now appears in the shop.`;
  }

  // ----------------------
  // Inventory & Item Info Helpers
  // ----------------------
  function getItemInfo(user, itemName) {
    let custom = user.customItems.find(item => (typeof item === "object" && item.name.toLowerCase() === itemName.toLowerCase()));
    if (custom) {
      return `📦 <strong>Custom Item:</strong> ${custom.name}<br>Effect: ${custom.effect}<br>Uses: ${custom.uses}<br>Cooldown: ${custom.cooldown} turns`;
    }
    let shopItem = shopItems.find(it => it.name.toLowerCase() === itemName.toLowerCase());
    if (shopItem) {
      return `🛍 <strong>Shop Item:</strong> ${shopItem.name}<br>Category: ${shopItem.category}<br>Price: ${shopItem.price} Gcoins`;
    }
    return "❓ Item not found.";
  }
  function removeItem(inventory, item) {
    const index = inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
    if (index !== -1) {
      inventory.splice(index, 1);
    }
  }

  // ----------------------
  // Visual Effects & Sound
  // ----------------------
  function triggerVisualEffects(response) {
    const clearEffects = () => {
      container.classList.remove("spring-event", "bet-win", "bet-lose");
    };
    if (response.includes("Spring Blossom Event")) {
      container.classList.add("spring-event");
      setTimeout(clearEffects, 3000);
    } else if (response.includes("won!") && response.includes("bet")) {
      container.classList.add("bet-win");
      playSound("betWinSound");
      setTimeout(clearEffects, 2000);
    } else if (response.includes("lost") && response.includes("bet")) {
      container.classList.add("bet-lose");
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

  // ----------------------
  // Mini-Games
  // ----------------------
  function playMiniGame(gameName) {
    if (gameName.toLowerCase() === "rps") {
      const choices = ["rock", "paper", "scissors"];
      let playerChoice = prompt("Rock, paper, or scissors?").toLowerCase();
      if (!choices.includes(playerChoice)) return "Invalid choice.";
      let botChoice = choices[Math.floor(Math.random() * 3)];
      let result = "";
      if (playerChoice === botChoice) {
        result = "It's a tie!";
      } else if (
        (playerChoice === "rock" && botChoice === "scissors") ||
        (playerChoice === "paper" && botChoice === "rock") ||
        (playerChoice === "scissors" && botChoice === "paper")
      ) {
        currentUser.balance += 100;
        currentUser.rpsWins = (currentUser.rpsWins || 0) + 1;
        result = `You win! You earned 100 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        result = `You lose! Bot chose ${botChoice}.`;
      }
      return result;
    } else if (gameName.toLowerCase() === "toss") {
      let guess = prompt("Heads or Tails?").toLowerCase();
      if (!["heads", "tails"].includes(guess)) return "Invalid guess.";
      let outcome = Math.random() < 0.5 ? "heads" : "tails";
      if (guess === outcome) {
        currentUser.balance += 50;
        return `Correct! It was ${outcome}. You earned 50 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `Wrong! It was ${outcome}.`;
      }
    } else if (gameName.toLowerCase() === "dice") {
      let guess = parseInt(prompt("Guess a number between 1 and 6:"));
      if (isNaN(guess) || guess < 1 || guess > 6) return "Invalid guess.";
      let roll = Math.floor(Math.random() * 6) + 1;
      if (guess === roll) {
        currentUser.balance += 150;
        return `Exact match! You guessed ${guess} and the dice rolled ${roll}. You earned 150 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `You guessed ${guess} but the dice rolled ${roll}.`;
      }
    } else if (gameName.toLowerCase() === "roulette") {
      let guess = parseInt(prompt("Pick a number between 0 and 9:"));
      if (isNaN(guess) || guess < 0 || guess > 9) return "Invalid number.";
      let result = Math.floor(Math.random() * 10);
      if (guess === result) {
        currentUser.balance += 200;
        return `🎯 Jackpot! You guessed ${guess} and it landed exactly on ${result}. You earned 200 Gcoins. New Balance: ${currentUser.balance}`;
      } else if (Math.abs(guess - result) === 1) {
        currentUser.balance += 100;
        return `Close! You guessed ${guess} and the result was ${result}. You earned 100 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `No luck. You guessed ${guess} but the result was ${result}.`;
      }
    }
    return "Mini-game not available.";
  }

  // ----------------------
  // Help Command (Enhanced UI)
  // ----------------------
  function getTutorial() {
    return `
<strong>📚 Available Commands:</strong><br><br>
<strong>Economy:</strong><br>
• -info – Show your account info (Wallet & Bank)<br>
• -balance (-bal) – Show your current Gcoins<br>
• -deposit (-dep) &lt;amount&gt; – Deposit coins into your bank<br>
• -withdraw (-with) &lt;amount&gt; – Withdraw coins from your bank<br>
• -pay &lt;@user&gt; &lt;amount&gt; – Pay another user<br>
• -daily – Collect your daily bonus<br>
• -beg – Beg for coins<br><br>
<strong>Jobs:</strong><br>
• -jobs – List available jobs<br>
• -work &lt;job&gt; – Work a job (Farmer, Miner, Fisher)<br>
• -rob &lt;@user&gt; – Rob a user<br><br>
<strong>Gambling:</strong><br>
• -gamble &lt;amount&gt; – Gamble coins<br>
• -roulette – Play roulette<br>
• -bet &lt;amount/all/half&gt; – Bet coins (every 10 bets increases luck & levels up)<br>
• -toss – Play a coin toss<br>
• -dice – Play a dice game<br><br>
<strong>Shop & Items:</strong><br>
• -shop – View shop items<br>
• -buy &lt;item&gt; [amount] – Buy an item<br>
• -sell &lt;item&gt; [amount] – Sell an item<br>
• -inventory (-inv) – View your inventory<br>
• -iteminfo &lt;item&gt; – Get info about an item<br>
• -sortinv – Sort your inventory alphabetically<br>
• -filterinv &lt;keyword&gt; – Filter your inventory<br><br>
<strong>Crafting:</strong><br>
• -craftables – List crafting recipes<br>
• -craft &lt;item&gt; – Craft an item<br>
• -craft custom &lt;item details&gt; – Craft a custom item<br><br>
<strong>Custom Items:</strong><br>
• -customitem "Item Name" effect:"Effect description" cost:&lt;amount&gt; – Create a custom item (costs at least 1,000,000 Gcoins)<br><br>
<strong>Trade:</strong><br>
• -trade &lt;@user&gt; &lt;item&gt; &lt;amount&gt; – Trade items with a user<br><br>
<strong>Lore:</strong><br>
• -lore – Get lore & hints<br><br>
<strong>Customization:</strong><br>
• -customize – Change your avatar or join a guild<br><br>
<strong>Quests & Exploration:</strong><br>
• -quest – Start a new quest<br>
• -explore – Explore a new area<br>
• -battle – Engage in battle<br><br>
<strong>Mini-Games:</strong><br>
• -mini &lt;game&gt; – Play a mini-game (rps, toss, dice, roulette)<br><br>
<strong>Social:</strong><br>
• -guild create/join &lt;name&gt; – Create or join a guild<br>
• -friend &lt;@user&gt; – Send a friend request<br>
• -unfriend &lt;@user&gt; – Remove a friend<br>
• -party – Create a party<br>
• -invite &lt;@user&gt; – Invite someone to your party<br><br>
<strong>Achievements & Stats:</strong><br>
• -achievements – View your achievements<br>
• -stats – View your detailed stats<br>
• -leaderboard – View the wealth leaderboard<br>
• -rank – View your rank<br><br>
<strong>Help:</strong><br>
• -help – Show this help message<br>
`;
  }

  // ----------------------
  // Format User Info Helper
  // ----------------------
  function formatUserInfo(user) {
    return `
<strong>👤 Player Info - ${user.username}</strong><br>
---------------------------------------------------------<br>
💰 Wallet: ${user.balance} Gcoins<br>
🏦 Bank: ${user.bank} Gcoins<br>
📦 Inventory: ${user.inventory.join(", ")}<br>
🛠 Custom Items: ${user.customItems.length ? user.customItems.map(ci => typeof ci === "string" ? ci : ci.name).join(", ") : "None"}<br>
⭐ Level: ${user.level} | 🍀 Luck: ${user.luck.toFixed(1)}
`;
  }

  // ----------------------
  // Economy Helper Functions
  // ----------------------
  function handleDeposit(user, amountStr) {
    let amount;
    if (amountStr.toLowerCase() === "all") {
      amount = user.balance;
    } else if (amountStr.toLowerCase() === "half") {
      amount = Math.floor(user.balance / 2);
    } else {
      amount = parseInt(amountStr);
    }
    if (isNaN(amount) || amount <= 0) return "❌ Invalid deposit amount.";
    if (amount > user.balance) return "❌ Insufficient balance.";
    user.balance -= amount;
    user.bank += amount;
    return `✅ Deposited ${amount} Gcoins.<br>New Wallet: ${user.balance} Gcoins, Bank: ${user.bank} Gcoins`;
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
    if (isNaN(amount) || amount <= 0) return "❌ Invalid withdraw amount.";
    if (amount > user.bank) return "❌ Insufficient bank balance.";
    user.bank -= amount;
    user.balance += amount;
    return `✅ Withdrew ${amount} Gcoins.<br>New Wallet: ${user.balance} Gcoins, Bank: ${user.bank} Gcoins`;
  }
  function handlePay(user, targetUsername, amount) {
    if (isNaN(amount) || amount <= 0) return "❌ Invalid amount.";
    if (amount > user.balance) return "❌ Insufficient balance.";
    user.balance -= amount;
    return `✅ Paid ${amount} Gcoins to @${targetUsername}.<br>New Wallet: ${user.balance} Gcoins`;
  }
  function handleWork(user, job) {
    const rewards = { farmer: 100, miner: 150, fisher: 80 };
    const reward = rewards[job.toLowerCase()] || 50;
    user.balance += reward;
    user.jobsCompleted = (user.jobsCompleted || 0) + 1;
    return `👷 You worked as a ${job} and earned ${reward} Gcoins!`;
  }
  function handleGamble(user, amount) {
    if (isNaN(amount) || amount <= 0) return "❌ Invalid gamble amount.";
    if (amount > user.balance) return "❌ Insufficient balance.";
    user.balance -= amount;
    let win = Math.random() < 0.5;
    if (win) {
      user.balance += amount * 2;
      return `🎉 You gambled ${amount} Gcoins and won!<br>New Wallet: ${user.balance} Gcoins`;
    } else {
      return `😞 You gambled ${amount} Gcoins and lost.<br>New Wallet: ${user.balance} Gcoins`;
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
    if (isNaN(betAmount) || betAmount <= 0) return "❌ Invalid bet amount.";
    if (betAmount > user.balance) return "❌ Insufficient balance for bet.";
    user.balance -= betAmount;
    let win = Math.random() < 0.5;
    user.betCount = (user.betCount || 0) + 1;
    if (win) {
      user.balance += betAmount * 2;
      let msg = `🎲 You bet ${betAmount} Gcoins and won!<br>New Wallet: ${user.balance} Gcoins`;
      if (user.betCount >= 10) {
        user.luck += 0.1;
        user.level++;
        user.betCount = 0;
        msg += `<br>🔥 You leveled up to ${user.level} and gained extra luck! (Luck: ${user.luck.toFixed(1)})`;
      }
      return msg;
    } else {
      return `🎲 You bet ${betAmount} Gcoins and lost.<br>New Wallet: ${user.balance} Gcoins`;
    }
  }
  function handleBuy(user, item, amount) {
    amount = amount || 1;
    let shopItem = shopItems.find(it => it.name.toLowerCase() === item.toLowerCase());
    if (!shopItem) return "❌ Item not available.";
    const totalCost = shopItem.price * amount;
    if (user.balance < totalCost) return "❌ Insufficient balance.";
    user.balance -= totalCost;
    for (let i = 0; i < amount; i++) {
      user.inventory.push(shopItem.name);
    }
    return `✅ Bought ${amount} ${shopItem.name}(s) for ${totalCost} Gcoins.<br>New Wallet: ${user.balance} Gcoins`;
  }
  function handleSell(user, item, amount) {
    amount = amount || 1;
    let count = user.inventory.filter(it => it.toLowerCase() === item.toLowerCase()).length;
    if (count < amount) return "❌ Not enough items to sell.";
    let shopItem = shopItems.find(it => it.name.toLowerCase() === item.toLowerCase());
    let sellPrice = shopItem ? shopItem.price * 0.5 : 25;
    for (let i = 0; i < amount; i++) {
      removeItem(user.inventory, item);
    }
    let totalGain = Math.floor(sellPrice * amount);
    user.balance += totalGain;
    return `✅ Sold ${amount} ${item}(s) for ${totalGain} Gcoins.<br>New Wallet: ${user.balance} Gcoins`;
  }

  // ----------------------
  // Additional Social Commands: Guild, Friend, Party
  // ----------------------
  // Guild: create or join
  function handleGuildCommand(args) {
    if (args[1] && args[1].toLowerCase() === "create" && args[2]) {
      let guildName = args.slice(2).join(" ");
      if (guilds[guildName]) {
        return `❌ Guild "${guildName}" already exists.`;
      } else {
        guilds[guildName] = { leader: currentUser.username, members: [currentUser.username] };
        return `✅ Guild "${guildName}" created. You are the leader!`;
      }
    } else if (args[1] && args[1].toLowerCase() === "join" && args[2]) {
      let guildName = args.slice(2).join(" ");
      if (!guilds[guildName]) {
        return `❌ Guild "${guildName}" does not exist.`;
      } else {
        if (!guilds[guildName].members.includes(currentUser.username)) {
          guilds[guildName].members.push(currentUser.username);
          return `✅ You joined guild "${guildName}".`;
        } else {
          return `ℹ️ You are already in guild "${guildName}".`;
        }
      }
    } else {
      return "Usage: -guild create <name> OR -guild join <name>";
    }
  }

  // ----------------------
  // Lore/Hints Helper
  // ----------------------
  function getLoreInfo() {
    return `📜 <strong>Lore & Hints:</strong><br>
- The ancient ruins hide many secrets.<br>
- Use '-craftables' to see available recipes.<br>
- Wealthy players can shape destiny with '-customitem'.<br>
- Explore, trade, and plan carefully for success.`;
  }

  // ----------------------
  // Craftables List Helper
  // ----------------------
  function getCraftablesList() {
    let list = "🛠 <strong>Available Crafting Recipes:</strong><br>";
    craftingRecipes.forEach(recipe => {
      list += `• <strong>${recipe.item}</strong>: Requires `;
      for (let ing in recipe.ingredients) {
        list += `${recipe.ingredients[ing]} ${ing}, `;
      }
      list = list.slice(0, -2) + `. Success Rate: ${Math.floor(recipe.successRate * 100)}%<br>`;
    });
    return list;
  }

  // ----------------------
  // Help Command (Enhanced Appearance)
  // ----------------------
  function getTutorial() {
    return `
<strong>📚 Available Commands:</strong><br><br>
<strong>Economy:</strong><br>
• -info – Show your account info (Wallet & Bank)<br>
• -balance (-bal) – Show your current Gcoins<br>
• -deposit (-dep) &lt;amount&gt; – Deposit coins into your bank<br>
• -withdraw (-with) &lt;amount&gt; – Withdraw coins from your bank<br>
• -pay &lt;@user&gt; &lt;amount&gt; – Pay another user<br>
• -daily – Collect your daily bonus<br>
• -beg – Beg for coins<br><br>
<strong>Jobs:</strong><br>
• -jobs – List available jobs<br>
• -work &lt;job&gt; – Work a job (Farmer, Miner, Fisher)<br>
• -rob &lt;@user&gt; – Rob a user<br><br>
<strong>Gambling:</strong><br>
• -gamble &lt;amount&gt; – Gamble coins<br>
• -roulette – Play roulette<br>
• -bet &lt;amount/all/half&gt; – Bet coins (every 10 bets increases luck & levels up)<br>
• -toss – Play a coin toss<br>
• -dice – Play a dice game<br><br>
<strong>Shop & Items:</strong><br>
• -shop – View shop items<br>
• -buy &lt;item&gt; [amount] – Buy an item<br>
• -sell &lt;item&gt; [amount] – Sell an item<br>
• -inventory (-inv) – View your inventory<br>
• -iteminfo &lt;item&gt; – Get info about an item<br>
• -sortinv – Sort your inventory alphabetically<br>
• -filterinv &lt;keyword&gt; – Filter your inventory<br><br>
<strong>Crafting:</strong><br>
• -craftables – List crafting recipes<br>
• -craft &lt;item&gt; – Craft an item<br>
• -craft custom &lt;item details&gt; – Craft a custom item<br><br>
<strong>Custom Items:</strong><br>
• -customitem "Item Name" effect:"Effect description" cost:&lt;amount&gt; – Create a custom item (min. cost: 1,000,000 Gcoins)<br><br>
<strong>Trade:</strong><br>
• -trade &lt;@user&gt; &lt;item&gt; &lt;amount&gt; – Trade items with a user<br><br>
<strong>Lore:</strong><br>
• -lore – Get lore & hints<br><br>
<strong>Customization:</strong><br>
• -customize – Change your avatar or join a guild<br><br>
<strong>Quests & Exploration:</strong><br>
• -quest – Start a new quest<br>
• -explore – Explore a new area<br>
• -battle – Engage in battle<br><br>
<strong>Mini-Games:</strong><br>
• -mini &lt;game&gt; – Play a mini-game (rps, toss, dice, roulette)<br><br>
<strong>Social:</strong><br>
• -guild create/join &lt;name&gt; – Create or join a guild<br>
• -friend &lt;@user&gt; – Send a friend request<br>
• -unfriend &lt;@user&gt; – Remove a friend<br>
• -party – Create a party<br>
• -invite &lt;@user&gt; – Invite someone to your party<br><br>
<strong>Achievements & Stats:</strong><br>
• -achievements – View your achievements<br>
• -stats – View your detailed stats<br>
• -leaderboard – View the wealth leaderboard<br>
• -rank – View your rank<br><br>
<strong>Help:</strong><br>
• -help – Show this help message<br>
`;
  }

  // ----------------------
  // Format User Info Helper
  // ----------------------
  function formatUserInfo(user) {
    return `
<strong>👤 Player Info - ${user.username}</strong><br>
---------------------------------------------------------<br>
💰 Wallet: ${user.balance} Gcoins<br>
🏦 Bank: ${user.bank} Gcoins<br>
📦 Inventory: ${user.inventory.join(", ")}<br>
🛠 Custom Items: ${user.customItems.length ? user.customItems.map(ci => typeof ci === "string" ? ci : ci.name).join(", ") : "None"}<br>
⭐ Level: ${user.level} | 🍀 Luck: ${user.luck.toFixed(1)}
`;
  }

  // ----------------------
  // Command Processing
  // ----------------------
  function processCommand(input) {
    const args = parseCommand(input);
    const command = args[0].toLowerCase();
    let response = "";

    if (command === "-info") {
      response = formatUserInfo(currentUser) + `<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-balance" || command === "-bal") {
      response = `💰 Wallet: ${currentUser.balance} Gcoins<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-dep" || command === "-deposit") {
      if (args[1])
        response = handleDeposit(currentUser, args[1]);
      else response = "Usage: -dep <amount/all/half>";
    } else if (command === "-with" || command === "-withdraw") {
      if (args[1])
        response = handleWithdraw(currentUser, args[1]);
      else response = "Usage: -with <amount/all/half>";
    } else if (command === "-pay") {
      if (args.length >= 3) {
        const targetUser = args[1].replace("@", "");
        const amount = parseInt(args[2]);
        response = handlePay(currentUser, targetUser, amount);
      } else response = "Usage: -pay <@user> <amount>";
    } else if (command === "-daily") {
      currentUser.balance += 200;
      response = "🌅 You collected your daily bonus of 200 Gcoins!";
    } else if (command === "-beg") {
      let begAmount = Math.floor(Math.random() * 50) + 10;
      currentUser.balance += begAmount;
      response = `🙏 You begged and received ${begAmount} Gcoins!`;
    } else if (command === "-jobs") {
      response = "👷 Available jobs: Farmer, Miner, Fisher. Use -work <job> to work.";
    } else if (command === "-work") {
      if (args[1]) response = handleWork(currentUser, args[1]);
      else response = "Usage: -work <job>";
    } else if (command === "-rob") {
      response = "🚫 Robbing feature not implemented.";
    } else if (command === "-gamble") {
      if (args[1]) response = handleGamble(currentUser, parseInt(args[1]));
      else response = "Usage: -gamble <amount>";
    } else if (command === "-roulette") {
      response = playMiniGame("roulette");
    } else if (command === "-bet") {
      if (args[1]) response = handleBet(currentUser, args[1]);
      else response = "Usage: -bet <amount/all/half>";
    } else if (command === "-toss") {
      response = playMiniGame("toss");
    } else if (command === "-dice") {
      response = playMiniGame("dice");
    } else if (command === "-shop") {
      let shopList = "🛍 Shop Items:<br>";
      shopItems.forEach((item) => {
        shopList += `• <strong>${item.name}</strong> (${item.category}) - ${item.price} Gcoins<br>`;
      });
      response = shopList;
    } else if (command === "-buy") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleBuy(currentUser, itemName, amount);
      } else response = "Usage: -buy <item> [amount]";
    } else if (command === "-sell") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleSell(currentUser, itemName, amount);
      } else response = "Usage: -sell <item> [amount]";
    } else if (command === "-inventory" || command === "-inv") {
      response = "📦 Inventory: " + (currentUser.inventory.length ? currentUser.inventory.join(", ") : "Empty");
    } else if (command === "-iteminfo") {
      if (args[1]) {
        let itemName = args.slice(1).join(" ");
        response = getItemInfo(currentUser, itemName);
      } else response = "Usage: -iteminfo <item>";
    } else if (command === "-sortinv") {
      currentUser.inventory.sort();
      response = "✅ Your inventory has been sorted alphabetically.";
    } else if (command === "-filterinv") {
      if (args[1]) {
        let keyword = args[1].toLowerCase();
        let filtered = currentUser.inventory.filter((item) => item.toLowerCase().includes(keyword));
        response = "🔍 Filtered Inventory: " + (filtered.length ? filtered.join(", ") : "No items found.");
      } else response = "Usage: -filterinv <keyword>";
    } else if (command === "-craftables") {
      response = getCraftablesList();
    } else if (command === "-craft") {
      if (args[1]) {
        if (args[1].toLowerCase() === "custom") {
          response = handleCustomItem(currentUser, args.slice(2).join(" "));
        } else {
          response = craftItemCommand(currentUser, args.slice(1).join(" "));
        }
      } else response = "Usage: -craft <item> or -craft custom <item details>";
    } else if (command === "-customitem") {
      if (args.length >= 3) {
        response = handleCustomItemCreation(currentUser, args.slice(1).join(" "));
      } else {
        response = 'Usage: -customitem "Item Name" effect:"Effect description" cost:<amount>';
      }
    } else if (command === "-trade") {
      if (args.length >= 4) {
        const targetUser = args[1].replace("@", "");
        const tradeItem = args[2];
        const tradeAmount = parseInt(args[3]);
        response = handleTrade(currentUser, targetUser, tradeItem, tradeAmount);
      } else {
        response = "Usage: -trade <@user> <item> <amount>";
      }
    } else if (command === "-lore") {
      response = getLoreInfo();
    } else if (command === "-customize") {
      response = "🎨 Customize: Change your avatar or join a guild. (Feature implemented)";
    } else if (command === "-quest") {
      response = "📝 New Quest: Gather 10 herbs for the local alchemist.";
      addQuest("Gather 10 herbs for the local alchemist.");
      currentUser.questsCompleted = (currentUser.questsCompleted || 0) + 1;
    } else if (command === "-explore") {
      response = "🧭 You explored a mysterious forest and found 150 Gcoins and rare herbs!";
      currentUser.balance += 150;
      currentUser.inventory.push("rare herb");
    } else if (command === "-battle") {
      response = "⚔️ You engaged in battle and won 300 Gcoins!";
      currentUser.balance += 300;
      currentUser.battlesWon = (currentUser.battlesWon || 0) + 1;
    } else if (command === "-mini") {
      if (args[1]) {
        response = playMiniGame(args[1]);
      } else {
        response = "Usage: -mini <game> (e.g., -mini rps)";
      }
    } else if (command === "-guild") {
      response = handleGuildCommand(args);
    } else if (command === "-friend") {
      if (args[1]) {
        response = `✅ Friend request sent to ${args[1]}. (Simulated)`;
      } else {
        response = "Usage: -friend <@user>";
      }
    } else if (command === "-unfriend") {
      if (args[1]) {
        response = `✅ ${args[1]} removed from your friend list. (Simulated)`;
      } else {
        response = "Usage: -unfriend <@user>";
      }
    } else if (command === "-party") {
      response = "🎉 Party created! Invite friends using -invite <@user>.";
    } else if (command === "-invite") {
      if (args[1]) {
        response = `✅ ${args[1]} invited to your party. (Simulated)`;
      } else {
        response = "Usage: -invite <@user>";
      }
    } else if (command === "-achievements") {
      response = "🏆 Achievements: " + (currentUser.achievements.length ? currentUser.achievements.join(", ") : "None");
    } else if (command === "-stats") {
      response = `📊 Stats:<br>
⭐ Level: ${currentUser.level}<br>
🍀 Luck: ${currentUser.luck.toFixed(1)}<br>
✅ Bets Won: ${currentUser.gambling.totalBetsWon || 0}<br>
📈 Jobs Completed: ${currentUser.jobsCompleted || 0}<br>
⚔️ Battles Won: ${currentUser.battlesWon || 0}<br>
🤝 Trades: ${currentUser.trades || 0}<br>
🤖 RPS Wins: ${currentUser.rpsWins || 0}`;
    } else if (command === "-leaderboard") {
      response = getLeaderboard("wealth");
    } else if (command === "-rank") {
      response = `Your rank is #${Math.floor(Math.random() * 100) + 1} (simulated)`;
    } else if (command === "-help") {
      response = getTutorial();
    } else {
      response = "❓ Unknown command. Type -help for available commands.";
    }
    
    addMessage(response, "system");
    triggerVisualEffects(response);
    saveAccounts(accounts);
  }

  // ----------------------
  // Crafting Helper Functions
  // ----------------------
  function craftItemCommand(user, itemName) {
    itemName = itemName.toLowerCase();
    let recipe = craftingRecipes.find(r => r.item.toLowerCase() === itemName);
    if (!recipe) return "📜 No recipe found for that item.";
    for (let ingredient in recipe.ingredients) {
      let count = user.inventory.filter(i => i.toLowerCase() === ingredient.toLowerCase()).length;
      if (count < recipe.ingredients[ingredient]) return `❌ Not enough ${ingredient} to craft ${recipe.item}.`;
    }
    for (let ingredient in recipe.ingredients) {
      for (let i = 0; i < recipe.ingredients[ingredient]; i++) {
        removeItem(user.inventory, ingredient);
      }
    }
    if (Math.random() < recipe.successRate) {
      user.inventory.push(recipe.item);
      playSound("craftSuccessSound");
      return `✨ Success! You crafted a ${recipe.item}.`;
    } else {
      playSound("craftFailSound");
      return `⚠️ Crafting failed. The materials were wasted.`;
    }
  }
  function handleCustomItem(user, details) {
    let cost = 500;
    if (user.balance < cost) return "💸 Not enough balance to craft a custom item.";
    user.balance -= cost;
    if (Math.random() < 0.5) {
      let newItem = `Custom ${details}`;
      user.customItems.push(newItem);
      user.inventory.push(newItem);
      playSound("craftSuccessSound");
      return `✨ Success! You crafted your custom item: ${newItem}.`;
    } else {
      playSound("craftFailSound");
      return "⚠️ Crafting failed. The materials were wasted.";
    }
  }
  function handleCustomItemCreation(user, paramString) {
    let nameMatch = paramString.match(/"([^"]+)"/);
    let effectMatch = paramString.match(/effect:"([^"]+)"/i);
    let costMatch = paramString.match(/cost:(\d+)/i);
    if (!nameMatch || !effectMatch || !costMatch) {
      return 'Error: Use -customitem "Item Name" effect:"Effect description" cost:<amount>';
    }
    let itemName = nameMatch[1];
    let effectDesc = effectMatch[1];
    let cost = parseInt(costMatch[1]);
    if (cost < 1000000) return "⚠️ The cost is too low for a custom item. Minimum cost is 1,000,000 Gcoins.";
    if (user.balance < cost) return "💸 Not enough balance to create a custom item.";
    user.balance -= cost;
    let customItem = {
      name: itemName,
      effect: effectDesc,
      uses: 1,
      cooldown: 3,
      custom: true
    };
    user.customItems.push(customItem);
    user.inventory.push(itemName);
    shopItems.push({ name: itemName, category: "Custom", price: cost * 2 });
    playSound("craftSuccessSound");
    return `✨ Success! You created a custom item: "${itemName}" with effect: "${effectDesc}". It now appears in the shop.`;
  }

  // ----------------------
  // Inventory & Item Info Helpers
  // ----------------------
  function getItemInfo(user, itemName) {
    let custom = user.customItems.find(item => (typeof item === "object" && item.name.toLowerCase() === itemName.toLowerCase()));
    if (custom) {
      return `📦 <strong>Custom Item:</strong> ${custom.name}<br>Effect: ${custom.effect}<br>Uses: ${custom.uses}<br>Cooldown: ${custom.cooldown} turns`;
    }
    let shopItem = shopItems.find(it => it.name.toLowerCase() === itemName.toLowerCase());
    if (shopItem) {
      return `🛍 <strong>Shop Item:</strong> ${shopItem.name}<br>Category: ${shopItem.category}<br>Price: ${shopItem.price} Gcoins`;
    }
    return "❓ Item not found.";
  }
  function removeItem(inventory, item) {
    const index = inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
    if (index !== -1) {
      inventory.splice(index, 1);
    }
  }

  // ----------------------
  // Visual Effects & Sound
  // ----------------------
  function triggerVisualEffects(response) {
    const clearEffects = () => {
      container.classList.remove("spring-event", "bet-win", "bet-lose");
    };
    if (response.includes("Spring Blossom Event")) {
      container.classList.add("spring-event");
      setTimeout(clearEffects, 3000);
    } else if (response.includes("won!") && response.includes("bet")) {
      container.classList.add("bet-win");
      playSound("betWinSound");
      setTimeout(clearEffects, 2000);
    } else if (response.includes("lost") && response.includes("bet")) {
      container.classList.add("bet-lose");
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

  // ----------------------
  // Mini-Games
  // ----------------------
  function playMiniGame(gameName) {
    if (gameName.toLowerCase() === "rps") {
      const choices = ["rock", "paper", "scissors"];
      let playerChoice = prompt("Rock, paper, or scissors?").toLowerCase();
      if (!choices.includes(playerChoice)) return "Invalid choice.";
      let botChoice = choices[Math.floor(Math.random() * 3)];
      let result = "";
      if (playerChoice === botChoice) {
        result = "It's a tie!";
      } else if (
        (playerChoice === "rock" && botChoice === "scissors") ||
        (playerChoice === "paper" && botChoice === "rock") ||
        (playerChoice === "scissors" && botChoice === "paper")
      ) {
        currentUser.balance += 100;
        currentUser.rpsWins = (currentUser.rpsWins || 0) + 1;
        result = `You win! You earned 100 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        result = `You lose! Bot chose ${botChoice}.`;
      }
      return result;
    } else if (gameName.toLowerCase() === "toss") {
      let guess = prompt("Heads or Tails?").toLowerCase();
      if (!["heads", "tails"].includes(guess)) return "Invalid guess.";
      let outcome = Math.random() < 0.5 ? "heads" : "tails";
      if (guess === outcome) {
        currentUser.balance += 50;
        return `Correct! It was ${outcome}. You earned 50 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `Wrong! It was ${outcome}.`;
      }
    } else if (gameName.toLowerCase() === "dice") {
      let guess = parseInt(prompt("Guess a number between 1 and 6:"));
      if (isNaN(guess) || guess < 1 || guess > 6) return "Invalid guess.";
      let roll = Math.floor(Math.random() * 6) + 1;
      if (guess === roll) {
        currentUser.balance += 150;
        return `Exact match! You guessed ${guess} and the dice rolled ${roll}. You earned 150 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `You guessed ${guess} but the dice rolled ${roll}.`;
      }
    } else if (gameName.toLowerCase() === "roulette") {
      let guess = parseInt(prompt("Pick a number between 0 and 9:"));
      if (isNaN(guess) || guess < 0 || guess > 9) return "Invalid number.";
      let result = Math.floor(Math.random() * 10);
      if (guess === result) {
        currentUser.balance += 200;
        return `🎯 Jackpot! You guessed ${guess} and it landed exactly on ${result}. You earned 200 Gcoins. New Balance: ${currentUser.balance}`;
      } else if (Math.abs(guess - result) === 1) {
        currentUser.balance += 100;
        return `Close! You guessed ${guess} and the result was ${result}. You earned 100 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `No luck. You guessed ${guess} but the result was ${result}.`;
      }
    }
    return "Mini-game not available.";
  }

  // ----------------------
  // Help Command (Enhanced Appearance)
  // ----------------------
  function getTutorial() {
    return `
<strong>📚 Available Commands:</strong><br><br>
<strong>Economy:</strong><br>
• -info – Show your account info (Wallet & Bank)<br>
• -balance (-bal) – Show your current Gcoins<br>
• -deposit (-dep) &lt;amount&gt; – Deposit coins into your bank<br>
• -withdraw (-with) &lt;amount&gt; – Withdraw coins from your bank<br>
• -pay &lt;@user&gt; &lt;amount&gt; – Pay another user<br>
• -daily – Collect your daily bonus<br>
• -beg – Beg for coins<br><br>
<strong>Jobs:</strong><br>
• -jobs – List available jobs<br>
• -work &lt;job&gt; – Work a job (Farmer, Miner, Fisher)<br>
• -rob &lt;@user&gt; – Rob a user<br><br>
<strong>Gambling:</strong><br>
• -gamble &lt;amount&gt; – Gamble coins<br>
• -roulette – Play roulette<br>
• -bet &lt;amount/all/half&gt; – Bet coins (every 10 bets increases luck & levels up)<br>
• -toss – Play a coin toss<br>
• -dice – Play a dice game<br><br>
<strong>Shop & Items:</strong><br>
• -shop – View shop items<br>
• -buy &lt;item&gt; [amount] – Buy an item<br>
• -sell &lt;item&gt; [amount] – Sell an item<br>
• -inventory (-inv) – View your inventory<br>
• -iteminfo &lt;item&gt; – Get info about an item<br>
• -sortinv – Sort your inventory alphabetically<br>
• -filterinv &lt;keyword&gt; – Filter your inventory<br><br>
<strong>Crafting:</strong><br>
• -craftables – List crafting recipes<br>
• -craft &lt;item&gt; – Craft an item<br>
• -craft custom &lt;item details&gt; – Craft a custom item<br><br>
<strong>Custom Items:</strong><br>
• -customitem "Item Name" effect:"Effect description" cost:&lt;amount&gt; – Create a custom item (min. cost: 1,000,000 Gcoins)<br><br>
<strong>Trade:</strong><br>
• -trade &lt;@user&gt; &lt;item&gt; &lt;amount&gt; – Trade items with a user<br><br>
<strong>Lore:</strong><br>
• -lore – Get lore & hints<br><br>
<strong>Customization:</strong><br>
• -customize – Change your avatar or join a guild<br><br>
<strong>Quests & Exploration:</strong><br>
• -quest – Start a new quest<br>
• -explore – Explore a new area<br>
• -battle – Engage in battle<br><br>
<strong>Mini-Games:</strong><br>
• -mini &lt;game&gt; – Play a mini-game (rps, toss, dice, roulette)<br><br>
<strong>Social:</strong><br>
• -guild create/join &lt;name&gt; – Create or join a guild<br>
• -friend &lt;@user&gt; – Send a friend request<br>
• -unfriend &lt;@user&gt; – Remove a friend<br>
• -party – Create a party<br>
• -invite &lt;@user&gt; – Invite someone to your party<br><br>
<strong>Achievements & Stats:</strong><br>
• -achievements – View your achievements<br>
• -stats – View your detailed stats<br>
• -leaderboard – View the wealth leaderboard<br>
• -rank – View your rank<br><br>
<strong>Help:</strong><br>
• -help – Show this help message<br>
`;
  }

  // ----------------------
  // Format User Info Helper
  // ----------------------
  function formatUserInfo(user) {
    return `
<strong>👤 Player Info - ${user.username}</strong><br>
---------------------------------------------------------<br>
💰 Wallet: ${user.balance} Gcoins<br>
🏦 Bank: ${user.bank} Gcoins<br>
📦 Inventory: ${user.inventory.join(", ")}<br>
🛠 Custom Items: ${user.customItems.length ? user.customItems.map(ci => typeof ci === "string" ? ci : ci.name).join(", ") : "None"}<br>
⭐ Level: ${user.level} | 🍀 Luck: ${user.luck.toFixed(1)}
`;
  }

  // ----------------------
  // Command Processing
  // ----------------------
  function processCommand(input) {
    const args = parseCommand(input);
    const command = args[0].toLowerCase();
    let response = "";

    if (command === "-info") {
      response = formatUserInfo(currentUser) + `<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-balance" || command === "-bal") {
      response = `💰 Wallet: ${currentUser.balance} Gcoins<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-dep" || command === "-deposit") {
      if (args[1])
        response = handleDeposit(currentUser, args[1]);
      else response = "Usage: -dep <amount/all/half>";
    } else if (command === "-with" || command === "-withdraw") {
      if (args[1])
        response = handleWithdraw(currentUser, args[1]);
      else response = "Usage: -with <amount/all/half>";
    } else if (command === "-pay") {
      if (args.length >= 3) {
        const targetUser = args[1].replace("@", "");
        const amount = parseInt(args[2]);
        response = handlePay(currentUser, targetUser, amount);
      } else response = "Usage: -pay <@user> <amount>";
    } else if (command === "-daily") {
      currentUser.balance += 200;
      response = "🌅 You collected your daily bonus of 200 Gcoins!";
    } else if (command === "-beg") {
      let begAmount = Math.floor(Math.random() * 50) + 10;
      currentUser.balance += begAmount;
      response = `🙏 You begged and received ${begAmount} Gcoins!`;
    } else if (command === "-jobs") {
      response = "👷 Available jobs: Farmer, Miner, Fisher. Use -work <job> to work.";
    } else if (command === "-work") {
      if (args[1]) response = handleWork(currentUser, args[1]);
      else response = "Usage: -work <job>";
    } else if (command === "-rob") {
      response = "🚫 Robbing feature not implemented.";
    } else if (command === "-gamble") {
      if (args[1]) response = handleGamble(currentUser, parseInt(args[1]));
      else response = "Usage: -gamble <amount>";
    } else if (command === "-roulette") {
      response = playMiniGame("roulette");
    } else if (command === "-bet") {
      if (args[1]) response = handleBet(currentUser, args[1]);
      else response = "Usage: -bet <amount/all/half>";
    } else if (command === "-toss") {
      response = playMiniGame("toss");
    } else if (command === "-dice") {
      response = playMiniGame("dice");
    } else if (command === "-shop") {
      let shopList = "🛍 Shop Items:<br>";
      shopItems.forEach((item) => {
        shopList += `• <strong>${item.name}</strong> (${item.category}) - ${item.price} Gcoins<br>`;
      });
      response = shopList;
    } else if (command === "-buy") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleBuy(currentUser, itemName, amount);
      } else response = "Usage: -buy <item> [amount]";
    } else if (command === "-sell") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleSell(currentUser, itemName, amount);
      } else response = "Usage: -sell <item> [amount]";
    } else if (command === "-inventory" || command === "-inv") {
      response = "📦 Inventory: " + (currentUser.inventory.length ? currentUser.inventory.join(", ") : "Empty");
    } else if (command === "-iteminfo") {
      if (args[1]) {
        let itemName = args.slice(1).join(" ");
        response = getItemInfo(currentUser, itemName);
      } else response = "Usage: -iteminfo <item>";
    } else if (command === "-sortinv") {
      currentUser.inventory.sort();
      response = "✅ Your inventory has been sorted alphabetically.";
    } else if (command === "-filterinv") {
      if (args[1]) {
        let keyword = args[1].toLowerCase();
        let filtered = currentUser.inventory.filter((item) => item.toLowerCase().includes(keyword));
        response = "🔍 Filtered Inventory: " + (filtered.length ? filtered.join(", ") : "No items found.");
      } else response = "Usage: -filterinv <keyword>";
    } else if (command === "-craftables") {
      response = getCraftablesList();
    } else if (command === "-craft") {
      if (args[1]) {
        if (args[1].toLowerCase() === "custom") {
          response = handleCustomItem(currentUser, args.slice(2).join(" "));
        } else {
          response = craftItemCommand(currentUser, args.slice(1).join(" "));
        }
      } else response = "Usage: -craft <item> or -craft custom <item details>";
    } else if (command === "-customitem") {
      if (args.length >= 3) {
        response = handleCustomItemCreation(currentUser, args.slice(1).join(" "));
      } else {
        response = 'Usage: -customitem "Item Name" effect:"Effect description" cost:<amount>';
      }
    } else if (command === "-trade") {
      if (args.length >= 4) {
        const targetUser = args[1].replace("@", "");
        const tradeItem = args[2];
        const tradeAmount = parseInt(args[3]);
        response = handleTrade(currentUser, targetUser, tradeItem, tradeAmount);
      } else {
        response = "Usage: -trade <@user> <item> <amount>";
      }
    } else if (command === "-lore") {
      response = getLoreInfo();
    } else if (command === "-customize") {
      response = "🎨 Customize: Change your avatar or join a guild. (Feature implemented)";
    } else if (command === "-quest") {
      response = "📝 New Quest: Gather 10 herbs for the local alchemist.";
      addQuest("Gather 10 herbs for the local alchemist.");
      currentUser.questsCompleted = (currentUser.questsCompleted || 0) + 1;
    } else if (command === "-explore") {
      response = "🧭 You explored a mysterious forest and found 150 Gcoins and rare herbs!";
      currentUser.balance += 150;
      currentUser.inventory.push("rare herb");
    } else if (command === "-battle") {
      response = "⚔️ You engaged in battle and won 300 Gcoins!";
      currentUser.balance += 300;
      currentUser.battlesWon = (currentUser.battlesWon || 0) + 1;
    } else if (command === "-mini") {
      if (args[1]) {
        response = playMiniGame(args[1]);
      } else {
        response = "Usage: -mini <game> (e.g., -mini rps)";
      }
    } else if (command === "-guild") {
      response = handleGuildCommand(args);
    } else if (command === "-friend") {
      if (args[1]) {
        response = `✅ Friend request sent to ${args[1]}. (Simulated)`;
      } else {
        response = "Usage: -friend <@user>";
      }
    } else if (command === "-unfriend") {
      if (args[1]) {
        response = `✅ ${args[1]} removed from your friend list. (Simulated)`;
      } else {
        response = "Usage: -unfriend <@user>";
      }
    } else if (command === "-party") {
      response = "🎉 Party created! Invite friends using -invite <@user>.";
    } else if (command === "-invite") {
      if (args[1]) {
        response = `✅ ${args[1]} invited to your party. (Simulated)`;
      } else {
        response = "Usage: -invite <@user>";
      }
    } else if (command === "-achievements") {
      response = "🏆 Achievements: " + (currentUser.achievements.length ? currentUser.achievements.join(", ") : "None");
    } else if (command === "-stats") {
      response = `📊 Stats:<br>
⭐ Level: ${currentUser.level}<br>
🍀 Luck: ${currentUser.luck.toFixed(1)}<br>
✅ Bets Won: ${currentUser.gambling.totalBetsWon || 0}<br>
📈 Jobs Completed: ${currentUser.jobsCompleted || 0}<br>
⚔️ Battles Won: ${currentUser.battlesWon || 0}<br>
🤝 Trades: ${currentUser.trades || 0}<br>
🤖 RPS Wins: ${currentUser.rpsWins || 0}`;
    } else if (command === "-leaderboard") {
      response = getLeaderboard("wealth");
    } else if (command === "-rank") {
      response = `Your rank is #${Math.floor(Math.random() * 100) + 1} (simulated)`;
    } else if (command === "-help") {
      response = getTutorial();
    } else {
      response = "❓ Unknown command. Type -help for available commands.";
    }
    
    addMessage(response, "system");
    triggerVisualEffects(response);
    saveAccounts(accounts);
  }

  // ----------------------
  // Crafting Helper Functions
  // ----------------------
  function craftItemCommand(user, itemName) {
    itemName = itemName.toLowerCase();
    let recipe = craftingRecipes.find(r => r.item.toLowerCase() === itemName);
    if (!recipe) return "📜 No recipe found for that item.";
    for (let ingredient in recipe.ingredients) {
      let count = user.inventory.filter(i => i.toLowerCase() === ingredient.toLowerCase()).length;
      if (count < recipe.ingredients[ingredient]) return `❌ Not enough ${ingredient} to craft ${recipe.item}.`;
    }
    for (let ingredient in recipe.ingredients) {
      for (let i = 0; i < recipe.ingredients[ingredient]; i++) {
        removeItem(user.inventory, ingredient);
      }
    }
    if (Math.random() < recipe.successRate) {
      user.inventory.push(recipe.item);
      playSound("craftSuccessSound");
      return `✨ Success! You crafted a ${recipe.item}.`;
    } else {
      playSound("craftFailSound");
      return `⚠️ Crafting failed. The materials were wasted.`;
    }
  }
  function handleCustomItem(user, details) {
    let cost = 500;
    if (user.balance < cost) return "💸 Not enough balance to craft a custom item.";
    user.balance -= cost;
    if (Math.random() < 0.5) {
      let newItem = `Custom ${details}`;
      user.customItems.push(newItem);
      user.inventory.push(newItem);
      playSound("craftSuccessSound");
      return `✨ Success! You crafted your custom item: ${newItem}.`;
    } else {
      playSound("craftFailSound");
      return "⚠️ Crafting failed. The materials were wasted.";
    }
  }
  function handleCustomItemCreation(user, paramString) {
    let nameMatch = paramString.match(/"([^"]+)"/);
    let effectMatch = paramString.match(/effect:"([^"]+)"/i);
    let costMatch = paramString.match(/cost:(\d+)/i);
    if (!nameMatch || !effectMatch || !costMatch) {
      return 'Error: Use -customitem "Item Name" effect:"Effect description" cost:<amount>';
    }
    let itemName = nameMatch[1];
    let effectDesc = effectMatch[1];
    let cost = parseInt(costMatch[1]);
    if (cost < 1000000) return "⚠️ The cost is too low for a custom item. Minimum cost is 1,000,000 Gcoins.";
    if (user.balance < cost) return "💸 Not enough balance to create a custom item.";
    user.balance -= cost;
    let customItem = {
      name: itemName,
      effect: effectDesc,
      uses: 1,
      cooldown: 3,
      custom: true
    };
    user.customItems.push(customItem);
    user.inventory.push(itemName);
    shopItems.push({ name: itemName, category: "Custom", price: cost * 2 });
    playSound("craftSuccessSound");
    return `✨ Success! You created a custom item: "${itemName}" with effect: "${effectDesc}". It now appears in the shop.`;
  }

  // ----------------------
  // Mini-Games
  // ----------------------
  function playMiniGame(gameName) {
    if (gameName.toLowerCase() === "rps") {
      const choices = ["rock", "paper", "scissors"];
      let playerChoice = prompt("Rock, paper, or scissors?").toLowerCase();
      if (!choices.includes(playerChoice)) return "Invalid choice.";
      let botChoice = choices[Math.floor(Math.random() * 3)];
      let result = "";
      if (playerChoice === botChoice) {
        result = "It's a tie!";
      } else if (
        (playerChoice === "rock" && botChoice === "scissors") ||
        (playerChoice === "paper" && botChoice === "rock") ||
        (playerChoice === "scissors" && botChoice === "paper")
      ) {
        currentUser.balance += 100;
        currentUser.rpsWins = (currentUser.rpsWins || 0) + 1;
        result = `You win! You earned 100 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        result = `You lose! Bot chose ${botChoice}.`;
      }
      return result;
    } else if (gameName.toLowerCase() === "toss") {
      let guess = prompt("Heads or Tails?").toLowerCase();
      if (!["heads", "tails"].includes(guess)) return "Invalid guess.";
      let outcome = Math.random() < 0.5 ? "heads" : "tails";
      if (guess === outcome) {
        currentUser.balance += 50;
        return `Correct! It was ${outcome}. You earned 50 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `Wrong! It was ${outcome}.`;
      }
    } else if (gameName.toLowerCase() === "dice") {
      let guess = parseInt(prompt("Guess a number between 1 and 6:"));
      if (isNaN(guess) || guess < 1 || guess > 6) return "Invalid guess.";
      let roll = Math.floor(Math.random() * 6) + 1;
      if (guess === roll) {
        currentUser.balance += 150;
        return `Exact match! You guessed ${guess} and the dice rolled ${roll}. You earned 150 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `You guessed ${guess} but the dice rolled ${roll}.`;
      }
    } else if (gameName.toLowerCase() === "roulette") {
      let guess = parseInt(prompt("Pick a number between 0 and 9:"));
      if (isNaN(guess) || guess < 0 || guess > 9) return "Invalid number.";
      let result = Math.floor(Math.random() * 10);
      if (guess === result) {
        currentUser.balance += 200;
        return `🎯 Jackpot! You guessed ${guess} and it landed exactly on ${result}. You earned 200 Gcoins. New Balance: ${currentUser.balance}`;
      } else if (Math.abs(guess - result) === 1) {
        currentUser.balance += 100;
        return `Close! You guessed ${guess} and the result was ${result}. You earned 100 Gcoins. New Balance: ${currentUser.balance}`;
      } else {
        return `No luck. You guessed ${guess} but the result was ${result}.`;
      }
    }
    return "Mini-game not available.";
  }

  // ----------------------
  // Help Command (Enhanced Appearance)
  // ----------------------
  function getTutorial() {
    return `
<strong>📚 Available Commands:</strong><br><br>
<strong>Economy:</strong><br>
• -info – Show your account info (Wallet & Bank)<br>
• -balance (-bal) – Show your current Gcoins<br>
• -deposit (-dep) &lt;amount&gt; – Deposit coins into your bank<br>
• -withdraw (-with) &lt;amount&gt; – Withdraw coins from your bank<br>
• -pay &lt;@user&gt; &lt;amount&gt; – Pay another user<br>
• -daily – Collect your daily bonus<br>
• -beg – Beg for coins<br><br>
<strong>Jobs:</strong><br>
• -jobs – List available jobs<br>
• -work &lt;job&gt; – Work a job (Farmer, Miner, Fisher)<br>
• -rob &lt;@user&gt; – Rob a user<br><br>
<strong>Gambling:</strong><br>
• -gamble &lt;amount&gt; – Gamble coins<br>
• -roulette – Play roulette<br>
• -bet &lt;amount/all/half&gt; – Bet coins (every 10 bets increases luck & levels up)<br>
• -toss – Play a coin toss<br>
• -dice – Play a dice game<br><br>
<strong>Shop & Items:</strong><br>
• -shop – View shop items<br>
• -buy &lt;item&gt; [amount] – Buy an item<br>
• -sell &lt;item&gt; [amount] – Sell an item<br>
• -inventory (-inv) – View your inventory<br>
• -iteminfo &lt;item&gt; – Get info about an item<br>
• -sortinv – Sort your inventory alphabetically<br>
• -filterinv &lt;keyword&gt; – Filter your inventory<br><br>
<strong>Crafting:</strong><br>
• -craftables – List crafting recipes<br>
• -craft &lt;item&gt; – Craft an item<br>
• -craft custom &lt;item details&gt; – Craft a custom item<br><br>
<strong>Custom Items:</strong><br>
• -customitem "Item Name" effect:"Effect description" cost:&lt;amount&gt; – Create a custom item (min. cost: 1,000,000 Gcoins)<br><br>
<strong>Trade:</strong><br>
• -trade &lt;@user&gt; &lt;item&gt; &lt;amount&gt; – Trade items with a user<br><br>
<strong>Lore:</strong><br>
• -lore – Get lore & hints<br><br>
<strong>Customization:</strong><br>
• -customize – Change your avatar or join a guild<br><br>
<strong>Quests & Exploration:</strong><br>
• -quest – Start a new quest<br>
• -explore – Explore a new area<br>
• -battle – Engage in battle<br><br>
<strong>Mini-Games:</strong><br>
• -mini &lt;game&gt; – Play a mini-game (rps, toss, dice, roulette)<br><br>
<strong>Social:</strong><br>
• -guild create/join &lt;name&gt; – Create or join a guild<br>
• -friend &lt;@user&gt; – Send a friend request<br>
• -unfriend &lt;@user&gt; – Remove a friend<br>
• -party – Create a party<br>
• -invite &lt;@user&gt; – Invite someone to your party<br><br>
<strong>Achievements & Stats:</strong><br>
• -achievements – View your achievements<br>
• -stats – View your detailed stats<br>
• -leaderboard – View the wealth leaderboard<br>
• -rank – View your rank<br><br>
<strong>Help:</strong><br>
• -help – Show this help message<br>
`;
  }

  // ----------------------
  // Format User Info Helper
  // ----------------------
  function formatUserInfo(user) {
    return `
<strong>👤 Player Info - ${user.username}</strong><br>
---------------------------------------------------------<br>
💰 Wallet: ${user.balance} Gcoins<br>
🏦 Bank: ${user.bank} Gcoins<br>
📦 Inventory: ${user.inventory.join(", ")}<br>
🛠 Custom Items: ${user.customItems.length ? user.customItems.map(ci => typeof ci === "string" ? ci : ci.name).join(", ") : "None"}<br>
⭐ Level: ${user.level} | 🍀 Luck: ${user.luck.toFixed(1)}
`;
  }

  // ----------------------
  // Command Processing
  // ----------------------
  function processCommand(input) {
    const args = parseCommand(input);
    const command = args[0].toLowerCase();
    let response = "";

    if (command === "-info") {
      response = formatUserInfo(currentUser) + `<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-balance" || command === "-bal") {
      response = `💰 Wallet: ${currentUser.balance} Gcoins<br>🏦 Bank: ${currentUser.bank} Gcoins`;
    } else if (command === "-dep" || command === "-deposit") {
      if (args[1])
        response = handleDeposit(currentUser, args[1]);
      else response = "Usage: -dep <amount/all/half>";
    } else if (command === "-with" || command === "-withdraw") {
      if (args[1])
        response = handleWithdraw(currentUser, args[1]);
      else response = "Usage: -with <amount/all/half>";
    } else if (command === "-pay") {
      if (args.length >= 3) {
        const targetUser = args[1].replace("@", "");
        const amount = parseInt(args[2]);
        response = handlePay(currentUser, targetUser, amount);
      } else response = "Usage: -pay <@user> <amount>";
    } else if (command === "-daily") {
      currentUser.balance += 200;
      response = "🌅 You collected your daily bonus of 200 Gcoins!";
    } else if (command === "-beg") {
      let begAmount = Math.floor(Math.random() * 50) + 10;
      currentUser.balance += begAmount;
      response = `🙏 You begged and received ${begAmount} Gcoins!`;
    } else if (command === "-jobs") {
      response = "👷 Available jobs: Farmer, Miner, Fisher. Use -work <job> to work.";
    } else if (command === "-work") {
      if (args[1]) response = handleWork(currentUser, args[1]);
      else response = "Usage: -work <job>";
    } else if (command === "-rob") {
      response = "🚫 Robbing feature not implemented.";
    } else if (command === "-gamble") {
      if (args[1]) response = handleGamble(currentUser, parseInt(args[1]));
      else response = "Usage: -gamble <amount>";
    } else if (command === "-roulette") {
      response = playMiniGame("roulette");
    } else if (command === "-bet") {
      if (args[1]) response = handleBet(currentUser, args[1]);
      else response = "Usage: -bet <amount/all/half>";
    } else if (command === "-toss") {
      response = playMiniGame("toss");
    } else if (command === "-dice") {
      response = playMiniGame("dice");
    } else if (command === "-shop") {
      let shopList = "🛍 Shop Items:<br>";
      shopItems.forEach((item) => {
        shopList += `• <strong>${item.name}</strong> (${item.category}) - ${item.price} Gcoins<br>`;
      });
      response = shopList;
    } else if (command === "-buy") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleBuy(currentUser, itemName, amount);
      } else response = "Usage: -buy <item> [amount]";
    } else if (command === "-sell") {
      if (args[1]) {
        let itemName = args[1];
        let amount = args[2] ? parseInt(args[2]) : 1;
        response = handleSell(currentUser, itemName, amount);
      } else response = "Usage: -sell <item> [amount]";
    } else if (command === "-inventory" || command === "-inv") {
      response = "📦 Inventory: " + (currentUser.inventory.length ? currentUser.inventory.join(", ") : "Empty");
    } else if (command === "-iteminfo") {
      if (args[1]) {
        let itemName = args.slice(1).join(" ");
        response = getItemInfo(currentUser, itemName);
      } else response = "Usage: -iteminfo <item>";
    } else if (command === "-sortinv") {
      currentUser.inventory.sort();
      response = "✅ Your inventory has been sorted alphabetically.";
    } else if (command === "-filterinv") {
      if (args[1]) {
        let keyword = args[1].toLowerCase();
        let filtered = currentUser.inventory.filter((item) => item.toLowerCase().includes(keyword));
        response = "🔍 Filtered Inventory: " + (filtered.length ? filtered.join(", ") : "No items found.");
      } else response = "Usage: -filterinv <keyword>";
    } else if (command === "-craftables") {
      response = getCraftablesList();
    } else if (command === "-craft") {
      if (args[1]) {
        if (args[1].toLowerCase() === "custom") {
          response = handleCustomItem(currentUser, args.slice(2).join(" "));
        } else {
          response = craftItemCommand(currentUser, args.slice(1).join(" "));
        }
      } else response = "Usage: -craft <item> or -craft custom <item details>";
    } else if (command === "-customitem") {
      if (args.length >= 3) {
        response = handleCustomItemCreation(currentUser, args.slice(1).join(" "));
      } else {
        response = 'Usage: -customitem "Item Name" effect:"Effect description" cost:<amount>';
      }
    } else if (command === "-trade") {
      if (args.length >= 4) {
        const targetUser = args[1].replace("@", "");
        const tradeItem = args[2];
        const tradeAmount = parseInt(args[3]);
        response = handleTrade(currentUser, targetUser, tradeItem, tradeAmount);
      } else {
        response = "Usage: -trade <@user> <item> <amount>";
      }
    } else if (command === "-lore") {
      response = getLoreInfo();
    } else if (command === "-customize") {
      response = "🎨 Customize: Change your avatar or join a guild. (Feature implemented)";
    } else if (command === "-quest") {
      response = "📝 New Quest: Gather 10 herbs for the local alchemist.";
      addQuest("Gather 10 herbs for the local alchemist.");
      currentUser.questsCompleted = (currentUser.questsCompleted || 0) + 1;
    } else if (command === "-explore") {
      response = "🧭 You explored a mysterious forest and found 150 Gcoins and rare herbs!";
      currentUser.balance += 150;
      currentUser.inventory.push("rare herb");
    } else if (command === "-battle") {
      response = "⚔️ You engaged in battle and won 300 Gcoins!";
      currentUser.balance += 300;
      currentUser.battlesWon = (currentUser.battlesWon || 0) + 1;
    } else if (command === "-mini") {
      if (args[1]) {
        response = playMiniGame(args[1]);
      } else {
        response = "Usage: -mini <game> (e.g., -mini rps)";
      }
    } else if (command === "-guild") {
      response = handleGuildCommand(args);
    } else if (command === "-friend") {
      if (args[1]) {
        response = `✅ Friend request sent to ${args[1]}. (Simulated)`;
      } else {
        response = "Usage: -friend <@user>";
      }
    } else if (command === "-unfriend") {
      if (args[1]) {
        response = `✅ ${args[1]} removed from your friend list. (Simulated)`;
      } else {
        response = "Usage: -unfriend <@user>";
      }
    } else if (command === "-party") {
      response = "🎉 Party created! Invite friends using -invite <@user>.";
    } else if (command === "-invite") {
      if (args[1]) {
        response = `✅ ${args[1]} invited to your party. (Simulated)`;
      } else {
        response = "Usage: -invite <@user>";
      }
    } else if (command === "-achievements") {
      response = "🏆 Achievements: " + (currentUser.achievements.length ? currentUser.achievements.join(", ") : "None");
    } else if (command === "-stats") {
      response = `📊 Stats:<br>
⭐ Level: ${currentUser.level}<br>
🍀 Luck: ${currentUser.luck.toFixed(1)}<br>
✅ Bets Won: ${currentUser.gambling.totalBetsWon || 0}<br>
📈 Jobs Completed: ${currentUser.jobsCompleted || 0}<br>
⚔️ Battles Won: ${currentUser.battlesWon || 0}<br>
🤝 Trades: ${currentUser.trades || 0}<br>
🤖 RPS Wins: ${currentUser.rpsWins || 0}`;
    } else if (command === "-leaderboard") {
      response = getLeaderboard("wealth");
    } else if (command === "-rank") {
      response = `Your rank is #${Math.floor(Math.random() * 100) + 1} (simulated)`;
    } else if (command === "-help") {
      response = getTutorial();
    } else {
      response = "❓ Unknown command. Type -help for available commands.";
    }
    
    addMessage(response, "system");
    triggerVisualEffects(response);
    saveAccounts(accounts);
  }

  // ----------------------
  // Authentication: Tabs
  // ----------------------
  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
  });
  signupTab.addEventListener("click", () => {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  });

  // ----------------------
  // Authentication: Login & Signup
  // ----------------------
  accounts = loadAccounts();
  loginSubmit.addEventListener("click", () => {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }
    if (!accounts[username]) {
      alert("Account not found. Please sign up.");
      return;
    }
    if (accounts[username].password !== password) {
      alert("Incorrect password.");
      return;
    }
    currentUser = accounts[username];
    authModal.classList.add("hidden");
    container.classList.remove("hidden");
    addMessage(`<span class="highlight">Welcome back, ${currentUser.username}!</span>`, "system");
    loadTradeChatMessages();
    loadThemeFromStorage();
    updateThemeHUD();
  });
  signupSubmit.addEventListener("click", () => {
    const username = signupUsername.value.trim();
    const password = signupPassword.value.trim();
    const confirmPassword = signupConfirmPassword.value.trim();
    if (!username || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (accounts[username]) {
      alert("Username already exists.");
      return;
    }
    currentUser = getDefaultAccount(username);
    currentUser.password = password;
    accounts[username] = currentUser;
    saveAccounts(accounts);
    authModal.classList.add("hidden");
    container.classList.remove("hidden");
    addMessage(`<span class="highlight">Account created. Welcome, ${currentUser.username}!</span>`, "system");
    loadTradeChatMessages();
    loadThemeFromStorage();
    updateThemeHUD();
  });

  // ----------------------
  // Theme Toggle
  // ----------------------
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
  });

  // ----------------------
  // Deployment of Theme Customization HUD
  // ----------------------
  customizeThemeBtn.addEventListener("click", () => {
    customizeHUD.classList.remove("hidden");
  });
  closeCustomizeHUD.addEventListener("click", () => {
    customizeHUD.classList.add("hidden");
  });
  saveThemeBtn.addEventListener("click", () => {
    let settings = { background: "", primaryColor: primaryColorInput.value };
    if (bgUpload.files && bgUpload.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        settings.background = e.target.result;
        applyTheme(settings);
        saveThemeSettings(settings);
        customizeHUD.classList.add("hidden");
      };
      reader.readAsDataURL(bgUpload.files[0]);
    } else {
      applyTheme(settings);
      saveThemeSettings(settings);
      customizeHUD.classList.add("hidden");
    }
  });
  function applyTheme(settings) {
    if (settings.background) {
      document.body.style.backgroundImage = `url(${settings.background})`;
      document.body.style.backgroundSize = "cover";
    } else {
      document.body.style.backgroundImage = "";
    }
    container.style.background = settings.primaryColor;
  }
  function loadThemeFromStorage() {
    let settings = loadThemeSettings();
    if (settings) {
      applyTheme(settings);
    }
  }
  function updateThemeHUD() {
    let settings = loadThemeSettings();
    if (settings) {
      primaryColorInput.value = settings.primaryColor || "#2c2c2c";
    }
  }
});

