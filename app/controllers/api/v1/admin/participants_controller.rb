module Api
  module V1
    module Admin
      class ParticipantsController < BaseController
        before_action :set_event, only: [:event_participants, :add_to_event, :remove_from_event, :import]
        before_action :set_participant, only: [:show, :update, :destroy]

        # GET /api/v1/admin/participants - Global participant list
        def index
          @participants = Participant.includes(:department).search(params[:q]).order(:name)
          @participants = @participants.page(params[:page]).per(params[:per_page] || 20) if params[:page]
        end

        # GET /api/v1/admin/participants/:id
        def show
        end

        # POST /api/v1/admin/participants - Create global participant
        def create
          @participant = Participant.new(participant_params)

          if @participant.save
            render :show, status: :created
          else
            render json: { errors: @participant.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/admin/participants/:id
        def update
          if @participant.update(participant_params)
            render :show
          else
            render json: { errors: @participant.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/admin/participants/:id
        def destroy
          if @participant.winners.any?
            return render json: { error: "無法刪除有中獎紀錄的參與者" }, status: :forbidden
          end

          @participant.destroy
          head :no_content
        end

        # GET /api/v1/admin/events/:event_id/participants - Event participants
        def event_participants
          # Get IDs of event_participants who have already won
          won_ids = Winner.joins(:prize)
                          .where(prizes: { event_id: @event.id })
                          .select(:event_participant_id)

          # Sort non-winners first, then by name
          @event_participants = @event.event_participants
                                      .joins(:participant)
                                      .includes(participant: :department)
                                      .left_joins(:winners)
                                      .select("DISTINCT ON (event_participants.id) event_participants.*, participants.name AS participant_name, CASE WHEN event_participants.id IN (#{won_ids.to_sql}) THEN 1 ELSE 0 END AS won_order")
                                      .order("event_participants.id, won_order ASC, participant_name ASC")
        end

        # POST /api/v1/admin/events/:event_id/participants/:id/add
        def add_to_event
          participant = Participant.find(params[:id])
          @event_participant = @event.event_participants.build(participant: participant)

          if @event_participant.save
            render :event_participant, status: :created
          else
            render json: { errors: @event_participant.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/admin/events/:event_id/participants/:id/remove
        def remove_from_event
          event_participant = @event.event_participants.find_by!(participant_id: params[:id])

          if event_participant.winners.any?
            return render json: { error: "無法移除有中獎紀錄的參與者" }, status: :forbidden
          end

          event_participant.destroy
          head :no_content
        end

        # POST /api/v1/admin/events/:event_id/participants/import
        def import
          unless params[:file]
            return render json: { error: "未上傳檔案" }, status: :bad_request
          end

          content = params[:file].read
          result = ParticipantImportService.new(@event, content).call

          if result.success?
            render json: { imported_count: result.imported_count }
          else
            render json: { errors: result.errors }, status: :unprocessable_entity
          end
        end

        private

        def set_event
          @event = Event.find(params[:event_id])
        end

        def set_participant
          @participant = Participant.includes(:department).find(params[:id])
        end

        def participant_params
          params.require(:participant).permit(:name, :employee_id, :phone, :email, :hire_date, :department)
        end
      end
    end
  end
end
