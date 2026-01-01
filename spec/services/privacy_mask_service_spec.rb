require 'rails_helper'

RSpec.describe PrivacyMaskService do
  describe '.mask' do
    context 'with name field' do
      it 'masks single character names' do
        expect(described_class.mask('王', 'name')).to eq('王')
      end

      it 'masks two character names' do
        expect(described_class.mask('王明', 'name')).to eq('王○')
      end

      it 'masks three or more character names' do
        expect(described_class.mask('王小明', 'name')).to eq('王○明')
      end
    end

    context 'with phone field' do
      it 'masks phone numbers' do
        expect(described_class.mask('0912345678', 'phone')).to eq('0912-XXX-678')
      end

      it 'returns short phones unchanged' do
        expect(described_class.mask('12345', 'phone')).to eq('12345')
      end
    end

    context 'with email field' do
      it 'masks email addresses' do
        expect(described_class.mask('john@example.com', 'email')).to eq('jo***@example.com')
      end

      it 'handles short local parts' do
        expect(described_class.mask('a@example.com', 'email')).to eq('a***@example.com')
      end
    end

    context 'with employee_id field' do
      it 'masks employee IDs' do
        expect(described_class.mask('E12345', 'employee_id')).to eq('E1****')
      end
    end

    context 'with blank values' do
      it 'returns blank values unchanged' do
        expect(described_class.mask(nil, 'name')).to be_nil
        expect(described_class.mask('', 'name')).to eq('')
      end
    end
  end
end
