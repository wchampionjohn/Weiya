module ApiHelpers
  def json_response
    JSON.parse(response.body)
  end

  # Override HTTP methods to default to JSON format
  %w[get post patch put delete].each do |method|
    define_method(method) do |path, **options|
      options[:as] ||= :json
      super(path, **options)
    end
  end
end

RSpec.configure do |config|
  config.include ApiHelpers, type: :request

  config.before(:each, type: :request) do
    host! 'localhost'
  end
end
