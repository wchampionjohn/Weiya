class HomeController < ApplicationController
  def index
  end

  def admin
    render :admin, layout: "admin"
  end

  def event
    @event = Event.find_by_slug_or_id(params[:id])

    if @event.nil?
      render file: Rails.public_path.join("404.html"), status: :not_found, layout: false
    elsif !@event.public_access_enabled && !@event.draft?
      render file: Rails.public_path.join("404.html"), status: :not_found, layout: false
    else
      # Draft events can be previewed
      @preview_mode = @event.draft?
      render :event, layout: "event"
    end
  end
end
