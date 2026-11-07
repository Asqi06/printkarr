// Upload and verification enhance native forms; the same routes work without JS.
async function showOrderScreen(response) {
  const currentNonce=document.querySelector('script[nonce]')?.nonce;
  const html = await response.text(), doc = new DOMParser().parseFromString(html, 'text/html');
  if (!doc.querySelector('.order-focus #main')) { if(!response.ok)throw new Error(doc.querySelector('[role=alert]')?.textContent || 'This file could not be processed. Choose a PDF, PNG or JPG and retry.');location.assign(response.url);return; }
  const module=doc.head.querySelector('script[type="module"][src]');
  if(module && ![...document.head.querySelectorAll('script[type="module"][src]')].some(s=>s.getAttribute('src')===module.getAttribute('src'))){location.assign(response.url);return;}
  const main = document.getElementById('main'); main.replaceChildren(...doc.getElementById('main').childNodes);
  document.title = doc.title;
  history.replaceState(null, '', response.url);
  const back = doc.querySelector('.order-back'); if(back) document.querySelector('.order-back').href = back.href;
  const responseNonce=response.headers.get('content-security-policy')?.match(/'nonce-([^']+)'/)?.[1];
  for (const script of main.querySelectorAll('script')) {
    if(responseNonce && !script.src && script.nonce!==responseNonce){script.remove();continue;}
    const replacement = document.createElement('script'); for(const attr of script.attributes) replacement.setAttribute(attr.name,attr.value); if(currentNonce && script.nonce)replacement.nonce=currentNonce;replacement.textContent=script.textContent; script.replaceWith(replacement);
  }
  for(const script of doc.head.querySelectorAll('script[src]')) if (!document.querySelector(`script[src="${script.getAttribute('src')}"]`)) { const added=document.createElement('script'); for(const attr of script.attributes)added.setAttribute(attr.name,attr.value); document.head.append(added); }
  document.dispatchEvent(new Event('print-screen'));
  window.scrollTo(0,0); const heading=main.querySelector('h1'); if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
document.addEventListener('change', event => {
  const input = event.target;
  if (!input.matches('[data-order-upload] input[type=file]') || !input.files[0]) return;
  input.setCustomValidity(''); const max=Number(input.form.dataset.maxMb)*1024*1024;
  if(input.files[0].size>max){input.setCustomValidity(`Choose a file no larger than ${input.form.dataset.maxMb} MB.`);input.reportValidity();return;}
  input.form.requestSubmit();
});
document.addEventListener('submit', async event => {
  const form=event.target; if(!form.matches('[data-order-upload],[data-inline-order]')) return;
  if(event.defaultPrevented)return;
  event.preventDefault();if(form.dataset.busy)return; const button=form.querySelector('[type=submit]'); const previous=button?button.textContent:'';
  const busyText=form.matches('[data-order-upload]')?'Uploading & counting…':'Please wait…';
  const data=new FormData(form);form.dataset.busy='1';if(button){button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=busyText;}
  const status=form.querySelector('[role=status]'); if(status)status.textContent='Keep this page open while your file uploads.';
  try { const get=form.method.toLowerCase()==='get', url=get?form.action+'?'+new URLSearchParams(data):form.action; const response=await fetch(url,get?{}:{method:'POST',body:form.enctype==='multipart/form-data'?data:new URLSearchParams(data)}); await showOrderScreen(response); }
  catch (failure) { const error=document.createElement('p');error.className='login-err';error.setAttribute('role','alert');error.textContent=failure instanceof TypeError ? 'Could not connect. Your details are still here; please retry.' : failure.message;form.prepend(error); }
  finally { delete form.dataset.busy;if(button){button.disabled=false;button.removeAttribute('aria-busy');button.textContent=previous;} }
});
document.addEventListener('click', event => {
  const open=event.target.closest('[data-open-preview]'), close=event.target.closest('[data-close-preview]');
  if(open){const dialog=document.querySelector('.order-preview');for(const frame of dialog.querySelectorAll('[data-preview-src]')) if(!frame.src)frame.src=frame.dataset.previewSrc;dialog.showModal();}
  if(close)close.closest('dialog').close();
});

document.addEventListener('dragover', event => { const zone=event.target.closest('[data-order-upload] .drop'); if (!zone) return; event.preventDefault(); zone.classList.add('is-dragging'); });
document.addEventListener('dragleave', event => { const zone=event.target.closest('[data-order-upload] .drop'); if (zone) zone.classList.remove('is-dragging'); });
document.addEventListener('drop', event => {
  const zone = event.target.closest('[data-order-upload] .drop');
  if (!zone || !event.dataTransfer?.files?.length) return;
  event.preventDefault();
  zone.classList.remove('is-dragging');
  const input = zone.closest('form').querySelector('input[type=file]');
  if (input?.files) { input.files = event.dataTransfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); }
});
