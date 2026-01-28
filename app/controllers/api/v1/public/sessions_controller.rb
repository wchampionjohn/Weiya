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

          event_participant = event.event_participants
            .joins(:participant)
            .find_by("participants.#{field}" => value)

          if event_participant
            session[:event_participant_id] = event_participant.id
            session[:participant_event_id] = event.id

            render json: {
              participant: {
                id: event_participant.participant.id,
                name: event_participant.name
              },
              wins: participant_wins(event_participant)
            }
          else
            render json: { error: "Participant not found" }, status: :not_found
          end
        end

        def destroy
          session.delete(:event_participant_id)
          session.delete(:participant_event_id)
          render json: { message: "Logged out successfully" }
        end

        private

        def participant_wins(event_participant)
          event_participant.winners.includes(:prize).map do |winner|
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
