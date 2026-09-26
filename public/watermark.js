const imageInput = document.getElementById("ticketImage");
const canvas = document.getElementById("watermarkCanvas");

if (imageInput && canvas) {

    const ctx = canvas.getContext("2d");

    const scaleInput = document.getElementById("imageScale");

    const watermarkSize =
        document.getElementById("watermarkSize");

    const watermarkPosition =
        document.getElementById("watermarkPosition");

    const WATERMARK_TEXT = "BoardingPassMuseum";
    const WATERMARK_OPACITY = 0.55;
    function restoreWatermarkSettings(){
        try{
            const settings=JSON.parse(sessionStorage.getItem("bpmImageEditorWatermarkSettings")||"null");
            if(!settings)return;
            const size=Number(settings.size);
            if(watermarkSize&&Number.isFinite(size))watermarkSize.value=String(Math.min(Number(watermarkSize.max)||120,Math.max(Number(watermarkSize.min)||10,size)));
            if(watermarkPosition&&["bottom-right","bottom-left","top-right","top-left"].includes(settings.position))watermarkPosition.value=settings.position;
        }catch{}
    }
    restoreWatermarkSettings();


    let img = new Image();

    let scale = 1;

    let offsetX = 0;
    let offsetY = 0;
    let rotation = 0;
    const maskColorInput=document.getElementById("maskColor");


    let dragging = false;
    let maskMode = false;
    let masking = false;
    let maskStart = null;
    let maskPreview = null;
    const masks = [];
    let cropMode=false,cropStart=null,cropRect=null,watermarkBaked=false;

    let lastX = 0;
    let lastY = 0;



    imageInput.addEventListener(
        "change",
        function () {

            const file = this.files[0];

            if (!file) return;


            const reader = new FileReader();


            reader.onload = function(e){


                img.onload = function(){


                    // 保持原图比例

                    canvas.width = img.width;

                    canvas.height = img.height;


                    scale = 1;
                    rotation = 0;
                    watermarkBaked=false;
                    cropRect=null;

                    offsetX = 0;

                    offsetY = 0;


                    draw();


                };


                img.src = e.target.result;


            };


            reader.readAsDataURL(file);


        }
    );





    // 缩放

    scaleInput.addEventListener(
        "input",
        function(){

            scale = Number(this.value);

            draw();

        }
    );






    // 拖动图片


    const canvasPoint = e => {
        const rect=canvas.getBoundingClientRect();
        return {x:(e.clientX-rect.left)*canvas.width/rect.width,y:(e.clientY-rect.top)*canvas.height/rect.height};
    };
    const imagePoint=point=>{const x=point.x-canvas.width/2-offsetX,y=point.y-canvas.height/2-offsetY,a=rotation*Math.PI/180;return{x:(x*Math.cos(a)+y*Math.sin(a))/scale+img.width/2,y:(-x*Math.sin(a)+y*Math.cos(a))/scale+img.height/2};};

    canvas.addEventListener(
        "pointerdown",
        function(e){
            const point=canvasPoint(e);
            canvas.setPointerCapture?.(e.pointerId);
            if(cropMode){cropStart=point;cropRect={x:point.x,y:point.y,w:0,h:0};draw();return;}
            if(maskMode){masking=true;maskStart=imagePoint(point);maskPreview={x:maskStart.x,y:maskStart.y,w:0,h:0};draw();return;}

            dragging = true;

            lastX = point.x;

            lastY = point.y;

        }
    );


    canvas.addEventListener(
        "pointermove",
        function(e){

            const point=canvasPoint(e);

            if(cropMode&&cropStart){
                let w=point.x-cropStart.x,h=point.y-cropStart.y;
                const ratio=Number(document.getElementById("cropAspect")?.value);
                if(Number.isFinite(ratio)&&ratio>0)h=Math.sign(h||1)*Math.abs(w)/ratio;
                const x=Math.min(cropStart.x,cropStart.x+w),y=Math.min(cropStart.y,cropStart.y+h);
                cropRect={x:Math.max(0,x),y:Math.max(0,y),w:Math.min(canvas.width-Math.max(0,x),Math.abs(w)),h:Math.min(canvas.height-Math.max(0,y),Math.abs(h))};
                draw();return;
            }

            if(masking&&maskStart){const p=imagePoint(point);maskPreview={x:Math.min(maskStart.x,p.x),y:Math.min(maskStart.y,p.y),w:Math.abs(p.x-maskStart.x),h:Math.abs(p.y-maskStart.y)};draw();return;}


            if(!dragging)
                return;


            offsetX += point.x - lastX;

            offsetY += point.y - lastY;


            lastX = point.x;

            lastY = point.y;


            draw();


        }
    );


    canvas.addEventListener(
        "pointerup",
        function(){

            if(cropMode&&cropStart){cropStart=null;updateCropControls();return;}
            if(masking){if(maskPreview&&maskPreview.w>8&&maskPreview.h>8)masks.push(maskPreview);masking=false;maskStart=null;maskPreview=null;draw();updateMaskStatus();return;}

            dragging=false;

        }
    );


    canvas.addEventListener(
        "mouseleave",
        function(){

            dragging=false;

        }
    );






    function drawImageAndMasks(){
        if(!img.src)return;
        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );



        // 图片

        ctx.save();
        ctx.translate(canvas.width/2+offsetX,canvas.height/2+offsetY);
        ctx.rotate(rotation*Math.PI/180);
        ctx.scale(scale,scale);
        ctx.drawImage(img,-img.width/2,-img.height/2);
        ctx.fillStyle=maskColorInput?.value||"#000000";
        masks.forEach(mask=>ctx.fillRect(mask.x-img.width/2,mask.y-img.height/2,mask.w,mask.h));
        if(maskPreview){ctx.fillStyle=maskColorInput?.value||"#000000";ctx.fillRect(maskPreview.x-img.width/2,maskPreview.y-img.height/2,maskPreview.w,maskPreview.h);ctx.strokeStyle=maskColorInput?.value==="#ffffff"?"#111":"#fff";ctx.lineWidth=Math.max(2,canvas.width/500)/scale;ctx.strokeRect(maskPreview.x-img.width/2,maskPreview.y-img.height/2,maskPreview.w,maskPreview.h);}
        ctx.restore();
    }

    function draw(){
        if(!img.src)return;
        drawImageAndMasks();
        if(cropMode&&cropRect){ctx.fillStyle="rgba(0,0,0,.58)";ctx.fillRect(0,0,canvas.width,cropRect.y);ctx.fillRect(0,cropRect.y+cropRect.h,canvas.width,canvas.height-cropRect.y-cropRect.h);ctx.fillRect(0,cropRect.y,cropRect.x,cropRect.h);ctx.fillRect(cropRect.x+cropRect.w,cropRect.y,canvas.width-cropRect.x-cropRect.w,cropRect.h);ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(2,canvas.width/700);ctx.strokeRect(cropRect.x,cropRect.y,cropRect.w,cropRect.h);}





        if(!watermarkBaked)drawWatermark();


    }

    const maskModeBtn=document.getElementById("maskModeBtn"),undoMaskBtn=document.getElementById("undoMaskBtn"),clearMasksBtn=document.getElementById("clearMasksBtn"),maskStatus=document.getElementById("maskStatus");
    function updateMaskStatus(){if(maskStatus)maskStatus.textContent=maskMode?`遮挡模式：已添加 ${masks.length} 处，请继续拖动框选`:`图片移动模式：已遮挡 ${masks.length} 处`;if(maskModeBtn)maskModeBtn.textContent=maskMode?"完成遮挡":"开始遮挡";canvas.style.cursor=maskMode?"crosshair":"grab";}
    maskModeBtn?.addEventListener("click",()=>{maskMode=!maskMode;dragging=false;masking=false;maskPreview=null;updateMaskStatus();draw();});
    undoMaskBtn?.addEventListener("click",()=>{masks.pop();updateMaskStatus();draw();});
    clearMasksBtn?.addEventListener("click",()=>{masks.length=0;updateMaskStatus();draw();});
    maskColorInput?.addEventListener("change",draw);
    function rotateImage(delta){if(!img.src)return;rotation=(rotation+delta+360)%360;const swap=rotation%180!==0;canvas.width=swap?img.height:img.width;canvas.height=swap?img.width:img.height;offsetX=0;offsetY=0;updateMaskStatus();draw();}
    document.getElementById("rotateImageLeft")?.addEventListener("click",()=>rotateImage(-90));
    document.getElementById("rotateImageRight")?.addEventListener("click",()=>rotateImage(90));
    const cropModeBtn=document.getElementById("cropModeBtn"),applyCropBtn=document.getElementById("applyCropBtn"),cancelCropBtn=document.getElementById("cancelCropBtn");
    function updateCropControls(){if(applyCropBtn)applyCropBtn.disabled=!cropRect||cropRect.w<12||cropRect.h<12;if(cancelCropBtn)cancelCropBtn.disabled=!cropMode;if(cropModeBtn)cropModeBtn.textContent=cropMode?"退出裁剪":"框选裁剪区域";canvas.style.cursor=cropMode||maskMode?"crosshair":"grab";window.bpmImageEditorReady=()=>!cropMode&&!masking&&!cropRect;}
    cropModeBtn?.addEventListener("click",()=>{cropMode=!cropMode;maskMode=false;cropStart=null;if(!cropMode)cropRect=null;updateCropControls();updateMaskStatus();draw();});
    cancelCropBtn?.addEventListener("click",()=>{cropMode=false;cropStart=null;cropRect=null;updateCropControls();draw();});
    applyCropBtn?.addEventListener("click",()=>{if(!cropRect)return;const r={x:Math.round(cropRect.x),y:Math.round(cropRect.y),w:Math.round(cropRect.w),h:Math.round(cropRect.h)};if(r.w<12||r.h<12)return;cropMode=false;cropStart=null;drawImageAndMasks();const pixels=ctx.getImageData(r.x,r.y,r.w,r.h),tmp=document.createElement("canvas");tmp.width=r.w;tmp.height=r.h;tmp.getContext("2d").putImageData(pixels,0,0);const next=new Image();next.onload=()=>{img=next;canvas.width=r.w;canvas.height=r.h;scale=1;offsetX=offsetY=0;rotation=0;masks.length=0;watermarkBaked=false;if(scaleInput)scaleInput.value="1";cropRect=null;updateCropControls();updateMaskStatus();draw();};next.src=tmp.toDataURL("image/png");});
    document.getElementById("cropAspect")?.addEventListener("change",()=>{cropRect=null;cropStart=null;draw();updateCropControls();});
    canvas.style.touchAction="none";
    updateMaskStatus();
    updateCropControls();
    window.bpmImageEditorReady=()=>!cropMode&&!masking&&!cropRect;
    window.bpmGetEditorSource=()=>img.src||"";
    window.bpmLoadEditorSource=source=>{const next=new Image();next.onload=()=>{img=next;canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;scale=1;rotation=0;offsetX=offsetY=0;masks.length=0;cropRect=null;watermarkBaked=false;if(scaleInput)scaleInput.value="1";draw();};next.src=source;};
    window.bpmExportEditorImage=()=>{if(!window.bpmImageEditorReady())throw Error("请先应用或取消裁剪框");drawImageAndMasks();const result=canvas.toDataURL("image/png");draw();return result;};
    if(location.pathname.endsWith("/image-editor.html")){const source=sessionStorage.getItem("bpmImageEditorSource");if(source){sessionStorage.removeItem("bpmImageEditorSource");window.bpmLoadEditorSource(source);}}
    window.addEventListener("pageshow",()=>{restoreWatermarkSettings();const result=sessionStorage.getItem("bpmImageEditorResult");if(!result)return;sessionStorage.removeItem("bpmImageEditorResult");window.bpmLoadEditorSource(result);});







    function drawWatermark(){


        const text = WATERMARK_TEXT;



        const size =
            Number(watermarkSize.value) || 40;



        const opacity = WATERMARK_OPACITY;



        ctx.font =
            `600 ${size}px Arial, sans-serif`;



        const textWidth =
            ctx.measureText(text).width;



        let x = 40;

        let y = size + 40;



        switch(
            watermarkPosition.value
        ){


            case "top-right":

                x =
                canvas.width -
                textWidth -
                40;

                y =
                size + 40;

                break;



            case "bottom-left":

                x = 40;

                y =
                canvas.height - 40;

                break;



            case "bottom-right":

                x =
                canvas.width -
                textWidth -
                40;

                y =
                canvas.height - 40;

                break;


        }





        // 水印背景

        ctx.fillStyle =
        `rgba(0,0,0,${opacity})`;


        ctx.fillRect(

            x - 15,

            y - size - 10,

            textWidth + 30,

            size + 25

        );





        // 水印文字


        ctx.fillStyle =
        "white";


        ctx.fillText(

            text,

            x,

            y

        );


    }







    [
        watermarkSize,
        watermarkPosition

    ].forEach(
        item => {


            if(item){

                item.addEventListener(
                    "input",
                    draw
                );


                item.addEventListener(
                    "change",
                    draw
                );

            }

        }
    );


}
