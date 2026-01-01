module Api
  module V1
    module Public
      class SessionsController < BaseController
        def create
          event = Event.find(params[:event_id])
          field = params[:field]
          value = params[:value]

          unless event.required_fields.include?(field)
            return render json: { error: "Invalid login field" }, status: :bad_request
          end

          participant = event.participants.find_by(field => value)

          if participant
            session[:participant_id] = participant.id
            session[:participant_event_id] = event.id

            render json: {
              participant: {
                id: participant.id,
                name: participant.name
              },
              wins: participant_wins(participant)
            }
          else
            render json: { error: "Participant not found" }, status: :not_found
          end
        end

        def destroy
          session.delete(:participant_id)
          session.delete(:participant_event_id)
          render json: { message: "Logged out successfully" }
        end

        private

        def participant_wins(participant)
          participant.winners.includes(prize: :event).map do |winner|
            {
              id: winner.id,
              prize: {
                id: winner.prize.id,
                name: winner.prize.name,
                value: winner.prize.value
              },
              drawn_at: winner.drawn_at,
              distributed: winner.distributed
            }
          end
        end
      end
    end
  end
end
