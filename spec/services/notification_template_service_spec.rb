require 'rails_helper'

RSpec.describe NotificationTemplateService do
  let(:event) { create(:event, name: '2025 尾牙抽獎活動') }
  let(:participant) do
    create(:participant,
      name: '王小明',
      employee_id: 'EMP001',
      phone: '0912345678',
      email: 'ming@example.com',
      department: 'Engineering'
    )
  end
  let(:event_participant) { create(:event_participant, event: event, participant: participant) }
  let(:prize) { create(:prize, event: event, name: 'iPhone 15 Pro', value: 35000.to_i) }
  let(:winner) { create(:winner, prize: prize, event_participant: event_participant) }

  describe '.render' do
    it 'replaces all template variables' do
      template = '恭喜 {name} 獲得 {prize}！價值 ${value}'
      result = described_class.render(template, winner)
      expect(result).to match(/恭喜 王小明 獲得 iPhone 15 Pro！價值 \$35000/)
    end

    it 'replaces event name variable' do
      template = '您在 {event_name} 中獲得 {prize}'
      result = described_class.render(template, winner)
      expect(result).to eq('您在 2025 尾牙抽獎活動 中獲得 iPhone 15 Pro')
    end

    it 'replaces contact info variables' do
      template = '員工編號：{employee_id}，電話：{phone}，Email：{email}'
      result = described_class.render(template, winner)
      expect(result).to eq('員工編號：EMP001，電話：0912345678，Email：ming@example.com')
    end

    it 'replaces department variable' do
      template = '部門：{department}'
      result = described_class.render(template, winner)
      expect(result).to eq('部門：Engineering')
    end

    it 'handles missing optional fields' do
      participant.update!(phone: nil, email: nil, department: nil)
      template = '電話：{phone}，Email：{email}，部門：{department}'
      result = described_class.render(template, winner)
      expect(result).to eq('電話：，Email：，部門：')
    end

    it 'returns original template if blank' do
      expect(described_class.render('', winner)).to eq('')
      expect(described_class.render(nil, winner)).to be_nil
    end
  end

  describe '.preview' do
    it 'replaces variables with sample data' do
      template = '恭喜 {name} 獲得 {prize}！'
      sample_data = { 'name' => '測試員工', 'prize' => '測試獎品' }
      result = described_class.preview(template, sample_data)
      expect(result).to eq('恭喜 測試員工 獲得 測試獎品！')
    end

    it 'accepts symbol keys' do
      template = '{name} 獲得 {prize}'
      sample_data = { name: '測試員工', prize: '測試獎品' }
      result = described_class.preview(template, sample_data)
      expect(result).to eq('測試員工 獲得 測試獎品')
    end

    it 'shows placeholder for missing variables' do
      template = '{name} 獲得 {prize}，價值 {value}'
      sample_data = { 'name' => '測試' }
      result = described_class.preview(template, sample_data)
      expect(result).to eq('測試 獲得 [prize]，價值 [value]')
    end

    it 'returns original template if blank' do
      expect(described_class.preview('', {})).to eq('')
      expect(described_class.preview(nil, {})).to be_nil
    end

    it 'handles all allowed variables' do
      template = '{name} {prize} {value} {event_name} {employee_id} {phone} {email} {department}'
      sample_data = {
        'name' => 'N',
        'prize' => 'P',
        'value' => 'V',
        'event_name' => 'E',
        'employee_id' => 'I',
        'phone' => 'H',
        'email' => 'M',
        'department' => 'D'
      }
      result = described_class.preview(template, sample_data)
      expect(result).to eq('N P V E I H M D')
    end
  end
end
