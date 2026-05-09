let users = [];
let bills = [];

/* -------------------------
   BILL TYPE CONTROL
--------------------------*/

function handleBillTypeChange() {
  const select = document.getElementById("billType");
  const custom = document.getElementById("customBillName");

  if (select.value === "other") {
    custom.style.display = "block";
  } else {
    custom.style.display = "none";
    custom.value = "";
  }
}

/* -------------------------
   SAFE HELPER
--------------------------*/

function safeDivide(a, b) {
  return b ? a / b : 0;
}

/* -------------------------
   ADD USER
--------------------------*/

function addUser() {
  const name = document.getElementById("name").value.trim();
  const roomSize = Number(document.getElementById("roomSize").value);
  const days = Number(document.getElementById("days").value);

  if (!name) return alert("Name required");

  users.push({
    id: Date.now(),
    name,
    roomSize: roomSize || 0,
    daysPresent: days || 0,
    paid: 0
  });

  updateUI();
}

/* -------------------------
   ADD BILL (FIXED)
--------------------------*/

function addBill() {
  const typeSelect = document.getElementById("billType");
  const customInput = document.getElementById("customBillName");
  const amount = Number(document.getElementById("amount").value);
  const splitType = document.getElementById("splitType").value;

  if (amount <= 0) {
    return alert("Invalid amount");
  }

  let type = typeSelect.value;
  let name = type;

  if (type === "other") {
    if (!customInput.value.trim()) {
      return alert("Enter custom bill type");
    }
    name = customInput.value.trim();
  }

  bills.push({
    id: Date.now(),
    type,
    name,
    amount,
    splitType
  });

  /* RESET UI STATE */
  typeSelect.value = "rent";
  customInput.value = "";
  customInput.style.display = "none";
  document.getElementById("amount").value = "";

  updateUI();
}

/* -------------------------
   CALCULATE
--------------------------*/

function calculate() {
  let result = {};

  users.forEach(u => {
    result[u.id] = {
      name: u.name,
      totalDue: 0,
      paid: u.paid,
      balance: 0
    };
  });

  bills.forEach(bill => {
    let shares = splitBill(bill);

    for (let id in shares) {
      if (result[id]) {
        result[id].totalDue += shares[id];
      }
    }
  });

  for (let id in result) {
    result[id].balance = result[id].paid - result[id].totalDue;
  }

  renderResults(result);
}

/* -------------------------
   SPLIT LOGIC
--------------------------*/

function splitBill(bill) {
  let shares = {};

  if (!users.length) return shares;

  if (bill.splitType === "equal") {
    let share = safeDivide(bill.amount, users.length);
    users.forEach(u => shares[u.id] = share);
  }

  if (bill.splitType === "presence") {
    let total = users.reduce((s, u) => s + u.daysPresent, 0);
    users.forEach(u => {
      shares[u.id] = safeDivide(u.daysPresent, total) * bill.amount;
    });
  }

  if (bill.splitType === "room_size") {
    let total = users.reduce((s, u) => s + u.roomSize, 0);
    users.forEach(u => {
      shares[u.id] = safeDivide(u.roomSize, total) * bill.amount;
    });
  }

  return shares;
}

/* -------------------------
   UI
--------------------------*/

function updateUI() {
  document.getElementById("usersBox").innerHTML =
    users.map(u => `
      <div class="item">
        <b>${u.name}</b><br>
        Room: ${u.roomSize} | Days: ${u.daysPresent}
      </div>
    `).join("");

  document.getElementById("billsBox").innerHTML =
    bills.map(b => `
      <div class="item">
        <b>${b.name}</b><br>
        ${b.type} | ${b.amount}
      </div>
    `).join("");
}

/* -------------------------
   RESULTS
--------------------------*/

function renderResults(result) {
  let output = "";

  for (let id in result) {
    let r = result[id];

    output += `
${r.name}
  Due: ${r.totalDue.toFixed(2)}
  Paid: ${r.paid.toFixed(2)}
  Balance: ${r.balance.toFixed(2)}

-------------------
`;
  }

  document.getElementById("output").textContent = output;
}

updateUI();