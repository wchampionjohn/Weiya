# Create test admin
admin = Admin.find_or_create_by!(email: "admin@example.com") do |a|
  a.password = "password123"
end

puts "建立管理員: #{admin.email}"

# Generate participant data
def generate_participants(count)
  surnames = %w[王 李 張 陳 林 黃 吳 劉 蔡 楊 許 鄭 謝 郭 洪 曾 邱 廖 賴 周]
  given_names = %w[志明 美華 建國 淑芬 俊傑 雅婷 家豪 怡君 宗翰 佳蓉 冠宇 詩涵 柏翰 雅芳 承翰 欣怡 彥廷 雅雯 宥廷 筱涵]

  (1..count).map do |i|
    surname = surnames.sample
    given = given_names.sample
    {
      name: "#{surname}#{given}",
      employee_id: "E#{i.to_s.rjust(4, '0')}",
      phone: "09#{rand(10000000..99999999)}",
      email: "employee#{i}@company.com"
    }
  end
end

# Create global participants pool
puts "\n建立參與者資料..."
participants_data = generate_participants(100)
participants = participants_data.map do |data|
  Participant.find_or_create_by!(employee_id: data[:employee_id]) do |p|
    p.name = data[:name]
    p.phone = data[:phone]
    p.email = data[:email]
  end
end
puts "建立了 #{participants.count} 位參與者"

# Create Event 1: 2024 尾牙抽獎 (已完成)
event1 = Event.find_or_create_by!(name: "2024 尾牙抽獎") do |e|
  e.event_date = DateTime.new(2024, 12, 31, 18, 0, 0)
  e.status = :completed
  e.allow_repeat_win = false
  e.required_fields = ["name", "employee_id"]
end

puts "\n建立活動: #{event1.name}"

# Add participants to event 1 (first 50)
participants[0..49].each do |participant|
  event1.event_participants.find_or_create_by!(participant: participant)
end
puts "  加入 #{event1.event_participants.count} 位參與者"

# Create prizes for event 1
# Order: small prizes first (position 1) → big prizes last
prizes1_data = [
  { name: "五獎 - 禮券", prize_type: :gift, value: 1000, quantity: 20, position: 1, display_fields: ["name"], privacy_settings: { "name" => true } },
  { name: "四獎 - 現金紅包", prize_type: :cash, value: 3000, quantity: 10, position: 2, display_fields: ["name", "employee_id"], privacy_settings: { "name" => true, "employee_id" => false } },
  { name: "三獎 - AirPods Pro", prize_type: :gift, value: 8000, quantity: 5, position: 3, display_fields: ["name"], privacy_settings: { "name" => true } },
  { name: "二獎 - iPad Air", prize_type: :gift, value: 20000, quantity: 2, position: 4, display_fields: ["name", "employee_id"], privacy_settings: { "name" => true, "employee_id" => true } },
  { name: "頭獎 - iPhone 15 Pro", prize_type: :gift, value: 40000, quantity: 1, position: 5, display_fields: ["name"], privacy_settings: { "name" => true } }
]

prizes1_data.each do |prize_data|
  event1.prizes.find_or_create_by!(name: prize_data[:name]) do |p|
    p.prize_type = prize_data[:prize_type]
    p.value = prize_data[:value]
    p.quantity = prize_data[:quantity]
    p.position = prize_data[:position]
    p.display_fields = prize_data[:display_fields]
    p.privacy_settings = prize_data[:privacy_settings]
    p.drawn = true
    p.drawn_at = event1.event_date
  end
end
puts "  建立 #{event1.prizes.count} 個獎項"

# Create winners for event 1
event1.prizes.each do |prize|
  eligible = event1.event_participants.where.not(id: Winner.select(:event_participant_id))
  selected = eligible.sample(prize.quantity)
  selected.each do |ep|
    Winner.find_or_create_by!(prize: prize, event_participant: ep) do |w|
      w.drawn_at = event1.event_date
      w.distributed = [true, false].sample
      w.distributed_at = w.distributed ? event1.event_date + 1.hour : nil
    end
  end
end
puts "  建立 #{event1.winners.count} 位中獎者"

# Create Event 2: 2025 春酒抽獎 (進行中)
event2 = Event.find_or_create_by!(name: "2025 春酒抽獎") do |e|
  e.event_date = DateTime.new(2025, 2, 15, 18, 0, 0)
  e.status = :active
  e.password = "spring2025"
  e.allow_repeat_win = true
  e.required_fields = ["name", "phone"]
end

puts "\n建立活動: #{event2.name}"

# Add participants to event 2 (30-80)
participants[30..79].each do |participant|
  event2.event_participants.find_or_create_by!(participant: participant)
end
puts "  加入 #{event2.event_participants.count} 位參與者"

