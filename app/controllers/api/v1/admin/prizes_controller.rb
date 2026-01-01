module Api
  module V1
    module Admin
      class PrizesController < BaseController
        before_action :set_event
        before_action :set_prize, only: [:show, :update, :destroy]

        def show
        end

        def create
          @prize = @event.prizes.build(prize_params)
          @prize.position ||= @event.prizes.maximum(:position).to_i + 1

          if @prize.save
            render :show, status: :created
          else
            render json: { errors: @prize.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          unless @event.can_modify_prize?(@prize)
            return render json: { error: "無法修改已開獎的獎項" }, status: :forbidden
          end

          if @prize.update(prize_params)
            render :show
          else
            render json: { errors: @prize.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          unless @event.can_modify_prize?(@prize)
            return render json: { error: "無法刪除已開獎的獎項" }, status: :forbidden
          end

          @prize.destroy
          head :no_content
        end

        def reorder
          unless @event.draft?
            return render json: { error: "僅能在草稿狀態調整獎項順序" }, status: :forbidden
          end

          ActiveRecord::Base.transaction do
            params[:prizes].each do |prize_data|
              prize = @event.prizes.find(prize_data[:id])
              # Skip reordering for prizes that have been drawn
              next if prize.drawn?
              prize.update!(position: prize_data[:position])
            end
          end

          render json: { success: true }
        rescue ActiveRecord::RecordNotFound => e
          render json: { error: "找不到獎項" }, status: :not_found
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.message }, status: :unprocessable_entity
        end

        private

        def set_event
          @event = Event.find(params[:event_id])
        end

        def set_prize
          @prize = @event.prizes.find(params[:id])
        end

        def prize_params
          params.require(:prize).permit(
            :name, :prize_type, :value, :quantity, :taxable, :position,
            :allow_repeat_win_override, :scheduled_at,
            display_fields: [], privacy_settings: {}
          )
        end
      end
    end
  end
end
