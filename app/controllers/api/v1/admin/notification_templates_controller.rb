module Api
  module V1
    module Admin
      class NotificationTemplatesController < BaseController
        before_action :set_template, only: [:show, :update, :destroy]

        def index
          @templates = NotificationTemplate.ordered

          @templates = @templates.where(notification_type: params[:notification_type]) if params[:notification_type].present?
          @templates = @templates.where(method: params[:method]) if params[:method].present?
        end

        def show
        end

        def create
          @template = NotificationTemplate.new(template_params)

          if @template.save
            render :show, status: :created
          else
            render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @template.update(template_params)
            render :show
          else
            render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @template.destroy
          head :no_content
        end

        private

        def set_template
          @template = NotificationTemplate.find(params[:id])
        end

        def template_params
          params.require(:notification_template).permit(:name, :notification_type, :method, :content, :is_default, :position)
        end
      end
    end
  end
end