# Create prizes for event 2
# Order: small prizes first (position 1) → big prizes last
prizes2_data = [
  { name: "參加獎 - 精美禮品", prize_type: :gift, value: 500, quantity: 30, position: 1, display_fields: ["name"], privacy_settings: { "name" => true } },
  { name: "三獎 - 百貨禮券", prize_type: :gift, value: 2000, quantity: 10, position: 2, display_fields: ["name"], privacy_settings: { "name" => true } },
  { name: "二獎 - 現金獎", prize_type: :cash, value: 5000, quantity: 5, position: 3, display_fields: ["name", "employee_id"], privacy_settings: { "name" => true, "employee_id" => true } },
  { name: "頭獎 - Apple Watch", prize_type: :gift, value: 15000, quantity: 3, position: 4, display_fields: ["name"], privacy_settings: { "name" => true } },
  { name: "特獎 - MacBook Pro", prize_type: :gift, value: 80000, quantity: 1, position: 5, display_fields: ["name", "phone"], privacy_settings: { "name" => true, "phone" => true } }
]

prizes2_data.each do |prize_data|
  event2.prizes.find_or_create_by!(name: prize_data[:name]) do |p|
    p.prize_type = prize_data[:prize_type]
    p.value = prize_data[:value]
    p.quantity = prize_data[:quantity]
    p.position = prize_data[:position]
    p.display_fields = prize_data[:display_fields]
    p.privacy_settings = prize_data[:privacy_settings]
    p.drawn = false
  end
end
puts "  建立 #{event2.prizes.count} 個獎項"

# Create Event 3: 2025 尾牙抽獎 (草稿)
event3 = Event.find_or_create_by!(name: "2025 尾牙抽獎") do |e|
  e.event_date = DateTime.new(2025, 12, 31, 18, 0, 0)
  e.status = :draft
  e.allow_repeat_win = false
  e.required_fields = ["name", "employee_id", "email"]
end

puts "\n建立活動: #{event3.name}"

# Add participants to event 3 (all 100)
participants.each do |participant|
  event3.event_participants.find_or_create_by!(participant: participant)
end
puts "  加入 #{event3.event_participants.count} 位參與者"

# Create prizes for event 3
# Order: small prizes first (position 1) → big prizes last
prizes3_data = [
  { name: "六獎 - 電影票", prize_type: :gift, value: 500, quantity: 50, position: 1 },
  { name: "五獎 - 百貨禮券", prize_type: :gift, value: 2000, quantity: 20, position: 2 },
  { name: "四獎 - 現金紅包", prize_type: :cash, value: 5000, quantity: 10, position: 3 },
  { name: "三獎 - Switch 遊戲機", prize_type: :gift, value: 10000, quantity: 5, position: 4 },
  { name: "二獎 - PlayStation 5", prize_type: :gift, value: 18000, quantity: 3, position: 5 },
  { name: "頭獎 - iPhone 16 Pro Max", prize_type: :gift, value: 50000, quantity: 2, position: 6 },
  { name: "超級大獎 - 海外旅遊", prize_type: :gift, value: 100000, quantity: 1, position: 7 }
]

prizes3_data.each do |prize_data|
  event3.prizes.find_or_create_by!(name: prize_data[:name]) do |p|
    p.prize_type = prize_data[:prize_type]
    p.value = prize_data[:value]
    p.quantity = prize_data[:quantity]
    p.position = prize_data[:position]
    p.display_fields = ["name"]
    p.privacy_settings = { "name" => true }
    p.drawn = false
  end
end
puts "  建立 #{event3.prizes.count} 個獎項"

# Create Event 4: 部門聚餐抽獎 (草稿 - 測試拖曳排序)
event4 = Event.find_or_create_by!(name: "部門聚餐抽獎") do |e|
  e.event_date = DateTime.new(2026, 3, 15, 19, 0, 0)
  e.status = :draft
  e.allow_repeat_win = false
  e.required_fields = ["name", "department"]
end

puts "\n建立活動: #{event4.name}"

# Add participants to event 4 (first 30)
participants[0..29].each do |participant|
  event4.event_participants.find_or_create_by!(participant: participant)
end
puts "  加入 #{event4.event_participants.count} 位參與者"

# Create prizes for event 4 (fewer prizes for easier testing)
# Order: small prizes first (position 1) → big prizes last
prizes4_data = [
  { name: "E獎 - 文具組", prize_type: :gift, value: 200, quantity: 10, position: 1 },
  { name: "D獎 - 現金紅包", prize_type: :cash, value: 500, quantity: 10, position: 2 },
  { name: "C獎 - 咖啡禮盒", prize_type: :gift, value: 800, quantity: 5, position: 3 },
  { name: "B獎 - 行動電源", prize_type: :gift, value: 1500, quantity: 3, position: 4 },
  { name: "A獎 - 藍牙耳機", prize_type: :gift, value: 3000, quantity: 2, position: 5 },
]

prizes4_data.each do |prize_data|
  event4.prizes.find_or_create_by!(name: prize_data[:name]) do |p|
    p.prize_type = prize_data[:prize_type]
    p.value = prize_data[:value]
    p.quantity = prize_data[:quantity]
    p.position = prize_data[:position]
    p.display_fields = ["name"]
    p.privacy_settings = { "name" => true }
    p.drawn = false
  end
