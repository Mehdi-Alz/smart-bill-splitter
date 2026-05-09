let users = [];
let bills = [];

function addUser() {
  const name = document.getElementById("name").value;
  const roomSize = Number(document.getElementById("roomSize").value);
  const days = Number(document.getElementById("days").value);

  users.push({
    id: Date.now(),
    name,
    roomSize,
    daysPresent: days,
    paid: 0
  });

  alert("User added");
}

function addBill() {
  const type = document.getElementById("billType").value;
  const amount = Number(document.getElementById("amount").value);
  const splitType = document.getElementById("splitType").value;

  bills.push({
    id: Date.now(),
    type,
    amount,
    splitType
  });

  alert("Bill added");
}

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
      result[id].totalDue += shares[id];
    }
  });

  for (let id in result) {
    result[id].balance = result[id].paid - result[id].totalDue;
  }

  document.getElementById("output").textContent =
    JSON.stringify(result, null, 2);
}

function splitBill(bill) {
  let shares = {};

  if (bill.splitType === "equal") {
    let share = bill.amount / users.length;
    users.forEach(u => shares[u.id] = share);
  }

  if (bill.splitType === "presence") {
    let total = users.reduce((a, b) => a + b.daysPresent, 0);
    users.forEach(u => {
      shares[u.id] = (u.daysPresent / total) * bill.amount;
    });
  }

  if (bill.splitType === "room_size") {
    let total = users.reduce((a, b) => a + b.roomSize, 0);
    users.forEach(u => {
      shares[u.id] = (u.roomSize / total) * bill.amount;
    });
  }

  return shares;
}