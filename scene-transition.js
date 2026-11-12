import {chapterDefinition} from './chapter-data.js?v=108';
import {routeNode} from './route-model.js?v=140';

const chapterThemes=['ember','tide','star'];

function themeFor(game){
 if(game.mode==='camp')return 'camp';
 if(game.runContext&&game.runContext.kind!=='campaign')return 'rift';
 return chapterThemes[game.chapter-1]||'ember';
}

function ease(progress){
 const x=Math.max(0,Math.min(1,progress));
 return x*x*(3-2*x);
}

export function createSceneTransition(overlay){
 const veil=overlay.querySelector('.travel-veil'),cue=overlay.querySelector('.travel-cue');
 const area=overlay.querySelector('#travel-area'),title=overlay.querySelector('#travel-name');
 let lastProgress=-1;

 function clear(){
  if(!overlay.dataset.phase)return;
  overlay.classList.add('hidden');
  delete overlay.dataset.phase;
 }

 function frame(transition){
  if(!transition||overlay.dataset.phase!=='travel')return;
  const progress=1-transition.t/transition.max;
  if(progress===lastProgress)return;
  lastProgress=progress;
  const edge=Math.min(progress,1-progress);
  const ink=ease(edge/.4);
  veil.style.opacity=ink;
  veil.style.setProperty('--travel-ink-progress',ink);
  cue.style.opacity=ease(edge/.14);
 }

 function start(game){
  const {expedition,transition,runContext}=game,theme=themeFor(game);
  const node=routeNode(expedition.graph,expedition.selectedID??expedition.currentID);
  const region=theme==='rift'?(runContext.kind==='rift'?'裂隙':'終局'):chapterDefinition(game.chapter)?.name||'遠征';
  area.textContent=region+' · 第 '+((node?.layer??transition.to)+1)+' 層';
  title.textContent=node?.name||'下一區域';
  overlay.dataset.theme=theme;
  overlay.dataset.phase='travel';
  lastProgress=-1;
  frame(transition);
  overlay.classList.remove('hidden');
 }

 function reveal(game){
  overlay.dataset.theme=themeFor(game);
  overlay.dataset.phase='reveal';
  overlay.classList.remove('hidden');
 }

 veil.addEventListener('animationend',()=>{
  if(overlay.dataset.phase==='reveal')clear();
 });
 return {start,frame,reveal,clear};
}
