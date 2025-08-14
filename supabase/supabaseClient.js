
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mlkkehhdymhqctxlioov.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Загрузка данных за месяц и пользователя
export async function loadDataFromSupabase(year, month, currentPerson) {
  // Доходы
  const { data: incomeData, error: incomeError } = await supabase
    .from('Income')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('person', currentPerson);
  if (incomeError) console.error('Income load error:', incomeError);

  // Расходы
  const { data: payableData, error: payableError } = await supabase
    .from('Payable')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('person', currentPerson);
  if (payableError) console.error('Payable load error:', payableError);

  // Наличные
  const { data: cashData, error: cashError } = await supabase
    .from('TotalCash')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('person', currentPerson);
  if (cashError) console.error('TotalCash load error:', cashError);

  return { incomeData, payableData, cashData };
}

// Сохранение данных
export async function saveDataToSupabase(year, month, currentPerson, incomeArr, payableArr, cashAmount) {
  // Доходы
  for (let inc of incomeArr) {
    await supabase
      .from('Income')
      .upsert({ ...inc, year, month, person: currentPerson }, { onConflict: ['year','month','person','source'] });
  }

  // Расходы
  for (let p of payableArr) {
    await supabase
      .from('Payable')
      .upsert({ ...p, year, month, person: currentPerson }, { onConflict: ['year','month','person','id'] });
  }

  // Наличные
  await supabase
    .from('TotalCash')
    .upsert({ year, month, person: currentPerson, amount: cashAmount }, { onConflict: ['year','month','person'] });
}
