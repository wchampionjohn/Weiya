module Api
  module V1
    module Admin
      class PrizeTypesController < BaseController
        before_action :set_prize_type, only: [:update, :destroy]

        def index
          @prize_types = PrizeType.ordered
          render json: @prize_types.map { |pt| prize_type_json(pt) }
        end

        def create
          @prize_type = PrizeType.new(prize_type_params)
          @prize_type.position = PrizeType.maximum(:position).to_i + 1

          if @prize_type.save
            render json: prize_type_json(@prize_type), status: :created
          else
            render json: { errors: @prize_type.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @prize_type.update(prize_type_params)
            render json: prize_type_json(@prize_type)
          else
            render json: { errors: @prize_type.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          unless @prize_type.deletable?
            return render json: { error: "預設獎品類型無法刪除" }, status: :forbidden
          end

          # Return info about prizes that will be affected
          affected_prizes_count = @prize_type.prizes.count

          @prize_type.destroy
          render json: {
            success: true,
            affected_prizes_count: affected_prizes_count
          }
        end

        def check_usage
          prize_type = PrizeType.find(params[:id])
          prizes = prize_type.prizes.includes(:event).limit(10)

          render json: {
            in_use: prize_type.in_use?,
            prizes_count: prize_type.prizes.count,
            sample_prizes: prizes.map { |p| { id: p.id, name: p.name, event_name: p.event.name } }
          }
        end

        private

        def set_prize_type
          @prize_type = PrizeType.find(params[:id])
        end

        def prize_type_params
          params.require(:prize_type).permit(:name, :code)
        end

        def prize_type_json(pt)
          {
            id: pt.id,
            name: pt.name,
            code: pt.code,
            is_default: pt.is_default,
            position: pt.position,
            prizes_count: pt.prizes.count,
            deletable: pt.deletable?
          }
        end
      end
    end
  end
end
