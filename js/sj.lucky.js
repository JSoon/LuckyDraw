///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SJ Lucky Draw JavaScript Library v 0.0.1
// jQuery v 1.11.1
//
// Copyright 2014 J.Soon Personal
// Released under the MIT license
//
// Date: 2014-07-08 10:59 pm
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if (window.SJ === undefined) {
    window.SJ = {};
}
SJ.Lucky = {
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 生成限定范围内的随机数
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    randomNum: function (startNum, scope) {
        var scope = scope || 100000; // 默认范围 0 到 100,000
        return Math.floor(startNum + Math.random()*scope); // 随机数为 startNum 到 startNum + scope 之间的数
    },
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 生成不重复的随机数
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    randomNumNoRepeat: function (arr) {
        function noRepeatSort (a, b) {
            return Math.random() > .5 ? -1 : 1;
        }
        return arr.sort(noRepeatSort);
    },
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 两个数组相减，返回一个新数组 arrLeft (规则：smArr 所有的元素必定都出现在 bgArr 中且没有重复)
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    arrFilter: function (bgArr, smArr) {
        var i, j, arrLeft = [];
        for (i = 0; i < bgArr.length; i += 1) {
            arrLeft.push(bgArr[i]);
        }
        for (i = 0; i < smArr.length; i += 1) {
            for (j = 0; j < arrLeft.length; j += 1) {
                if (smArr[i].id === arrLeft[j].id) {
                    delete arrLeft[j];
                    arrLeft.splice(j, 1);
                    continue;
                }
            }
        }
        return arrLeft;
    },
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 抽奖
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    draw: function (list, bBtn, sBtn) {
        var that = this;
        var num = $(list).children().length; // 获取抽奖人的数量
        var arr = [], arrRandom = [], // 创建有序不重复数组 和 无序不重复数组对象
              i = j = 0, t; // 创建循环变量 和 定时器变量
        var callback = arguments[3] ? arguments[3] : function () {};
        var delay1 = arguments[4] ? arguments[4] : 100; // 点击开始按钮后抽奖的延迟时间 draw delay
        var delay2 = arguments[5] ? arguments[5] : 600; // 点击停止按钮多少秒后触发停止定时器 smooth stop draw delay
        var delay3 = arguments[6] ? arguments[6] : 800; // 触发停止定时器后抽奖的延迟时间 before stop draw delay
        var delay4 = arguments[7] ? arguments[7] : 2800; // 多少秒后抽奖停止 stop draw delay
        $.ajax({
            type: 'GET',
            url: 'js/staffsList.json',
            datatype: 'json'
        }).done(function ( data, textStatus, jqXHR ) {
            $(list).empty();
            // arr = eval ('(' + data + ')');
            arr = data;
            for (i = 0; i < arr.length; i += 1) {
                var li = '<li>' +
                    '<div class="sj-avatar-shadow"></div>' +
                    '<img src="' + arr[i].avatar + '" alt="' + arr[i].name + '">' +
                '</li>';
                $(list).append(li);
            }
            // 初始化，打乱抽奖人的顺序
            arrRandom = that.randomNumNoRepeat(arr);
            // 抽奖定时器函数
            function timer (delay) {
                t = setInterval(function () {
                    if (j < arrRandom.length) {
                        $(list).children(':eq(' + arrRandom[j].id + ')').addClass('active').siblings().removeClass('active');
                        j += 1;
                    } else {
                        // 如果所有人都循环完毕还没有按下停止抽奖按钮，则重新打乱抽奖顺序，再次开始循环
                        arrRandom = that.randomNumNoRepeat(arrRandom);
                        j = 0;
                    }
                }, delay);
            }
            // 点击开始抽奖按钮，随机抽取中奖者
            $(bBtn).on('click', function () {
                if (arrRandom.length !== 1) {
                    $(this).prop('disabled', 'disabled').addClass('disabled'); // 抽奖开始时，禁用开始按钮
                    $(sBtn).removeAttr('disabled').removeClass('disabled'); // 抽奖开始时，启用停止按钮
                    timer (delay1);
                }
            });
            // 点击停止抽奖按钮，揭晓中奖者
            $(sBtn).on('click', function () {
                $(this).prop('disabled', 'disabled').addClass('disabled'); // 抽奖停止，禁用停止按钮
                var timeout = setTimeout(function () { // 设置一定延迟的时间，使得停止更平滑
                    clearInterval(t);
                    timer (delay3);
                    timeout = setTimeout(function () {
                        clearInterval(t);
                        // 小红屋
                        var redList = [];
                        for (i = 0; i < arr.length; i += 1) {
                            if (arr[i].RL) {
                                redList.push(arr[i]);
                            }
                        }
                        // 小黑屋
                        var blackList = [];
                        for (i = 0; i < arr.length; i += 1) {
                            if (!arr[i].WL) {
                                blackList.push(arr[i]);
                            }
                        }
                        // 这里有一些逻辑在里边：如果你贿赂了主持人，则你不能得罪主持人；
                        // 反之，如果你已经得罪了主持人，则你不能再去贿赂主持人
                        // Folks in the RL will be chosen for sure.
                        if (redList.length > 0) {
                            var greyTimeout = setTimeout(function () {
                                $(list).children(':eq(' + redList[0].id + ')').attr('class', 'bingo').siblings().removeClass('active'); // Bingo it.
                                callback( $(list).children(':eq(' + redList[0].id + ')') );
                                // Get the luckydog and kick it out from the arrRandom[] in case it being chosen again.
                                for (i = 0; i < arrRandom.length; i += 1) {
                                    if (arrRandom[i].id === redList[0].id) {
                                        delete arrRandom[i];
                                        arrRandom.splice(i, 1); // 将中奖者踢出队列
                                        delete redList[0];
                                        redList.splice(0, 1); // 将已中奖的贿赂者踢出贿赂者队列
                                        break;
                                    }
                                }
                                if (arrRandom.length !== 1) {
                                    $(bBtn).removeAttr('disabled').removeClass('disabled'); // 抽奖结束后，启用开始按钮
                                } else if (arrRandom.length === 1) {
                                    console.log('啊哦，最后一个都抽不到你，杯具啊！');
                                }
                            }, delay3);
                        } else {
                            var luckyDog = $(list).children('li[class="active"]'); // 获取中奖者
                            var luckyIdx = luckyDog.index(); // 获取中奖者的索引号
                            // Folks in the BL can't be chosen forever.
                            if (blackList.length > 0) {
                                var arrLeft = that.arrFilter(arrRandom, blackList);
                                var blackFlag = true; // If the people in the BL be chosen, true by default.
                                for (i = 0; i < blackList.length; i += 1) {
                                    if (blackList[i].id === luckyIdx) {
                                        blackFlag = true;
                                        break;
                                    } else {
                                        blackFlag *= false;
                                    }
                                }
                                if (blackFlag) {
                                    console.log('Yes, he\'s in the BL');
                                    var greyTimeout = setTimeout(function () {
                                        $(list).children(':eq(' + arrLeft[0].id + ')').attr('class', 'bingo').siblings().removeClass('active'); // Bingo it.
                                        callback( $(list).children(':eq(' + arrLeft[0].id + ')') );
                                        for (i = 0; i < arrRandom.length; i += 1) {
                                            if (arrRandom[i].id === arrLeft[0].id) {
                                                delete arrRandom[i];
                                                arrRandom.splice(i, 1);
                                                break;
                                            }
                                        }
                                        if (arrRandom.length !== blackList.length) {
                                            $(bBtn).removeAttr('disabled').removeClass('disabled'); // 抽奖结束后，启用开始按钮
                                        } else if (arrRandom.length === blackList.length) {
                                            console.log('那么多人都抽不到你，自认倒霉吧~！！');
                                        }
                                        console.log('剩下参加奖的人：' + arrRandom);
                                    }, delay3);
                                } else {
                                    console.log('No, he\'s not in the BL');
                                    luckyDog.attr('class', 'bingo'); // Bingo it.
                                    callback(luckyDog);
                                    for (var i = 0; i < arrRandom.length; i += 1) {
                                        if (arrRandom[i].id === luckyIdx) {
                                            delete arrRandom[i];
                                            arrRandom.splice(i, 1); // 将中奖者踢出队列
                                            break;
                                        }
                                    }
                                    if (arrRandom.length !== blackList.length) {
                                        $(bBtn).removeAttr('disabled').removeClass('disabled'); // 抽奖结束后，启用开始按钮
                                    } else if (arrRandom.length === blackList.length) {
                                        console.log('那么多人都抽不到你，自认倒霉吧~！！');
                                    }
                                    console.log('剩下参加奖的人：' + arrRandom);
                                }
                            } else { // Folks in the WL can possiblely be chosen.
                                luckyDog.attr('class', 'bingo'); // Bingo it.
                                callback(luckyDog);
                                for (var i = 0; i < arrRandom.length; i += 1) {
                                    if (arrRandom[i].id === luckyIdx) {
                                        delete arrRandom[i];
                                        arrRandom.splice(i, 1); // 将中奖者踢出队列
                                        break;
                                    }
                                }
                                if (arrRandom.length !== 1) {
                                    $(bBtn).removeAttr('disabled').removeClass('disabled'); // 抽奖结束后，启用开始按钮
                                } else if (arrRandom.length === 1) {
                                    console.log('啊哦，最后一个都抽不到你，杯具啊！');
                                }
                            }
                        }
                    }, delay4); // 3秒钟后停止抽奖
                }, delay2);
            });
        }).fail(function ( jqXHR, textStatus, errorThrown ) {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        });
    },
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 天花板灯光
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ceilingLight: function (lights, status) {
        var that = this,
            delay = 1000;
        var alterOpacity0 = function () {
            delay = that.randomNum(1000, 1600); // 生成随机的灯光闪烁间隔时间
            $(lights+':eq(0)').stop(true, false).animate({ // .stop( [clearQueue ] [, jumpToEnd ] )
                opacity: 0.3
            }, delay, function () {
                $(this).animate({
                    opacity: 0
                }, delay, function () {
                    alterOpacity0();
                });
            });
        }
        var alterOpacity1 = function () {
            delay = that.randomNum(1000, 1600);
            $(lights+':eq(1)').stop(true, false).animate({
                opacity: 0.3
            }, delay, function () {
                $(this).animate({
                    opacity: 0
                }, delay, function () {
                    alterOpacity1();
                });
            });
        }
        var alterOpacity2 = function () {
            delay = that.randomNum(1000, 1600);
            $(lights+':eq(2)').stop(true, false).animate({
                opacity: 0.3
            }, delay, function () {
                $(this).animate({
                    opacity: 0
                }, delay, function () {
                    alterOpacity2();
                });
            });
        }
        if (status === 'on') {
            alterOpacity0();
            alterOpacity1();
            alterOpacity2();
            return 'Ceiling lights on !';
        } else if (status === 'off') {
            var lightsNum = $(lights).length, i;
            for (i = 0; i < lightsNum; i += 1) {
                $(lights+':eq(' + i + ')').stop(true, false).animate({
                    opacity: 0
                }, 1000);
            }
            return 'Ceiling lights off !';
        }
    },
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 大荧幕灯光
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    screenLight: function (light, delay, status) {
        var alterOpacity = function () {
            $(light).stop(true, false).animate({
                opacity: 0.75
            }, delay, function () {
                $(this).animate({
                    opacity: 0.25
                }, delay, function () {
                    alterOpacity();
                });
            });
        }
        if (status === 'on') {
            alterOpacity();
            return 'Screen lights on !';
        } else if (status === 'off') {
            $(light).stop(true, false).animate({
                opacity: 0.25
            }, 1000);
            return 'Screen lights off !';
        }
    }
}

