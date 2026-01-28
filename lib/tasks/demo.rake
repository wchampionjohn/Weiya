namespace :demo do
  desc "清除 DEMO 資料（活動、參與者、獎項、中獎記錄）"
  task clear: :environment do
    puts "清除 DEMO 資料..."
    Winner.delete_all
    puts "  - 中獎記錄: 已清除"
    Prize.delete_all
    puts "  - 獎項: 已清除"
    EventParticipant.delete_all
    puts "  - 活動參與者: 已清除"
    Event.delete_all
    puts "  - 活動: 已清除"
    Participant.delete_all
    puts "  - 參與者: 已清除"
    puts "完成！"
  end

  desc "建立 DEMO 資料"
  task seed: :environment do
    puts "=" * 50
    puts "建立 DEMO 資料"
    puts "=" * 50

    # Ensure departments exist
    if Department.count == 0
      puts "\n建立部門..."
      [
        { name: "工程部", code: "ENG" },
        { name: "產品部", code: "PRD" },
        { name: "設計部", code: "DSG" },
        { name: "行銷部", code: "MKT" },
        { name: "業務部", code: "SAL" },
        { name: "人資部", code: "HR" }
      ].each { |d| Department.create!(d) }
    end

    departments = Department.all.index_by(&:name)

    # Create participants
    puts "\n建立參與者..."
    participants_data = [
      { name: "王建明", employee_id: "E0001", phone: "0912345001", email: "wang.jm@company.com", dept: "工程部", years: 8 },
      { name: "李淑芬", employee_id: "E0002", phone: "0912345002", email: "li.sf@company.com", dept: "產品部", years: 5 },
      { name: "張志偉", employee_id: "E0003", phone: "0912345003", email: "zhang.zw@company.com", dept: "工程部", years: 3 },
      { name: "陳美玲", employee_id: "E0004", phone: "0912345004", email: "chen.ml@company.com", dept: "設計部", years: 6 },
      { name: "林俊傑", employee_id: "E0005", phone: "0912345005", email: "lin.jj@company.com", dept: "行銷部", years: 2 },
      { name: "黃雅婷", employee_id: "E0006", phone: "0912345006", email: "huang.yt@company.com", dept: "業務部", years: 4 },
      { name: "吳宗翰", employee_id: "E0007", phone: "0912345007", email: "wu.zh@company.com", dept: "工程部", years: 7 },
      { name: "劉怡君", employee_id: "E0008", phone: "0912345008", email: "liu.yj@company.com", dept: "人資部", years: 10 },
      { name: "蔡柏翰", employee_id: "E0009", phone: "0912345009", email: "tsai.bh@company.com", dept: "工程部", years: 1 },
      { name: "楊詩涵", employee_id: "E0010", phone: "0912345010", email: "yang.sh@company.com", dept: "產品部", years: 3 },
      { name: "許家豪", employee_id: "E0011", phone: "0912345011", email: "hsu.jh@company.com", dept: "設計部", years: 5 },
      { name: "鄭佳蓉", employee_id: "E0012", phone: "0912345012", email: "cheng.jr@company.com", dept: "行銷部", years: 2 },
      { name: "謝承翰", employee_id: "E0013", phone: "0912345013", email: "hsieh.ch@company.com", dept: "業務部", years: 6 },
      { name: "郭雅芳", employee_id: "E0014", phone: "0912345014", email: "kuo.yf@company.com", dept: "工程部", years: 4 },
      { name: "洪冠宇", employee_id: "E0015", phone: "0912345015", email: "hong.ky@company.com", dept: "產品部", years: 8 },
      { name: "曾筱涵", employee_id: "E0016", phone: "0912345016", email: "tseng.xh@company.com", dept: "設計部", years: 1 },
      { name: "邱彥廷", employee_id: "E0017", phone: "0912345017", email: "chiu.yt@company.com", dept: "行銷部", years: 3 },
      { name: "廖雅雯", employee_id: "E0018", phone: "0912345018", email: "liao.yw@company.com", dept: "業務部", years: 5 },
      { name: "賴宥廷", employee_id: "E0019", phone: "0912345019", email: "lai.yt@company.com", dept: "人資部", years: 2 },
      { name: "周欣怡", employee_id: "E0020", phone: "0912345020", email: "chou.xy@company.com", dept: "工程部", years: 9 },
      { name: "吳明哲", employee_id: "E0021", phone: "0912345021", email: "wu.mz@company.com", dept: "產品部", years: 4 },
      { name: "林佳穎", employee_id: "E0022", phone: "0912345022", email: "lin.jy@company.com", dept: "設計部", years: 7 },
      { name: "陳威廷", employee_id: "E0023", phone: "0912345023", email: "chen.wt@company.com", dept: "行銷部", years: 1 },
      { name: "張雅琪", employee_id: "E0024", phone: "0912345024", email: "zhang.yq@company.com", dept: "業務部", years: 3 },
      { name: "王俊豪", employee_id: "E0025", phone: "0912345025", email: "wang.jh@company.com", dept: "工程部", years: 6 },
      { name: "李佳玲", employee_id: "E0026", phone: "0912345026", email: "li.jl@company.com", dept: "產品部", years: 2 },
      { name: "黃建華", employee_id: "E0027", phone: "0912345027", email: "huang.jh@company.com", dept: "設計部", years: 11 },
      { name: "劉雅萍", employee_id: "E0028", phone: "0912345028", email: "liu.yp@company.com", dept: "行銷部", years: 4 },
      { name: "蔡明憲", employee_id: "E0029", phone: "0912345029", email: "tsai.mx@company.com", dept: "業務部", years: 8 },
      { name: "楊宗霖", employee_id: "E0030", phone: "0912345030", email: "yang.zl@company.com", dept: "人資部", years: 5 }
    ]

    participants = participants_data.map do |data|
      dept = departments[data[:dept]]
      Participant.create!(
        name: data[:name],
        employee_id: data[:employee_id],
        phone: data[:phone],
        email: data[:email],
        department_id: dept&.id,
        hire_date: Date.today - data[:years].years - rand(0..11).months
      )
    end
    puts "  建立 #{participants.count} 位參與者"

    # Event 1: 2025 尾牙抽獎 (已完成)
    puts "\n建立活動: 2025 尾牙抽獎 (已完成)"
    event1 = Event.create!(
      name: "2025 尾牙抽獎",
      event_date: DateTime.new(2025, 1, 18, 18, 0, 0),
      status: :completed,
      allow_repeat_win: false,
      required_fields: ["name", "employee_id"]
    )
    participants.each { |p| event1.event_participants.create!(participant: p) }

    prizes1 = [
      { name: "參加獎 - 超商禮券", value: 500, quantity: 10, position: 1 },
      { name: "四獎 - 百貨禮券", value: 2000, quantity: 5, position: 2 },
      { name: "三獎 - AirPods", value: 5000, quantity: 3, position: 3 },
      { name: "二獎 - iPad", value: 15000, quantity: 2, position: 4 },
      { name: "頭獎 - iPhone 16 Pro", value: 40000, quantity: 1, position: 5 }
    ].map do |data|
      event1.prizes.create!(
        name: data[:name], value: data[:value], quantity: data[:quantity], position: data[:position],
        display_fields: ["name"], privacy_settings: { "name" => true },
        drawn: true, drawn_at: event1.event_date + (data[:position] * 15).minutes
      )
    end

    available_eps = event1.event_participants.to_a.shuffle
    prizes1.each do |prize|
      prize.quantity.times do
        ep = available_eps.pop
        break unless ep
        Winner.create!(
          prize: prize, event_participant: ep, drawn_at: prize.drawn_at,
          distributed: [true, true, false].sample,
          distributed_at: [true, false].sample ? prize.drawn_at + 1.hour : nil
        )
      end
    end
    puts "  #{event1.prizes.count} 個獎項, #{event1.winners.count} 位中獎者"

    # Event 2: 2026 春酒抽獎 (進行中)
    puts "\n建立活動: 2026 春酒抽獎 (進行中)"
    event2 = Event.create!(
      name: "2026 春酒抽獎",
      event_date: DateTime.now + 1.hour,
      status: :active,
      password: "spring2026",
      allow_repeat_win: false,
      required_fields: ["name", "phone"]
    )
    participants[0..24].each { |p| event2.event_participants.create!(participant: p) }

    base_time = event2.event_date
    [
      { name: "幸運獎 - 禮品袋", value: 300, quantity: 8, position: 1, scheduled_at: base_time + 30.minutes },
      { name: "三獎 - 藍牙喇叭", value: 1500, quantity: 4, position: 2, scheduled_at: base_time + 45.minutes },
      { name: "二獎 - Switch 遊戲", value: 1800, quantity: 2, position: 3, scheduled_at: base_time + 60.minutes },
      { name: "頭獎 - Apple Watch", value: 12000, quantity: 1, position: 4, scheduled_at: base_time + 75.minutes }
    ].each do |data|
      event2.prizes.create!(
        name: data[:name], value: data[:value], quantity: data[:quantity], position: data[:position],
        scheduled_at: data[:scheduled_at], display_fields: ["name"], privacy_settings: { "name" => true }, drawn: false
      )
    end
    puts "  #{event2.prizes.count} 個獎項, #{event2.event_participants.count} 位參與者"
    puts "  密碼: spring2026"

    # Event 3: 2026 尾牙抽獎 (草稿)
    puts "\n建立活動: 2026 尾牙抽獎 (草稿)"
    event3 = Event.create!(
      name: "2026 尾牙抽獎",
      event_date: DateTime.new(2026, 12, 31, 18, 0, 0),
      status: :draft,
      allow_repeat_win: false,
      required_fields: ["name", "employee_id", "email"]
    )
    participants.each { |p| event3.event_participants.create!(participant: p) }

    event3_time = event3.event_date
    [
      { name: "六獎 - 電影票", value: 500, quantity: 15, position: 1, scheduled_at: event3_time + 20.minutes },
      { name: "五獎 - 百貨禮券", value: 1500, quantity: 8, position: 2, scheduled_at: event3_time + 35.minutes },
      { name: "四獎 - 現金紅包", value: 3000, quantity: 5, position: 3, scheduled_at: event3_time + 50.minutes },
      { name: "三獎 - Nintendo Switch", value: 10000, quantity: 3, position: 4, scheduled_at: event3_time + 65.minutes, eligibility: { "min_seniority" => 2 } },
      { name: "二獎 - PlayStation 5", value: 18000, quantity: 2, position: 5, scheduled_at: event3_time + 80.minutes, eligibility: { "min_seniority" => 3 } },
      { name: "頭獎 - MacBook Air", value: 40000, quantity: 1, position: 6, scheduled_at: event3_time + 95.minutes, eligibility: { "min_seniority" => 5 } }
    ].each do |data|
      event3.prizes.create!(
        name: data[:name], value: data[:value], quantity: data[:quantity], position: data[:position],
        scheduled_at: data[:scheduled_at], eligibility_rules: data[:eligibility],
        display_fields: ["name", "employee_id"], privacy_settings: { "name" => true, "employee_id" => false }, drawn: false
      )
    end
    puts "  #{event3.prizes.count} 個獎項, #{event3.event_participants.count} 位參與者"

    # Summary
    puts "\n" + "=" * 50
    puts "DEMO 資料建立完成！"
    puts "=" * 50
    puts "\n活動: #{Event.count} 個"
    puts "參與者: #{Participant.count} 人"
    puts "獎項: #{Prize.count} 個"
    puts "中獎記錄: #{Winner.count} 筆"
    puts "\n登入資訊:"
    puts "  帳號: admin@example.com"
    puts "  密碼: password123"
  end

  desc "重置 DEMO 資料（清除後重新建立）"
  task reset: :environment do
    Rake::Task["demo:clear"].invoke
    puts ""
    Rake::Task["demo:seed"].invoke
  end
end
