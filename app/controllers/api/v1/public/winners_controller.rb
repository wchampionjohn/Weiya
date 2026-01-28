module Api
  module V1
    module Public
      class WinnersController < BaseController
        before_action :set_event
        before_action :require_published!
        before_action :verify_event_access!

        def index
          @winners = @event.winners
                           .includes(:prize, event_participant: :participant)
                           .joins(:prize)
                           .order("prizes.position ASC, winners.drawn_at DESC")
        end

        private

        def set_event
          @event = Event.find(params[:event_id])
        end

        def require_published!
          return if @event.active? || @event.completed?

          render json: { error: "活動不存在" }, status: :not_found
        end

        def verify_event_access!
          return if event_verified?(@event)

          render json: { error: "需要密碼", password_required: true }, status: :forbidden
        end
      end
    end
  end
end
