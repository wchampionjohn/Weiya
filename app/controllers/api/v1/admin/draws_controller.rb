module Api
  module V1
    module Admin
      class DrawsController < BaseController
        before_action :set_prize

        def create
          simulate = params[:simulate] == true || params[:simulate] == "true"

          # Skip sequential validation for simulation
          unless simulate
            unless next_prize_to_draw?(@prize)
              return render json: { error: "須按順序開獎，請先完成前面順位的獎項" }, status: :forbidden
            end

            # Real draw only allowed when event is active
            unless @prize.event.active?
              return render json: { error: "活動必須為進行中狀態才能抽獎" }, status: :forbidden
            end
          end

          # Simulation only allowed when event is draft
          if simulate && !@prize.event.draft?
            return render json: { error: "模擬抽獎只能在草稿狀態使用" }, status: :forbidden
          end

          count = params[:count]&.to_i

          result = DrawService.new(@prize, admin: current_admin, count: count, simulate: simulate).call

          if result.success?
            if simulate
              render json: {
                simulated: true,
                prize: { id: @prize.id, name: @prize.name },
                winners: result.winners
              }
            else
              @prize = @prize.reload
              @winners = result.winners
            end
          else
            render json: { error: result.error }, status: :unprocessable_entity
          end
        end

        private

        def set_prize
          @prize = Prize.find(params[:prize_id])
        end

        # Check if the given prize is the next one to be drawn (lowest position among undrawn)
        def next_prize_to_draw?(prize)
          event = prize.event
          next_prize = event.prizes.undrawn.order(:position).first
          next_prize&.id == prize.id
        end
      end
    end
  end
end
