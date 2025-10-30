# name: discourse-reply-to-view
# about: Implements reply-to-view functionality similar to Discuz's hide tags
# version: 0.1.0
# authors: YourName
# url: https://github.com/yourusername/discourse-reply-to-view
# contact_emails: your-email@example.com

enabled_site_setting :reply_to_view_enabled

after_initialize do
  module ::ReplyToView
    class Engine < ::Rails::Engine
      engine_name "reply_to_view"
      isolate_namespace ReplyToView
    end
  end

  register_post_custom_field_type('reply_to_view_content', :text)

  on(:post_created) do |post|
    if post.raw =~ /\[hide\](.*?)\[\/hide\]/m
      content = $1
      post.custom_fields['reply_to_view_content'] = content
      post.save_custom_fields
      
      # 替换原始内容为提示信息
      post.raw.gsub!(/\[hide\](.*?)\[\/hide\]/m, I18n.t('reply_to_view.hidden_content'))
      post.save!(validate: false)
    end
  end

  on(:post_edited) do |post|
    if post.raw =~ /\[hide\](.*?)\[\/hide\]/m
      content = $1
      post.custom_fields['reply_to_view_content'] = content
      post.save_custom_fields
    else
      post.custom_fields.delete('reply_to_view_content')
      post.save_custom_fields
    end
  end

  add_to_serializer(:post, :reply_to_view_content) do
    object.custom_fields['reply_to_view_content']
  end

  add_to_serializer(:post, :include_reply_to_view_content?) do
    object.custom_fields['reply_to_view_content'].present?
  end

  add_to_serializer(:post, :can_view_hidden_content) do
    return true if scope.is_staff?
    return true if object.user_id == scope.user.id
    
    # 检查用户是否在主题中回复过
    topic_posts = Topic.find(object.topic_id).posts
    topic_posts.where(user_id: scope.user.id).where('post_number > 1').exists?
  end
end