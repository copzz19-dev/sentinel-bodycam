const $=id=>document.getElementById(id);
let stream=null, recorder=null, chunks=[], startedAt=0, timerHandle=null, db=null, drawFrame=null, recordingStarting=false;
let overlayImage=null;
const DB_NAME='sentinel-bodycam', STORE='clips';
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2500)}
function timeFmt(ms){let s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':')}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error)})}
function tx(mode='readonly'){return db.transaction(STORE,mode).objectStore(STORE)}
function loadOverlay(){if(overlayImage)return Promise.resolve(overlayImage);return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{overlayImage=image;resolve(image)};image.onerror=()=>reject(new Error('Could not load overlay.png.'));image.src='./overlay.png'})}
async function enableCamera(){
 try{
  if(!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access requires HTTPS. Open the hosted app using https://.');
  stream=await navigator.mediaDevices.getUserMedia({audio:true,video:{facingMode:$('facing').value,width:{ideal:$('quality').value==='high'?1920:1280},height:{ideal:$('quality').value==='high'?1080:720}}});
  $('preview').srcObject=stream;$('preview').style.display='block';$('placeholder').style.display='none';
  $('status').textContent='CAMERA READY';$('status').style.color='#38c78a';$('recordBtn').disabled=false;$('cameraBtn').textContent='CAMERA ENABLED';$('hint').textContent='Camera preview is active. Recording starts only when you press the button.';
 }catch(e){toast(e.message||'Could not access camera or microphone.');}
}
function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}$('preview').srcObject=null;$('preview').style.display='none';$('placeholder').style.display='flex';$('status').textContent='CAMERA OFF';$('status').style.color='';$('recordBtn').disabled=true;$('cameraBtn').textContent='ENABLE CAMERA'}
async function startRecording(){
 if(!stream||recordingStarting)return;
 recordingStarting=true;$('recordBtn').disabled=true;
 let outputStream;
 try{
  const video=$('preview'),image=await loadOverlay();
  if(!video.videoWidth||!video.videoHeight)throw new Error('The camera is not ready yet. Please try again.');
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  if(!context||!canvas.captureStream)throw new Error('Overlay recording is not supported by this browser.');
  canvas.width=video.videoWidth;canvas.height=video.videoHeight;
  const portrait=canvas.height>canvas.width,aspect=image.naturalWidth/image.naturalHeight;
  const width=Math.min(canvas.width*(portrait?.82:.36),canvas.height*(portrait?.28:.36)*aspect),height=width/aspect,margin=Math.round(Math.min(canvas.width,canvas.height)*.02);
  const draw=()=>{context.drawImage(video,0,0,canvas.width,canvas.height);context.drawImage(image,canvas.width-width-margin,margin,width,height);drawFrame=requestAnimationFrame(draw)};
  draw();
  outputStream=canvas.captureStream(30);
  stream.getAudioTracks().forEach(track=>outputStream.addTrack(track));
  const mime=['video/mp4;codecs=h264,aac','video/mp4','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  recorder=new MediaRecorder(outputStream,mime?{mimeType:mime}:undefined);
 }catch(e){if(outputStream)outputStream.getTracks().forEach(track=>track.stop());if(drawFrame)cancelAnimationFrame(drawFrame);drawFrame=null;recordingStarting=false;$('recordBtn').disabled=false;toast(e.message||'Recording is not supported by this browser.');return}
 chunks=[];recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
 const activeRecorder=recorder;
 recorder.onstop=async()=>{if(drawFrame)cancelAnimationFrame(drawFrame);drawFrame=null;outputStream.getTracks().forEach(track=>track.stop());const blob=new Blob(chunks,{type:activeRecorder.mimeType||'video/webm'});if(blob.size){try{await new Promise((resolve,reject)=>{const r=tx('readwrite').add({blob,created:new Date().toISOString(),duration:Date.now()-startedAt,type:blob.type});r.onsuccess=resolve;r.onerror=()=>reject(r.error)});toast('Recording saved on this iPhone.');await loadClips()}catch(e){toast(e.message||'Could not save recording.')}}};
 try{recorder.start(1000)}catch(e){outputStream.getTracks().forEach(track=>track.stop());if(drawFrame)cancelAnimationFrame(drawFrame);drawFrame=null;recorder=null;recordingStarting=false;$('recordBtn').disabled=false;toast(e.message||'Could not start recording.');return}
 recordingStarting=false;
 startedAt=Date.now();$('recordBtn').disabled=true;$('stopBtn').disabled=false;$('cameraBtn').disabled=true;$('recOverlay').style.display='block';$('status').textContent='RECORDING';$('status').style.color='#ff7378';$('hint').textContent='Recording in progress. Press STOP & SAVE when finished.';
 const tick=()=>{const t=Date.now()-startedAt;$('timer').textContent=timeFmt(t);$('overlayTime').textContent=timeFmt(t)};tick();timerHandle=setInterval(tick,250);
}
function stopRecording(){if(recorder&&recorder.state!=='inactive'){recorder.stop()}clearInterval(timerHandle);$('recordBtn').disabled=false;$('stopBtn').disabled=true;$('cameraBtn').disabled=false;$('recOverlay').style.display='none';$('status').textContent='CAMERA READY';$('status').style.color='#38c78a';$('hint').textContent='Recording saved locally when processing finishes.'}
async function loadClips(){
 const req=tx().getAll();req.onsuccess=()=>{const clips=req.result.sort((a,b)=>b.id-a.id);$('count').textContent=clips.length;$('recordings').innerHTML='';if(!clips.length){$('recordings').innerHTML='<div class="empty">No recordings yet.</div>';return}
 clips.forEach(c=>{const url=URL.createObjectURL(c.blob),date=new Date(c.created);const card=document.createElement('article');card.className='clip';const title=document.createElement('strong');title.textContent='Recording '+String(c.id).padStart(3,'0');const meta=document.createElement('small');meta.textContent=date.toLocaleString()+' · '+timeFmt(c.duration);const video=document.createElement('video');video.controls=true;video.playsInline=true;video.src=url;const actions=document.createElement('div');actions.className='clip-actions';const download=document.createElement('a');download.href=url;download.download='Sentinel-'+c.id+'.'+(c.type.includes('mp4')?'mp4':'webm');download.textContent='EXPORT VIDEO';const del=document.createElement('button');del.textContent='DELETE';del.onclick=()=>{if(confirm('Delete this recording from this device?')){tx('readwrite').delete(c.id).onsuccess=()=>{URL.revokeObjectURL(url);loadClips();toast('Recording deleted.')}}};actions.append(download,del);card.append(title,meta,video,actions);$('recordings').append(card)})};
}
function switchScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('selected',b.dataset.screen===id));if(id==='libraryScreen')loadClips()}
$('cameraBtn').onclick=enableCamera;$('recordBtn').onclick=startRecording;$('stopBtn').onclick=stopRecording;
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>switchScreen(b.dataset.screen));
$('facing').onchange=()=>{if(stream&&!recorder){stopCamera();enableCamera()}};
window.addEventListener('pagehide',()=>{if(recorder&&recorder.state!=='inactive')recorder.stop();stopCamera()});
(async()=>{try{await openDB();await loadClips()}catch(e){toast('Local storage is unavailable in this browser.')}})();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
