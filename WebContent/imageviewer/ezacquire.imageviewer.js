(function ($) {
    let $imageViewer = null;

    let $imageContain = [];
    let $imageCanvas = [];
    let $imageScrollPaneAPI = [];

    let $annotationContain = [];
    let $annotationCanvas = [];
    let $annotationScrollPaneAPI = [];

    let $watermarkCanvas = [];

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
        FitHeight: { id: "btnFitHeight", css: "fa-arrows-v",        show: true, title: "最適高度"  },
        FitWidth:  { id: "btnFitWidth",  css: "fa-arrows-h",        show: true, title: "最適寬度"  },
        FullSize:  { id: "btnFullSize",  css: "fa-arrows",          show: true, title: "原圖"     },
        ZoomIn:    { id: "btnZoomIn",    css: "fa-search-plus",     show: true, title: "放大"     },
        ZoomOut:   { id: "btnZoomOut",   css: "fa-search-minus",    show: true, title: "縮小"     },
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

    let DisplayMode = { FitWidth: 0, FitHeight: 1, FitWindow: 2, FullSize: 3 };
    let MouseMode = {None: 0, Zoom: 1, Move: 2};
    let AnnoMode = {None: 0, Edit: 1, Del: 2};

    let $mouseTrack = { startX: 0, startY: 0, endX: 0, endY: 0};

    let $importVariable = {
        viewerWidth: 1500, viewerHeight: 600,
        //外部傳入影像資訊
        imageServerUrl: '',
        imageInfo : [{ docId: "", formId: "", currentPage: "", viewPage: "", totalPage: "", viewWidth: 1500, viewHeight: 600 }],
        showMoveTo: true,
        //DisplayMode : { FitWidth: 0, FitHeight: 1, FitWindow: 2, FullSize: 3 };
        initDisplayMode : 3,
        waterMarkText : '',
        displayAfterLoad : true,
        // 沒有 tool 就沒有 annotation
        showAnnotationTool: true
    };

    let $viewers = [];

    let $variable = {
        waterMarkFont: 'bold 60pt Calibri',
        waterMarkFillColor: '#ff0000',
        waterMarkFillAlpha: 0.4,
        waterMarkRotateAngle: 45,

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
//imageviewer - singleDoc

    $.fn.imageviewer = function (options) {
        this.init = function (options) {
            $importVariable = $.extend($importVariable, options);
            $variable._wapperId = `${$(this).attr("id")}`;
            $(`#${$variable._wapperId}`).css({'width' : $importVariable.viewerWidth});
            $variable._showAnnotation = $importVariable.showAnnotationTool;

//---------------------------------------------------------------------------------------------------------------------
//initialize viewersArray
            for (let viewNo in $importVariable.imageInfo){
                if ($viewers[viewNo] === undefined) {
                    for (let i = 0; i < $importVariable.imageInfo.length; i++)
                    {$viewers.push({
                        _docUrl : null,
                        _tiff : null,
                        _minScale: 0.2,
                        _currentScale: 1,
                        _oriImageWidth : null,  _oriImageHeight : null,
                        _imageWidth: 1,         _imageHeight: 1,
                        _centerX: 1,            _centerY: 1,
                        _canvasDisplayWidth: 0, _canvasDisplayHeight: 0,
                        _newX: 0,               _newY: 0,
                        _rotate: 0,
                        _displayMode: DisplayMode.FullSize,
                        _mouseMode: MouseMode.None,
                        _annoMode: AnnoMode.None,
                        _maxClicked: true,
                        _unMaxClicked: false,

                    });
                    }
                }
            }
            for (let viewNo in $importVariable.imageInfo){
                $(`#${$variable._wapperId}`).append(`<div id="View-${viewNo}"></div>`);
                $function.renderAndComponentViewer(viewNo);
            }

        };

        $imageViewer = $.extend($imageViewer,$function);
        this.init(options);
        return $imageViewer;
    };
//----------------------------------------------------------------------------------------------------------------------
//Functions
    let $function = {
        renderAndComponentViewer: function(viewNo) {
//---------------------------------------------------------------------------------------------------------------------
//render toolBar
            if ($variable.showToolBar) {
                $(`#View-${viewNo}`).append(`<div id="dummy-tool-btn-warp-${viewNo}" style="background-color:darkgray; width:${$importVariable.imageInfo[viewNo].viewerWidth}px; z-index: 4"></div>`);
                if (!$importVariable.showAnnotationTool) {
                    $toolsBtn.ShowAnno.show = false;
                    $toolsBtn.HideAnno.show = false;
                    $toolsBtn.EditAnno.show = false;
                    $toolsBtn.DelAnno.show = false;
                }
                for (let i in $toolsBtn) {
                    $(`#dummy-tool-btn-warp-${viewNo}`).append(`
                    <button type="button" id="${$variable._wapperId}-${$toolsBtn[i].id}-${viewNo}" class="tbtn btn-primary" title="${$toolsBtn[i].title}" ><i class="fa ${$toolsBtn[i].css} fa-1x"></i></button>`);
                    if (!$toolsBtn[i].show) {$(`#${$variable._wapperId}-${$toolsBtn[i].id}-${viewNo}`).css({display : 'none'});}
                }
                $(`#${$variable._wapperId}-btnNext-${viewNo}`).after(`<span><input type='text' maxlength=3 style='width:24px;' id=dummy-currentPage-${viewNo}><span id=dummy-totalPage-${viewNo}>/</span></span>`);
                $(`#${$variable._wapperId}-btnUnMax-${viewNo}`).css({float : 'right'});
                $(`#${$variable._wapperId}-btnMax-${viewNo}`).css({float : 'right'});
                if ($viewers[viewNo]._maxClicked){
                    $(`#${$variable._wapperId}-btnUnMax-${viewNo}`).show();
                    $(`#${$variable._wapperId}-btnMax-${viewNo}`).hide();

                } else {
                    $(`#${$variable._wapperId}-btnUnMax-${viewNo}`).hide();
                    $(`#${$variable._wapperId}-btnMax-${viewNo}`).show();
                }
            }
//render viewer
            /*  myId - toolbar
                 - viewerPanel - annotationContain - annotationCanvas (z-index: 4, 所有滑鼠在這一層 listener)
                               - tempCanvas (z-index: 3)
                               - watermarkCanvas (z-index: 2)
                               - imageContain - imageCanvas (z-index: 1)
            */
            $(`#View-${viewNo}`).append(`
            <div id="${$variable._wapperId}-PANEL-${viewNo}" style="width:${viewNo}px; height:${$importVariable.imageInfo[viewNo].viewerHeight}px;">
                <canvas id="watermarkCanvas-${viewNo}" width="${$importVariable.imageInfo[viewNo].viewerWidth}" height="${$importVariable.imageInfo[viewNo].viewerHeight}" style="width:${$importVariable.imageInfo[viewNo].viewerWidth}px; height: ${$importVariable.imageInfo[viewNo].viewerHeight}px; position: absolute; z-index: 2;"></canvas>
                <div id="${$variable._wapperId}-IMAGEDIV-${viewNo}" style="width:${$importVariable.imageInfo[viewNo].viewerWidth}px; height: ${$importVariable.imageInfo[viewNo].viewerHeight}px; padding: 0; text-align: center; position: absolute; z-index: 1;">
                    <canvas id="imageCanvas-${viewNo}"></canvas>
                </div>
                <div id="${$variable._wapperId}-TEMPDIV-${viewNo}" style="width:${$importVariable.imageInfo[viewNo].viewerWidth}px; height: ${$importVariable.imageInfo[viewNo].viewerHeight}px; padding: 0; text-align: center; position: absolute; z-index: 3">
                    <canvas id="tempCanvas-${viewNo}"></canvas>
                </div>
                <div id="${$variable._wapperId}-DRAWDIV-${viewNo}" style="width:${$importVariable.imageInfo[viewNo].viewerWidth}px; height: ${$importVariable.imageInfo[viewNo].viewerHeight}px; padding: 0; text-align: center; position: absolute; z-index: 4">
                    <canvas id="annotationCanvas-${viewNo}"></canvas>
                </div>
            </div>`);

//----------------------------------------------------------------------------------------------------------------------
//set viewer component
            $watermarkCanvas[viewNo] = document.getElementById(`watermarkCanvas-${viewNo}`);
            if ($importVariable.waterMarkText !== '') { $function._drawWaterMark(viewNo);}

            $imageCanvas[viewNo] = document.getElementById(`imageCanvas-${viewNo}`);
            $imageContain[viewNo] = $(`#${$variable._wapperId}-IMAGEDIV-${viewNo}`);
            $imageScrollPaneAPI[viewNo] = $imageContain[viewNo].jScrollPane({ showArrows: false }).data('jsp');

            $tempCanvas[viewNo] = document.getElementById(`tempCanvas-${viewNo}`);
            $tempContain[viewNo] = $(`#${$variable._wapperId}-TEMPDIV-${viewNo}`);
            $tempScrollPaneAPI[viewNo] = $tempContain[viewNo]
                .bind('jsp-scroll-x', function(event, scrollPositionX) {
                    $imageScrollPaneAPI[viewNo].scrollToX(scrollPositionX);
                })
                .bind('jsp-scroll-y', function(event, scrollPositionY) {
                    $imageScrollPaneAPI[viewNo].scrollToY(scrollPositionY);
                })
                .jScrollPane({
                    showArrows: false,
                    horizontalDragMaxWidth: 0,
                    verticalDragMaxHeight: 0
                })
                .data('jsp');

            $annotationCanvas[viewNo] = document.getElementById(`annotationCanvas-${viewNo}`);
            $annotationContain[viewNo] = $(`#${$variable._wapperId}-DRAWDIV-${viewNo}`);
            $annotationScrollPaneAPI[viewNo] = $annotationContain[viewNo]
                .bind('jsp-scroll-x', function(event, scrollPositionX) {
                    $imageScrollPaneAPI[viewNo].scrollToX(scrollPositionX);
                })
                .bind('jsp-scroll-y', function(event, scrollPositionY) {
                    $imageScrollPaneAPI[viewNo].scrollToY(scrollPositionY);
                })
                .jScrollPane({ showArrows: false })
                .data('jsp');

            $function.loadImage($importVariable, viewNo);
            $(`#dummy-currentPage-${viewNo}`).val(`${$importVariable.imageInfo[viewNo].currentPage}`);
            $(`#dummy-totalPage-${viewNo}`).html(` /${$importVariable.imageInfo[viewNo].totalPage}`);
            if ($importVariable.imageInfo[viewNo].currentPage === '1') {$(`#${$variable._wapperId}-btnPrev-${viewNo}`).prop('disabled',true);}
//set toolbar component
            if ($variable.showToolBar) {
                $(`#${$variable._wapperId}-btnFitHeight-${viewNo}`).click(function () {
                    $function.fitHeight(viewNo);
                });
                $(`#${$variable._wapperId}-btnFitWidth-${viewNo}`).click(function () {
                    $function.fitWidth(viewNo);
                });
                $(`#${$variable._wapperId}-btnFullSize-${viewNo}`).click(function () {
                    $function.fullSize(viewNo);
                });
                $(`#${$variable._wapperId}-btnZoomIn-${viewNo}`).click(function () {
                    $function.scaleUp(viewNo);
                });
                $(`#${$variable._wapperId}-btnZoomOut-${viewNo}`).click(function () {
                    $function.scaleDown(viewNo);
                });
                $(`#${$variable._wapperId}-btnRotateCW-${viewNo}`).click(function () {
                    $function.rorateCW(viewNo);
                });
                $(`#${$variable._wapperId}-btnRotateCCW-${viewNo}`).click(function () {
                    $function.rorateCCW(viewNo);
                });

                $(`#${$variable._wapperId}-btnShowAnno-${viewNo}`).click(function () {
                    $variable._showAnnotation = true;
                    $(`#${$variable._wapperId}-btnShowAnno-${viewNo}`).hide();
                    $(`#${$variable._wapperId}-btnHideAnno-${viewNo}`).show();
                    $function._redrawAnnotationCanvas(viewNo);
                });

                $(`#${$variable._wapperId}-btnHideAnno-${viewNo}`).click(function () {
                    $variable._showAnnotation = false;
                    $(`#${$variable._wapperId}-btnHideAnno-${viewNo}`).hide();
                    $(`#${$variable._wapperId}-btnShowAnno-${viewNo}`).show();
                    $function._clearAnnotationCanvas(viewNo);
                });

                $(`#${$variable._wapperId}-btnEditAnno-${viewNo}`).click(function () {
                    if ($viewers[viewNo]._annoMode !== AnnoMode.Edit) {
                        $viewers[viewNo]._annoMode = AnnoMode.Edit;
                        $(`#${$variable._wapperId}-btnEditAnno-${viewNo}`).addClass("btn-active").removeClass("btn-default");
                    } else {
                        $viewers[viewNo]._annoMode = AnnoMode.None;
                        $(`#${$variable._wapperId}-btnEditAnno-${viewNo}`).addClass("btn-default").removeClass("btn-active");
                    }
                });

                $(`#${$variable._wapperId}-btnPrev-${viewNo}`).click(function () {
                    $importVariable.imageInfo[viewNo].currentPage--;
                    $function.loadImage($importVariable, viewNo);
                    $(`#dummy-currentPage-${viewNo}`).val(`${$importVariable.imageInfo[viewNo].currentPage}`);
                    $(`#dummy-totalPage-${viewNo}`).html(` /${$importVariable.imageInfo[viewNo].totalPage}`);
                    if ($importVariable.imageInfo[viewNo].currentPage === 1) {
                        $(`#${$variable._wapperId}-btnPrev-${viewNo}`).prop('disabled',true);
                    }
                    $(`#${$variable._wapperId}-btnNext-${viewNo}`).prop('disabled',false);
                });

                $(`#${$variable._wapperId}-btnNext-${viewNo}`).click(function () {
                    $importVariable.imageInfo[viewNo].currentPage++;
                    $function.loadImage($importVariable, viewNo);
                    $(`#dummy-currentPage-${viewNo}`).val(`${$importVariable.imageInfo[viewNo].currentPage}`);
                    $(`#dummy-totalPage-${viewNo}`).html(` /${$importVariable.imageInfo[viewNo].totalPage}`);
                    if ($importVariable.imageInfo[viewNo].currentPage === parseInt($importVariable.imageInfo[viewNo].totalPage)) {
                        $(`#${$variable._wapperId}-btnNext-${viewNo}`).prop('disabled',true);
                    }
                    $(`#${$variable._wapperId}-btnPrev-${viewNo}`).prop('disabled',false);
                });

                $(`#${$variable._wapperId}-btnUnMax-${viewNo}`).click(function () {
                    $importVariable.imageInfo[viewNo].viewerWidth /= 2;
                    $(`#${$variable._wapperId}-btnUnMax-${viewNo}`).parent().parent().empty();
                    $function.renderAndComponentViewer(viewNo);

                    $(`#${$variable._wapperId}-btnUnMax-${viewNo}`).hide();
                    $(`#${$variable._wapperId}-btnMax-${viewNo}`).show();
                    $viewers[viewNo]._unMaxClicked = true;
                    $viewers[viewNo]._maxClicked = false;
                });

                $(`#${$variable._wapperId}-btnMax-${viewNo}`).click(function () {
                    $importVariable.imageInfo[viewNo].viewerWidth *= 2;
                    $(`#${$variable._wapperId}-btnUnMax-${viewNo}`).parent().parent().empty();
                    $function.renderAndComponentViewer(viewNo);

                    $(`#${$variable._wapperId}-btnMax-${viewNo}`).hide();
                    $(`#${$variable._wapperId}-btnUnMax-${viewNo}`).show();
                    $viewers[viewNo]._maxClicked = true;
                    $viewers[viewNo]._unMaxClicked = false;
                });

                $(`#dummy-currentPage-${viewNo}`).keypress(function (e) {
                    if(e.which === 13) {
                        let currentPage = $(`#dummy-currentPage-${viewNo}`).val();
                        if (currentPage >= 1 && currentPage <= $importVariable.imageInfo[viewNo].totalPage) {
                            $importVariable.imageInfo[viewNo].currentPage = currentPage;
                            $function.loadImage($importVariable, viewNo);
                            $(`#dummy-currentPage-${viewNo}`).val(`${$importVariable.imageInfo[viewNo].currentPage}`);
                            $(`#dummy-totalPage-${viewNo}`).html(` /${$importVariable.imageInfo[viewNo].totalPage}`);
                            $(`#${$variable._wapperId}-btnPrev-${viewNo}`).prop('disabled',false);
                            $(`#${$variable._wapperId}-btnNext-${viewNo}`).prop('disabled',false);

                            switch (currentPage) {
                                case '1' :
                                    $(`#${$variable._wapperId}-btnPrev-${viewNo}`).prop('disabled',true);
                                    break;
                                case $importVariable.imageInfo.totalPage :
                                    $(`#${$variable._wapperId}-btnNext-${viewNo}`).prop('disabled',true);
                                    break;
                            }
                        }else {
                            alert("error");
                            $(`#dummy-currentPage-${viewNo}`).val(1);
                            $importVariable.imageInfo[viewNo].currentPage = $(`#dummy-currentPage-${viewNo}`).val();
                            $function.loadImage($importVariable, viewNo);
                            $(`#dummy-currentPage-${viewNo}`).val(`${$importVariable.imageInfo[viewNo].currentPage}`);
                            $(`#dummy-totalPage-${viewNo}`).html(` /${$importVariable.imageInfo[viewNo].totalPage}`);
                            $(`#${$variable._wapperId}-btnPrev-${viewNo}`).prop('disabled',true);
                            $(`#${$variable._wapperId}-btnNext-${viewNo}`).prop('disabled',false);
                        }
                    }
                })
            }
//----------------------------------------------------------------------------------------------------------------------
//set annotation component
            /*
            // Annotation 編輯的對話框
            if ($annoEditDialog[viewNo] === undefined) {
                $annoEditDialog[viewNo] = new tingle.modal({
                    footer: true,
                    stickyFooter: false,
                    closeMethods: [],
                    //closeLabel: "Close",
                    cssClass: ['custom-class-1', 'custom-class-2'],
                    onOpen: function() {
                        console.log('modal open');
                    },
                    onClose: function() {
                        console.log('modal closed');
                    },
                    beforeClose: function() {
                        // here's goes some logic
                        // e.g. save content before closing the modal
                        return true; // close the modal
                        //return false; // nothing happens
                    }
                });

                $annoEditDialog[viewNo].setContent(`
                <div class='tab'>
                  <button class='tablinks' id='tabText-${viewNo}'>Text</button>
                  <button class='tablinks' id='tabColor-${viewNo}'>Color</button>
                </div>
                <div id='Text-${viewNo}' class='tabcontent'>
                  <textarea rows='4' cols='70' style='border-radius: 4px;' id='${$variable._wapperId}_AnnoText-${viewNo}'></textarea>
                </div>
                <div id='Color-${viewNo}' class='tabcontent'>
                  "Background color: <input name='bgColor' type='color' value='${$variable.annotationDefaultBGColor}'/><br/>
                  "Text color: <input name='textColor' type='color' value='${$variable.annotationDefaultTextColor}'/><br/>
                </div>`);
                $(`#tabText-${viewNo}`).click(function (e) {
                    $function._showTab(e, `Text-${viewNo}`);
                });
                $(`#tabColor-${viewNo}`).click(function (e) {
                    $function._showTab(e, `Color-${viewNo}`);
                });
                document.getElementById(`tabText-${viewNo}`).click();

                $annoEditDialog[viewNo].addFooterBtn('Cancel', 'tingle-btn tingle-btn--primary', function() {
                    // here goes some logic
                    $annoEditDialog[viewNo].close();
                });
                $annoEditDialog[viewNo].addFooterBtn('Save', 'tingle-btn tingle-btn--default', function() {
                    // here goes some logic
                    $annoEditDialog[viewNo].close();
                });
            }
            */
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
                        $function._drawRectangleInTempCanvas($mouseTrack.startX, $mouseTrack.startY, e.offsetX-$mouseTrack.startX, e.offsetY-$mouseTrack.startY, true, false, viewNo);
                        break;
                    case MouseMode.Move :
                        $viewers[viewNo]._newX = $annotationScrollPaneAPI[viewNo].getContentPositionX() - (e.offsetX - $mouseTrack.startX);
                        $viewers[viewNo]._newY = $annotationScrollPaneAPI[viewNo].getContentPositionY() - (e.offsetY - $mouseTrack.startY);

                        $imageScrollPaneAPI[viewNo].scrollTo($viewers[viewNo]._newX,$viewers[viewNo]._newY);
                        $annotationScrollPaneAPI[viewNo].scrollTo($viewers[viewNo]._newX,$viewers[viewNo]._newY);
                        break;
                }
            });

            $annotationCanvas[viewNo].addEventListener('mouseup', function (e) {
                switch ($viewers[viewNo]._mouseMode) {
                    case MouseMode.Zoom :
                        console.log(`x:${$mouseTrack.startX} y:${$mouseTrack.startY} width:${Math.abs($mouseTrack.endX - $mouseTrack.startX)} height:${Math.abs($mouseTrack.endY - $mouseTrack.startY)}`);
                        if ($viewers[viewNo]._annoMode === AnnoMode.Edit) {
                            $annoEditDialog[viewNo].open();
                        } else {
                            $mouseTrack.endX = e.offsetX;
                            $mouseTrack.endY = e.offsetY;
                            $function._clearTempCanvas(viewNo);
                            let x = $mouseTrack.startX < $mouseTrack.endX ? $mouseTrack.startX : $mouseTrack.endX;
                            let y = $mouseTrack.startY < $mouseTrack.endY ? $mouseTrack.startY : $mouseTrack.endY;
                            $function._zoomArea(x/$viewers[viewNo]._currentScale, y/$viewers[viewNo]._currentScale, Math.abs($mouseTrack.endX - $mouseTrack.startX)/$viewers[viewNo]._currentScale, Math.abs($mouseTrack.endY - $mouseTrack.startY)/$viewers[viewNo]._currentScale, viewNo);
                        }
                        break;
                    case MouseMode.Move :
                        $imageScrollPaneAPI[viewNo].scrollTo($viewers[viewNo]._newX,$variable._newY);
                        $annotationScrollPaneAPI[viewNo].scrollTo($viewers[viewNo]._newX,$variable._newY);
                        break;
                }
                $viewers[viewNo]._mouseMode = MouseMode.None;
            });
        },

        loadImage: function(docObject, viewNo) {
            $viewers[viewNo]._rotate = 0;
            if (docObject.showAnnotationTool) { $function.loadAnnotation(); }
            let url = `${docObject.imageServerUrl}?docId=${docObject.imageInfo[viewNo].docId}&currentPage=${docObject.imageInfo[viewNo].currentPage}&type=tiff`;

            if (url !== $viewers[viewNo]._docUrl) {

                $viewers[viewNo]._docUrl = url;
                let xhr = new XMLHttpRequest();
                xhr.responseType = 'arraybuffer';
                xhr.open('GET', url);
                xhr.onload = function () {
                    let t0 = performance.now();
                    $viewers[viewNo]._tiff = new Tiff({buffer: xhr.response});
                    $viewers[viewNo]._oriImageWidth = $viewers[viewNo]._tiff.width(); $viewers[viewNo]._oriImageHeight = $viewers[viewNo]._tiff.height();
                    $viewers[viewNo]._imageWidth = $viewers[viewNo]._oriImageWidth;   $viewers[viewNo]._imageHeight = $viewers[viewNo]._oriImageHeight;

                    $imageCanvas[viewNo].width = $viewers[viewNo]._imageWidth ;       $imageCanvas[viewNo].height = $viewers[viewNo]._imageHeight;
                    $tempCanvas[viewNo].width = $viewers[viewNo]._imageWidth;         $tempCanvas[viewNo].height = $viewers[viewNo]._imageHeight;
                    $annotationCanvas[viewNo].width = $viewers[viewNo]._imageWidth ;  $annotationCanvas[viewNo].height = $viewers[viewNo]._imageHeight;
                    $viewers[viewNo]._centerX = $viewers[viewNo]._imageWidth / 2;     $viewers[viewNo]._centerY = $viewers[viewNo]._imageHeight / 2;

                    let scale_w = docObject.imageInfo[viewNo].viewerWidth / $viewers[viewNo]._imageWidth;
                    let scale_h = docObject.imageInfo[viewNo].viewerHeight / $viewers[viewNo]._imageHeight;
                    $viewers[viewNo]._minScale = scale_h < scale_w ? scale_h : scale_w;

                    $image[viewNo] = new Image();
                    $image[viewNo].src = $viewers[viewNo]._tiff.toDataURL();
                    $image[viewNo].onload = function () {
                        let t1 = performance.now();
                        console.log(`Load image decode tiff, took t1-t0 ${t1 - t0} milliseconds.`);
                        let ctx = $imageCanvas[viewNo].getContext('2d');
                        ctx.drawImage($image[viewNo], 0, 0);
                        if (docObject.displayAfterLoad) {
                            $function._calcDisplayModeScale(docObject.initDisplayMode, viewNo);
                            $function._draw(viewNo);
                        }
                        let t2 = performance.now();
                        console.log(`Load image all done, took t2-t0 ${t2 - t0} milliseconds.`);
                    };
                };
                xhr.send();
            } else {
                $imageCanvas[viewNo].width = $viewers[viewNo]._imageWidth ;       $imageCanvas[viewNo].height = $viewers[viewNo]._imageHeight;
                $tempCanvas[viewNo].width = $viewers[viewNo]._imageWidth;         $tempCanvas[viewNo].height = $viewers[viewNo]._imageHeight;
                $annotationCanvas[viewNo].width = $viewers[viewNo]._imageWidth ;  $annotationCanvas[viewNo].height = $viewers[viewNo]._imageHeight;

                let ctx = $imageCanvas[viewNo].getContext('2d');
                ctx.drawImage($image[viewNo], 0, 0);
                if (docObject.displayAfterLoad) {
                    $function._calcDisplayModeScale(docObject.initDisplayMode, viewNo);
                    $function._draw(viewNo);
                }
            }

            // 如果要顯示 annotation, 就把 annotation 畫出來
            if ($variable._showAnnotation) {
                $function._redrawAnnotationCanvas(viewNo);
            }
        },

        moveTo: function(viewNo, docNo, page, x, y, width, height) {
            if(page !== parseInt($(`#dummy-currentPage-${viewNo}`).val()))
            {
                $importVariable.imageInfo[viewNo].currentPage = page;
                $function.loadImage($importVariable, viewNo);
                $(`#dummy-currentPage-${viewNo}`).val(`${$importVariable.imageInfo[viewNo].currentPage}`);
                $(`#dummy-totalPage-${viewNo}`).html(` /${$importVariable.imageInfo[viewNo].totalPage}`);
                if ($importVariable.imageInfo[viewNo].currentPage === parseInt($importVariable.imageInfo[viewNo].totalPage)) {
                    $(`#${$variable._wapperId}-btnNext-${viewNo}`).prop('disabled',true);
                }
                $(`#${$variable._wapperId}-btnPrev-${viewNo}`).prop('disabled',false);

                setTimeout(function () {$function.zoomArea(x, y, width, height, viewNo);},2000);
            } else {
                $function.zoomArea(x, y, width, height, viewNo);
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

        fitHeight: function(viewNo) {
            $viewers[viewNo]._centerX = $viewers[viewNo]._imageWidth / 2;
            $viewers[viewNo]._centerY = $viewers[viewNo]._imageHeight / 2;

            $viewers[viewNo]._displayMode = DisplayMode.FitHeight;
            $function._calcDisplayModeScale($viewers[viewNo]._displayMode, viewNo);
            $function._draw(viewNo);
        },

        fitWidth: function(viewNo) {
            $viewers[viewNo]._centerX = $viewers[viewNo]._imageWidth / 2;
            $viewers[viewNo]._centerY = $viewers[viewNo]._imageHeight / 2;

            $viewers[viewNo]._displayMode = DisplayMode.FitWidth;
            $function._calcDisplayModeScale($viewers[viewNo]._displayMode, viewNo);
            $function._draw(viewNo);
        },

        fullSize: function(viewNo) {
            $viewers[viewNo]._centerX = $viewers[viewNo]._imageWidth / 2;
            $viewers[viewNo]._centerY = $viewers[viewNo]._imageHeight / 2;

            $viewers[viewNo]._displayMode = DisplayMode.FullSize;
            $function._calcDisplayModeScale($viewers[viewNo]._displayMode, viewNo);
            $function._draw(viewNo);
        },

        scaleUp: function(viewNo) {
            $viewers[viewNo]._currentScale += $variable._scaleDistance;
            $viewers[viewNo]._currentScale = $viewers[viewNo]._currentScale > 1 ? 1 : $viewers[viewNo]._currentScale;

            $function._calcInScale(viewNo);
            $function._draw(viewNo);
        },

        scaleDown: function(viewNo) {
            $viewers[viewNo]._currentScale -= $variable._scaleDistance;
            $viewers[viewNo]._currentScale = $viewers[viewNo]._currentScale < $viewers[viewNo]._minScale ? $viewers[viewNo]._minScale : $viewers[viewNo]._currentScale;

            $function._calcInScale(viewNo);
            $function._draw(viewNo);
        },

        rorateCW: function(viewNo) {
            $function._rotateImage(90, viewNo);
            $function._draw(viewNo);
        },

        rorateCCW: function(viewNo) {
            $function._rotateImage(-90, viewNo);
            $function._draw(viewNo);
        },

        zoomArea: function(x, y, width, height, viewNo) {
            if ($.isNumeric(x) && $.isNumeric(y) && $.isNumeric(width) && $.isNumeric(height)) {
                $function._zoomArea(x, y, width, height, viewNo);
                $function._clearTempCanvas(viewNo);
                //$function._drawRectangle(x, y, width, height, true, true);
                $function._drawRectangleInTempCanvas(x, y, width, height, true, true, viewNo);
            }
        },

        _calcDisplayModeScale: function(displayMode, viewNo) {
            switch (displayMode) {
                case DisplayMode.FitWidth:
                    $viewers[viewNo]._currentScale = $importVariable.imageInfo[viewNo].viewerWidth / $viewers[viewNo]._imageWidth;
                    break;
                case DisplayMode.FitHeight:
                    $viewers[viewNo]._currentScale = $importVariable.imageInfo[viewNo].viewerHeight / $viewers[viewNo]._imageHeight;
                    break;
                case DisplayMode.FitWindow:
                    let scale1, scale2;
                    scale1 = $importVariable.imageInfo[viewNo].viewerWidth / $viewers[viewNo]._imageWidth;
                    scale2 = $importVariable.imageInfo[viewNo].viewerHeight / $viewers[viewNo]._imageHeight;
                    $viewers[viewNo]._currentScale = scale1 < scale2 ? scale1 : scale2;
                    break;
                case DisplayMode.FullSize:
                    $viewers[viewNo]._currentScale = 1;
                    break;
            }
            $function._calcInScale(viewNo);
        },

        _calcInScale: function(viewNo) {
            $viewers[viewNo]._canvasDisplayWidth = $viewers[viewNo]._imageWidth * $viewers[viewNo]._currentScale;
            $viewers[viewNo]._canvasDisplayHeight = $viewers[viewNo]._imageHeight * $viewers[viewNo]._currentScale;
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
            $viewers[viewNo]._currentScale = Math.min($importVariable.imageInfo[viewNo].viewerWidth/width, $importVariable.imageInfo[viewNo].viewerHeight/height);
            $viewers[viewNo]._currentScale = $viewers[viewNo]._currentScale > 1 ? 1 : $viewers[viewNo]._currentScale;

            $function._calcInScale(viewNo);
            $function._draw(viewNo);
        },

        _draw: function(viewNo) {
            // draw image
            console.log("-------------------------------------------");
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
            $imageCanvas[viewNo].setAttribute('style',`width:${$viewers[viewNo]._canvasDisplayWidth}px; height:${$viewers[viewNo]._canvasDisplayHeight}px; margin:0px; z-index: 1`);
            $imageScrollPaneAPI[viewNo].reinitialise();
            $tempCanvas[viewNo].setAttribute('style',`width:${$viewers[viewNo]._canvasDisplayWidth}px; height:${$viewers[viewNo]._canvasDisplayHeight}px; margin:0px; z-index: 3`);
            $tempScrollPaneAPI[viewNo].reinitialise();
            $annotationCanvas[viewNo].setAttribute('style',`width:${$viewers[viewNo]._canvasDisplayWidth}px; height:${$viewers[viewNo]._canvasDisplayHeight}px; margin:0px; z-index: 4`);
            $annotationScrollPaneAPI[viewNo].reinitialise();

            // move scroll
            if ($imageScrollPaneAPI[viewNo].getContentWidth() > $importVariable.imageInfo[viewNo].viewerWidth) {
                if ($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale > $importVariable.imageInfo[viewNo].viewerWidth / 2) {
                    $imageScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $importVariable.imageInfo[viewNo].viewerWidth / 2);
                    $annotationScrollPaneAPI[viewNo].scrollToX($viewers[viewNo]._centerX * $viewers[viewNo]._currentScale - $importVariable.imageInfo[viewNo].viewerWidth / 2);
                }
            }
            if ($imageScrollPaneAPI[viewNo].getContentHeight() > $importVariable.imageInfo[viewNo].viewerHeight) {
                if ($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale > $importVariable.imageInfo[viewNo].viewerHeight / 2) {
                    $imageScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $importVariable.imageInfo[viewNo].viewerHeight / 2);
                    $annotationScrollPaneAPI[viewNo].scrollToY($viewers[viewNo]._centerY * $viewers[viewNo]._currentScale - $importVariable.imageInfo[viewNo].viewerHeight / 2);
                }
            }
        },

        _drawWaterMark: function(viewNo) {
            let context = $watermarkCanvas[viewNo].getContext('2d');
            context.save();
            context.translate($importVariable.imageInfo[viewNo].viewerWidth / 2, $importVariable.imageInfo[viewNo].viewerHeight / 2);
            context.rotate(Math.PI / 4);
            context.textAlign = 'center';
            context.font = $variable.waterMarkFont;
            context.fillStyle = $variable.waterMarkFillColor;
            context.globalAlpha = $variable.waterMarkFillAlpha;
            context.fillText($importVariable.waterMarkText, 0, 10);
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

        _rotateImage: function(degree, viewNo) {
            $viewers[viewNo]._rotate += degree;
            let tmp = $viewers[viewNo]._imageHeight;
            $viewers[viewNo]._imageHeight = $viewers[viewNo]._imageWidth;
            $viewers[viewNo]._imageWidth = tmp;

            let scale_w = $importVariable.imageInfo[viewNo].viewerWidth / $viewers[viewNo]._imageWidth;
            let scale_h = $importVariable.imageInfo[viewNo].viewerHeight / $viewers[viewNo]._imageHeight;
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

            $function._calcInScale(viewNo);
        },

        _clearAnnotationCanvas: function(viewNo) {
            let ctx = $annotationCanvas[0].getContext('2d');
            ctx.clearRect(0, 0, $viewers[viewNo]._imageWidth, $viewers[viewNo]._imageHeight);
        },

        _redrawAnnotationCanvas: function(viewNo) {
            $function._clearAnnotationCanvas(viewNo);

            // loop annotation list
            for (let i=0; i< $annoArray.length; i++) {
                //if ($annoArray[i].page == $imageInfo[viewNo].currentPage) {
                    $function._drawAnnotation($annoArray[i], viewNo);
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
