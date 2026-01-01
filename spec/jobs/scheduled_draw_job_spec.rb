require 'rails_helper'

RSpec.describe ScheduledDrawJob, type: :job do
  let(:event) { create(:event, :active) }
  let(:prize) { create(:prize, event: event, quantity: 1) }
  let!(:participants) { create_list(:participant, 3, event: event) }

  describe '#perform' do
    it 'executes the draw' do
      expect {
        described_class.perform_now(prize.id)
      }.to change(Winner, :count).by(1)
    end

    it 'marks prize as drawn' do
      described_class.perform_now(prize.id)
      expect(prize.reload.drawn).to be true
    end

    context 'when prize not found' do
      it 'does not raise error' do
        expect {
          described_class.perform_now(999999)
        }.not_to raise_error
      end
    end

    context 'when prize already drawn' do
      before { prize.update!(drawn: true) }

      it 'does not create winners' do
        expect {
          described_class.perform_now(prize.id)
        }.not_to change(Winner, :count)
      end
    end
  end
end
