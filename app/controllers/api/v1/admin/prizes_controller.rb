module Api
  module V1
    module Admin
      class PrizesController < BaseController
        before_action :set_event
        before_action :set_prize, only: [:show, :update, :destroy, :eligible_participants]

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

        # Phase 2: Get eligible participants for a prize
        def eligible_participants
          @eligible = @event.event_participants.eligible_for(@prize).includes(participant: :department)

          render json: {
            total_count: @event.event_participants.count,
            eligible_count: @eligible.count,
            participants: @eligible.limit(100).map do |ep|
              {
                id: ep.participant_id,
                name: ep.name,
                employee_id: ep.employee_id,
                department: ep.participant.department&.name,
                seniority_years: ep.seniority_years
              }
            end
          }
        end

        # Phase 2: Add bonus prize during active event
        def bonus
          unless @event.active?
            return render json: { error: "只有進行中的活動可以新增加碼獎項" }, status: :forbidden
          end

          @prize = @event.prizes.build(bonus_prize_params)
          @prize.is_bonus = true
          @prize.insert_after_latest_drawn

          # Validate eligibility
          if @prize.has_designated_participants?
            # Check if designated participants have already won (when repeat wins not allowed)
            unless @event.allow_repeat_win_for_prize?(@prize)
              already_won_ids = Winner.where(prize: @event.prizes)
                                      .joins(event_participant: :participant)
                                      .where(participants: { id: @prize.designated_participant_ids })
                                      .pluck('participants.id')
                                      .uniq

              if already_won_ids.any?
                already_won_names = Participant.where(id: already_won_ids).pluck(:name).join('、')
                return render json: {
                  error: "無法新增加碼獎項：指定中獎人「#{already_won_names}」已經中過獎。請選擇其他人，或在活動設定中允許重複中獎。"
                }, status: :unprocessable_entity
              end
            end
          else
            # No designated participants - check if there are eligible participants
            eligible_count = @event.event_participants.eligible_for(@prize).count
            if eligible_count.zero?
              return render json: {
                error: "無法新增加碼獎項：目前沒有符合資格的參與者可供抽獎。請指定中獎人，或確認活動設定允許重複中獎。"
              }, status: :unprocessable_entity
            end
          end

          if @prize.save
            # Broadcast new prize via ActionCable
            ActionCable.server.broadcast("draw_channel_#{@event.id}", {
              type: "bonus_prize_added",
              prize: prize_broadcast_data(@prize)
            })
            render :show, status: :created
          else
            render json: { errors: @prize.errors.full_messages }, status: :unprocessable_entity
          end
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
            :name, :prize_type_id, :value, :quantity, :taxable, :position,
            :allow_repeat_win_override, :scheduled_at,
            display_fields: [], privacy_settings: {},
            eligibility_rules: [:min_seniority_years, departments: []],
            designated_participant_ids: []
          )
        end

        def bonus_prize_params
          params.require(:prize).permit(
            :name, :prize_type_id, :value, :quantity, :taxable,
            :allow_repeat_win_override,
            display_fields: [], privacy_settings: {},
            eligibility_rules: [:min_seniority_years, departments: []],
            designated_participant_ids: []
          )
        end

        def prize_broadcast_data(prize)
          {
            id: prize.id,
            name: prize.name,
            prize_type: prize.prize_type,
            value: prize.value,
            quantity: prize.quantity,
            position: prize.position,
            is_bonus: prize.is_bonus,
            drawn: prize.drawn?,
            remaining_quantity: prize.remaining_quantity
          }
        end
      end
    end
  end
end
