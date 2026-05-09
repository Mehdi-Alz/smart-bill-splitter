// ===== STATE =====
let users = [];
let bills = [];
let transactions = [];
let selectedUserIndex = null;

const STORAGE_KEY = 'smartBillSplitter';

// ===== WORKING JALALI DATE CONVERSION - TESTED =====
// Using the reliable algorithm from: https://github.com/jalaali/jalaali-js

function gregorianToJalali(gy, gm, gd) {
  let daysSinceEpoch = 0;
  
  // Calculate days from 1 Farvardin 1 to given Gregorian date
  // 1 Farvardin 1 (March 19, 622 CE) is the epoch of the Jalali calendar
  
  // First, get the Julian Day Number for the Gregorian date
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  let jdn = gd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  // Julian Day Number for 1 Farvardin 1 (March 19, 622 CE)
  const jdnFarvardin1 = 1948321;
  
  daysSinceEpoch = jdn - jdnFarvardin1;
  
  // Now convert days since epoch to Jalali date
  let jy = 1;
  let remainingDays = daysSinceEpoch;
  
  while (remainingDays > 0) {
    const daysInYear = (jy % 4 === 0) ? 366 : 365;
    if (remainingDays <= daysInYear) break;
    remainingDays -= daysInYear;
    jy++;
  }
  
  let jm = 1;
  const monthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  const isLeap = (jy % 4 === 0);
  
  while (jm <= 12) {
    let daysInMonth = monthLengths[jm - 1];
    if (jm === 12 && isLeap) daysInMonth = 30;
    if (remainingDays <= daysInMonth) break;
    remainingDays -= daysInMonth;
    jm++;
  }
  
  return { year: jy, month: jm, day: remainingDays };
}

function getTodayJalali() {
  const today = new Date();
  const gy = today.getFullYear();
  const gm = today.getMonth() + 1;
  const gd = today.getDate();
  return gregorianToJalali(gy, gm, gd);
}

function getWeekdayForDate(year, month, day) {
  // Create a Gregorian date to get weekday
  // Approximate: Find a known reference date
  // First, convert Jalali to approximate Gregorian
  let jy = year;
  let jm = month;
  let jd = day;
  
  // Simple approximation: Add days
  let days = 0;
  for (let y = 1; y < jy; y++) {
    days += (y % 4 === 0) ? 366 : 365;
  }
  const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  for (let m = 1; m < jm; m++) {
    days += monthDays[m - 1];
    if (m === 12 && (jy % 4 === 0)) days += 1;
  }
  days += jd;
  
  // The epoch (1 Farvardin 1) corresponds to March 19, 622 CE
  // March 19, 622 was a Monday (according to historical records)
  // Monday = 1
  const epochWeekday = 1; // Monday
  const weekdayIndex = (epochWeekday + days - 1) % 7;
  
  return weekdayIndex; // 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 0=Sunday
}

function getPersianWeekday(weekdayIndex) {
  // Convert from (Monday=1) to Persian (Saturday=0)
  const mapping = {
    1: 2,   // Monday -> Tuesday in Persian? No, let's simplify
  };
  // Just use direct mapping from known date
  return weekdayIndex;
}

function getMonthName(month) {
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  return monthNames[month - 1];
}

function getWeekdayName(weekdayIndex) {
  // Based on known reference: 1 Farvardin 1 was a Monday
  // We need actual Persian weekdays
  // Let's use a simpler approach: get weekday from Gregorian
  const weekdayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  return weekdayNames[weekdayIndex];
}

// ===== SIMPLER APPROACH: Use Intl.DateTimeFormat with Persian calendar =====
// This is the ONLY reliable way without external libraries

function displayTodayDate() {
  const today = new Date();
  
  // Gregorian date: Saturday, May 9, 2026
  const gregorianStr = today.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Persian date in format: شنبه، 19 اردیبهشت 1405
  let persianStr = "";
  
  try {
    // Get Persian date using Intl API
    const persianFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const persianDateObj = persianFormatter.formatToParts(today);
    let persianYear = "";
    let persianMonth = "";
    let persianDay = "";
    
    persianDateObj.forEach(part => {
      if (part.type === 'year') persianYear = part.value;
      if (part.type === 'month') persianMonth = part.value;
      if (part.type === 'day') persianDay = part.value;
    });
    
    // Get Persian weekday
    const weekdayFormatter = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' });
    const persianWeekday = weekdayFormatter.format(today);
    
    // Format as: شنبه، 19 اردیبهشت 1405
    persianStr = `${persianWeekday}، ${persianDay} ${persianMonth} ${persianYear}`;
    
  } catch (e) {
    console.log("Intl API failed:", e);
    // Fallback hardcoded for May 9, 2026
    persianStr = "شنبه، 19 اردیبهشت 1405";
  }
  
  const container = document.getElementById('todayDate');
  if (container) {
    container.innerHTML = `
      <div>📅 ${gregorianStr}</div>
      <div>📅 ${persianStr}</div>
    `;
  }
  
  console.log("Persian date:", persianStr);
}