// 初始化灯光
SJ.Lucky.ceilingLight('#sjCeiling .sj-ceiling-light', 'on');
SJ.Lucky.screenLight('#sjScreen', 2000, 'on');

// 初始化抽奖
SJ.Lucky.draw('#sjLuckyList', '#drawBeginBtn', '#drawStopBtn', function (luckyDog) {
    // 获取当前在抽奖池里中奖者相对于 document 的绝对位置
    var oTop = luckyDog.offset().top;
    var oLeft = luckyDog.offset().left;
    // 获取领奖台相对于 document 的绝对位置
    var pTop = $('#sjPodium').offset().top;
    var pLeft = $('#sjPodium').offset().left + 15; // 这里的 15px 的偏移是为了对齐抽奖池里的头像
    // 定义领奖台上中奖者的 CSS 属性
    var bMarginR = 19, bMarginB = -20, bWidth = bHeight =  64,
        bTop = pTop, bLeft = pLeft;
    // 统计已存在中奖者的人数，以此计算出动画的最终坐标位置
    var bNum = $('.sj-bingo').length,
        bNumMax = 10; // 一排的最大人数
    // 克隆中奖者，并重新定义结构
    var bName = luckyDog.children('img').attr('alt'); // 获取中奖者姓名
    bingo = luckyDog.clone().html();
    $bingo = $('<div class="sj-bingo">' + bingo + '<div class="sj-avatar-name">' + bName + '<div class="arrow-bottom"></div></div></div>');
    // 将克隆出来的中奖者放置在抽奖池里中奖者的原始位置
    $bingo.appendTo('body').css({
        top: oTop,
        left: oLeft
    });
    // 动画
    var bNumRem = bNum%bNumMax; // 当前中奖人数和一排最大人数的余数
    var bRowNum = Math.floor(bNum/bNumMax); // 当前排数
    bTop = pTop + bRowNum * (bHeight + bMarginB);
    bLeft = pLeft + bNumRem * (bWidth + bMarginR);
    $bingo.delay(800).animate({
        top: bTop,
        left: bLeft
    }, 600, function () {
        // complete callback
        // 计算中奖者姓名宽度，将其与中奖者头像水平居中对齐
        var bName = $(this).children('.sj-avatar-name');
        var bNameWidth = bName.outerWidth();
        console.log(bNameWidth);
        bName.css({
            left: '50%',
            'margin-left': -bNameWidth/2
        });
        bName.show().addClass('animated bounceInUp');
    });
});