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

  // ----------------------
  // Global State
  // ----------------------
  let accounts = loadAccounts();
  let currentUser = null; // will be set upon login/signup

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
      shop: null
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
    { name: "Healing Potion", category: "Consumable", price: 50 }
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
  });

  // ----------------------
  // Theme Toggle
  // ----------------------
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
  });

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
  // Leaderboard Button (placeholder function)
  // ----------------------
  viewLeaderboard.addEventListener("click", () => {
    // For now, simply display a placeholder message.
    addMessage("Leaderboard feature coming soon!", "system");
  });

  // ----------------------
  // Marketplace Button
  // ----------------------
  openMarket.addEventListener("click", () => {
    displayMarketplace();
  });
  closeMarket.addEventListener("click", () => {
    marketModal.classList.add("hidden");
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
  // Message Display Helper with simple markdown formatting
  // ----------------------
  function addMessage(message, type) {
    const msgElem = document.createElement("div");
    msgElem.className = `message ${type}`;
    msgElem.innerHTML = message
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>");
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
  // Command Processing
  // ----------------------
  function processCommand(input) {
    const args = parseCommand(input);
    const command = args[0].toLowerCase();
    let response = "";

    // Economy Commands
    if (command === "-info") {
      response = formatUserInfo(currentUser);
    } else if (command === "-balance" || command === "-bal") {
      response = `Balance: ${currentUser.balance} Gcoins`;
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
      response = "You collected your daily bonus of 200 Gcoins!";
    } else if (command === "-beg") {
      let begAmount = Math.floor(Math.random() * 50) + 10;
      currentUser.balance += begAmount;
      response = `You begged and received ${begAmount} Gcoins!`;
    }
    // Jobs Commands (placeholders)
    else if (command === "-jobs") {
      response = "Available jobs: Farmer, Miner, Fisher. Use -work <job> to work.";
    } else if (command === "-work") {
      if (args[1]) response = handleWork(currentUser, args[1]);
      else response = "Usage: -work <job>";
    } else if (command === "-rob") {
      response = "Robbing feature not implemented.";
    }
    // Gambling Commands
    else if (command === "-gamble") {
      if (args[1]) response = handleGamble(currentUser, parseInt(args[1]));
      else response = "Usage: -gamble <amount>";
    } else if (command === "-roulette") {
      response = "Roulette feature not implemented.";
    } else if (command === "-bet") {
      if (args[1]) response = handleBet(currentUser, args[1]);
      else response = "Usage: -bet <amount/all/half>";
    }
    // Shop & Items Commands
    else if (command === "-shop") {
      let shopList = "Shop Items:\n";
      shopItems.forEach((item) => {
        shopList += `• ${item.name} (${item.category}) - ${item.price} Gcoins\n`;
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
      response = "Inventory: " + (currentUser.inventory.length ? currentUser.inventory.join(", ") : "Empty");
    } else if (command === "-iteminfo") {
      if (args[1]) {
        let itemName = args.slice(1).join(" ");
        response = getItemInfo(currentUser, itemName);
      } else response = "Usage: -iteminfo <item>";
    } else if (command === "-sortinv") {
      currentUser.inventory.sort();
      response = "Your inventory has been sorted alphabetically.";
    } else if (command === "-filterinv") {
      if (args[1]) {
        let keyword = args[1].toLowerCase();
        let filtered = currentUser.inventory.filter((item) => item.toLowerCase().includes(keyword));
        response = "Filtered Inventory: " + (filtered.length ? filtered.join(", ") : "No items found.");
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
    // Customization/Guild Command (placeholder)
    else if (command === "-customize") {
      response = "Customization and guild management feature coming soon!";
    }
    // Help Command
    else if (command === "-help") {
      response = getTutorial();
    } else {
      response = "Unknown command. Type -help for available commands.";
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
    if (!recipe) return "No recipe found for that item.";
    for (let ingredient in recipe.ingredients) {
      let count = user.inventory.filter(i => i.toLowerCase() === ingredient.toLowerCase()).length;
      if (count < recipe.ingredients[ingredient]) return `Not enough ${ingredient} to craft ${recipe.item}.`;
    }
    for (let ingredient in recipe.ingredients) {
      for (let i = 0; i < recipe.ingredients[ingredient]; i++) {
        removeItem(user.inventory, ingredient);
      }
    }
    if (Math.random() < recipe.successRate) {
      user.inventory.push(recipe.item);
      playSound("craftSuccessSound");
      return `Success! You crafted a ${recipe.item}.`;
    } else {
      playSound("craftFailSound");
      return `Crafting failed. The materials were wasted.`;
    }
  }
  function handleCustomItem(user, details) {
    let cost = 500;
    if (user.balance < cost) return "Not enough balance to craft a custom item.";
    user.balance -= cost;
    if (Math.random() < 0.5) {
      let newItem = `Custom ${details}`;
      user.customItems.push(newItem);
      user.inventory.push(newItem);
      playSound("craftSuccessSound");
      return `Success! You crafted your custom item: ${newItem}.`;
    } else {
      playSound("craftFailSound");
      return "Crafting failed. The materials were wasted.";
    }
  }
  function handleCustomItemCreation(user, paramString) {
    let nameMatch = paramString.match(/"([^"]+)"/);
    let effectMatch = paramString.match(/effect:"([^"]+)"/i);
    let costMatch = paramString.match(/cost:(\d+)/i);
    if (!nameMatch || !effectMatch || !costMatch) {
      return 'Error: Please use the syntax -customitem "Item Name" effect:"Effect description" cost:<amount>';
    }
    let itemName = nameMatch[1];
    let effectDesc = effectMatch[1];
    let cost = parseInt(costMatch[1]);
    if (cost < 1000) return "The cost is too low for a custom item. Minimum cost is 1000 Gcoins.";
    if (user.balance < cost) return "Not enough balance to create a custom item.";
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
    return `Success! You created a custom item: "${itemName}" with effect: "${effectDesc}". It now appears in the shop.`;
  }

  // ----------------------
  // Inventory & Item Info Helpers
  // ----------------------
  function getItemInfo(user, itemName) {
    let custom = user.customItems.find(item => (typeof item === "object" && item.name.toLowerCase() === itemName.toLowerCase()));
    if (custom) {
      return `Custom Item: ${custom.name}\nEffect: ${custom.effect}\nUses: ${custom.uses}\nCooldown: ${custom.cooldown} turns`;
    }
    let shopItem = shopItems.find(it => it.name.toLowerCase() === itemName.toLowerCase());
    if (shopItem) {
      return `Shop Item: ${shopItem.name}\nCategory: ${shopItem.category}\nPrice: ${shopItem.price} Gcoins`;
    }
    return "Item not found.";
  }

  // ----------------------
  // Trade Helper
  // ----------------------
  function handleTrade(user, targetUsername, itemName, amount) {
    if (!accounts[targetUsername]) return "Target user not found.";
    let count = user.inventory.filter(i => i.toLowerCase() === itemName.toLowerCase()).length;
    if (count < amount) return "Not enough quantity of the item.";
    for (let i = 0; i < amount; i++) {
      removeItem(user.inventory, itemName);
    }
    for (let i = 0; i < amount; i++) {
      accounts[targetUsername].inventory.push(itemName);
    }
    saveAccounts(accounts);
    return `Trade successful: You traded ${amount} ${itemName}(s) to @${targetUsername}.`;
  }

  // ----------------------
  // Utility Functions for Economy
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
    return `You worked as a ${job} and earned ${reward} Gcoins!`;
  }
  function handleGamble(user, amount) {
    if (isNaN(amount) || amount <= 0) return "Invalid gamble amount.";
    if (amount > user.balance) return "Insufficient balance.";
    user.balance -= amount;
    let win = Math.random() < 0.5;
    if (win) {
      user.balance += amount * 2;
      return `You gambled ${amount} Gcoins and won! New Balance: ${user.balance}`;
    } else {
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
    user.balance -= betAmount;
    let win = Math.random() < 0.5;
    if (win) {
      user.balance += betAmount * 2;
      return `You bet ${betAmount} Gcoins and won! New Balance: ${user.balance}`;
    } else {
      return `You bet ${betAmount} Gcoins and lost. New Balance: ${user.balance}`;
    }
  }
  function handleBuy(user, item, amount) {
    amount = amount || 1;
    let shopItem = shopItems.find(it => it.name.toLowerCase() === item.toLowerCase());
    if (!shopItem) return "Item not available.";
    const totalCost = shopItem.price * amount;
    if (user.balance < totalCost) return "Insufficient balance.";
    user.balance -= totalCost;
    for (let i = 0; i < amount; i++) {
      user.inventory.push(shopItem.name);
    }
    return `Bought ${amount} ${shopItem.name}(s) for ${totalCost} Gcoins. New Balance: ${user.balance}`;
  }
  function handleSell(user, item, amount) {
    amount = amount || 1;
    let count = user.inventory.filter(it => it.toLowerCase() === item.toLowerCase()).length;
    if (count < amount) return "Not enough items to sell.";
    let shopItem = shopItems.find(it => it.name.toLowerCase() === item.toLowerCase());
    let sellPrice = shopItem ? shopItem.price * 0.5 : 25;
    for (let i = 0; i < amount; i++) {
      removeItem(user.inventory, item);
    }
    let totalGain = Math.floor(sellPrice * amount);
    user.balance += totalGain;
    return `Sold ${amount} ${item}(s) for ${totalGain} Gcoins. New Balance: ${user.balance}`;
  }
  function getLoreInfo() {
    return `**Lore & Hints:**
- The ancient ruins hide many secrets.
- Use '-craftables' to see available recipes.
- Wealthy players can shape destiny with '-customitem'.
- Explore, trade, and plan carefully for success.`;
  }
  function getTutorial() {
    return `**Available Commands:**
Economy: -info, -balance (-bal), -deposit (-dep) <amount>, -withdraw (-with) <amount>, -pay <@user> <amount>, -daily, -beg
Jobs: -jobs, -work <job>, -rob
Gambling: -gamble <amount>, -roulette, -bet <amount/all/half>
Shop & Items: -shop, -buy <item> [amount], -sell <item> [amount], -inventory (-inv), -iteminfo <item>, -sortinv, -filterinv <keyword>
Crafting: -craftables, -craft <item> or -craft custom <item details>
Custom: -customitem "Item Name" effect:"Effect description" cost:<amount>
Trade: -trade <@user> <item> <amount>
Lore: -lore
Customization: -customize (coming soon)
Help: -help
(Note: Commands are case-insensitive)`;
  }
  function formatUserInfo(user) {
    return `**Player Info - ${user.username}**
---------------------------------------------------------
💸 Balance: ${user.balance} Gcoins
🛒 Inventory: ${user.inventory.join(", ")}
🛠 Custom Items: ${user.customItems.length ? user.customItems.map(ci => typeof ci === "string" ? ci : ci.name).join(", ") : "None"}`;
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
});
