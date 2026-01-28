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

      it 'creates global participants' do
        expect { subject }.to change(Participant, :count).by(2)
      end

      it 'adds participants to event' do
        expect { subject }.to change(EventParticipant, :count).by(2)
      end

      it 'returns imported count' do
        expect(subject.imported_count).to eq(2)
      end
    end

    context 'with existing participant' do
      let!(:existing_participant) { create(:participant, name: 'John Doe', employee_id: 'E001') }
      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email
          John Doe,E001,0912345678,john@example.com
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'does not create duplicate participant' do
        expect { subject }.not_to change(Participant, :count)
      end

      it 'adds existing participant to event' do
        expect { subject }.to change(EventParticipant, :count).by(1)
        expect(event.participants).to include(existing_participant)
      end
    end

    context 'with participant already in event' do
      let!(:participant) { create(:participant, name: 'John Doe', employee_id: 'E001') }
      let!(:event_participant) { create(:event_participant, event: event, participant: participant) }

      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email
          John Doe,E001,0912345678,john@example.com
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'does not add duplicate event participant' do
        expect { subject }.not_to change(EventParticipant, :count)
      end

      it 'returns success with zero imports' do
        expect(subject.success?).to be true
        expect(subject.imported_count).to eq(0)
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

      it 'does not add any event participants' do
        expect { subject }.not_to change(EventParticipant, :count)
      end
    end

    context 'with duplicate employee_id in CSV' do
      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email
          John Doe,E001,0912345678,john@example.com
          Jane Doe,E001,0923456789,jane@example.com
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'handles duplicate by finding existing participant' do
        expect { subject }.to change(Participant, :count).by(1)
        expect { subject }.not_to change(EventParticipant, :count)
      end
    end

    context 'with mixed valid and invalid data' do
      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email
          John Doe,E001,0912345678,john@example.com
          ,E002,0923456789,jane@example.com
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'rolls back all changes on error' do
        expect { subject }.not_to change(Participant, :count)
        expect { subject }.not_to change(EventParticipant, :count)
      end
    end

    context 'with skip_header option' do
      let(:csv_content) do
        <<~CSV
          John Doe,E001,0912345678,john@example.com
        CSV
      end

      it 'does not skip header when skip_header is false' do
        result = described_class.new(event, csv_content, skip_header: false).call
        expect(result.success?).to be true
        expect(result.imported_count).to eq(1)
      end
    end

    context 'with hire_date and department columns' do
      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email,hire_date,department
          John Doe,E001,0912345678,john@example.com,2020-01-15,Engineering
          Jane Doe,E002,0923456789,jane@example.com,2019-06-01,Marketing
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'imports hire_date correctly' do
        subject
        participant = Participant.find_by(employee_id: 'E001')
        expect(participant.hire_date).to eq(Date.new(2020, 1, 15))
      end

      it 'imports department correctly' do
        subject
        participant = Participant.find_by(employee_id: 'E001')
        expect(participant.department).to eq('Engineering')
      end

      it 'imports all participants with seniority data' do
        expect { subject }.to change(Participant, :count).by(2)
        jane = Participant.find_by(employee_id: 'E002')
        expect(jane.hire_date).to eq(Date.new(2019, 6, 1))
        expect(jane.department).to eq('Marketing')
      end
    end

    context 'with various date formats' do
      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email,hire_date,department
          John Doe,E001,0912345678,john@example.com,2020/01/15,Dept1
          Jane Doe,E002,0923456789,jane@example.com,20190601,Dept2
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'parses YYYY/MM/DD format' do
        subject
        expect(Participant.find_by(employee_id: 'E001').hire_date).to eq(Date.new(2020, 1, 15))
      end

      it 'parses YYYYMMDD format' do
        subject
        expect(Participant.find_by(employee_id: 'E002').hire_date).to eq(Date.new(2019, 6, 1))
      end
    end

    context 'with missing hire_date and department' do
      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email,hire_date,department
          John Doe,E001,0912345678,john@example.com,,
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'imports participant with nil hire_date and department' do
        expect { subject }.to change(Participant, :count).by(1)
        participant = Participant.find_by(employee_id: 'E001')
        expect(participant.hire_date).to be_nil
        expect(participant.department).to be_nil
      end
    end

    context 'with only basic columns (backward compatibility)' do
      let(:csv_content) do
        <<~CSV
          name,employee_id,phone,email
          John Doe,E001,0912345678,john@example.com
        CSV
      end

      subject { described_class.new(event, csv_content).call }

      it 'imports successfully without hire_date and department columns' do
        expect { subject }.to change(Participant, :count).by(1)
        participant = Participant.find_by(employee_id: 'E001')
        expect(participant.hire_date).to be_nil
        expect(participant.department).to be_nil
      end
    end
  end
end