end
puts "  建立 #{event4.prizes.count} 個獎項"

# Create Event 5: 團建抽獎活動 (草稿 - 更多獎項測試)
event5 = Event.find_or_create_by!(name: "團建抽獎活動") do |e|
  e.event_date = DateTime.new(2026, 5, 1, 14, 0, 0)
  e.status = :draft
  e.allow_repeat_win = true
  e.required_fields = ["name", "phone"]
end

puts "\n建立活動: #{event5.name}"

# Add participants to event 5 (40-70)
participants[40..69].each do |participant|
  event5.event_participants.find_or_create_by!(participant: participant)
end
puts "  加入 #{event5.event_participants.count} 位參與者"

# Create prizes for event 5 (more prizes with various values)
# Order: small prizes first (position 1) → big prizes last
prizes5_data = [
  { name: "參加獎 - 精美小禮", prize_type: :gift, value: 100, quantity: 20, position: 1 },
  { name: "幸運獎 - 超商禮券", prize_type: :gift, value: 500, quantity: 10, position: 2 },
  { name: "銅獎 - 隨身碟 256GB", prize_type: :gift, value: 1500, quantity: 5, position: 3 },
  { name: "特別獎 - 現金獎", prize_type: :cash, value: 2000, quantity: 5, position: 4 },
  { name: "銀獎 - 電競滑鼠", prize_type: :gift, value: 3000, quantity: 3, position: 5 },
  { name: "金獎 - 無線耳機", prize_type: :gift, value: 8000, quantity: 2, position: 6 },
  { name: "白金獎 - 智慧手錶", prize_type: :gift, value: 12000, quantity: 1, position: 7 },
]

prizes5_data.each do |prize_data|
  event5.prizes.find_or_create_by!(name: prize_data[:name]) do |p|
    p.prize_type = prize_data[:prize_type]
    p.value = prize_data[:value]
    p.quantity = prize_data[:quantity]
    p.position = prize_data[:position]
    p.display_fields = ["name", "phone"]
    p.privacy_settings = { "name" => true, "phone" => true }
    p.drawn = false
  end
end
puts "  建立 #{event5.prizes.count} 個獎項"

# Create Event 6: 簡易測試活動 (草稿 - 最少獎項)
event6 = Event.find_or_create_by!(name: "簡易測試活動") do |e|
  e.event_date = DateTime.new(2026, 6, 1, 10, 0, 0)
  e.status = :draft
  e.allow_repeat_win = false
  e.required_fields = ["name"]
end

puts "\n建立活動: #{event6.name}"

# Add participants to event 6 (first 20)
participants[0..19].each do |participant|
  event6.event_participants.find_or_create_by!(participant: participant)
end
puts "  加入 #{event6.event_participants.count} 位參與者"

# Create prizes for event 6 (just 3 prizes for simple testing)
# Order: small prizes first (position 1) → big prizes last
prizes6_data = [
  { name: "第三獎", prize_type: :cash, value: 200, quantity: 5, position: 1 },
  { name: "第二獎", prize_type: :cash, value: 500, quantity: 2, position: 2 },
  { name: "第一獎", prize_type: :cash, value: 1000, quantity: 1, position: 3 },
]

prizes6_data.each do |prize_data|
  event6.prizes.find_or_create_by!(name: prize_data[:name]) do |p|
    p.prize_type = prize_data[:prize_type]
    p.value = prize_data[:value]
    p.quantity = prize_data[:quantity]
    p.position = prize_data[:position]
    p.display_fields = ["name"]
    p.privacy_settings = { "name" => true }
    p.drawn = false
  end
end
puts "  建立 #{event6.prizes.count} 個獎項"

puts "\n" + "=" * 50
puts "Seed 完成!"
puts "=" * 50
puts "\n管理員登入資訊:"
puts "  Email: admin@example.com"
puts "  密碼:  password123"
puts "\n活動資訊:"
puts "  1. #{event1.name} (#{event1.status}) - #{event1.event_participants.count} 位參與者"
puts "  2. #{event2.name} (#{event2.status}) - #{event2.event_participants.count} 位參與者 - 密碼: spring2025"
puts "  3. #{event3.name} (#{event3.status}) - #{event3.event_participants.count} 位參與者 - #{event3.prizes.count} 個獎項"
puts "  4. #{event4.name} (#{event4.status}) - #{event4.event_participants.count} 位參與者 - #{event4.prizes.count} 個獎項 [測試拖曳]"
puts "  5. #{event5.name} (#{event5.status}) - #{event5.event_participants.count} 位參與者 - #{event5.prizes.count} 個獎項 [測試拖曳]"
puts "  6. #{event6.name} (#{event6.status}) - #{event6.event_participants.count} 位參與者 - #{event6.prizes.count} 個獎項 [測試拖曳]"
puts "\n參與者總數: #{Participant.count}"
puts "中獎紀錄數: #{Winner.count}"
