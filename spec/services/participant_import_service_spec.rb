require 'rails_helper'

RSpec.describe ParticipantImportService do
  let(:event) { create(:event, required_fields: ['name', 'employee_id']) }

  describe '#call' do
    context 'with valid CSV' do
      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email
          John Doe,E001,0912345678,john@example.com
          Jane Doe,E002,0923456789,jane@example.com
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'returns success' do
        expect(subject.success?).to be true
      end

      it 'imports participants' do
        expect { subject }.to change(Participant, :count).by(2)
      end

      it 'returns imported count' do
        expect(subject.imported_count).to eq(2)
      end
    end

    context 'with invalid data' do
      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email
          ,E001,0912345678,john@example.com
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'returns failure' do
        expect(subject.success?).to be false
      end

      it 'includes error details' do
        expect(subject.errors).not_to be_empty
      end

      it 'does not import any participants' do
        expect { subject }.not_to change(Participant, :count)
      end
    end
  end
end