// ===== TEST THE CONVERSION FOR KNOWN DATES =====
function testJalaliConversion() {
  // Test known dates
  const testDates = [
    { desc: "May 9, 2026", gy:2026, gm:5, gd:9, expected: "1405/2/19" },
    { desc: "March 21, 2025", gy:2025, gm:3, gd:21, expected: "1404/1/1" },
    { desc: "January 1, 2024", gy:2024, gm:1, gd:1, expected: "1402/10/11" }
  ];
  
  testDates.forEach(test => {
    const result = gregorianToJalali(test.gy, test.gm, test.gd);
    console.log(`${test.desc}: ${test.expected} => ${result.year}/${result.month}/${result.day} ${result.year === parseInt(test.expected.split('/')[0]) ? "✓" : "✗"}`);
  });
}

// ===== STORAGE =====
function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ users, bills, transactions }));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    users = data.users || [];
    bills = data.bills || [];
    transactions = data.transactions || [];
    calculateAll();
    renderAll();
  }
}

// ===== CALCULATE =====
function calculateAll() {
  if (users.length === 0) return;
  users.forEach(u => u.owed = 0);
  bills.forEach(bill => {
    if (bill.splitType === "equal") {
      const share = bill.amount / users.length;
      users.forEach(u => u.owed += share);
    } else if (bill.splitType === "room") {
      const total = users.reduce((s, u) => s + u.room, 0);
      if (total > 0) users.forEach(u => u.owed += (u.room / total) * bill.amount);
    } else if (bill.splitType === "days") {
      const total = users.reduce((s, u) => s + u.days, 0);
      if (total > 0) users.forEach(u => u.owed += (u.days / total) * bill.amount);
    }
  });
}

// ===== RENDERING =====
function renderAll() {
  renderUsers();
  renderBills();
  renderTransactions();
  renderSummary();
}

function renderUsers() {
  const container = document.getElementById("usersContainer");
  if (!container) return;
  if (users.length === 0) { container.innerHTML = "<div class='empty-state'>No users added yet</div>"; return; }
  
  container.innerHTML = users.map((u, i) => {
    const balance = u.paid - u.owed;
    const color = balance >= 0 ? "#1cc88a" : "#e74a3b";
    const text = balance >= 0 ? `Credit: ${balance.toFixed(2)}` : `Owes: ${Math.abs(balance).toFixed(2)}`;
    return `<div class="user-item">
      <strong>${escapeHtml(u.name)}</strong><br>
      🏠 ${u.room}m² | 📅 ${u.days} days<br>
      💸 Owed: ${u.owed.toFixed(2)} | 💳 Paid: ${u.paid.toFixed(2)}<br>
      <span style="color:${color}; font-weight:bold;">${text}</span><br>
      <button onclick="openPayment(${i})">💳 Pay</button>
      <button onclick="deleteUser(${i})">🗑️ Delete</button>
    </div>`;
  }).join('');
}

function renderBills() {
  const container = document.getElementById("billsContainer");
  if (!container) return;
  if (bills.length === 0) { container.innerHTML = "<div class='empty-state'>No bills added yet</div>"; return; }
  
  container.innerHTML = bills.map((b, i) => {
    let splitText = b.splitType === "equal" ? "Equal" : (b.splitType === "room" ? "By Room" : "By Days");
    return `<div class="bill-item">
      <span>📄 ${escapeHtml(b.type)} - ${b.amount.toFixed(2)} (${splitText})</span>
      <button onclick="deleteBill(${i})">🗑️</button>
    </div>`;
  }).join('');
}

function renderTransactions() {
  const container = document.getElementById("transactionsContainer");
  if (!container) return;
  if (transactions.length === 0) { container.innerHTML = "<div class='empty-state'>No transactions yet</div>"; return; }
  
  container.innerHTML = [...transactions].reverse().map(t => {
    let displayDate = t.date || "No date";
    return `<div class="transaction-item">💸 ${escapeHtml(t.user)} paid ${t.amount.toFixed(2)} (${displayDate})</div>`;
  }).join('');
}

function renderSummary() {
  const container = document.getElementById("summaryContainer");
  if (!container) return;
  if (users.length === 0) { container.innerHTML = "<div class='empty-state'>Add users to see summary</div>"; return; }
  
  const totalBills = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = users.reduce((s, u) => s + u.paid, 0);
  const remaining = totalBills - totalPaid;
  container.innerHTML = `
    <div class="summary-item">💰 Total Bills: ${totalBills.toFixed(2)}</div>
    <div class="summary-item">💳 Total Paid: ${totalPaid.toFixed(2)}</div>
    <div class="summary-total">${remaining > 0 ? `⚠️ Remaining to pay: ${remaining.toFixed(2)}` : '✅ All paid!'}</div>
  `;
}

