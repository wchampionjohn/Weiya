module Api
  module V1
    module Admin
      class WinnersController < BaseController
        before_action :set_winner, only: [:update]

        def index
          @winners = Winner.includes(:prize, event_participant: :participant)
                           .joins(:prize)
                           .order("prizes.position ASC, winners.drawn_at DESC")

          @winners = @winners.where(prizes: { event_id: params[:event_id] }) if params[:event_id]
          @winners = @winners.where(distributed: params[:distributed] == "true") if params[:distributed].present?
        end

        def update
          if params[:distributed] == true || params[:distributed] == "true"
            @winner.mark_distributed!(current_admin)
          elsif params[:notification_requested].present?
            @winner.update!(notification_requested: params[:notification_requested])
          end
        end

        private

        def set_winner
          @winner = Winner.find(params[:id])
        end
      end
    end
  end
end
