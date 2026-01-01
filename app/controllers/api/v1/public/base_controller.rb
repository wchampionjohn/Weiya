module Api
  module V1
    module Public
      class BaseController < Api::V1::BaseController
        helper_method :event_verified?

        private

        def current_event_participant
          return @current_event_participant if defined?(@current_event_participant)

          event_participant_id = session[:event_participant_id]
          return @current_event_participant = nil unless event_participant_id

          @current_event_participant = EventParticipant.find_by(id: event_participant_id)
        end

        def event_verified?(event)
          return true if event.password.blank?

          session["event_verified_#{event.id}"] == true
        end
      end
    end
  end
end
