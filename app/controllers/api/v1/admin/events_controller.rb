module Api
  module V1
    module Admin
      class EventsController < BaseController
        before_action :set_event, only: [:show, :update, :destroy, :publish, :generate_slug, :clear_slug]

        def index
          @events = Event.order(created_at: :desc)
        end

        def show
          @event = Event.includes(:prizes, event_participants: :participant).find(params[:id])
        end

        def create
          @event = Event.new(event_params)

          if @event.save
            render :show, status: :created
          else
            render json: { errors: @event.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          unless @event.editable? || @event.active?
            return render json: { error: "無法修改已完成的活動" }, status: :forbidden
          end

          if @event.update(event_params)
            render :show
          else
            render json: { errors: @event.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          unless @event.editable?
            return render json: { error: "無法刪除非草稿活動" }, status: :forbidden
          end

          @event.destroy
          head :no_content
        end

        def publish
          unless @event.draft?
            return render json: { error: "只有草稿活動可以發佈" }, status: :unprocessable_entity
          end

          if @event.update(status: :active)
            render :show
          else
            render json: { errors: @event.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def generate_slug
          @event.generate_slug!
          render :show
        end

        def clear_slug
          @event.clear_slug!
          render :show
        end

        private

        def set_event
          @event = Event.find(params[:id])
        end

        def event_params
          params.require(:event).permit(
            :name, :event_date, :password, :allow_repeat_win, :privacy_enabled, :public_access_enabled,
            required_fields: [], display_fields: [], privacy_settings: {}
          )
        end
      end
    end
  end
end
