let $docNum = 0;
let $docNo = 0;
let $image =
    {
        docId : null,
        docType : null,
        docUrl : null,
        Page : 1,
        totalPage : null,
        width : null,
        height : null,
        editWidth : null,
        editHeight : null,
    };
let $divImage =
    {
        scrollBarWidth : 17,
        divWidth : null,
        divHeight : null,
        rotateDegree : 90,
        totalRotate : 0,
        ZoomInScale : 1,
    };
let $focus =
    {
        X : 0,
        Y : 0,
        width : 0,
        height : 0,
        zoomInScale : null,
    };
let $tag =
    {
        clicked : false,
        X : 0,
        Y : 0,
        width : 0,
        height : 0,
        zoomInScale : null,
    };
let $windows =
    {
        clicked : false,
    };
let $click =
    {
        clickType : null,
        startX : 0,
        startY : 0,
        startPageX : 0,
        startPageY : 0,
        startScrollX : 0,
        startScrollY : 0,
    };
let $move =
    {
        scrollX : 0,
        scrollY : 0,
    };

//----------------------------------------------------------------------------------------------------------------------
//初始化工具列
$.fn.setViewer = function ()
{
    $(this).find(".btnSubmit").click(loadImage);
    $(this).find(".docImage")
        .load(getImageSize)
        .load(setConvas);

    $(this).find(".FitHeight").click(transform);
    $(this).find(".FitWidth").click(transform);
    $(this).find(".FullSize").click(transform);
    $(this).find(".ZoomIn").click(transform);
    $(this).find(".ZoomOut").click(transform);
    $(this).find(".RotateCW").click(transform);
    $(this).find(".RotateCCW").click(transform);
    $(this).find(".Pri").click(print);
    $(this).find(".PageUp").click(loadImage);
    $(this).find(".PageDown").click(loadImage);
    $(this).find(".Tag").click(showTag);
    $(this).find(".Min").click(windows);
    $(this).find(".Max").click(windows);
};
//登入
function login()
{
    $("#btnLogout").css("display","inline");
    $("#btnAddDoc").css("display","inline");
    $("#imageViewer0").css("display","block");
}
//登出
function logout()
{
    $("#btnLogout").css("display","none");
    $("#btnAddDoc").css("display","none");
    $("#imageViewer0").css("display","none");
}
//增加繪圖區
function addDoc()
{
    $("#imageViewer"+$docNum).after($("#imageViewer"+$docNum).clone().prop("id","imageViewer"+($docNum+1)));
    $docNum++;
    $("#imageViewer"+$docNum).setViewer();
}

//取得圖檔
function loadImage()
{
    /*
    換頁判斷
    */
    switch ($(this).attr("class"))
    {
        case "PageUp":
            $image.Page--;
            break;
        case "PageDown":
            $image.Page++;
            break;
    }

    let IVlocation = $(this).parent().parent();     //取得 imageViewer 位置
    $docNo = IVlocation.attr("id").match(/\d+/);    //取得第幾份文檔
    $image.docId = IVlocation.find('.docid').val();

    if(IVlocation.find(".tiff").prop("checked")) {$image.docType = IVlocation.find(".tiff").val()}
    else {$image.docType = null}

    IVlocation.find(".page").val($image.Page);
    let currentPage = $image.Page;
    $.ajax(
        {
            type: "POST",
            url : "imageServlet",
            data :
                {
                    username : $('#username').val(),
                    password : $('#password').val()
                },

            success : function()
            {
                $image.docUrl = document.location.href
                    .replace(
                        "index.html",
                        "imageServlet?docId=" + $image.docId
                        + "&currentPage=" + currentPage
                    );
                if ($image.docType !== null){$image.docUrl += "&type="+$image.docType}

                console.log("url="+$image.docUrl);

                /*
                showImage
                */
                IVlocation.find('.docImage')
                //.error(function () {$(this).attr("src","image/loading.png");})
                    .attr("src", $image.docUrl);
                if($image.docType === "tiff")
                {
                    var xhr = new XMLHttpRequest();
                    xhr.responseType = "arraybuffer";
                    xhr.open("GET", $image.docUrl);
                    xhr.onload = function ()
                    {
                        var tiff = new Tiff({buffer: xhr.response});
                        var canvas = tiff.toCanvas();
                        IVlocation.find('.docImage').attr("src",canvas.toDataURL());
                    };
                    xhr.send();
                }
            },
            error : function() {alert("連線失敗!!");}
        });
}
//----------------------------------------------------------------------------------------------------------------------
//初始化數據
function getImageSize()
{
    $divImage.divHeight = $(this).closest(".divImage").height();
    $divImage.divWidth = $(this).closest(".divImage").width();
    $divImage.totalRotate = 0;
    $divImage.zoomInScale = 1;

    $(this).css("height","").css("width","");
    $(this).closest(".divImage").find(".imageCanvas").css("height","").css("width","");

    $image.width = $(this).width();
    $image.height = $(this).height();
    $image.editWidth = $image.width;
    $image.editHeight = $image.height;

    console.log("\n docId : "+ $image.docId
        + "\n docType : "+ $image.docType
        + "\n docUrl : "+ $image.docUrl
        + "\n Page : "+ $image.Page
        + "\n totalPage : "+ $image.totalPage
        + "\n width : "+ $image.width
        + "\n height : "+ $image.height
        + "\n editWidth : "+ $image.editWidth
        + "\n editHeight : "+ $image.editHeight);

    //$(".Tag").css("color","black");
    //$tag.clicked = false;
}
//設定Tag鈕變化

