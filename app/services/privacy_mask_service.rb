class PrivacyMaskService
  class << self
    def mask(value, field)
      return value if value.blank?

      case field.to_s
      when "name"
        mask_name(value)
      when "phone"
        mask_phone(value)
      when "email"
        mask_email(value)
      when "employee_id"
        mask_employee_id(value)
      else
        mask_generic(value)
      end
    end

    private

    def mask_name(name)
      chars = name.chars
      return name if chars.length <= 1

      if chars.length == 2
        "#{chars[0]}○"
      else
        "#{chars[0]}○#{chars[-1]}"
      end
    end

    def mask_phone(phone)
      return phone if phone.length < 6

      phone[0..3] + "-XXX-" + phone[-3..]
    end

    def mask_email(email)
      local, domain = email.split("@")
      return email unless domain

      masked_local = if local.length <= 2
        local[0] + "***"
      else
        local[0..1] + "***"
      end

      "#{masked_local}@#{domain}"
    end

    def mask_employee_id(id)
      return id if id.length <= 2

      id[0..1] + "*" * (id.length - 2)
    end

    def mask_generic(value)
      chars = value.to_s
      return chars if chars.length <= 2

      chars[0] + "*" * (chars.length - 2) + chars[-1]
    end
  end
end
