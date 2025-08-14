import { supabase } from './supabase/supabaseClient.js'

let currentUserId = null
let currentYear = new Date().getFullYear()
let currentMonth = 1

document.addEventListener('DOMContentLoaded', async () => {
  await setupPersonSelectors()
  setupMonthYearSelectors()
  // default select first user
  const firstBtn = document.querySelector('.selector-block')
  if (firstBtn) firstBtn.click()
})

async function setupPersonSelectors() {
  // fetch all users
  const { data: users, error } = await supabase.from('users').select('*')
  if (error) {
    console.error('Users fetch error:', error)
    return
  }

  const container = document.getElementById('personSelectors')
  container.innerHTML = ''

  users.forEach(user => {
    const btn = document.createElement('div')
    btn.className = 'selector-block'
    btn.id = `user-${user.id}`
    btn.textContent = user.name
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.selector-block').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentUserId = user.id
      await loadData()
    })
    container.appendChild(btn)
  })
}

function setupMonthYearSelectors() {
  const monthSelect = document.getElementById('monthSelect')
  const yearSelect = document.getElementById('yearSelect')

  if (monthSelect) {
    for (let i = 1; i <= 12; i++) {
      const opt = document.createElement('option')
      opt.value = i
      opt.textContent = i
      if (i === currentMonth) opt.selected = true
      monthSelect.appendChild(opt)
    }
    monthSelect.addEventListener('change', async () => {
      currentMonth = parseInt(monthSelect.value)
      await loadData()
    })
  }

  if (yearSelect) {
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      const opt = document.createElement('option')
      opt.value = i
      opt.textContent = i
      if (i === currentYear) opt.selected = true
      yearSelect.appendChild(opt)
    }
    yearSelect.addEventListener('change', async () => {
      currentYear = parseInt(yearSelect.value)
      await loadData()
    })
  }
}

async function loadData() {
  if (!currentUserId) return
  console.log(`Fetching data for user ${currentUserId} ${currentMonth}/${currentYear}`)

  // Income
  const { data: incomeData, error: incomeError } = await supabase
    .from('income')
    .select('*, users(name)')
    .eq('user_id', currentUserId)
    .eq('year', currentYear)
    .eq('month', currentMonth)

  if (incomeError) return console.error('Income fetch error:', incomeError)

  // Expenses
  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .select('*, users(name)')
    .eq('user_id', currentUserId)
    .eq('year', currentYear)
    .eq('month', currentMonth)

  if (expenseError) return console.error('Expense fetch error:', expenseError)

  renderIncome(incomeData)
  renderExpenses(expenseData)
}

function renderIncome(list) {
  const container = document.getElementById('incomeList')
  container.innerHTML = ''
  list.forEach(item => {
    const div = document.createElement('div')
    div.className = 'income-item'
    div.textContent = `${item.source}: ${item.amount}`
    container.appendChild(div)
  })
}

function renderExpenses(list) {
  const container = document.getElementById('expenseList')
  container.innerHTML = ''
  list.forEach(item => {
    const div = document.createElement('div')
    div.className = 'expense-item'
    div.textContent = `${item.type}: ${item.amount}`
    container.appendChild(div)
  })
}