function showTag()
{
    if ($tag.clicked)
    {
        $(this).css("color","black");
        $tag.clicked = false;
    }
    else
    {
        $(this).css("color","#3498db");
        $tag.clicked = true;
    }
}
//初始化canvas
function setConvas()
{
    $focus.X = 0;
    $focus.Y = 0;
    $focus.width = 0;
    $focus.height = 0;
    $focus.zoomInScale = null;

    $(this).closest(".divImage").find(".imageCanvas")
        .attr("width", $image.width)
        .attr("height", $image.height)
        .removeLayer("Image"+$docNo)
        .addLayer
        ({
            name: "Image"+$docNo,
            type: "image",
            source: $(this).attr("src"),
            index: 0,
            x: $image.width / 2,
            y: $image.height / 2,
        })
        .removeLayer("Focus"+$docNo)
        .addLayer({
            name: "Focus"+$docNo,
            type: "rectangle",
            index: 1,
            strokeStyle: "#000",
            fromCenter: false
        })
        .removeLayer("Tag"+$docNo)
        .addLayer({
            name: "Tag"+$docNo,
            type: "rectangle",
            index: 2,
            strokeStyle: "orangered",
            strokeWidth: 2,
            fromCenter: false
        })
        .drawLayers();
    //------------------------------------------------------------------------------------------------------------------
    //各層canvas加入滑鼠事件
    //關閉右鍵選單
    $(".divImage").contextmenu(function() {return false});

    //按下滑鼠
    $(".divImage").mousedown(function (e)
    {
        const clickX = e.offsetX;
        const clickY = e.offsetY;

        $click.clickType = e.which;
        $click.startX = clickX;
        $click.startY = clickY;
        $click.startPageX = e.pageX;
        $click.startPageY = e.pageY;

        $click.startScrollX = $(this).scrollLeft();
        $click.startScrollY = $(this).scrollTop();

        //按下後移動
        $(this).on(
            "mousemove",function (e)
            {
                $move.scrollX = $click.startScrollX - (e.pageX - $click.startPageX);
                $move.scrollY = $click.startScrollY - (e.pageY - $click.startPageY);

                if($tag.clicked)
                {
                    switch ($click.clickType)
                    {
                        case 1:
                            $(".imageCanvas").css("cursor","pointer");
                            $tag.zoomInScale = 1;
                            $tag.X = $click.startX;
                            $tag.Y = $click.startY;
                            $tag.width = e.offsetX - $tag.X;
                            $tag.height = e.offsetY - $tag.Y;
                            $(".imageCanvas").setLayer("Tag"+$docNo,
                                {
                                    x: $tag.X,
                                    y: $tag.Y,
                                    width: $tag.width,
                                    height: $tag.height,
                                })
                                .drawLayers();
                            break;
                    }
                }
                else
                {
                    switch ($click.clickType)
                    {
                        case 1:
                            $(".imageCanvas").css("cursor","grabbing");
                            $(this).scrollLeft($move.scrollX);
                            $(this).scrollTop($move.scrollY);
                            break;

                        case 3:
                            $focus.zoomInScale = 1;
                            $focus.X = $click.startX;
                            $focus.Y = $click.startY;
                            $focus.width = e.offsetX - $focus.X;
                            $focus.height = e.offsetY - $focus.Y;
                            $(".imageCanvas").setLayer("Focus"+$docNo,
                                {
                                    strokeWidth: 2,
                                    x: $focus.X,
                                    y: $focus.Y,
                                    width: $focus.width,
                                    height: $focus.height,
                                })
                                .drawLayers();
                    }
                }
            });
    });
    //放開滑鼠
    $(".divImage").mouseup(function (e)
    {
        if($tag.clicked) {}
        else
        {
            switch ($click.clickType)
            {

                case 3:
                    $(".imageCanvas").setLayer("Focus"+$docNo, {strokeWidth: 0,}).drawLayers();

                    $focus.zoomInScale = $focus.zoomInScale/$divImage.zoomInScale;
                    if ($focus.width > $focus.height)
                    {
                        $divImage.zoomInScale = ($divImage.divWidth - $divImage.scrollBarWidth)/Math.abs($focus.width*$focus.zoomInScale);
                        $focus.zoomInScale*=$divImage.zoomInScale;
                    }
                    else
                    {
                        $divImage.zoomInScale = ($divImage.divHeight)/Math.abs($focus.height*$focus.zoomInScale);
                        $focus.zoomInScale*=$divImage.zoomInScale;
                    }
                    scaleAndRotate();

                    if(e.offsetX >= $click.startX && e.offsetY >= $click.startY)
                    {
                        $(this).scrollLeft($click.startX*$focus.zoomInScale);
                        $(this).scrollTop($click.startY*$focus.zoomInScale);
                    }
                    else if(e.offsetX >= $click.startX && e.offsetY < $click.startY)
                    {
                        $(this).scrollLeft($click.startX*$focus.zoomInScale);
                        $(this).scrollTop(($click.startY - Math.abs($focus.height))*$focus.zoomInScale);
                    }
                    else if(e.offsetX < $click.startX && e.offsetY >= $click.startY)
                    {
                        $(this).scrollLeft(($click.startX- Math.abs($focus.width))*$focus.zoomInScale);
                        $(this).scrollTop($click.startY*$focus.zoomInScale);
                    }
                    else if(e.offsetX < $click.startX && e.offsetY < $click.startY)
                    {
                        $(this).scrollLeft(($click.startX- Math.abs($focus.width))*$focus.zoomInScale);
                        $(this).scrollTop(($click.startY - Math.abs($focus.height))*$focus.zoomInScale);
                    }
                    break;
            }
        }
        $(this).off("mousemove");
        $(".imageCanvas").css("cursor","default");
    });
    //滑鼠離開圖層
    $(".divImage").mouseleave(function (e)
    {
        $(this).off("mousemove");
        $(".imageCanvas")
            .css("cursor","default")
            .setLayer("Focus"+$docNo,
                {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                })
            .drawLayers();
    });
}
//---------------------------------------------------------------------------------------------------------------------
function transform()
{
    let IVlocation = $(this).parent().parent();     //取得 imageViewer 位置
    let $docNo = IVlocation.attr("id").match(/\d+/);    //取得第幾份文檔

    switch ($(this).attr("class"))
    {
        case "FitHeight":
            if($divImage.zoomInScale !== $divImage.divHeight/
                (Math.abs($image.height*Math.cos($divImage.totalRotate*Math.PI/180)) +
                    Math.abs($image.width*Math.sin($divImage.totalRotate*Math.PI/180))))
            {
                $focus.zoomInScale = $focus.zoomInScale/$divImage.zoomInScale;
                $tag.zoomInScale = $tag.zoomInScale/$divImage.zoomInScale;
                $divImage.zoomInScale = $divImage.divHeight/
                    (Math.abs($image.height*Math.cos($divImage.totalRotate*Math.PI/180)) +
                        Math.abs($image.width*Math.sin($divImage.totalRotate*Math.PI/180)));
                $focus.zoomInScale*=$divImage.zoomInScale;
                $tag.zoomInScale*=$divImage.zoomInScale;
            }
            break;
        case "FitWidth":
            if (
                $divImage.zoomInScale !== ($divImage.divWidth - $divImage.scrollBarWidth)/
                (Math.abs($image.height * Math.sin($divImage.totalRotate * Math.PI/180)) +
                    Math.abs($image.width * Math.cos($divImage.totalRotate * Math.PI/180))))
            {
                $focus.zoomInScale = $focus.zoomInScale/$divImage.zoomInScale;
                $tag.zoomInScale = $tag.zoomInScale/$divImage.zoomInScale;
                $divImage.zoomInScale = ($divImage.divWidth - $divImage.scrollBarWidth)/
                    (Math.abs($image.height * Math.sin($divImage.totalRotate * Math.PI/180)) +
                        Math.abs($image.width * Math.cos($divImage.totalRotate * Math.PI/180)));
                $focus.zoomInScale*=$divImage.zoomInScale;
                $tag.zoomInScale*=$divImage.zoomInScale;
            }
            break;
        case "FullSize":
            if ($divImage.zoomInScale !== 1)
            {
                $focus.zoomInScale = $focus.zoomInScale/$divImage.zoomInScale;
                $tag.zoomInScale = $tag.zoomInScale/$divImage.zoomInScale;
                $divImage.zoomInScale = 1;
            }
            break;
        case "ZoomIn":
            $divImage.zoomInScale *= 1.1;
            $focus.zoomInScale *= 1.1;
            $tag.zoomInScale *= 1.1;
            break;
        case "ZoomOut":
            $divImage.zoomInScale /= 1.1;
            $focus.zoomInScale /= 1.1;
            $tag.zoomInScale /= 1.1;
            break;
        case "RotateCW":
            $divImage.totalRotate += $divImage.rotateDegree;
            break;
        case "RotateCCW":
            $divImage.totalRotate -= $divImage.rotateDegree;
            break;
    }
    scaleAndRotate();
}
function print()
{
    $(".Pri")
        .attr("href",$(".imageCanvas").getCanvasImage())
        .attr("download",$image.docId +"_"+ $image.Page + ".png");
}
function windows()
{
    switch ($(this).attr("class"))
    {
        case "Min":
            $(".divImage").css("height","0");
            break;
        case "Max":
            $(this).find("i").toggleClass("fa fa-window-maximize fa-1x fa fa-window-restore fa-1x");
            if ($windows.clicked)
            {
                $(".divImage").css("height","80vh");
                $windows.clicked = false;
            }
            else
            {
                $(".divImage")
                    .css("height",$tag.height*$tag.zoomInScale + $divImage.scrollBarWidth)
                    .scrollLeft($tag.X*$tag.zoomInScale)
                    .scrollTop($tag.Y*$tag.zoomInScale);
                $windows.clicked = true;
            }
            break;
    }
}

