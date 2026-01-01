Rails.application.routes.draw do
  # API routes
  namespace :api do
    namespace :v1 do
      # Admin routes
      namespace :admin do
        resource :session, only: [:create, :destroy]

        # Global participants management
        resources :participants, only: [:index, :show, :create, :update, :destroy]

        resources :events do
          resources :prizes, except: [:index] do
            collection do
              patch :reorder
            end
          end
          member do
            post :publish
          end
          # Event-specific participants
          collection do
            get ":event_id/participants", to: "participants#event_participants", as: :event_participants
            post ":event_id/participants/:id/add", to: "participants#add_to_event", as: :add_participant_to_event
            delete ":event_id/participants/:id/remove", to: "participants#remove_from_event", as: :remove_participant_from_event
            post ":event_id/participants/import", to: "participants#import", as: :import_event_participants
          end
        end
        resources :prizes, only: [] do
          resource :draw, only: [:create]
        end
        resources :winners, only: [:index, :update]
      end

      # Public routes
      namespace :public do
        resources :events, only: [:show] do
          member do
            post :verify
            get :status
          end
          resources :winners, only: [:index]
        end
        resource :session, only: [:create, :destroy]
      end
    end
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # Frontend routes (catch-all for React Router)
  get "admin", to: "home#admin"
  get "admin/*path", to: "home#admin"

  # Event public pages
  get "events/:id", to: "home#event", as: :public_event
  get "events/:id/overview", to: "home#event"
  get "events/:id/live", to: "home#event"
  get "events/:id/draw", to: "home#event"
  get "events/:id/results", to: "home#event"
  get "events/:id/login", to: "home#event"
  get "events/:id/my-results", to: "home#event"

  root "home#index"
  get "*path", to: "home#index", constraints: ->(req) { !req.path.start_with?("/api") }
end
