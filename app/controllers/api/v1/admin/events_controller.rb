module Api
  module V1
    module Admin
      class EventsController < BaseController
        before_action :set_event, only: [:show, :update, :destroy, :publish, :complete, :generate_slug, :clear_slug, :copy, :preview_notification, :preview_eligible_participants]

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

        def complete
          unless @event.can_complete?
            return render json: { error: "活動尚未完成所有抽獎或狀態不正確" }, status: :unprocessable_entity
          end

          if @event.update(status: :completed)
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

        # Phase 2: Copy event
        def copy
          options = {
            name: params.dig(:event, :name),
            event_date: params.dig(:event, :event_date),
            copy_prizes: params.dig(:event, :copy_prizes) != false,
            copy_participants: params.dig(:event, :copy_participants) == true
          }.compact

          @event = EventCopyService.new(@event, options).copy
          render :show, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        # Phase 2: Preview notification template
        def preview_notification
          template_type = params[:template_type]
          sample_data = params[:sample_data] || {}

          template = case template_type
          when 'sms' then @event.sms_template
          when 'email' then @event.email_template
          else
            return render json: { error: '無效的模板類型' }, status: :unprocessable_entity
          end

          if template.blank?
            return render json: { error: '模板尚未設定' }, status: :unprocessable_entity
          end

          preview = NotificationTemplateService.preview(template, sample_data)
          render json: { preview: preview }
        end

        # Preview eligible participants with given rules (without saving)
        def preview_eligible_participants
          rules = params[:eligibility_rules] || {}
          min_seniority = rules[:min_seniority_years].to_i
          departments = rules[:departments] || []

          scope = @event.event_participants.includes(participant: :department)

          # Apply seniority filter
          if min_seniority > 0
            scope = scope.with_min_seniority(@event, min_seniority)
          end

          # Apply department filter
          if departments.present? && departments.any?
            scope = scope.joins(:participant).where(participants: { department_id: Department.where(name: departments).select(:id) })
          end

          # Get IDs of event_participants who have already won in this event
          won_event_participant_ids = Winner.joins(:prize)
                                            .where(prizes: { event_id: @event.id })
                                            .pluck(:event_participant_id)
                                            .to_set

          # Build participant list with has_won status, sorted by non-winners first
          participants_data = scope.limit(100).map do |ep|
            {
              id: ep.participant_id,
              name: ep.name,
              employee_id: ep.employee_id,
              department: ep.participant.department&.name,
              seniority_years: ep.seniority_years,
              has_won: won_event_participant_ids.include?(ep.id)
            }
          end.sort_by { |p| [p[:has_won] ? 1 : 0, p[:name].to_s] }

          render json: {
            total_count: @event.event_participants.count,
            eligible_count: scope.count,
            participants: participants_data
          }
        end

        private

        def set_event
          @event = Event.find(params[:id])
        end

        def event_params
          params.require(:event).permit(
            :name, :event_date, :password, :allow_repeat_win, :privacy_enabled, :public_access_enabled,
            :sms_template, :email_template,
            required_fields: [], display_fields: [], privacy_settings: {}
          )
        end
      end
    end
  end
end
