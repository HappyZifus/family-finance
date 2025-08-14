import { supabase } from '../supabase/supabaseClient.js'

let currentUser = null
let currentPerson = 'me'
const FamilyMembers = ['me','wife']

// --- Авторизация ---
document.getElementById('loginGoogle').addEventListener('click', async ()=>{
  const { data, error } = await supabase.auth.signInWithOAuth({ provider:'google' })
  if(error) console.error(error)
})

supabase.auth.onAuthStateChange((event, session)=>{
  if(session?.user){
    currentUser = session.user
    document.getElementById('userEmail').textContent = currentUser.email
    loadData()
  }
})

// --- Селекторы пользователя ---
document.getElementById('personMe').addEventListener('click', ()=>selectPerson('me'))
document.getElementById('personWife').addEventListener('click', ()=>selectPerson('wife'))
function selectPerson(person){
  currentPerson = person
  document.getElementById('personMe').classList.toggle('active', person==='me')
  document.getElementById('personWife').classList.toggle('active', person==='wife')
  loadData()
}

// --- Загрузка данных и обновление UI ---
async function loadData(){
  if(!currentUser) return

  const year = new Date().getFullYear()
  const month = new Date().getMonth()+1

  // Здесь ты будешь загружать доходы и расходы из Supabase
  // и пересчитывать верхнюю и нижнюю статистику
  document.getElementById('monthStats').innerHTML = `
    <div class="stat-block">В наличии: 0 €</div>
    <div class="stat-block">Остаток: 0 €</div>
    <div class="stat-block">Процент дохода: 0%</div>
    <div class="stat-block">Общие траты: 0 €</div>
    <div class="stat-block">Честная доля: 0 €</div>
    <div class="stat-block">Разница: 0 €</div>
  `
}

// --- Добавление дохода ---
document.getElementById('addIncome').addEventListener('click', ()=>{
  const div = document.createElement('div')
  div.className = 'income-line'
  div.innerHTML = `<input type="text" placeholder="Источник"><input type="number" placeholder="Сумма (€)"><input type="range" min="0" max="1" step="1">`
  document.getElementById('incomeFields').appendChild(div)
})
