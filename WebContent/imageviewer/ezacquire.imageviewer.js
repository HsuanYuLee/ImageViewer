(function ($) {
    'use strict';
    let $imageViewer = null;
    let $viewer = {
        width: 1500,
        minWidth: 750,
        height: 600,
        closeMaxAndUnmax: false,
        initDisplayMode: 3,
        showWaterMark: true,
        showAnnotationTool: false,

    };
    let $imageData = [];
    let $waterMark = {
        Font: 'bold 60pt Calibri',
        FillColor: '#ff0000',
        FillAlpha: 0.4,
        RotateAngle: 45,
        Text: '中文 ImageViewer Demo',
    };

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

    let $image = [];

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
        UnMax:     { id: "btnUnMax",     css: "fa-window-restore",  show: true, title: "還原"     },
        Max:       { id: "btnMax",       css: "fa-window-maximize", show: false,title: "最大化"    },
    };

    let DisplayMode = { fitWidth: 0, fitHeight: 1, FitWindow: 2, fullSize: 3, zoomIn: 4, zoomOut: 5 };
    let MouseMode = {None: 0, Zoom: 1, Move: 2};
    let AnnoMode = {None: 0, Edit: 1, Del: 2};

    let $mouseTrack = { startX: 0, startY: 0, endX: 0, endY: 0};

    let $importVariable = {
        viewerWidth: null, viewerHeight: null,
        minWidth: null,
        closeMaxAndUnmax: null,
        //外部傳入影像資訊
        imageServerUrl: null,
        imageInfo : [{ docId: "", formId: "", currentPage: "", viewPage: "", totalPage: ""}],
        //DisplayMode : { fitWidth: 0, fitHeight: 1, FitWindow: 2, fullSize: 3 };
        initDisplayMode : null,
        waterMarkText : null,
        // 沒有 tool 就沒有 annotation
        showAnnotationTool: null
    };

    let $viewers = [];

    let $moveTo = {
        viewNo : null,
        docNo : null,
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
        showToolBar: true,
        _wapperId: '',
        //每次縮小
        _scaleDistance: 0.05,

        _showAnnotation: false,
    };
//======================================================================================================================
//imageviewer
    $.fn.imageviewer = function (options) {
        $imageViewer = $.extend($imageViewer,$function);

        this.init = function (options) {
            $viewer = $.extend($viewer, options);
            $variable._wapperId = $(this).attr("id");
            $(this).css({'width' : options.width});

            $variable._showAnnotation = $viewer.showAnnotationTool;
            $innerFunction.renderViewer(options, 0);
    };
        this.init(options);
        return $imageViewer;
    };
//----------------------------------------------------------------------------------------------------------------------
//Functions
    let $function = {
        setWaterMark: function(options) {
            $.extend($waterMark, options);
            if ($viewer.showWaterMark) {
                for (let viewNo in $watermarkCanvas) {
                    $innerFunction.drawWaterMark(viewNo);
                }
            }
        },
        loadImage: function(options) {
                $imageData = options;

                let keys = Object.keys($imageData.imageInfo.properties);
                let GETinfo = '';
                for (let i = 0; i < keys.length; i++) {
                    if ($imageData.imageInfo.properties[keys[i]] !== '') { GETinfo += keys[i]+'='+$imageData.imageInfo.properties[keys[i]]+'&'; }
                }
                GETinfo += 'currentPage='+$imageData.imageInfo.defaultProperties.currentPage+'&totalPage='+$imageData.imageInfo.defaultProperties.totalPage;
                console.log(GETinfo);

                if ($imageData.tiff) {
                    GETinfo += '&type=tiff';
                    let url = $imageData.imageServerUrl+'?'+GETinfo;
                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', url);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = function () {
                        let t0 = performance.now();
                        $image[0] = new Image();
                        $image[0].src = new Tiff({buffer: xhr.response}).toDataURL();
                        $image[0].onload = function () {
                            let t1 = performance.now();
                            console.log('Load image decode tiff, took t1-t0 ' +(t1-t0)+ ' milliseconds.');
                            $innerFunction.setImageInViewer($image[0], 0);};
                    };
                    xhr.send();
                } else {
                    GETinfo = GETinfo.substring(0,GETinfo.length-1);
                    let url = $imageData.imageServerUrl+'?'+GETinfo;
                    let t0 = performance.now();
                    $image[0] = new Image();
                    $image[0].src = url;
                    $image[0].onload = function () {
                        let t1 = performance.now();
                        console.log('Load image, took t1-t0 ' +(t1-t0)+ ' milliseconds.');
                        $innerFunction.setImageInViewer($image[0], 0);
                    };
                }
                $('#dummy-currentPage-'+0).val($imageData.imageInfo.defaultProperties.currentPage);
                $('#dummy-totalPage-'+0).html(' /'+$imageData.imageInfo.defaultProperties.totalPage);
                $('#'+$variable._wapperId+'-btnPrev-'+0).prop('disabled',false);
                $('#'+$variable._wapperId+'-btnNext-'+0).prop('disabled',false);
                if ($('#dummy-currentPage-'+0).val() === '1') { $('#'+$variable._wapperId+'-btnPrev-'+0).prop('disabled',true); }
                if ($('#dummy-currentPage-'+0).val() === '4') { $('#'+$variable._wapperId+'-btnNext-'+0).prop('disabled',true); }
        },

        resizeViewer: function(options) {
            $.extend($viewer, options);
            $('#'+$variable._wapperId).empty();
            $innerFunction.renderViewer($viewer, 0);
            if ($image[0] !== undefined) {
                $innerFunction.setImageInViewer($image[0], 0);
            }
        },

        moveTo: function(viewNo, docNo, page, x, y, width, height) {

            let fromMoveTo = true;
            $moveTo.viewNo = viewNo;  $moveTo.docNo = docNo;  $moveTo.page = page;
            $moveTo.x = x;            $moveTo.y = y;
            $moveTo.width = width;    $moveTo.height = height;

            if(page !== parseInt($('#dummy-currentPage-'+viewNo).val()))
            {
                $imageData[viewNo].currentPage = page;
                $innerFunction.changePage(page, viewNo, fromMoveTo);
            } else {
                $innerFunction.zoomArea(x, y, width, height, viewNo);
            }
        }
    };
