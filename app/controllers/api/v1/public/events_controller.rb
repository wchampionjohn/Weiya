module Api
  module V1
    module Public
      class EventsController < BaseController
        before_action :set_event
        before_action :require_published!
        before_action :verify_event_access!, only: [:show]

        def show
          @event = Event.includes(prizes: { winners: { event_participant: :participant } }).find(params[:id])
        end

        def verify
          if @event.password.blank?
            session["event_verified_#{@event.id}"] = true
            return render json: { verified: true }
          end

          if params[:password] == @event.password
            session["event_verified_#{@event.id}"] = true
            render json: { verified: true }
          else
            render json: { error: "密碼錯誤", verified: false }, status: :unauthorized
          end
        end

        def status
          render json: {
            id: @event.id,
            name: @event.name,
            status: @event.status,
            password_required: @event.has_password? && !event_verified?(@event)
          }
        end

        private

        def set_event
          @event = Event.find(params[:id])
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