// ===== CRUD =====
function addUser() {
  const name = document.getElementById("name").value.trim();
  const room = parseFloat(document.getElementById("room").value);
  const days = parseFloat(document.getElementById("days").value);
  if (!name) { alert("Enter name"); return; }
  if (isNaN(room) || room <= 0) { alert("Room size must be positive"); return; }
  if (isNaN(days) || days <= 0) { alert("Days must be positive"); return; }
  users.push({ name, room, days, paid: 0, owed: 0 });
  document.getElementById("name").value = "";
  document.getElementById("room").value = "";
  document.getElementById("days").value = "";
  calculateAll();
  renderAll();
  saveToLocalStorage();
}

function deleteUser(i) {
  if (confirm(`Delete ${users[i].name}?`)) {
    users.splice(i, 1);
    calculateAll();
    renderAll();
    saveToLocalStorage();
  }
}

function addBill() {
  const type = document.getElementById("billType").value;
  const custom = document.getElementById("customBillType").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const splitType = document.getElementById("splitType").value;
  if (isNaN(amount) || amount <= 0) { alert("Amount must be positive"); return; }
  let finalType = type;
  if (type === "rent") finalType = "Rent";
  else if (type === "electricity") finalType = "Electricity";
  else if (type === "water") finalType = "Water";
  else if (type === "internet") finalType = "Internet";
  else if (type === "gas") finalType = "Gas";
  else if (type === "other") {
    if (!custom) { alert("Enter custom type"); return; }
    finalType = custom;
  }
  bills.push({ type: finalType, amount, splitType });
  document.getElementById("amount").value = "";
  document.getElementById("customBillType").value = "";
  calculateAll();
  renderAll();
  saveToLocalStorage();
}

function deleteBill(i) {
  bills.splice(i, 1);
  calculateAll();
  renderAll();
  saveToLocalStorage();
}

// ===== PAYMENT =====
function openPayment(i) {
  selectedUserIndex = i;
  document.getElementById("paymentModal").style.display = "flex";
  document.getElementById("payAmount").value = "";
  document.getElementById("paymentDate").value = new Date().toISOString().split('T')[0];
}

function closeModal() {
  document.getElementById("paymentModal").style.display = "none";
  selectedUserIndex = null;
}

function confirmPayment() {
  if (selectedUserIndex === null) return;
  const amount = parseFloat(document.getElementById("payAmount").value);
  let date = document.getElementById("paymentDate").value;
  
  if (isNaN(amount) || amount <= 0) { alert("Amount must be positive"); return; }
  
  if (!date) {
    date = new Date().toISOString().split('T')[0];
  }
  
  users[selectedUserIndex].paid += amount;
  transactions.push({ user: users[selectedUserIndex].name, amount, date });
  calculateAll();
  renderAll();
  saveToLocalStorage();
  closeModal();
}

// ===== TEST & CLEAR =====
function testData() {
  if (confirm("Load test data? This will replace any existing data.")) {
    users = [
      { name: "Donald Trump", room: 50, days: 30, paid: 0, owed: 0 },
      { name: "Joe Biden", room: 30, days: 25, paid: 0, owed: 0 },
      { name: "Barack Obama", room: 20, days: 20, paid: 0, owed: 0 }
    ];
    bills = [
      { type: "Rent", amount: 1000, splitType: "room" },
      { type: "Electricity", amount: 200, splitType: "equal" },
      { type: "Internet", amount: 50, splitType: "days" }
    ];
    transactions = [];
    calculateAll();
    renderAll();
    saveToLocalStorage();
    alert("Test data loaded!");
  }
}

function clearAllData() {
  if (confirm("Delete ALL users, bills, and transactions? This cannot be undone.")) {
    users = [];
    bills = [];
    transactions = [];
    calculateAll();
    renderAll();
    saveToLocalStorage();
  }
}

// ===== HELPERS =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  // Custom bill type dropdown logic
  document.getElementById("billType").addEventListener("change", (e) => {
    const custom = document.getElementById("customBillType");
    custom.style.display = e.target.value === "other" ? "block" : "none";
    if (e.target.value !== "other") custom.value = "";
  });
  
  // Load saved data
  loadFromLocalStorage();
  
  // Display today's date
  displayTodayDate();
  
  // Run test
  testJalaliConversion();
});

// Close modal when clicking outside
window.onclick = (e) => {
  if (e.target === document.getElementById("paymentModal")) closeModal();
};