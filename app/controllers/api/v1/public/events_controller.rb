module Api
  module V1
    module Public
      class EventsController < BaseController
        before_action :set_event
        before_action :require_published!
        before_action :require_public_access!
        before_action :verify_event_access!, only: [:show]

        def show
          # @event is already set by before_action, just eager load associations
          @event = Event.includes(prizes: { winners: { event_participant: :participant } }).find(@event.id)
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
          @event = Event.find_by_slug_or_id(params[:id])
          render json: { error: "活動不存在" }, status: :not_found unless @event
        end

        def require_published!
          # Allow draft events for preview mode
          return if @event.draft? || @event.active? || @event.completed?

          render json: { error: "活動不存在" }, status: :not_found
        end

        def require_public_access!
          return if @event.draft? || @event.public_access_enabled

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
