let $docIdNum = 0;
let $docTotalNum = 1;
let $images =
    {
        docId : [],
        docType : [],
        docUrl : [],
        Page : [],
        totalPage : [],
        width : [],
        height : [],
        editWidth : [],
        editHeight : [],
    };
let $divImages =
    {
        scrollBarWidth : 17,
        rotateDegree : 90,
        divWidth : [],
        divHeight : [],
        totalRotate : [],
        zoomInScale : [],
    };
let $focuses =
    {
        X : [],
        Y : [],
        width : [],
        height : [],
        zoomInScale : [],
    };
let $tags =
    {
        clicked : [],
        X : [],
        Y : [],
        width : [],
        height : [],
        totalRotate : [],
        zoomInScale : [],
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
    $(this).find(".Edit").click(edit);
    $(this).find(".Min").click(windows);
    $(this).find(".Max").click(windows);
    $(this).find(".Close").click(closeWindow);
};
//登入
function login()
{
    $("#btnLogout").css("display","inline");
    $("#btnAddDoc").css("display","inline");
    $(".imageViewer").css("display","block");
    $("#btnLogin").prop("disabled",true);
}
//登出
function logout()
{
    location.reload()
}
//增加繪圖區
function addDoc()
{
    $("#imageViewer"+$docIdNum).after($("#imageViewer"+$docIdNum).clone().prop("id","imageViewer"+($docIdNum+1)));
    $docIdNum++;
    $("#imageViewer"+$docIdNum)
        .attr("class","imageViewer")
        .css("display","block")
        .setViewer();
    $docTotalNum++;
}
//取得圖檔
function loadImage()
{
    let IVlocation = $(this).parent().parent();     //取得 imageViewer 位置
    let $docNo = IVlocation.attr("id").match(/\d+/);    //取得第幾份文檔
    showEdit($docNo);
    $images.docId[$docNo] = IVlocation.find('.docid').val();
    $images.totalPage[$docNo] = 3;

    //顯示第幾張圖
    IVlocation.find(".PageNo").css("display","inline");
    IVlocation.find(".PageList").css("display","inline");
    if (IVlocation.find("option").length === 0)
    {
        for (let i = 1; i<=$images.totalPage[$docNo]; i++)
        {IVlocation.find(".PageList").append("<option value="+i+">"+i+"</option>")}
    }
    //------------------------------------------------------------------------------------------------------------------
    //換頁
    let pageNO = IVlocation.find(".PageList").val();
    switch ($(this).attr("class"))
    {
        case "PageUp":
            pageNO--;
            break;
        case "PageDown":
            pageNO++;
            break;
    }
    if (pageNO <= "1")
    {
        IVlocation.find(".PageUp").prop("disabled",true);
        IVlocation.find(".PageDown").prop("disabled",false);
        pageNO = 1;
    }
    else if (pageNO >= "3")
    {
        IVlocation.find(".PageUp").prop("disabled",false);
        IVlocation.find(".PageDown").prop("disabled",true);
        pageNO = 3;
    }
    else
    {
        IVlocation.find(".PageUp").prop("disabled",false);
        IVlocation.find(".PageDown").prop("disabled",false);
    }
    IVlocation.find(".PageList").val(pageNO);
    let currentPage = IVlocation.find(".PageList").val();
    //------------------------------------------------------------------------------------------------------------------
    //是否用tiff檔
    if(IVlocation.find(".tiff").prop("checked"))
    {$images.docType[$docNo] = IVlocation.find(".tiff").val();}
    else
    {$images.docType[$docNo] = null;}
    //------------------------------------------------------------------------------------------------------------------
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
                $images.docUrl[$docNo] = document.location.href
                    .replace(
                        "index.html",
                        "imageServlet?docId=" + $images.docId[$docNo]
                        + "&currentPage=" + currentPage
                    );
                if ($images.docType[$docNo] !== null){$images.docUrl[$docNo] += "&type="+$images.docType[$docNo]}

                console.log("url="+$images.docUrl[$docNo]);
                /*
                showImage
                */
                IVlocation.find('.docImage')
                //.error(function () {$(this).attr("src","image/loading.png");})
                    .attr("src", $images.docUrl[$docNo]);
                if($images.docType[$docNo] === "tiff")
                {
                    var xhr = new XMLHttpRequest();
                    xhr.responseType = "arraybuffer";
                    xhr.open("GET", $images.docUrl[$docNo]);
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
    let IVlocation = $(this).parent().parent();     //取得 imageViewer 位置
    let $docNo = IVlocation.attr("id").match(/\d+/);    //取得第幾份文檔

    $divImages.divHeight[$docNo] = $(this).closest(".divImage").height();
    $divImages.divWidth[$docNo] = $(this).closest(".divImage").width();
    $divImages.totalRotate[$docNo] = 0;
    $divImages.zoomInScale[$docNo] = 1;

    $(this).css("height","").css("width","");
    $(this).closest(".divImage").find(".imageCanvas").css("height","").css("width","");

    $images.width[$docNo] = $(this).width();
    $images.height[$docNo] = $(this).height();
    $images.editWidth[$docNo] = $images.width[$docNo];
    $images.editHeight[$docNo] = $images.height[$docNo];
}
//----------------------------------------------------------------------------------------------------------------------
//初始化canvas
function setConvas()
{
    let IVlocation = $(this).parent().parent();     //取得 imageViewer 位置
    let $docNo = IVlocation.attr("id").match(/\d+/);    //取得第幾份文檔

    $focuses.X[$docNo] = 0;
    $focuses.Y[$docNo] = 0;
    $focuses.width[$docNo] = 0;
    $focuses.height[$docNo] = 0;
    $focuses.zoomInScale[$docNo] = null;

    $(this).closest(".divImage").find(".imageCanvas")
        .attr("width", $images.width[$docNo])
        .attr("height", $images.height[$docNo])
        .removeLayer("Image"+$docNo)
        .addLayer
        ({
            name: "Image"+$docNo,
            type: "image",
            source: $(this).attr("src"),
            index: 0,
            x: $images.width[$docNo] / 2,
            y: $images.height[$docNo] / 2,
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
    console.log("docNO = "+$docNo
        +"\ndocId = "+$images.docId
        +"\ndocPage = "+$images.Page
        +"\ndocType = "+$images.docType
        +"\ndocUrl = "+$images.docUrl
        +"\nwidth : "+ $images.width
        +"\nheight : "+ $images.height
        +"\nDocTotalNum : "+ $docTotalNum);
    //------------------------------------------------------------------------------------------------------------------
    //各層canvas加入滑鼠事件
    //關閉右鍵選單
    $(this).closest(".divImage").contextmenu(function() {return false});

    //按下滑鼠
    $(this).closest(".divImage").mousedown(function (e)
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
        $(this).on("mousemove",function (e)
            {
                $move.scrollX = $click.startScrollX - (e.pageX - $click.startPageX);
                $move.scrollY = $click.startScrollY - (e.pageY - $click.startPageY);

                if($(this).closest("#imageViewer"+$docNo).find(".Tag").css("color") === "rgb(52, 152, 219)")
                {
                    $(this).closest(".divImage").find(".imageCanvas").setLayer("Tag"+$docNo,
                        {
                            visible : true
                        });
                    switch ($click.clickType)
                    {
                        case 1:
                            $(this).closest(".divImage").find(".imageCanvas").css("cursor","pointer");
                            $tags.totalRotate[$docNo] = 0;
                            $tags.zoomInScale[$docNo] = 1;
                            $tags.X[$docNo] = $click.startX;
                            $tags.Y[$docNo] = $click.startY;
                            $tags.width[$docNo] = e.offsetX - $tags.X[$docNo];
                            $tags.height[$docNo] = e.offsetY - $tags.Y[$docNo];
                            $(this).closest(".divImage").find(".imageCanvas").setLayer("Tag"+$docNo,
                                {
                                    x: $tags.X[$docNo],
                                    y: $tags.Y[$docNo],
                                    width: $tags.width[$docNo],
                                    height: $tags.height[$docNo],
                                    rotate: $tags.totalRotate[$docNo]
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
                            $(this).closest(".divImage").find(".imageCanvas").css("cursor","grabbing");
                            $(this).scrollLeft($move.scrollX);
                            $(this).scrollTop($move.scrollY);
                            break;

                        case 3:
                            $focuses.zoomInScale[$docNo] = 1;
                            $focuses.X[$docNo] = $click.startX;
                            $focuses.Y[$docNo] = $click.startY;
                            $focuses.width[$docNo] = e.offsetX - $focuses.X[$docNo];
                            $focuses.height[$docNo] = e.offsetY - $focuses.Y[$docNo];
                            $(this).closest(".divImage").find(".imageCanvas").setLayer("Focus"+$docNo,
                                {
                                    strokeWidth: 2,
                                    x: $focuses.X[$docNo],
                                    y: $focuses.Y[$docNo],
                                    width: $focuses.width[$docNo],
                                    height: $focuses.height[$docNo],
                                })
                                .drawLayers();
                    }
                }
            });
    });
    //放開滑鼠
    $(this).closest(".divImage").mouseup(function (e)
    {
        if($tags.clicked[$docNo]) {}
        else
        {
            switch ($click.clickType)
            {
                case 3:
                    $(this).closest(".divImage").find(".imageCanvas").setLayer("Focus"+$docNo, {strokeWidth: 0,}).drawLayers();

                    $focuses.zoomInScale[$docNo] = $focuses.zoomInScale[$docNo]/$divImages.zoomInScale[$docNo];
                    if ($focuses.width[$docNo] > $focuses.height[$docNo])
                    {
                        $divImages.zoomInScale[$docNo] =
                            ($divImages.divWidth[$docNo] - $divImages.scrollBarWidth)/Math.abs($focuses.width[$docNo]*$focuses.zoomInScale[$docNo]);
                        $focuses.zoomInScale[$docNo]*=$divImages.zoomInScale[$docNo];
                    }
                    else
                    {
                        $divImages.zoomInScale[$docNo] =
                            ($divImages.divHeight[$docNo])/Math.abs($focuses.height[$docNo]*$focuses.zoomInScale[$docNo]);
                        $focuses.zoomInScale[$docNo]*=$divImages.zoomInScale[$docNo];
                    }
                    scaleAndRotate($docNo);
                    if(e.offsetX >= $click.startX && e.offsetY >= $click.startY)
                    {
                        $(this).scrollLeft($click.startX*$focuses.zoomInScale[$docNo]);
                        $(this).scrollTop($click.startY*$focuses.zoomInScale[$docNo]);
                    }
                    else if(e.offsetX >= $click.startX && e.offsetY < $click.startY)
                    {
                        $(this).scrollLeft($click.startX*$focuses.zoomInScale[$docNo]);
                        $(this).scrollTop(($click.startY - Math.abs($focuses.height[$docNo]))*$focuses.zoomInScale[$docNo]);
                    }
                    else if(e.offsetX < $click.startX && e.offsetY >= $click.startY)
                    {
                        $(this).scrollLeft(($click.startX- Math.abs($focuses.width[$docNo]))*$focuses.zoomInScale[$docNo]);
                        $(this).scrollTop($click.startY*$focuses.zoomInScale[$docNo]);
                    }
                    else if(e.offsetX < $click.startX && e.offsetY < $click.startY)
                    {
                        $(this).scrollLeft(($click.startX- Math.abs($focuses.width[$docNo]))*$focuses.zoomInScale[$docNo]);
                        $(this).scrollTop(($click.startY - Math.abs($focuses.height[$docNo]))*$focuses.zoomInScale[$docNo]);
                    }
                    break;
            }
        }
        $(this).off("mousemove");
        $(this).closest(".divImage").find(".imageCanvas").css("cursor","default");
    });
    //滑鼠離開圖層
    $(this).closest(".divImage").mouseleave(function ()
    {
        $(this).off("mousemove");
        $(this).closest(".divImage").find(".imageCanvas")
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
            if ($divImages.zoomInScale[$docNo] !== $divImages.divHeight[$docNo]/
                (Math.abs($images.height[$docNo]*Math.cos($divImages.totalRotate[$docNo]*Math.PI/180)) +
                    Math.abs($images.width[$docNo]*Math.sin($divImages.totalRotate[$docNo]*Math.PI/180))))
            {
                $focuses.zoomInScale[$docNo] = $focuses.zoomInScale[$docNo]/$divImages.zoomInScale[$docNo];
                $tags.zoomInScale[$docNo] = $tags.zoomInScale[$docNo]/$divImages.zoomInScale[$docNo];
                $divImages.zoomInScale[$docNo] = $divImages.divHeight[$docNo]/
                    (Math.abs($images.height[$docNo]*Math.cos($divImages.totalRotate[$docNo]*Math.PI/180)) +
                        Math.abs($images.width[$docNo]*Math.sin($divImages.totalRotate[$docNo]*Math.PI/180)));
                $focuses.zoomInScale[$docNo]*=$divImages.zoomInScale[$docNo];
                $tags.zoomInScale[$docNo]*=$divImages.zoomInScale[$docNo];
            }
            break;
        case "FitWidth":
            if ($divImages.zoomInScale[$docNo] !== ($divImages.divWidth[$docNo] - $divImages.scrollBarWidth)/
                (Math.abs($images.height[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI/180)) +
                    Math.abs($images.width[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI/180))))
            {
                $focuses.zoomInScale[$docNo] = $focuses.zoomInScale[$docNo]/$divImages.zoomInScale[$docNo];
                $tags.zoomInScale[$docNo] = $tags.zoomInScale[$docNo]/$divImages.zoomInScale[$docNo];
                $divImages.zoomInScale[$docNo] = ($divImages.divWidth[$docNo] - $divImages.scrollBarWidth)/
                    (Math.abs($images.height[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI/180)) +
                        Math.abs($images.width[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI/180)));
                $focuses.zoomInScale[$docNo]*=$divImages.zoomInScale[$docNo];
                $tags.zoomInScale[$docNo]*=$divImages.zoomInScale[$docNo];
            }
            break;
        case "FullSize":
            if ($divImages.zoomInScale[$docNo] !== 1)
            {
                $focuses.zoomInScale[$docNo] = $focuses.zoomInScale[$docNo]/$divImages.zoomInScale[$docNo];
                $tags.zoomInScale[$docNo] = $tags.zoomInScale[$docNo]/$divImages.zoomInScale[$docNo];
                $divImages.zoomInScale[$docNo] = 1;
            }
            break;
        case "ZoomIn":
            $divImages.zoomInScale[$docNo] *= 1.1;
            $focuses.zoomInScale[$docNo] *= 1.1;
            $tags.zoomInScale[$docNo] *= 1.1;
            break;
        case "ZoomOut":
            $divImages.zoomInScale[$docNo] /= 1.1;
            $focuses.zoomInScale[$docNo] /= 1.1;
            $tags.zoomInScale[$docNo] /= 1.1;
            break;
        case "RotateCW":
            $divImages.totalRotate[$docNo] += $divImages.rotateDegree;
            $tags.totalRotate[$docNo] += $divImages.rotateDegree;
            break;
        case "RotateCCW":
            $divImages.totalRotate[$docNo] -= $divImages.rotateDegree;
            $tags.totalRotate[$docNo] += $divImages.rotateDegree;
            break;
    }
    scaleAndRotate($docNo);
}
function print()
{
    let IVlocation = $(this).parent().parent();     //取得 imageViewer 位置
    let $docNo = IVlocation.attr("id").match(/\d+/);    //取得第幾份文檔
    $("#imageViewer"+$docNo).find(".Pri")
        .attr("href",$("#imageViewer"+$docNo).find(".imageCanvas").getCanvasImage())
        .attr("download",$images.docId[$docNo] +"_"+ $images.Page[$docNo] + ".png");
}
function showTag()  //設定Tag鈕變化
{
    switch ($(this).css("color"))
    {
        case "rgb(0, 0, 0)":
            $(this).css("color","#3498db");
            break;
        case "rgb(52, 152, 219)":
            $(this).css("color","black");
            break;
    }
}
function edit()
{
    let IVlocation = $(this).parent().parent();     //取得 imageViewer 位置
    let $docNo = IVlocation.attr("id").match(/\d+/);    //取得第幾份文檔

    switch ($(this).find("i").attr("class"))
    {
        case "fa fa-edit fa-1x":
            $(this).parent().next().css("width","70vw").css("border-width","0 0 2px 2px");
            $(this).parent().next().next().css("width","25vw").css("display","inline-block");
            showEdit($docNo);
            break;
        case "fa-edit fa fa-1x":
            $(this).parent().next().css("width","70vw").css("border-width","0 0 2px 2px");
            $(this).parent().next().next().css("display","inline-block");
            showEdit($docNo);
            break;
        case "fa fa-eye fa-1x":
            $(this).parent().next().css("width","95vw").css("border-width","0 2px 2px 2px");
            $(this).parent().next().next().css("display","none");
            break;
    }
   //$(this).parent().next().next().css("width","25vw").css("display","inline-block");
    $(this).find("i").toggleClass("fa fa-edit fa-1x fa fa-eye fa-1x");
}
function showEdit($docNo)
{
    $("#imageViewer"+$docNo).find(".DocNo").text($("#imageViewer"+$docNo).find(".docid").val());

    switch ($("#imageViewer"+$docNo).find(".docid").val())
    {
        case "20188":
            break;
        case "27895":

            break;
        case "20256":
            break;
    }

}
function windows()
{
    let IVlocation = $(this).parent().parent();     //取得 imageViewer 位置
    let $docNo = IVlocation.attr("id").match(/\d+/);    //取得第幾份文檔
    switch ($(this).attr("class"))
    {
        case "Min":
            switch ($(this).find("i").attr("class"))
            {
                case "fa fa-window-minimize fa-1x":
                    $(this).parent().css("border-width","2px 2px 2px 2px");
                    $(this).parent().next().css("display","none");
                    $(this).parent().next().next().css("display","none");
                    break;
                case "fa-window-minimize fa fa-1x" :
                    $(this).parent().css("border-width","2px 2px 2px 2px");
                    $(this).parent().next().css("display","none");
                    $(this).parent().next().next().css("display","none");
                    break;
                case "fa fa-window-maximize fa-1x" :
                    $(this).parent().css("border-width","2px 2px 0 2px");
                    if($(this).parent().parent().find(".Edit").find("i").attr("class") === "fa fa-eye fa-1x")
                    {
                        $(this).parent().next()
                            .css("width","70vw")
                            .css("display","inline-block")
                            .css("border-width","0 0 2px 2px");
                        $(this).parent().next().next().css("display","inline-block");
                    }
                    else
                    {
                        $(this).parent().next()
                            .css("width","95vw")
                            .css("display","inline-block")
                            .css("border-width","0 2px 2px 2px");
                        $(this).parent().next().next().css("display","none");
                    }
                    break;
            }
            $(this).find("i").toggleClass("fa fa-window-minimize fa-1x fa fa-window-maximize fa-1x");
            break;
        case "Max":
            $(this).next().find("i").attr("class","fa fa-window-minimize fa-1x");
            if($(this).parent().parent().find(".Edit").find("i").attr("class") === "fa fa-eye fa-1x")
            {
                $(this).parent().next()
                    .css("width","70vw")
                    .css("display","inline-block")
                    .css("border-width","0 0 2px 2px");
                $(this).parent().next().next().css("display","inline-block");
            }
            else
            {
                $(this).parent().next()
                    .css("width","95vw")
                    .css("display","inline-block")
                    .css("border-width","0 2px 2px 2px");
                $(this).parent().next().next().css("display","none");
            }
            switch ($(this).find("i").attr("class"))
            {
                case "fa-window-maximize fa fa-1x" :
                    $(this).parent().next().css("height","80vh");
                    $(this).parent().next().next().css("height","80vh");
                    break;
                case "fa fa-window-maximize fa-1x" :
                    $(this).parent().next().css("height","80vh");
                    $(this).parent().next().next().css("height","80vh");
                    break;
                case "fa fa-window-restore fa-1x" :
                    $(this).parent().next()
                        .css("height",$tags.height[$docNo]*$tags.zoomInScale[$docNo])
                        .scrollLeft($tags.X[$docNo]*$tags.zoomInScale[$docNo])
                        .scrollTop($tags.Y[$docNo]*$tags.zoomInScale[$docNo]);
                    $(this).parent().next().next()
                        .css("height",$tags.height[$docNo]*$tags.zoomInScale[$docNo]);
                    break;
            }
            $(this).find("i").toggleClass("fa fa-window-maximize fa-1x fa fa-window-restore fa-1x");
            break;
    }
}
function closeWindow()
{
    let IVlocation = $(this).parent().parent();     //取得 imageViewer 位置
    IVlocation.css("display","none");
    $docTotalNum--;
}
function scaleAndRotate($docNo)
{
    if($divImages.zoomInScale[$docNo] >= 2 )
    {
        $focuses.zoomInScale[$docNo] = 2*$focuses.zoomInScale[$docNo]/$divImages.zoomInScale[$docNo];
        $divImages.zoomInScale[$docNo] = 2;
    }
    $images.editWidth[$docNo] = $images.width[$docNo]*$divImages.zoomInScale[$docNo];
    $images.editHeight[$docNo] = $images.height[$docNo]*$divImages.zoomInScale[$docNo];
    $("#imageViewer"+$docNo).find(".imageCanvas")
        .attr("width",
            Math.abs($images.editHeight[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI / 180)) +
            Math.abs($images.editWidth[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI / 180)))
        .attr("height",
            Math.abs($images.editHeight[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI / 180)) +
            Math.abs($images.editWidth[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI / 180)))
        .setLayer("Image"+$docNo, {
                x: (Math.abs($images.editHeight[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI / 180))
                    + Math.abs($images.editWidth[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI / 180))) / 2,
                y: (Math.abs($images.editHeight[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI / 180))
                    + Math.abs($images.editWidth[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI / 180))) / 2,
                scale: $divImages.zoomInScale[$docNo],
                rotate: $divImages.totalRotate[$docNo]
            })
        .setLayer("Focus"+$docNo, {
                x: $focuses.X[$docNo]*$focuses.zoomInScale[$docNo],
                y: $focuses.Y[$docNo]*$focuses.zoomInScale[$docNo],
                width: $focuses.width[$docNo]*$focuses.zoomInScale[$docNo],
                height: $focuses.height[$docNo]*$focuses.zoomInScale[$docNo],
            })
        .setLayer("Tag"+$docNo, {
                x: $tags.X[$docNo]*$tags.zoomInScale[$docNo],
                y: $tags.Y[$docNo]*$tags.zoomInScale[$docNo],
                width: $tags.width[$docNo]*$tags.zoomInScale[$docNo],
                height: $tags.height[$docNo]*$tags.zoomInScale[$docNo],
            })
        .drawLayers();
    if ($tags.totalRotate[$docNo]%360 !== 0)
    {
        $("#imageViewer"+$docNo).find(".imageCanvas")
            .setLayer("Tag"+$docNo, {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            })
            .drawLayers();
    }
    console.log(
        "$docNo="+$docNo+"\n"
        +"width="+$images.editWidth[$docNo]+"\n"
        +"height="+$images.editHeight[$docNo]+"\n"
        +"divwidth="+Math.abs($images.editHeight[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI / 180)) +
        Math.abs($images.editWidth[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI / 180))+"\n"
        +"divheight="+Math.abs($images.editHeight[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI / 180)) +
        Math.abs($images.editWidth[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI / 180))+"\n"
        +"relZoomInScale="+$focuses.zoomInScale[$docNo]+"\n"
        +"abZoomInScale="+$divImages.zoomInScale[$docNo]+"\n"
        +"rotateDegree="+$divImages.rotateDegree+"\n"
        +"totalRotate="+$divImages.totalRotate[$docNo]+"\n"
        +"tagsRotate="+$tags.totalRotate[$docNo]+"\n"
        +"$images.docUrl[$docNo]="+$images.docUrl[$docNo]+"\n"
        +"x="+(Math.abs($images.editHeight[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI / 180))
        + Math.abs($images.editWidth[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI / 180))) / 2+"\n"
        +"y="+(Math.abs($images.editHeight[$docNo] * Math.cos($divImages.totalRotate[$docNo] * Math.PI / 180))
        + Math.abs($images.editWidth[$docNo] * Math.sin($divImages.totalRotate[$docNo] * Math.PI / 180))) / 2+"\n");
}




