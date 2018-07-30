(function ($) {
    'use strict';
    let $viewerNumber = 0;
    let $imageViewer = [];
    let $imageData = [];
    let $image = [];
    let $waterMark = {
        Font: 'bold 60pt Calibri',
        FillColor: '#ff0000',
        FillAlpha: 0.4,
        RotateAngle: 45,
        Text: '中文 ImageViewer Demo',
    };
    let loadFromMoveTo = false;

    let $watermarkCanvas = [];

    let $imageContain = [];
    let $imageCanvas = [];
    let $imageScrollPaneAPI = [];

    let $annotationContain = [];
    let $annotationCanvas = [];
    let $annotationScrollPaneAPI = [];

    let $tempContain = [];
    let $tempCanvas = [];
    let $tempScrollPaneAPI = [];

    let $annoEditDialog = [];

    // $annoArray 用來放 annotation
    // 每個 annotation 的內容為
    // id: annotation 編號, page: annotation 所在的頁碼, x: 左上角 x 座標, y: 左上角 y 座標, width: 寬度, height: 高度,
    // type: 形狀, text: 文字內容, bgcolor: 底色, fontcolor: 文字顏色, linecolor: 外框顏色

    let $annoArray = null;

    let $toolsBtn = {
        fitHeight: { id: "btnFitHeight", css: "fa-arrows-v",        show: true, title: "最適高度"  },
        fitWidth:  { id: "btnFitWidth",  css: "fa-arrows-h",        show: true, title: "最適寬度"  },
        fullSize:  { id: "btnFullSize",  css: "fa-arrows",          show: true, title: "原圖"     },
        zoomIn:    { id: "btnZoomIn",    css: "fa-search-plus",     show: true, title: "放大"     },
        zoomOut:   { id: "btnZoomOut",   css: "fa-search-minus",    show: true, title: "縮小"     },
        RotateCW:  { id: "btnRotateCW",  css: "fa-repeat",          show: true, title: "旋轉"     },
        RotateCCW: { id: "btnRotateCCW", css: "fa-undo",            show: true, title: "旋轉"     },
        Print:     { id: "btnPrint",     css: "fa-print",           show: true, title: "列印"     },
        ShowAnno:  { id: "btnShowAnno",  css: "fa-eye",             show: false,title: "顯示註記"  },
        HideAnno:  { id: "btnHideAnno",  css: "fa-eye-slash",       show: true, title: "隱藏註記"  },
        EditAnno:  { id: "btnEditAnno",  css: "fa-pencil-square-o", show: true, title: "新增註記"  },
        DelAnno:   { id: "btnDelAnno",   css: "fa-trash-o",         show: true, title: "刪除註記"  },
        Prev:      { id: "btnPrev",      css: "fa-arrow-left",      show: true, title: "上一頁"    },
        Next:      { id: "btnNext",      css: "fa-arrow-right",     show: true, title: "下一頁"    },
        UnMax:     { id: "btnUnMax",     css: "fa-window-restore",  show: false, title: "還原"     },
        Max:       { id: "btnMax",       css: "fa-window-maximize", show: true,title: "最大化"    },
    };

    let MouseMode = {None: 0, Zoom: 1, Move: 2};
    let AnnoMode = {None: 0, Edit: 1, Del: 2};
    let $mouseTrack = { startX: 0, startY: 0, endX: 0, endY: 0};

    let $viewers = [];

    let $moveTo = {
        viewNo : null,
        page : null,
        x : null,
        y : null,
        width : null,
        height : null
    };

    let $variable = {
        zoomRectFillStyle: 'rgba(255, 255, 125, 0.4)',
        zoomRectLineWidth: 2,
        zoomRectLineColor: '#ff0000',
        annotationDefaultBGColor: '#ffff7d',
        annotationDefaultTextColor: '#000000',
        annotationDefaultLineColor: '#ff0000',
        annotationDefaultFont: '16pt Arial',
        annotationDrawAlpha: 0.4,
        annotationTextMargin: 5,

        showPrint: false,
        //每次縮小
        _scaleDistance: 0.05,

        _showAnnotation: false,
    };
//======================================================================================================================
//imageviewer
    $.fn.imageviewer = function (options) {

        $viewerNumber++;
        $imageViewer[$viewerNumber] = options;
        $imageViewer[$viewerNumber].viewNo = $viewerNumber;
        $imageViewer[$viewerNumber].wapperId = $(this).attr('id');
        options = $imageViewer[$viewerNumber];

        $imageViewer[$viewerNumber].init = function(options) {

            $variable._showAnnotation = options.showAnnotationTool;
            $innerFunction.renderViewer(options, $imageViewer[$viewerNumber].viewNo);
        };

        $imageViewer[$viewerNumber].loadImage = function(imageServerUrl, tiff, currentPage, totalPage, properties) {
            $imageData[options.viewNo] = {
                imageServerUrl : imageServerUrl,
                tiff : tiff,
                currentPage : currentPage,
                totalPage : totalPage,
                properties : properties,
                viewNo : options.viewNo
            };
            $innerFunction.loadImage(imageServerUrl, tiff, currentPage, totalPage, properties, options.viewNo);
        };

        $imageViewer[$viewerNumber].setWaterMark = function(waterMarkOptions) {
            $.extend($waterMark, waterMarkOptions);
            if ($imageViewer[options.viewNo].showWaterMark) {
                $innerFunction.drawWaterMark(options.width, options.height, options.viewNo);
            }
        };

        $imageViewer[$viewerNumber].resizeViewer = function(width, height, minWidth) {

            $imageViewer[options.viewNo].width = width;
            $imageViewer[options.viewNo].height = height;
            $imageViewer[options.viewNo].minWidth = minWidth;

            $('#'+options.wapperId).empty();
            $innerFunction.renderViewer($imageViewer[options.viewNo], options.viewNo);
            if ($image[options.viewNo] !== undefined) {
                $innerFunction.loadImage($imageData[options.viewNo].imageServerUrl, $imageData[options.viewNo].tiff, $imageData[options.viewNo].currentPage, $imageData[options.viewNo].totalPage, $imageData[options.viewNo].properties, options.viewNo);
            }

        };

        $imageViewer[$viewerNumber].moveTo = function(page, x, y, width, height) {

            loadFromMoveTo = true;
            $moveTo.viewNo = options.viewNo;       $moveTo.page = page;
            $moveTo.x = x;            $moveTo.y = y;
            $moveTo.width = width;    $moveTo.height = height;

            if(page !== parseInt($('#dummy-currentPage-'+options.viewNo).val()))
            {
                $imageData[options.viewNo].currentPage = page;
                $innerFunction.loadImage($imageData[options.viewNo].imageServerUrl, $imageData[options.viewNo].tiff, $imageData[options.viewNo].currentPage, $imageData[options.viewNo].totalPage, $imageData[options.viewNo].properties, options.viewNo);
            } else {
                $innerFunction.zoomArea(x, y, width, height, options.viewNo);
            }
        };

        $imageViewer[$viewerNumber].clearViewer = function() {

            $('#imageCanvas-'+options.viewNo).replaceWith('<canvas id="imageCanvas-'+options.viewNo+'"></canvas>');
            $('#tempCanvas-'+options.viewNo).replaceWith('<canvas id="tempCanvas-'+options.viewNo+'"></canvas>');
            $('#annotationCanvas-'+options.viewNo).replaceWith('<canvas id="annotationCanvas-'+options.viewNo+'"></canvas>');

            $imageCanvas[options.viewNo] = document.getElementById('imageCanvas-'+options.viewNo);
            $tempCanvas[options.viewNo] = document.getElementById('tempCanvas-'+options.viewNo);
            $annotationCanvas[options.viewNo] = document.getElementById('annotationCanvas-'+options.viewNo);

            $innerFunction.mouseEvent(options.viewNo);

            $imageScrollPaneAPI[options.viewNo].reinitialise();
            $tempScrollPaneAPI[options.viewNo].reinitialise();
            $annotationScrollPaneAPI[options.viewNo].reinitialise();
        };

        $imageViewer[$viewerNumber].init($imageViewer[$viewerNumber]);
        return $imageViewer[$viewerNumber];
    };
//----------------------------------------------------------------------------------------------------------------------
//Inner Functions
    let $innerFunction = {
        renderViewer : function(options, viewNo) {
            $('#'+options.wapperId).append('<div id=View-'+viewNo+'></div>');
            //  render viewer
            /*  myId - toolbar
                     - viewerPanel - annotationContain - annotationCanvas (z-index: 4, 所有滑鼠在這一層 listener)
                     - tempCanvas (z-index: 3)
                     - watermarkCanvas (z-index: 2)
                     - imageContain - imageCanvas (z-index: 1)
            */
            if (options.showToolBar) {
                $('#View-'+viewNo).append('<div id=dummy-tool-btn-warp-'+viewNo+' style="background-color:darkgray; width:'+options.width+'px; z-index: 4"></div>');
                if (!options.showAnnotationTool) {
                    $toolsBtn.ShowAnno.show = false;
                    $toolsBtn.HideAnno.show = false;
                    $toolsBtn.EditAnno.show = false;
                    $toolsBtn.DelAnno.show = false;
                }
                if (options.closeMaxAndUnmax) {
                    $toolsBtn.UnMax.show = false;
                    $toolsBtn.Max.show = false;
                }
                for (let i in $toolsBtn) {
                    $('#dummy-tool-btn-warp-'+viewNo).append(
                        '<button type="button" id="'+options.wapperId+'-'+$toolsBtn[i].id+'-'+viewNo+'" class="tbtn-btn-primary" title="'+$toolsBtn[i].title+'" style="width: 35px"><i class="fa '+$toolsBtn[i].css+' fa-1x"></i></button>');
                    if (!$toolsBtn[i].show) {$('#'+options.wapperId+'-'+$toolsBtn[i].id+'-'+viewNo).css({display : 'none'});}
                }
                $('#'+options.wapperId+'-btnPrev-'+viewNo).prop('disabled',true);
                $('#'+options.wapperId+'-btnNext-'+viewNo).prop('disabled',true);
                $('#'+options.wapperId+'-btnNext-'+viewNo).after('<span><input type="text" maxlength=3 style="width:24px;" id=dummy-currentPage-'+viewNo+'><span id=dummy-totalPage-'+viewNo+'>/</span></span>');
                $('#'+options.wapperId+'-btnUnMax-'+viewNo).css({float : 'right'});
                $('#'+options.wapperId+'-btnMax-'+viewNo).css({float : 'right'});


            }
            $('#View-'+viewNo).append(
                '<div id="'+options.wapperId+'-PANEL-'+viewNo+'" style="width:'+options.width+'px; height:'+options.height+'px;">' +
                   // '<canvas id="watermarkCanvas-'+viewNo+'" width="'+options.width+'" height="'+options.height+'" style="width:'+options.width+'px; height: '+options.height+'px; position: absolute; z-index: 2;"></canvas>' +
                    '<div id="'+options.wapperId+'-IMAGEDIV-'+viewNo+'" style="width:'+options.width+'px; height: '+options.height+'px; padding: 0; text-align: center; position: absolute; z-index: 1;">' +
                        '<canvas id="imageCanvas-'+viewNo+'"></canvas>' +
                    '</div>' +
                    '<div id="'+options.wapperId+'-TEMPDIV-'+viewNo+'" style="width:'+options.width+'px; height: '+options.height+'px; padding: 0; text-align: center; position: absolute; z-index: 3">' +
                        '<canvas id="tempCanvas-'+viewNo+'"></canvas>' +
                    '</div>' +
                    '<div id="'+options.wapperId+'-DRAWDIV-'+viewNo+'" style="width:'+options.width+'px; height: '+options.height+'px; padding: 0; text-align: center; position: absolute; z-index: 4">' +
                        '<canvas id="annotationCanvas-'+viewNo+'"></canvas>' +
                    '</div>' +
                '</div>');

            //set Components
           // $watermarkCanvas[viewNo] = document.getElementById('watermarkCanvas-'+viewNo);

           // if (options.showWaterMark) { $innerFunction.drawWaterMark(options.width, options.height, viewNo); }
            $imageCanvas[viewNo] = document.getElementById('imageCanvas-'+viewNo);
            $tempCanvas[viewNo] = document.getElementById('tempCanvas-'+viewNo);
            $annotationCanvas[viewNo] = document.getElementById('annotationCanvas-'+viewNo);
            $viewers[viewNo] = {
                _minScale: null,
                _currentScale: 1,
                _rotate: 0,
                _mouseMode: null,
                _annoMode: null,
                viewerWidth: options.width,    viewerHeight: options.height,
                imageWidth: null,              imageHeight: null,
                _centerX: null,              _centerY: null,
                _canvasDisplayWidth: null,   _canvasDisplayHeight: null,

            };

            $imageContain[viewNo] = $('#'+options.wapperId+'-IMAGEDIV-'+viewNo);
            $imageScrollPaneAPI[viewNo] = $imageContain[viewNo].jScrollPane({ showArrows: false }).data('jsp');

            $tempContain[viewNo] = $('#'+options.wapperId+'-TEMPDIV-'+viewNo);
            $tempScrollPaneAPI[viewNo] = $tempContain[viewNo]
                .bind('jsp-scroll-x', function(event, scrollPositionX) { $imageScrollPaneAPI[viewNo].scrollToX(scrollPositionX); })
                .bind('jsp-scroll-y', function(event, scrollPositionY) { $imageScrollPaneAPI[viewNo].scrollToY(scrollPositionY); })
                .jScrollPane({ showArrows: false })
                .data('jsp');

            $annotationContain[viewNo] = $('#'+options.wapperId+'-DRAWDIV-'+viewNo);
            $annotationScrollPaneAPI[viewNo] = $annotationContain[viewNo]
                .bind('jsp-scroll-x', function(event, scrollPositionX) { $tempScrollPaneAPI[viewNo].scrollToX(scrollPositionX); })
                .bind('jsp-scroll-y', function(event, scrollPositionY) { $tempScrollPaneAPI[viewNo].scrollToY(scrollPositionY); })
                .jScrollPane({ showArrows: false })
                .data('jsp');

            //----------------------------------------------------------------------------------------------------------

            /*
            $imageContain[viewNo].css({
                width : '500px',
                height : '500px'
            });
            $tempContain[viewNo].css({
                width : '500px',
                height : '500px'
            });
            $annotationContain[viewNo].css({
                width : '500px',
                height : '500px'
            });

            */

            //----------------------------------------------------------------------------------------------------------




            if (options.showToolBar) {
                $('#'+options.wapperId+'-btnFitHeight-'+viewNo).click(function () {
                    $innerFunction.scale('fitHeight', viewNo);
                });
                $('#'+options.wapperId+'-btnFitWidth-'+viewNo).click(function () {
                    $innerFunction.scale('fitWidth', viewNo);
                });
                $('#'+options.wapperId+'-btnFullSize-'+viewNo).click(function () {
                    $innerFunction.scale('fullSize', viewNo);
                });
                $('#'+options.wapperId+'-btnZoomIn-'+viewNo).click(function () {
                    $innerFunction.scale('zoomIn', viewNo);
                });
                $('#'+options.wapperId+'-btnZoomOut-'+viewNo).click(function () {
                    $innerFunction.scale('zoomOut', viewNo);
                });
                $('#'+options.wapperId+'-btnRotateCW-'+viewNo).click(function () {
                    $innerFunction.rotate(90, viewNo);
                });
                $('#'+options.wapperId+'-btnRotateCCW-'+viewNo).click(function () {
                    $innerFunction.rotate(-90, viewNo);
                });

                /*
                $('#'+$variable._wapperId+'-btnShowAnno-'+viewNo).click(function () {
                    $variable._showAnnotation = true;
                    $('#'+$variable._wapperId+'-btnShowAnno-'+viewNo).hide();
                    $('#'+$variable._wapperId+'-btnHideAnno-'+viewNo).show();
                    $innerFunction._redrawAnnotationCanvas(viewNo);
                });

                $('#'+$variable._wapperId+'-btnHideAnno-'+viewNo).click(function () {
                    $variable._showAnnotation = false;
                    $('#'+$variable._wapperId+'-btnHideAnno-'+viewNo).hide();
                    $('#'+$variable._wapperId+'-btnShowAnno-'+viewNo).show();
                    $innerFunction._clearAnnotationCanvas(viewNo);
                });

                $('#'+$variable._wapperId+'-btnEditAnno-'+viewNo).click(function () {
                    if ($viewers[viewNo]._annoMode !== AnnoMode.Edit) {
                        $viewers[viewNo]._annoMode = AnnoMode.Edit;
                        $('#'+$variable._wapperId+'-btnEditAnno-'+viewNo).addClass("btn-active").removeClass("btn-default");
                    } else {
                        $viewers[viewNo]._annoMode = AnnoMode.None;
                        $('#'+$variable._wapperId+'-btnEditAnno-'+viewNo).addClass("btn-default").removeClass("btn-active");
                    }
                });
                */

                $('#'+options.wapperId+'-btnPrev-'+viewNo).click(function () {

                    $('#'+options.wapperId+'-btnPrev-'+viewNo).prop('disabled',true);
                    $('#'+options.wapperId+'-btnNext-'+viewNo).prop('disabled',true);
                    $imageData[viewNo].currentPage--;
                    if ($imageData[viewNo].currentPage <= 1) {
                        $imageData[viewNo].currentPage = 1;
                    }
                    loadFromMoveTo = false;
                    $innerFunction.loadImage($imageData[viewNo].imageServerUrl, $imageData[viewNo].tiff, $imageData[viewNo].currentPage, $imageData[viewNo].totalPage, $imageData[viewNo].properties, viewNo);
                });

                $('#'+options.wapperId+'-btnNext-'+viewNo).click(function () {

                    $('#'+options.wapperId+'-btnPrev-'+viewNo).prop('disabled',true);
                    $('#'+options.wapperId+'-btnNext-'+viewNo).prop('disabled',true);
                    $imageData[viewNo].currentPage++;
                    if ($imageData[viewNo].currentPage >= $imageData[viewNo].totalPage) {
                        $imageData[viewNo].currentPage = $imageData[viewNo].totalPage;
                    }
                    loadFromMoveTo = false;
                    $innerFunction.loadImage($imageData[viewNo].imageServerUrl, $imageData[viewNo].tiff, $imageData[viewNo].currentPage, $imageData[viewNo].totalPage, $imageData[viewNo].properties, viewNo);
                });

                $('#'+options.wapperId+'-btnUnMax-'+viewNo).click(function () {
                    options.width = [options.width, options.minWidth];
                    options.minWidth = options.width[0];
                    options.width = options.width[1];
                    $('#'+options.wapperId).empty();

                    $innerFunction.renderViewer(options, viewNo);
                    if ($image[viewNo] !== undefined) {
                        $innerFunction.loadImage($imageData[viewNo].imageServerUrl, $imageData[viewNo].tiff, $imageData[viewNo].currentPage, $imageData[viewNo].totalPage, $imageData[viewNo].properties, viewNo);
                    }

                    $('#'+options.wapperId+'-btnUnMax-'+viewNo).hide();
                    $('#'+options.wapperId+'-btnMax-'+viewNo).show();
                });

                $('#'+options.wapperId+'-btnMax-'+viewNo).click(function () {
                    options.width = [options.width, options.minWidth];
                    options.minWidth = options.width[0];
                    options.width = options.width[1];
                    $('#'+options.wapperId).empty();

                    $innerFunction.renderViewer(options, viewNo);
                    if ($image[viewNo] !== undefined) {
                        $innerFunction.loadImage($imageData[viewNo].imageServerUrl, $imageData[viewNo].tiff, $imageData[viewNo].currentPage, $imageData[viewNo].totalPage, $imageData[viewNo].properties, viewNo);
                    }
                    $('#'+options.wapperId+'-btnMax-'+viewNo).hide();
                    $('#'+options.wapperId+'-btnUnMax-'+viewNo).show();
                });

                $('#dummy-currentPage-'+viewNo).keypress(function (e) {
                    if(e.which === 13) {
                        let currentPage = $('#dummy-currentPage-'+viewNo).val();
                        if (currentPage >= 1 && currentPage <= $imageData[viewNo].totalPage) {
                        } else {
                            alert("error");
                            currentPage = 1;
                            $('#dummy-currentPage-'+viewNo).val(currentPage);
                        }
                        $imageData[viewNo].currentPage = currentPage;
                        loadFromMoveTo = false;
                        $innerFunction.loadImage($imageData[viewNo].imageServerUrl, $imageData[viewNo].tiff, $imageData[viewNo].currentPage, $imageData[viewNo].totalPage, $imageData[viewNo].properties, viewNo);
                    }
                })
            }

            //----------------------------------------------------------------------------------------------------------
            //Mouse Event
            $innerFunction.mouseEvent(viewNo);
            //----------------------------------------------------------------------------------------------------------
            },

        loadImage : function(imageServerUrl, tiff, currentPage, totalPage, properties, viewNo) {

            let keys = Object.keys(properties);
            let GETinfo = '';
            for (let i=0; i<keys.length; i++) {
                if (properties[keys[i]] !== '') { GETinfo += keys[i]+'='+properties[keys[i]]+'&'; }
            }
            GETinfo += 'currentPage='+currentPage+'&totalPage='+totalPage;
            if ($image[viewNo] === undefined || $image[viewNo].GETinfo !== GETinfo) {
                $image[viewNo] = {image: new Image(),viewNo: viewNo,currentPage: currentPage,GETinfo: GETinfo};
                if (tiff) {
                    GETinfo += '&type=tiff';
                    console.log('Load image from tiff');
                    let url = imageServerUrl+'?'+GETinfo;
                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', url);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = function () {
                        let t0 = performance.now();
                        $image[viewNo].image.src = new Tiff({buffer: xhr.response}).toDataURL();
                        $image[viewNo].image.onload = function () {
                            let t1 = performance.now();
                            console.log('Load image, took t1-t0 ' +(t1-t0)+ ' milliseconds.');
                            drawimage();
                        };
                    };
                    xhr.send();
                } else {
                    GETinfo = GETinfo.substring(0,GETinfo.length-1);
                    console.log('Load image from png');
                    let url = imageServerUrl+'?'+GETinfo;
                    let t0 = performance.now();
                    $image[viewNo].image.src = url;
                    $image[viewNo].image.onload = function () {
                        let t1 = performance.now();
                        console.log('Load image, took t1-t0 ' +(t1-t0)+ ' milliseconds.');
                        drawimage();
                    };
                }
            } else {
                drawimage();
            }

            function drawimage() {
                $innerFunction.setImage($image[viewNo].image, viewNo);
                let ctx = $imageCanvas[viewNo].getContext('2d');
                ctx.drawImage($image[viewNo].image, 0, 0);
                if (loadFromMoveTo) {
                    $innerFunction.zoomArea($moveTo.x, $moveTo.y, $moveTo.width, $moveTo.height, $moveTo.viewNo)
                }
            }
        },

        mouseEvent : function(viewNo) {
            let startX = null;
            let startY = null;

            $annotationContain[viewNo].bind("contextmenu", function (e) { return false; });
            $annotationCanvas[viewNo].addEventListener('mousedown', function (e) {

                $mouseTrack.startX = e.offsetX;   $mouseTrack.startY = e.offsetY;

                if (e.button === 2) { $viewers[viewNo]._mouseMode = MouseMode.Zoom; }
                else if (e.button === 0) { $viewers[viewNo]._mouseMode = MouseMode.Move; }
                else { $viewers[viewNo]._mouseMode = MouseMode.None; }

                startX = $annotationScrollPaneAPI[viewNo].getContentPositionX();
                startY = $annotationScrollPaneAPI[viewNo].getContentPositionY();
            });

            $annotationCanvas[viewNo].addEventListener('mousemove', function (e) {
                switch ($viewers[viewNo]._mouseMode) {
                    case MouseMode.Zoom :
                        $innerFunction._drawRectangleInTempCanvas($mouseTrack.startX + $tempScrollPaneAPI[viewNo].getContentPositionX(), $mouseTrack.startY + $tempScrollPaneAPI[viewNo].getContentPositionY(), e.offsetX-$mouseTrack.startX, e.offsetY-$mouseTrack.startY, true, false, viewNo);
                        break;
                    case MouseMode.Move :
                        let X = $annotationScrollPaneAPI[viewNo].getContentPositionX() - (e.offsetX - $mouseTrack.startX);
                        let Y = $annotationScrollPaneAPI[viewNo].getContentPositionY() - (e.offsetY - $mouseTrack.startY);

                        $imageScrollPaneAPI[viewNo].scrollTo(X,Y);
                        $tempScrollPaneAPI[viewNo].scrollTo(X,Y);
                        $annotationScrollPaneAPI[viewNo].scrollTo(X,Y);
                        break;
                }
            });

            $annotationCanvas[viewNo].addEventListener('mouseup', function (e) {
                switch ($viewers[viewNo]._mouseMode) {
                    case MouseMode.Zoom :
                        console.log('x:'+$mouseTrack.startX+' y:'+$mouseTrack.startY+' width:'+Math.abs($mouseTrack.endX - $mouseTrack.startX)+' height:'+Math.abs($mouseTrack.endY - $mouseTrack.startY));
                        if ($viewers[viewNo]._annoMode === AnnoMode.Edit) {
                            $annoEditDialog[viewNo].open();
                        } else {
                            $mouseTrack.endX = e.offsetX;
                            $mouseTrack.endY = e.offsetY;
                            $innerFunction._clearTempCanvas(viewNo);
                            let x = $mouseTrack.startX < $mouseTrack.endX ? $mouseTrack.startX : $mouseTrack.endX;
                            let y = $mouseTrack.startY < $mouseTrack.endY ? $mouseTrack.startY : $mouseTrack.endY;
                            $innerFunction._zoomArea(x/$viewers[viewNo]._currentScale, y/$viewers[viewNo]._currentScale, Math.abs($mouseTrack.endX - $mouseTrack.startX)/$viewers[viewNo]._currentScale, Math.abs($mouseTrack.endY - $mouseTrack.startY)/$viewers[viewNo]._currentScale, viewNo);
                        }
                        break;
                    case MouseMode.Move :
                        let A = $annotationScrollPaneAPI[viewNo].getContentPositionX() - startX;
                        let B = $annotationScrollPaneAPI[viewNo].getContentPositionY() - startY;
                        $viewers[viewNo]._centerX += A;
                        $viewers[viewNo]._centerY += B;
                        break;
                }
                $viewers[viewNo]._mouseMode = MouseMode.None;
            });
        },

        setPage : function(currentPage, totalPage, wapperId, viewNo) {
            $('#dummy-currentPage-'+viewNo).val(currentPage);
            $('#dummy-totalPage-'+viewNo).html(' /'+totalPage);
            $('#'+wapperId+'-btnPrev-'+viewNo).prop('disabled',false);
            $('#'+wapperId+'-btnNext-'+viewNo).prop('disabled',false);
            if (currentPage === 1) { $('#'+wapperId+'-btnPrev-'+viewNo).prop('disabled',true); }
            if (currentPage === totalPage) { $('#'+wapperId+'-btnNext-'+viewNo).prop('disabled',true); }
        },

        setImage : function(image, viewNo) {
            $viewers[viewNo].imageWidth = image.width;
            $viewers[viewNo].imageHeight = image.height;
            $viewers[viewNo]._canvasDisplayWidth = image.width;
            $viewers[viewNo]._canvasDisplayHeight = image.height;

            let scale1 = $viewers[viewNo].viewerWidth / $viewers[viewNo].imageWidth;
            let scale2 = $viewers[viewNo].viewerHeight / $viewers[viewNo].imageHeight;
            $viewers[viewNo]._minScale = scale1 < scale2 ? scale1 : scale2;

            $imageCanvas[viewNo].width = $viewers[viewNo].imageWidth ;
            $imageCanvas[viewNo].height = $viewers[viewNo].imageHeight;
            $tempCanvas[viewNo].width = $viewers[viewNo].imageWidth;
            $tempCanvas[viewNo].height = $viewers[viewNo].imageHeight;
            $annotationCanvas[viewNo].width = $viewers[viewNo].imageWidth ;
            $annotationCanvas[viewNo].height = $viewers[viewNo].imageHeight;
            $viewers[viewNo]._centerX = $viewers[viewNo].imageWidth / 2;
            $viewers[viewNo]._centerY = $viewers[viewNo].imageHeight / 2;

            $viewers[viewNo]._rotate = 0;

            $innerFunction.resetCanvas(viewNo);
            $innerFunction.scale($imageViewer[viewNo].initDisplayMode, viewNo);
            $innerFunction.setPage($imageData[viewNo].currentPage, $imageData[viewNo].totalPage, $imageViewer[viewNo].wapperId, viewNo);
        },

        resetCanvas : function(viewNo) {


            $imageScrollPaneAPI[viewNo].scrollTo(0,0);
            $tempScrollPaneAPI[viewNo].scrollTo(0,0);
            $annotationScrollPaneAPI[viewNo].scrollTo(0,0);

            $imageCanvas[viewNo].setAttribute('style','width:'+$viewers[viewNo]._canvasDisplayWidth+'px; height:'+$viewers[viewNo]._canvasDisplayHeight+'px; margin:0px; z-index: 1');
            $imageScrollPaneAPI[viewNo].reinitialise();
            $tempCanvas[viewNo].setAttribute('style','width:'+$viewers[viewNo]._canvasDisplayWidth+'px; height:'+$viewers[viewNo]._canvasDisplayHeight+'px; margin:0px; z-index: 3');
            $tempScrollPaneAPI[viewNo].reinitialise();
            $annotationCanvas[viewNo].setAttribute('style','width:'+$viewers[viewNo]._canvasDisplayWidth+'px; height:'+$viewers[viewNo]._canvasDisplayHeight+'px; margin:0px; z-index: 4');
            $annotationScrollPaneAPI[viewNo].reinitialise();

            // move scroll
            $imageScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $viewers[viewNo].viewerWidth / 2);
            $tempScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $viewers[viewNo].viewerWidth / 2);
            $annotationScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $viewers[viewNo].viewerWidth / 2);

            $imageScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $viewers[viewNo].viewerHeight / 2);
            $tempScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $viewers[viewNo].viewerHeight / 2);
            $annotationScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $viewers[viewNo].viewerHeight / 2);
        },

        loadAnnotation: function() {
            // id: annotation 編號, page: annotation 所在的頁碼, x: 左上角 x 座標, y: 左上角 y 座標, width: 寬度, height: 高度,
            // type: 形狀, text: 文字內容, bgcolor: 底色, fontcolor: 文字顏色, linecolor: 外框顏色
            $annoArray = [
                { id: 0, page: 1, x: 100, y: 200, width: 100, height: 100, type: 'RECT', text: '這是中文註記', bgcolor: '#ffff7d', fontcolor: '#000000', linecolor: '#ff0000' },
                { id: 0, page: 1, x: 500, y: 500, width: 200, height: 200, type: 'RECT', text: 'This is annotation', bgcolor: '#ffff7d', fontcolor: '#000000', linecolor: '#ff0000' }
            ];
        },

        scale: function(displayMode, viewNo) {
            switch (displayMode) {
                case 'fitWidth':
                    $viewers[viewNo]._currentScale = $viewers[viewNo].viewerWidth / $viewers[viewNo].imageWidth;
                    break;
                case 'fitHeight':
                    $viewers[viewNo]._currentScale = $viewers[viewNo].viewerHeight / $viewers[viewNo].imageHeight;
                    break;
                case 'fitWindow':
                    let scale1, scale2;
                    scale1 = $viewers[viewNo].viewerWidth / $viewers[viewNo].imageWidth;
                    scale2 = $viewers[viewNo].viewerHeight / $viewers[viewNo].imageHeight;
                    $viewers[viewNo]._currentScale = scale1 < scale2 ? scale1 : scale2;
                    break;
                case 'fullSize':
                    $viewers[viewNo]._currentScale = 1;
                    break;
                case 'zoomIn':
                    $viewers[viewNo]._currentScale += $variable._scaleDistance;
                    $viewers[viewNo]._currentScale = $viewers[viewNo]._currentScale > 1 ? 1 : $viewers[viewNo]._currentScale;
                    break;
                case 'zoomOut':
                    $viewers[viewNo]._currentScale -= $variable._scaleDistance;
                    $viewers[viewNo]._currentScale = $viewers[viewNo]._currentScale < $viewers[viewNo]._minScale ? $viewers[viewNo]._minScale : $viewers[viewNo]._currentScale;
                    break;
            }
            $innerFunction._calcInScale(viewNo);
            $innerFunction.resetCanvas(viewNo);
        },

        rotate: function(degree, viewNo) {
            $viewers[viewNo]._rotate += degree;
            $viewers[viewNo].imageHeight = [$viewers[viewNo].imageHeight, $viewers[viewNo].imageWidth];
            $viewers[viewNo].imageWidth = $viewers[viewNo].imageHeight[0];
            $viewers[viewNo].imageHeight = $viewers[viewNo].imageHeight[1];

            let scale_w = $viewers[viewNo].viewerWidth / $viewers[viewNo].imageWidth;
            let scale_h = $viewers[viewNo].viewerHeight / $viewers[viewNo].imageHeight;
            $viewers[viewNo]._minScale = scale_h < scale_w ? scale_h : scale_w;

            $imageCanvas[viewNo].width =      $viewers[viewNo].imageWidth;    $imageCanvas[viewNo].height =      $viewers[viewNo].imageHeight;
            $tempCanvas[viewNo].width =       $viewers[viewNo].imageWidth;    $tempCanvas[viewNo].height =       $viewers[viewNo].imageHeight;
            $annotationCanvas[viewNo].width = $viewers[viewNo].imageWidth ;   $annotationCanvas[viewNo].height = $viewers[viewNo].imageHeight;

            $viewers[viewNo]._centerX = $viewers[viewNo].imageWidth / 2;
            $viewers[viewNo]._centerY = $viewers[viewNo].imageHeight / 2;

            let ctx = $imageCanvas[viewNo].getContext('2d');
            ctx.translate($viewers[viewNo]._centerX, $viewers[viewNo]._centerY);
            ctx.rotate($viewers[viewNo]._rotate/180*Math.PI);
            ctx.drawImage($image[viewNo].image, -$image[viewNo].image.width/2, -$image[viewNo].image.height/2);
            ctx.rotate(-$viewers[viewNo]._rotate/180*Math.PI);
            ctx.translate(-$viewers[viewNo]._centerX, -$viewers[viewNo]._centerY);

            $innerFunction._calcInScale(viewNo);
            $innerFunction.resetCanvas(viewNo);
        },

        zoomArea: function(x, y, width, height, viewNo) {
            if ($.isNumeric(x) && $.isNumeric(y) && $.isNumeric(width) && $.isNumeric(height)) {
                $innerFunction._zoomArea(x, y, width, height, viewNo);
                $innerFunction._clearTempCanvas(viewNo);
                $innerFunction._drawRectangleInTempCanvas(x + $tempScrollPaneAPI[viewNo].getContentPositionX(), y + $tempScrollPaneAPI[viewNo].getContentPositionY(), width, height, true, true, viewNo);
            }
        },

        //框選放大
        _zoomArea: function(x, y, width, height, viewNo) {
            x = parseInt(x);
            y = parseInt(y);
            width = parseInt(width);
            height = parseInt(height);

            $viewers[viewNo]._centerX = x + width / 2;
            $viewers[viewNo]._centerY = y + height / 2;

            // 兩者取小倍率(適當倍率) 而且最大是一倍
            $viewers[viewNo]._currentScale = Math.min($viewers[viewNo].viewerWidth/width, $viewers[viewNo].viewerHeight/height);
            $viewers[viewNo]._currentScale = $viewers[viewNo]._currentScale > 1 ? 1 : $viewers[viewNo]._currentScale;

            $innerFunction._calcInScale(viewNo);
            $innerFunction.resetCanvas(viewNo);
        },

        _calcInScale: function(viewNo) {
            $viewers[viewNo]._canvasDisplayWidth = $viewers[viewNo].imageWidth * $viewers[viewNo]._currentScale;
            $viewers[viewNo]._canvasDisplayHeight = $viewers[viewNo].imageHeight * $viewers[viewNo]._currentScale;
        },

        drawWaterMark: function(width, height, viewNo) {
            let context = $watermarkCanvas[viewNo].getContext('2d');
            context.save();
            context.clearRect(0,0,width,height);
            context.translate(width/2, height/2);
            context.rotate(Math.PI*$waterMark.RotateAngle / 180);
            context.textAlign = 'center';
            context.font = $waterMark.Font;
            context.fillStyle = $waterMark.FillColor;
            context.globalAlpha = $waterMark.FillAlpha;
            context.fillText($waterMark.Text, 0, 10);
            context.restore();
        },

        _drawRectangleInTempCanvas: function(x, y, width, height, clearCanvas, fill, viewNo) {
            clearCanvas = clearCanvas === undefined ? false : clearCanvas;
            fill = fill === undefined ? false : fill;

            let ctx = $tempCanvas[viewNo].getContext('2d');

            if (clearCanvas){ ctx.clearRect(0, 0, $viewers[viewNo].imageWidth, $viewers[viewNo].imageHeight); }
            ctx.beginPath();

            ctx.rect((x-$imageScrollPaneAPI[viewNo].getContentPositionX())/$viewers[viewNo]._currentScale, (y-$imageScrollPaneAPI[viewNo].getContentPositionY())/$viewers[viewNo]._currentScale, width/$viewers[viewNo]._currentScale, height/$viewers[viewNo]._currentScale);
            if (fill) {
                ctx.fillStyle = $variable.zoomRectFillStyle;
                ctx.fill();
            }
            ctx.lineWidth = $variable.zoomRectLineWidth;
            ctx.strokeStyle = $variable.zoomRectLineColor;
            ctx.stroke();
        },

        _clearTempCanvas: function(viewNo) {
            let ctx = $tempCanvas[viewNo].getContext('2d');
            ctx.clearRect(0, 0, $viewers[viewNo].imageWidth, $viewers[viewNo].imageHeight);
        },

        _clearAnnotationCanvas: function(viewNo) {
            let ctx = $annotationCanvas[0].getContext('2d');
            ctx.clearRect(0, 0, $viewers[viewNo].imageWidth, $viewers[viewNo].imageHeight);
        },

        _redrawAnnotationCanvas: function(viewNo) {
            $innerFunction._clearAnnotationCanvas(viewNo);

            // loop annotation list
            for (let i=0; i< $annoArray.length; i++) {
                //if ($annoArray[i].page == $imageInfo[viewNo].currentPage) {
                $innerFunction._drawAnnotation($annoArray[i], viewNo);
                //}
            }
        },

        _drawAnnotation: function(anno, viewNo) {
            // id: annotation 編號, page: annotation 所在的頁碼, x: 左上角 x 座標, y: 左上角 y 座標, width: 寬度, height: 高度,
            // type: 形狀, text: 文字內容, bgcolor: 底色, fontcolor: 文字顏色, linecolor: 外框顏色

            let context = $annotationCanvas[viewNo].getContext('2d');

            context.beginPath();
            context.rect(anno.x, anno.y, anno.width, anno.height);
            context.fillStyle = anno.bgcolor;
            context.globalAlpha = $variable.annotationDrawAlpha;
            context.fill();
            context.lineWidth = $variable.zoomRectLineWidth;
            context.strokeStyle = anno.linecolor;
            context.stroke();
            context.font = $variable.annotationDefaultFont;
            context.textBaseline = 'top';
            context.fillStyle = anno.fontcolor;
            context.globalAlpha = 1;
            context.fillText(anno.text, anno.x + $variable.annotationTextMargin, anno.y + $variable.annotationTextMargin);
        },

        _showTab: function (evt, tabId) {
            let i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            document.getElementById(tabId).style.display = "block";
            evt.currentTarget.className += " active";
        }
    }
})(jQuery);
