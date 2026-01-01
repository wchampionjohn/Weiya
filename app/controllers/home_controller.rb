class HomeController < ApplicationController
  def index
  end

  def admin
    render :admin, layout: "admin"
  end

  def event
    @event = Event.find_by(id: params[:id])

    if @event.nil? || @event.draft?
      render file: Rails.public_path.join("404.html"), status: :not_found, layout: false
    else
      render :event, layout: "event"
    end
  end
end