//----------------------------------------------------------------------------------------------------------------------
//inner function

function scaleAndRotate()
{
    if($divImage.zoomInScale >= 2 )
    {
        $focus.zoomInScale = 2*$focus.zoomInScale/$divImage.zoomInScale;
        $divImage.zoomInScale = 2;
    }

    $image.editWidth = $image.width*$divImage.zoomInScale;
    $image.editHeight = $image.height*$divImage.zoomInScale;
    $(".imageCanvas")
        .attr("height",
            Math.abs($image.editHeight * Math.cos($divImage.totalRotate * Math.PI / 180)) +
            Math.abs($image.editWidth * Math.sin($divImage.totalRotate * Math.PI / 180)))
        .attr("width",
            Math.abs($image.editHeight * Math.sin($divImage.totalRotate * Math.PI / 180)) +
            Math.abs($image.editWidth * Math.cos($divImage.totalRotate * Math.PI / 180)))
        .setLayer(
            "Image"+$docNo, {
                x: (Math.abs($image.editHeight * Math.sin($divImage.totalRotate * Math.PI / 180)) +
                    Math.abs($image.editWidth * Math.cos($divImage.totalRotate * Math.PI / 180))) / 2,
                y: (Math.abs($image.editHeight * Math.cos($divImage.totalRotate * Math.PI / 180)) +
                    Math.abs($image.editWidth * Math.sin($divImage.totalRotate * Math.PI / 180))) / 2,
                scale: $divImage.zoomInScale,
                rotate: $divImage.totalRotate
            })
        .setLayer(
            "Focus"+$docNo, {
                x: $focus.X*$focus.zoomInScale,
                y: $focus.Y*$focus.zoomInScale,
                width: $focus.width*$focus.zoomInScale,
                height: $focus.height*$focus.zoomInScale,
            })
        .setLayer(
            "Tag"+$docNo, {
                x: $tag.X*$tag.zoomInScale,
                y: $tag.Y*$tag.zoomInScale,
                width: $tag.width*$tag.zoomInScale,
                height: $tag.height*$tag.zoomInScale,
            })
        .drawLayers();

    console.log(
        "width="+$image.editWidth+"\n"
        +"height="+$image.editHeight+"\n"
        +"relZoomInScale="+$focus.zoomInScale+"\n"
        +"abZoomInScale="+$divImage.zoomInScale+"\n"
        +"rotateDegree="+$divImage.rotateDegree+"\n"
        +"totalRotate="+$divImage.totalRotate+"\n");
}




