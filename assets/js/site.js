const toggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('#site-nav');
if(toggle&&nav){
  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
  });
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-load-example]');
  if(!button) return;
  const root=button.closest('.tool-card') || document;
  const value=button.dataset.example || '';
  const target=root.querySelector('[data-input], [data-text-input], [data-dev-input], [data-seo-input], textarea:not([readonly])');
  if(target){
    target.value=value;
    target.dispatchEvent(new Event('input',{bubbles:true}));
  }
  const status=root.querySelector('[data-status]');
  if(status) status.textContent='Example loaded. Run the tool or edit the sample.';
});

document.addEventListener('input',event=>{
  if(event.target.matches('textarea, input, select')){
    const root=event.target.closest('.tool-card');
    const empty=root?.querySelector('[data-empty-result]');
    if(empty) empty.hidden=false;
  }
});

document.addEventListener('click',event=>{
  if(event.target.matches('[data-run], [data-text-run], [data-dev-run], [data-seo-run], [data-calc-run], [data-action]')){
    const empty=event.target.closest('.tool-card')?.querySelector('[data-empty-result]');
    if(empty) empty.hidden=true;
  }
});