//----------------------------------------------------------------------------------------------------------------------
//Inner Functions
    let $innerFunction = {
        renderViewer : function(options, viewNo) {
            $('#'+$variable._wapperId).append('<div id=View-'+viewNo+'></div>');
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
                for (let i in $toolsBtn) {
                    $('#dummy-tool-btn-warp-'+viewNo).append(
                    '<button type="button" id="'+$variable._wapperId+'-'+$toolsBtn[i].id+'-'+viewNo+'" class="tbtn-btn-primary" title="'+$toolsBtn[i].title+'" style="width: 35px"><i class="fa '+$toolsBtn[i].css+' fa-1x"></i></button>');
                    if (!$toolsBtn[i].show) {$('#'+$variable._wapperId+'-'+$toolsBtn[i].id+'-'+viewNo).css({display : 'none'});}
                }
                $('#'+$variable._wapperId+'-btnNext-'+viewNo).after('<span><input type="text" maxlength=3 style="width:24px;" id=dummy-currentPage-'+viewNo+'><span id=dummy-totalPage-'+viewNo+'>/</span></span>');

                if (!options.closeMaxAndUnmax) {
                    $('#'+$variable._wapperId+'-btnUnMax-'+viewNo).css({float : 'right'});
                    $('#'+$variable._wapperId+'-btnMax-'+viewNo).css({float : 'right'});
                    /*
                    if ($viewers[viewNo]._maxClicked){
                        $('#'+$variable._wapperId+'-btnUnMax-'+viewNo).show();
                        $('#'+$variable._wapperId+'-btnMax-'+viewNo).hide();
                    } else {
                        $('#'+$variable._wapperId+'-btnUnMax-'+viewNo).hide();
                        $('#'+$variable._wapperId+'-btnMax-'+viewNo).show();
                    }
                    */
                }
            }
            $('#View-'+viewNo).append(
                '<div id="'+$variable._wapperId+'-PANEL-'+viewNo+'" style="width:'+viewNo+'px; height:'+options.height+'px;">' +
                    '<canvas id="watermarkCanvas-'+viewNo+'" width="'+options.width+'" height="'+options.height+'" style="width:'+options.width+'px; height: '+options.height+'px; position: absolute; z-index: 2;"></canvas>' +
                    '<div id="'+$variable._wapperId+'-IMAGEDIV-'+viewNo+'" style="width:'+options.width+'px; height: '+options.height+'px; padding: 0; text-align: center; position: absolute; z-index: 1;">' +
                        '<canvas id="imageCanvas-'+viewNo+'"></canvas>' +
                    '</div>' +
                    '<div id="'+$variable._wapperId+'-TEMPDIV-'+viewNo+'" style="width:'+options.width+'px; height: '+options.height+'px; padding: 0; text-align: center; position: absolute; z-index: 3">' +
                        '<canvas id="tempCanvas-'+viewNo+'"></canvas>' +
                    '</div>' +
                    '<div id="'+$variable._wapperId+'-DRAWDIV-'+viewNo+'" style="width:'+options.width+'px; height: '+options.height+'px; padding: 0; text-align: center; position: absolute; z-index: 4">' +
                        '<canvas id="annotationCanvas-'+viewNo+'"></canvas>' +
                    '</div>' +
                '</div>');

        //set Components
            $watermarkCanvas[viewNo] = document.getElementById('watermarkCanvas-'+viewNo);

            if ($viewer.showWaterMark) { $innerFunction.drawWaterMark(viewNo); }
            $imageCanvas[viewNo] = document.getElementById('imageCanvas-'+viewNo);
            $tempCanvas[viewNo] = document.getElementById('tempCanvas-'+viewNo);
            $annotationCanvas[viewNo] = document.getElementById('annotationCanvas-'+viewNo);
            $viewers[viewNo] = {
                _docUrl : null,
                _tiff : null,
                _minScale: null,
                _currentScale: 1,
                _viewerWidth: options.width, _viewerHeight: options.height,
                _oriImageWidth : null,       _oriImageHeight: null,
                _imageWidth: null,           _imageHeight: null,
                _centerX: null,              _centerY: null,
                _canvasDisplayWidth: null,   _canvasDisplayHeight: null,
                _rotate: 0,
                _displayMode: null,
                _mouseMode: null,
                _annoMode: null,
                _maxClicked: true,
            };

            $imageContain[viewNo] = $('#'+$variable._wapperId+'-IMAGEDIV-'+viewNo);
            $imageScrollPaneAPI[viewNo] = $imageContain[viewNo].jScrollPane({ showArrows: false }).data('jsp');

            $tempContain[viewNo] = $('#'+$variable._wapperId+'-TEMPDIV-'+viewNo);
            $tempScrollPaneAPI[viewNo] = $tempContain[viewNo]
                .bind('jsp-scroll-x', function(event, scrollPositionX) {
                    $imageScrollPaneAPI[viewNo].scrollToX(scrollPositionX);
                })
                .bind('jsp-scroll-y', function(event, scrollPositionY) {
                    $imageScrollPaneAPI[viewNo].scrollToY(scrollPositionY);
                })
                .jScrollPane({ showArrows: false })
                .data('jsp');

            $annotationContain[viewNo] = $('#'+$variable._wapperId+'-DRAWDIV-'+viewNo);
            $annotationScrollPaneAPI[viewNo] = $annotationContain[viewNo]
                .bind('jsp-scroll-x', function(event, scrollPositionX) {
                    $tempScrollPaneAPI[viewNo].scrollToX(scrollPositionX);
                })
                .bind('jsp-scroll-y', function(event, scrollPositionY) {
                    $tempScrollPaneAPI[viewNo].scrollToY(scrollPositionY);
                })
                .jScrollPane({ showArrows: false })
                .data('jsp');

            if ($variable.showToolBar) {
                $('#'+$variable._wapperId+'-btnFitHeight-'+viewNo).click(function () {
                    $viewers[viewNo]._displayMode = DisplayMode.fitHeight;
                    $innerFunction.scale($viewers[viewNo]._displayMode, viewNo);
                });
                $('#'+$variable._wapperId+'-btnFitWidth-'+viewNo).click(function () {
                    $viewers[viewNo]._displayMode = DisplayMode.fitWidth;
                    $innerFunction.scale($viewers[viewNo]._displayMode, viewNo);
                });
                $('#'+$variable._wapperId+'-btnFullSize-'+viewNo).click(function () {
                    $viewers[viewNo]._displayMode = DisplayMode.fullSize;
                    $innerFunction.scale($viewers[viewNo]._displayMode, viewNo);
                });
                $('#'+$variable._wapperId+'-btnZoomIn-'+viewNo).click(function () {
                    $innerFunction.scale(DisplayMode.zoomIn, viewNo);
                });
                $('#'+$variable._wapperId+'-btnZoomOut-'+viewNo).click(function () {
                    $innerFunction.scale(DisplayMode.zoomOut, viewNo);
                });
                $('#'+$variable._wapperId+'-btnRotateCW-'+viewNo).click(function () {
                    $innerFunction.rotate(90, viewNo);
                });
                $('#'+$variable._wapperId+'-btnRotateCCW-'+viewNo).click(function () {
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

                $('#'+$variable._wapperId+'-btnPrev-'+viewNo).click(function () {
                    $imageData.imageInfo.defaultProperties.currentPage--;
                    $function.loadImage($imageData);
                });

                $('#'+$variable._wapperId+'-btnNext-'+viewNo).click(function () {
                    $imageData.imageInfo.defaultProperties.currentPage++;
                    $function.loadImage($imageData);
                });

                $('#'+$variable._wapperId+'-btnUnMax-'+viewNo).click(function () {

                    $viewer.width = [$viewer.width, $viewer.minWidth];
                    $viewer.minWidth = $viewer.width[0];
                    $viewer.width = $viewer.width[1];
                    $(this).parent().parent().empty();

                    $innerFunction.renderViewer($viewer, viewNo);
                    if ($image[viewNo] !== undefined) {
                        $('#dummy-currentPage-'+0).val($imageData.imageInfo.defaultProperties.currentPage);
                        $('#dummy-totalPage-'+0).html(' /'+$imageData.imageInfo.defaultProperties.totalPage);
                        $('#'+$variable._wapperId+'-btnPrev-'+0).prop('disabled',false);
                        $('#'+$variable._wapperId+'-btnNext-'+0).prop('disabled',false);
                        if ($('#dummy-currentPage-'+0).val() === '1') { $('#'+$variable._wapperId+'-btnPrev-'+0).prop('disabled',true); }
                        if ($('#dummy-currentPage-'+0).val() === '4') { $('#'+$variable._wapperId+'-btnNext-'+0).prop('disabled',true); }
                        $innerFunction.setImageInViewer($image[viewNo], viewNo);
                    }

                    $('#'+$variable._wapperId+'-btnUnMax-'+viewNo).hide();
                    $('#'+$variable._wapperId+'-btnMax-'+viewNo).show();
                    $viewers[viewNo]._maxClicked = false;
                });

                $('#'+$variable._wapperId+'-btnMax-'+viewNo).click(function () {

                    $viewer.width = [$viewer.width, $viewer.minWidth];
                    $viewer.minWidth = $viewer.width[0];
                    $viewer.width = $viewer.width[1];
                    $(this).parent().parent().empty();

                    $innerFunction.renderViewer($viewer, viewNo);
                    if ($image[viewNo] !== undefined) {
                        $('#dummy-currentPage-'+0).val($imageData.imageInfo.defaultProperties.currentPage);
                        $('#dummy-totalPage-'+0).html(' /'+$imageData.imageInfo.defaultProperties.totalPage);
                        $('#'+$variable._wapperId+'-btnPrev-'+0).prop('disabled',false);
                        $('#'+$variable._wapperId+'-btnNext-'+0).prop('disabled',false);
                        if ($('#dummy-currentPage-'+0).val() === '1') { $('#'+$variable._wapperId+'-btnPrev-'+0).prop('disabled',true); }
                        if ($('#dummy-currentPage-'+0).val() === '4') { $('#'+$variable._wapperId+'-btnNext-'+0).prop('disabled',true); }
                        $innerFunction.setImageInViewer($image[viewNo], viewNo);
                    }

                    $('#'+$variable._wapperId+'-btnMax-'+viewNo).hide();
                    $('#'+$variable._wapperId+'-btnUnMax-'+viewNo).show();
                    $viewers[viewNo]._maxClicked = true;
                });

                $('#dummy-currentPage-'+viewNo).keypress(function (e) {
                    if(e.which === 13) {
                        let currentPage = $('#dummy-currentPage-'+viewNo).val();
                        if (currentPage >= 1 && currentPage <= $imageData.imageInfo.defaultProperties.totalPage) {
                        } else {
                            alert("error");
                            currentPage = 1;
                            $('#dummy-currentPage-'+viewNo).val(currentPage);
                        }
                        $imageData.imageInfo.defaultProperties.currentPage = currentPage;
                        $function.loadImage($imageData);
                    }
                })
            }

            //----------------------------------------------------------------------------------------------------------------------
            //Mouse Event
            $annotationContain[viewNo].bind("contextmenu", function (e) { return false; });
            $annotationCanvas[viewNo].addEventListener('mousedown', function (e) {

                $mouseTrack.startX = e.offsetX;   $mouseTrack.startY = e.offsetY;

                if (e.button === 2) { $viewers[viewNo]._mouseMode = MouseMode.Zoom; }
                else if (e.button === 0) { $viewers[viewNo]._mouseMode = MouseMode.Move; }
                else { $viewers[viewNo]._mouseMode = MouseMode.None; }
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
                }
                $viewers[viewNo]._mouseMode = MouseMode.None;
            });
            },

        setImageInViewer : function(image, viewNo) {
            $viewers[viewNo]._oriImageWidth = image.width;           $viewers[viewNo]._oriImageHeight = image.height;
            $viewers[viewNo]._imageWidth = $viewers[viewNo]._oriImageWidth;
            $viewers[viewNo]._imageHeight = $viewers[viewNo]._oriImageHeight;
            $viewers[viewNo]._canvasDisplayWidth = $viewers[viewNo]._oriImageWidth;
            $viewers[viewNo]._canvasDisplayHeight = $viewers[viewNo]._oriImageHeight;

            $imageCanvas[viewNo].width = $viewers[viewNo]._imageWidth ;
            $imageCanvas[viewNo].height = $viewers[viewNo]._imageHeight;
            $tempCanvas[viewNo].width = $viewers[viewNo]._imageWidth;
            $tempCanvas[viewNo].height = $viewers[viewNo]._imageHeight;
            $annotationCanvas[viewNo].width = $viewers[viewNo]._imageWidth ;
            $annotationCanvas[viewNo].height = $viewers[viewNo]._imageHeight;
            $viewers[viewNo]._centerX = $viewers[viewNo]._imageWidth / 2;
            $viewers[viewNo]._centerY = $viewers[viewNo]._imageHeight / 2;

            let ctx = $imageCanvas[viewNo].getContext('2d');
            ctx.drawImage($image[viewNo], 0, 0);

            if ($viewer.initDisplayMode !== '') {
                $innerFunction.scale($viewer.initDisplayMode, viewNo);
            }
            $innerFunction.resetCanvas(viewNo);
        },

        resetCanvas : function(viewNo) {
            if ($imageScrollPaneAPI[viewNo].getIsScrollableH()) {
                $imageScrollPaneAPI[viewNo].scrollToX(0);
                $tempScrollPaneAPI[viewNo].scrollToX(0);
                $annotationScrollPaneAPI[viewNo].scrollToX(0);
            }
            if ($imageScrollPaneAPI[viewNo].getIsScrollableV()) {
                $imageScrollPaneAPI[viewNo].scrollToY(0);
                $tempScrollPaneAPI[viewNo].scrollToY(0);
                $annotationScrollPaneAPI[viewNo].scrollToY(0);
            }

            $imageCanvas[viewNo].setAttribute('style','width:'+$viewers[viewNo]._canvasDisplayWidth+'px; height:'+$viewers[viewNo]._canvasDisplayHeight+'px; margin:0px; z-index: 1');
            $imageScrollPaneAPI[viewNo].reinitialise();
            $tempCanvas[viewNo].setAttribute('style','width:'+$viewers[viewNo]._canvasDisplayWidth+'px; height:'+$viewers[viewNo]._canvasDisplayHeight+'px; margin:0px; z-index: 3');
            $tempScrollPaneAPI[viewNo].reinitialise();
            $annotationCanvas[viewNo].setAttribute('style','width:'+$viewers[viewNo]._canvasDisplayWidth+'px; height:'+$viewers[viewNo]._canvasDisplayHeight+'px; margin:0px; z-index: 4');
            $annotationScrollPaneAPI[viewNo].reinitialise();

            // move scroll
            if ($imageScrollPaneAPI[viewNo].getContentWidth() > $viewers[viewNo]._viewerWidth) {
                if ($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale > $viewers[viewNo]._viewerWidth / 2) {
                    $imageScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerWidth / 2);
                    $tempScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerWidth / 2);
                    $annotationScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerWidth / 2);
                }
            }
            if ($imageScrollPaneAPI[viewNo].getContentHeight() > $viewers[viewNo]._viewerHeight) {
                if ($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale > $viewers[viewNo]._viewerHeight / 2) {
                    $imageScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerHeight / 2);
                    $tempScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerHeight / 2);
                    $annotationScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerHeight / 2);
                }
            }
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
                case DisplayMode.fitWidth:
                    $viewers[viewNo]._currentScale = $viewers[viewNo]._viewerWidth / $viewers[viewNo]._imageWidth;
                    break;
                case DisplayMode.fitHeight:
                    $viewers[viewNo]._currentScale = $viewers[viewNo]._viewerHeight / $viewers[viewNo]._imageHeight;
                    break;
                case DisplayMode.FitWindow:
                    let scale1, scale2;
                    scale1 = $viewers[viewNo]._viewerWidth / $viewers[viewNo]._imageWidth;
                    scale2 = $viewers[viewNo]._viewerHeight / $viewers[viewNo]._imageHeight;
                    $viewers[viewNo]._currentScale = scale1 < scale2 ? scale1 : scale2;
                    break;
                case DisplayMode.fullSize:
                    $viewers[viewNo]._currentScale = 1;
                    break;
                case DisplayMode.zoomIn:
                    $viewers[viewNo]._currentScale += $variable._scaleDistance;
                    $viewers[viewNo]._currentScale = $viewers[viewNo]._currentScale > 1 ? 1 : $viewers[viewNo]._currentScale;
                    break;
                case DisplayMode.zoomOut:
                    $viewers[viewNo]._currentScale -= $variable._scaleDistance;
                    $viewers[viewNo]._currentScale = $viewers[viewNo]._currentScale < $viewers[viewNo]._minScale ? $viewers[viewNo]._minScale : $viewers[viewNo]._currentScale;
                    break;
            }
            $innerFunction._calcInScale(viewNo);
            $innerFunction.resetCanvas(viewNo);
        },

        rotate: function(degree, viewNo) {
            $viewers[viewNo]._rotate += degree;
            $viewers[viewNo]._imageHeight = [$viewers[viewNo]._imageHeight, $viewers[viewNo]._imageWidth];
            $viewers[viewNo]._imageWidth = $viewers[viewNo]._imageHeight[0];
            $viewers[viewNo]._imageHeight = $viewers[viewNo]._imageHeight[1];

            let scale_w = $viewers[viewNo]._viewerWidth / $viewers[viewNo]._imageWidth;
            let scale_h = $viewers[viewNo]._viewerHeight / $viewers[viewNo]._imageHeight;
            $viewers[viewNo]._minScale = scale_h < scale_w ? scale_h : scale_w;

            $imageCanvas[viewNo].width =      $viewers[viewNo]._imageWidth;    $imageCanvas[viewNo].height =      $viewers[viewNo]._imageHeight;
            $tempCanvas[viewNo].width =       $viewers[viewNo]._imageWidth;    $tempCanvas[viewNo].height =       $viewers[viewNo]._imageHeight;
            $annotationCanvas[viewNo].width = $viewers[viewNo]._imageWidth ;   $annotationCanvas[viewNo].height = $viewers[viewNo]._imageHeight;

            $viewers[viewNo]._centerX = $viewers[viewNo]._imageWidth / 2;
            $viewers[viewNo]._centerY = $viewers[viewNo]._imageHeight / 2;

            let ctx = $imageCanvas[viewNo].getContext('2d');
            ctx.translate($viewers[viewNo]._centerX, $viewers[viewNo]._centerY);
            ctx.rotate($viewers[viewNo]._rotate/180*Math.PI);
            ctx.drawImage($image[viewNo], -$viewers[viewNo]._oriImageWidth/2, -$viewers[viewNo]._oriImageHeight/2);
            ctx.rotate(-$viewers[viewNo]._rotate/180*Math.PI);
            ctx.translate(-$viewers[viewNo]._centerX, -$viewers[viewNo]._centerY);

            $innerFunction._calcInScale(viewNo);
            $innerFunction.resetCanvas(viewNo);
        },

        changePage: function(currentPage, viewNo, fromMoveTo) {
            $importVariable.imageInfo[viewNo].currentPage = currentPage;
            $innerFunction.loadImage($importVariable, viewNo, fromMoveTo);
            $('#dummy-currentPage-'+viewNo).val(currentPage);

            $('#'+$variable._wapperId+'-btnPrev-'+viewNo).prop('disabled',false);
            $('#'+$variable._wapperId+'-btnNext-'+viewNo).prop('disabled',false);

            if (parseInt($importVariable.imageInfo[viewNo].currentPage) === 1) {
                $('#'+$variable._wapperId+'-btnPrev-'+viewNo).prop('disabled',true);
            }
            if (parseInt($importVariable.imageInfo[viewNo].currentPage) === parseInt($importVariable.imageInfo[viewNo].totalPage)) {
                $('#'+$variable._wapperId+'-btnNext-'+viewNo).prop('disabled',true);
            }
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
            $viewers[viewNo]._currentScale = Math.min($viewers[viewNo]._viewerWidth/width, $viewers[viewNo]._viewerHeight/height);
            $viewers[viewNo]._currentScale = $viewers[viewNo]._currentScale > 1 ? 1 : $viewers[viewNo]._currentScale;

            $innerFunction._calcInScale(viewNo);
            $innerFunction.resetCanvas(viewNo);
        },

        _calcInScale: function(viewNo) {
            $viewers[viewNo]._canvasDisplayWidth = $viewers[viewNo]._imageWidth * $viewers[viewNo]._currentScale;
            $viewers[viewNo]._canvasDisplayHeight = $viewers[viewNo]._imageHeight * $viewers[viewNo]._currentScale;
        },

        _draw: function(viewNo) {
            // draw image
            console.log("-------------------------------------------");

            $imageCanvas[viewNo].setAttribute('style','width:'+$viewers[viewNo]._canvasDisplayWidth+'px; height:'+$viewers[viewNo]._canvasDisplayHeight+'px; margin:0px; z-index: 1');
            $imageScrollPaneAPI[viewNo].reinitialise();
            $tempCanvas[viewNo].setAttribute('style','width:'+$viewers[viewNo]._canvasDisplayWidth+'px; height:'+$viewers[viewNo]._canvasDisplayHeight+'px; margin:0px; z-index: 3');
            $tempScrollPaneAPI[viewNo].reinitialise();
            $annotationCanvas[viewNo].setAttribute('style','width:'+$viewers[viewNo]._canvasDisplayWidth+'px; height:'+$viewers[viewNo]._canvasDisplayHeight+'px; margin:0px; z-index: 4');
            $annotationScrollPaneAPI[viewNo].reinitialise();

            // move scroll
            if ($imageScrollPaneAPI[viewNo].getContentWidth() > $viewers[viewNo]._viewerWidth) {
                if ($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale > $viewers[viewNo]._viewerWidth / 2) {
                    $imageScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerWidth / 2);
                    $tempScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerWidth / 2);
                    $annotationScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerWidth / 2);
                }
            }
            if ($imageScrollPaneAPI[viewNo].getContentHeight() > $viewers[viewNo]._viewerHeight) {
                if ($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale > $viewers[viewNo]._viewerHeight / 2) {
                    $imageScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerHeight / 2);
                    $tempScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerHeight / 2);
                    $annotationScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $viewers[viewNo]._viewerHeight / 2);
                }
            }
        },

        drawWaterMark: function(viewNo) {
            let context = $watermarkCanvas[viewNo].getContext('2d');
            context.save();
            context.clearRect(0,0,$viewer.width,$viewer.height);
            context.translate($viewer.width / 2, $viewer.height / 2);
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

            if (clearCanvas){ ctx.clearRect(0, 0, $viewers[viewNo]._imageWidth, $viewers[viewNo]._imageHeight); }
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
            ctx.clearRect(0, 0, $viewers[viewNo]._imageWidth, $viewers[viewNo]._imageHeight);
        },

        _clearAnnotationCanvas: function(viewNo) {
            let ctx = $annotationCanvas[0].getContext('2d');
            ctx.clearRect(0, 0, $viewers[viewNo]._imageWidth, $viewers[viewNo]._imageHeight);
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
