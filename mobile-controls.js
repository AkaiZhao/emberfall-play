// Orientation owns only its blocking flag. The application combines it with
// manual, dialog, storage and visibility pauses through onBlocked.
export function installMobileControls({onBlocked=()=>{},clearInput=()=>{},window:win=globalThis.window,document:doc=globalThis.document}={}){
 const body=doc.body,guard=doc.querySelector('#orientation-guard'),joystick=doc.querySelector('#joystick');
 const coarse=win.matchMedia?.('(any-pointer: coarse)'),hover=win.matchMedia?.('(hover: hover)');
 const listeners=[],previousInert=new Map();let blocked=false,phone=false,pointer=null,previousFocus=null,destroyed=false;
 const listen=(target,type,handler,options)=>{if(!target?.addEventListener)return;target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener(type,handler,options));};
 const stop=event=>{event.preventDefault();event.stopImmediatePropagation();};
 function clear(){
  const captured=pointer;pointer=null;
  if(captured!==null&&joystick?.hasPointerCapture?.(captured)){try{joystick.releasePointerCapture(captured);}catch{}}
  clearInput();
 }
 function setBlocked(value){
  if(value===blocked)return;
  blocked=value;clear();body.classList.toggle('mobile-portrait-blocked',blocked);
  if(guard)guard.hidden=!blocked;
  if(blocked){
   previousFocus=doc.activeElement;
   for(const selector of ['.game-shell','#panel-dialog']){const node=doc.querySelector(selector);if(node){previousInert.set(node,node.inert);node.inert=true;}}
   if(guard?.showModal&&!guard.open)guard.showModal();
   guard?.focus({preventScroll:true});
  }else{
   if(guard?.open)guard.close();
   for(const [node,inert] of previousInert)node.inert=inert;
   previousInert.clear();
   if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
   previousFocus=null;
  }
  onBlocked(blocked);
 }
 function update(){
  if(destroyed)return;
  const width=win.innerWidth,height=win.innerHeight;
  // Touch-first phones and tablets share one landscape layout. Hover-capable
  // computers keep desktop controls even if their screen also accepts touch.
  const touch=(coarse?.matches||((win.navigator?.maxTouchPoints||0)>0))&&!hover?.matches;
  phone=!!touch;
  body.classList.toggle('mobile-phone',phone);
  setBlocked(phone&&height>width);
 }
 function capturePointer(event){
  if(blocked){stop(event);return;}
  if(!joystick?.contains(event.target))return;
  if(pointer!==null&&pointer!==event.pointerId){stop(event);return;}
  pointer=event.pointerId;
 }
 function releasePointer(event){if(event.pointerId===pointer)pointer=null;}
 function cancelPointer(event){if(event.pointerId===pointer)clear();}
 function blockEvent(event){if(blocked)stop(event);}
 listen(win,'pointerdown',capturePointer,{capture:true,passive:false});
 listen(guard,'cancel',event=>{if(blocked)stop(event);});
 listen(win,'pointerup',releasePointer,true);
 listen(win,'pointercancel',cancelPointer,true);
 listen(win,'lostpointercapture',cancelPointer,true);
 for(const type of ['click','contextmenu','keydown','keyup','touchstart','touchmove','pointermove'])listen(win,type,blockEvent,{capture:true,passive:false});
 listen(win,'blur',()=>{if(phone||pointer!==null)clear();});
 listen(doc,'visibilitychange',()=>{if(doc.hidden&&(phone||pointer!==null))clear();});
 listen(win,'resize',update);listen(win,'orientationchange',update);listen(win.visualViewport,'resize',update);
 listen(coarse,'change',update);listen(hover,'change',update);
 update();
 return {
  get blocked(){return blocked;},
  destroy(){
   if(destroyed)return;
   for(const remove of listeners)remove();
   if(!blocked)clear();
   setBlocked(false);destroyed=true;pointer=null;
   body.classList.remove('mobile-phone','mobile-portrait-blocked');
   if(guard)guard.hidden=true;
  }
 };
}
