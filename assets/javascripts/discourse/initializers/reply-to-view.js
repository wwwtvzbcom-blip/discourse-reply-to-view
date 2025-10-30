import { withPluginApi } from "discourse/lib/plugin-api";

function initializeReplyToView(api) {
  const currentUser = api.getCurrentUser();
  
  api.decorateCookedElement((elem, helper) => {
    const post = helper.getModel();
    
    if (!post.can_view_hidden_content && post.reply_to_view_content) {
      const hideRegex = /\[hide\](.*?)\[\/hide\]/gs;
      const matches = post.raw.match(hideRegex);
      
      if (matches) {
        matches.forEach((match) => {
          const hiddenContent = match.replace('[hide]', '').replace('[/hide]', '');
          const replacement = document.createElement('div');
          replacement.className = 'reply-to-view-hidden';
          
          if (currentUser) {
            replacement.innerHTML = `
              <div class="reply-to-view-message">
                <i class="fa fa-lock"></i>
                ${I18n.t('reply_to_view.hidden_content')}
                <button class="btn btn-primary reply-to-view-button">${I18n.t('reply_to_view.reply_to_view')}</button>
              </div>
            `;
            
            const button = replacement.querySelector('.reply-to-view-button');
            button.addEventListener('click', () => {
              const composer = document.querySelector('#reply-control');
              if (composer) {
                composer.focus();
              } else {
                document.querySelector('.btn-primary.create')?.click();
              }
            });
          } else {
            replacement.innerHTML = `
              <div class="reply-to-view-message">
                <i class="fa fa-lock"></i>
                ${I18n.t('reply_to_view.hidden_content')}
                <a href="/login" class="btn btn-primary">${I18n.t('log_in')}</a>
              </div>
            `;
          }
          
          // 替换隐藏内容
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = post.raw;
          const rawContent = tempDiv.textContent || tempDiv.innerText || '';
          
          if (rawContent.includes(match)) {
            // 这里需要更复杂的DOM替换逻辑
            const walker = document.createTreeWalker(
              elem,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let node;
            while (node = walker.nextNode()) {
              if (node.nodeValue.includes(match)) {
                const span = document.createElement('span');
                span.innerHTML = node.nodeValue.replace(hideRegex, replacement.outerHTML);
                node.parentNode.replaceChild(span, node);
              }
            }
          }
        });
      }
    }
  }, {
    id: 'reply-to-view'
  });
}

export default {
  name: 'reply-to-view',
  initialize() {
    withPluginApi("1.5.0", initializeReplyToView);
  }
};