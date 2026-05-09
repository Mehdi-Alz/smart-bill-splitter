let users = [];
let bills = [];

/* -------------------------
   SAFE HELPERS
--------------------------*/

// Prevent division by zero crashes
function safeDivide(numerator, denominator) {
  if (!denominator || denominator === 0) return 0;
  return numerator / denominator;
}

/* -------------------------
   CORE DATA FUNCTIONS
--------------------------*/

function addUser() {
  const name = document.getElementById("name").value.trim();
  const roomSize = Number(document.getElementById("roomSize").value);
  const days = Number(document.getElementById("days").value);

  if (!name) return alert("Name is required");

  users.push({
    id: Date.now(),
    name,
    roomSize: roomSize || 0,
    daysPresent: days || 0,
    paid: 0
  });

  updateUI();
}

function addBill() {
  const type = document.getElementById("billType").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const splitType = document.getElementById("splitType").value;

  if (!type || amount <= 0) return alert("Invalid bill input");

  bills.push({
    id: Date.now(),
    type,
    amount,
    splitType
  });

  updateUI();
}

/* -------------------------
   CORE CALCULATION ENGINE
--------------------------*/

function calculate() {
  let result = {};

  // initialize users
  users.forEach(u => {
    result[u.id] = {
      name: u.name,
      totalDue: 0,
      paid: u.paid,
      balance: 0
    };
  });

  // apply each bill
  bills.forEach(bill => {
    let shares = splitBill(bill);

    for (let id in shares) {
      if (result[id]) {
        result[id].totalDue += shares[id];
      }
    }
  });

  // finalize balances
  for (let id in result) {
    result[id].balance = result[id].paid - result[id].totalDue;
  }

  renderResults(result);
}

/* -------------------------
   BILL SPLITTING LOGIC
--------------------------*/

function splitBill(bill) {
  let shares = {};

  if (!users.length) return shares;

  // Equal split
  if (bill.splitType === "equal") {
    let share = safeDivide(bill.amount, users.length);

    users.forEach(u => {
      shares[u.id] = share;
    });
  }

  // Presence-based split
  if (bill.splitType === "presence") {
    let totalDays = users.reduce((sum, u) => sum + u.daysPresent, 0);

    users.forEach(u => {
      let ratio = safeDivide(u.daysPresent, totalDays);
      shares[u.id] = ratio * bill.amount;
    });
  }

  // Room size split
  if (bill.splitType === "room_size") {
    let totalSize = users.reduce((sum, u) => sum + u.roomSize, 0);

    users.forEach(u => {
      let ratio = safeDivide(u.roomSize, totalSize);
      shares[u.id] = ratio * bill.amount;
    });
  }

  return shares;
}

/* -------------------------
   UI RENDERING
--------------------------*/

function updateUI() {
  const usersBox = document.getElementById("usersBox");
  const billsBox = document.getElementById("billsBox");

  usersBox.innerHTML = users.map(u => `
    <div class="item">
      <b>${u.name}</b><br>
      Room: ${u.roomSize} | Days: ${u.daysPresent}
    </div>
  `).join("");

  billsBox.innerHTML = bills.map(b => `
    <div class="item">
      <b>${b.type}</b><br>
      Amount: ${b.amount} | ${b.splitType}
    </div>
  `).join("");
}

/* -------------------------
   RESULT RENDERING
--------------------------*/

function renderResults(result) {
  let output = "";

  for (let id in result) {
    const r = result[id];

    output += `
${r.name}
  Total Due: ${r.totalDue.toFixed(2)}
  Paid:      ${r.paid.toFixed(2)}
  Balance:   ${r.balance.toFixed(2)}

------------------------
`;
  }

  document.getElementById("output").textContent = output;
}

/* -------------------------
   INIT SAFE STATE
--------------------------*/

// ensures UI doesn’t break on refresh/start
updateUI();