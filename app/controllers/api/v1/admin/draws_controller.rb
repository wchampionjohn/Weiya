module Api
  module V1
    module Admin
      class DrawsController < BaseController
        before_action :set_prize

        def create
          # Validate sequential drawing: must draw prizes in position order
          unless next_prize_to_draw?(@prize)
            return render json: { error: "須按順序開獎，請先完成前面順位的獎項" }, status: :forbidden
          end

          count = params[:count]&.to_i

          result = DrawService.new(@prize, admin: current_admin, count: count).call

          if result.success?
            @prize = @prize.reload
            @winners = result.winners
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
