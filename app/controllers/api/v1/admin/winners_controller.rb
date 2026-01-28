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
          @winners = @winners.where(prize_id: params[:prize_id]) if params[:prize_id].present?
        end

        def update
          if params[:distributed] == true || params[:distributed] == "true"
            @winner.mark_distributed!(current_admin)
          elsif params[:notification_requested].present?
            @winner.update!(notification_requested: params[:notification_requested])
          end
        end

        # Phase 2: Batch distribute
        def batch_distribute
          winner_ids = params[:winner_ids] || []

          if winner_ids.empty?
            return render json: { error: '請選擇至少一筆中獎記錄' }, status: :unprocessable_entity
          end

          options = {
            distribute: params[:distribute] != false && params[:distribute] != "false",
            send_sms: params[:send_sms] == true || params[:send_sms] == "true",
            send_email: params[:send_email] == true || params[:send_email] == "true",
            sms_template: params[:sms_template],
            email_template: params[:email_template]
          }

          service = WinnerBatchDistributeService.new(winner_ids, options)
          result = service.execute.result

          render json: {
            distributed_count: result[:distributed_count],
            skipped_count: result[:skipped_count],
            notified_count: result[:notified_count],
            sms_sent_count: result[:sms_sent_count],
            email_sent_count: result[:email_sent_count],
            winners: result[:winners].map { |w| winner_json(w) }
          }
        end

        private

        def winner_json(winner)
          {
            id: winner.id,
            prize_id: winner.prize_id,
            distributed: winner.distributed?,
            distributed_at: winner.distributed_at,
            participant: {
              id: winner.event_participant.participant.id,
              name: winner.event_participant.participant.name
            }
          }
        end

        def set_winner
          @winner = Winner.find(params[:id])
        end
      end
    end
  end
end
