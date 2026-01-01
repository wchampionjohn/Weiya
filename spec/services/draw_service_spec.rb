require 'rails_helper'

RSpec.describe DrawService do
  let(:event) { create(:event, :active) }
  let(:prize) { create(:prize, event: event, quantity: 2) }
  let!(:participants) { create_list(:participant, 5, event: event) }

  describe '#call' do
    subject { described_class.new(prize).call }

    it 'returns success result' do
      expect(subject.success?).to be true
    end

    it 'creates winners' do
      expect { subject }.to change(Winner, :count).by(2)
    end

    it 'returns drawn winners' do
      expect(subject.winners.size).to eq(2)
    end

    it 'marks prize as drawn when all spots filled' do
      subject
      expect(prize.reload.drawn).to be true
    end

    context 'when prize already drawn' do
      before { prize.update!(drawn: true) }

      it 'returns failure' do
        expect(subject.success?).to be false
        expect(subject.error).to eq('Prize already drawn')
      end
    end

    context 'when no eligible participants' do
      before { Participant.destroy_all }

      it 'returns failure' do
        expect(subject.success?).to be false
        expect(subject.error).to eq('No eligible participants')
      end
    end

    context 'with count parameter' do
      subject { described_class.new(prize, count: 1).call }

      it 'draws specified number of winners' do
        expect(subject.winners.size).to eq(1)
      end

      it 'does not mark prize as drawn if more spots remain' do
        subject
        expect(prize.reload.drawn).to be false
      end
    end
  end
end
