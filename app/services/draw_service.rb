class DrawService
  Result = Struct.new(:success, :winners, :error, :simulated, keyword_init: true) do
    def success?
      success
    end
  end

  def initialize(prize, admin: nil, count: nil, simulate: false)
    @prize = prize
    @admin = admin
    @count = count || @prize.remaining_quantity
    @simulate = simulate
  end

  def call
    # Allow simulation even if prize is drawn
    unless @simulate
      return Result.new(success: false, winners: [], error: "Prize already drawn") if @prize.drawn?
      return Result.new(success: false, winners: [], error: "No remaining quantity") unless @prize.remaining_quantity.positive?
    end

    @simulate ? simulate_draw : draw_winners
  end

  private

  def simulate_draw
    eligible_event_participants = find_eligible_event_participants
    return Result.new(success: false, winners: [], error: "No eligible participants", simulated: true) if eligible_event_participants.empty?

    draw_count = [@count, @prize.quantity, eligible_event_participants.size].min
    selected = secure_random_select(eligible_event_participants, draw_count)

    # Build simulated winner data without saving
    simulated_winners = selected.map do |event_participant|
      build_simulated_winner(event_participant)
    end

    broadcast_simulation_result(simulated_winners)

    Result.new(success: true, winners: simulated_winners, error: nil, simulated: true)
  end

  def draw_winners
    # Phase 2: Handle designated participants
    if @prize.has_designated_participants?
      return draw_designated_winners
    end

    eligible_event_participants = find_eligible_event_participants
    return Result.new(success: false, winners: [], error: "No eligible participants") if eligible_event_participants.empty?

    draw_count = [@count, @prize.remaining_quantity, eligible_event_participants.size].min
    selected = secure_random_select(eligible_event_participants, draw_count)

    winners = []
    ActiveRecord::Base.transaction do
      selected.each do |event_participant|
        winner = @prize.winners.create!(
          event_participant: event_participant,
          drawn_at: Time.current
        )
        winners << winner
      end

      if @prize.remaining_quantity.zero?
        @prize.update!(
          drawn: true,
          drawn_at: Time.current,
          drawn_by: @admin&.id
        )
      end
    end

    broadcast_draw_result(winners)

    Result.new(success: true, winners: winners, error: nil, simulated: false)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, winners: [], error: e.message)
  end

  def draw_designated_winners
    designated_participants = @prize.designated_participants
    event_participants = @prize.event.event_participants.where(participant: designated_participants)

    if event_participants.empty?
      return Result.new(
        success: false,
        winners: [],
        error: "指定中獎人不在活動參與者名單中"
      )
    end

    # Check how many to draw (limited by @count and remaining_quantity)
    draw_count = [@count, @prize.remaining_quantity, event_participants.size].min

    winners = []
    ActiveRecord::Base.transaction do
      event_participants.limit(draw_count).each do |event_participant|
        winner = @prize.winners.create!(
          event_participant: event_participant,
          drawn_at: Time.current,
          is_designated: true
        )
        winners << winner
      end

      # Mark prize as fully drawn if no remaining quantity
      if @prize.remaining_quantity.zero?
        @prize.update!(
          drawn: true,
          drawn_at: Time.current,
          drawn_by: @admin&.id
        )
      end
    end

    broadcast_draw_result(winners)

    Result.new(success: true, winners: winners, error: nil, simulated: false)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, winners: [], error: e.message)
  end

  def find_eligible_event_participants
    @prize.event.event_participants.eligible_for(@prize)
  end

  def secure_random_select(participants, count)
    participants.to_a.sample(count, random: SecureRandom)
  end

  def broadcast_draw_result(winners)
    return if winners.empty?

    ActionCable.server.broadcast(
      "draw_channel_#{@prize.event_id}",
      {
        type: "draw_result",
        prize_id: @prize.id,
        prize_name: @prize.name,
        winners: winners.map do |winner|
          build_winner_display(winner)
        end
      }
    )
  end

  def broadcast_simulation_result(simulated_winners)
    return if simulated_winners.empty?

    ActionCable.server.broadcast(
      "draw_channel_#{@prize.event_id}",
      {
        type: "simulation_result",
        prize_id: @prize.id,
        prize_name: @prize.name,
        winners: simulated_winners
      }
    )
  end

  def build_winner_display(winner)
    display_data = winner.display_data(masked: true)

    {
      id: winner.id,
      event_participant_id: winner.event_participant_id,
      display_data: display_data
    }
  end

  def build_simulated_winner(event_participant)
    participant = event_participant.participant
    event = @prize.event
    display_fields = event.display_fields || ["name"]
    privacy_enabled = event.privacy_enabled
    privacy_settings = event.privacy_settings || {}

    display_data = {}
    display_fields.each do |field|
      value = participant.send(field) rescue nil
      next unless value.present?

      if privacy_enabled && privacy_settings[field]
        display_data[field] = mask_value(field, value)
      else
        display_data[field] = value
      end
    end

    {
      id: nil,
      event_participant_id: event_participant.id,
      display_data: display_data,
      simulated: true
    }
  end

  def mask_value(field, value)
    case field
    when "name"
      return value if value.length <= 1
      value[0] + "＊" * (value.length - 2) + value[-1]
    when "phone"
      return value if value.length <= 4
      value[0..2] + "****" + value[-4..]
    when "email"
      parts = value.split("@")
      return value if parts.first.length <= 2
      parts.first[0..1] + "***@" + parts.last
    when "employee_id"
      return value if value.length <= 2
      value[0] + "*" * (value.length - 2) + value[-1]
    else
      value
    end
  end
end
