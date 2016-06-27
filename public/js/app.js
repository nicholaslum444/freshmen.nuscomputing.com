var _ = {};

_.now = Date.now || function() {
  return new Date().getTime();
};

_.throttle = function(func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};
  var later = function() {
    previous = options.leading === false ? 0 : _.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function() {
    var now = _.now();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};

_.padLeft = function(s, l, c) {
  s = s.toString();
  return Array(l - s.length + 1).join(c || "0") + s;
};

var nav = $('nav.global');
$(window).scroll(_.throttle(function(){
  nav.toggleClass('full', $(window).scrollTop() > 0);
}, 100));

$('.menu-btn').click(function(evt){
  $(this).toggleClass('activated');
  $('.full-only').toggleClass('active');
  evt.stopPropagation();
});

$('.show-menu').click(function (evt) {
  nav.addClass('full');
  $('.menu-btn').addClass('activated');
  $('.full-only').addClass('active');
  evt.stopPropagation();
});

$('body').click(function(){
  $('.menu-btn').removeClass('activated');
  $('.full-only').removeClass('active');
});

var videoBanner = $('.video-overlay');

videoBanner.each(function () {
  var $t = $(this); 
  
  // Check connection speed and widow width 
  if (('connection' in window.navigator && 
      window.navigator.connection.type === 'cellular') ||
      $(window).width() < 800)
  {
    return;
  }
  
  // Feature detect for HTML5 video with h.264 support 
  var video = document.createElement('video');
  if (!('canPlayType' in video) || video.canPlayType('video/mp4') === '') {
    return;
  }
  
  video.src = $t.data('video');
  video.controls = false; 
  video.loop = true;
  
  video.addEventListener('loadeddata', function() {
    // If video has enough data
    if (video.readyState > 3) {
      $t.fadeTo(400, 1, function(){ 
          $t.after(video); 
          video.play();
        })
        .fadeTo(400, .5);
    }
  });
  
  // Setup pause button
  $t.find('button').click(function (evt) {
    evt.preventDefault();
    
    // Check if video is playing 
    if (video.currentTime > 0 && ! video.paused && ! video.ended) {
      video.pause();
      
      $(this).find('.fa')
        .removeClass('fa-pause')
        .addClass('fa-play')
        .end()
      .find('span')
        .text('Play'); 
    } else {
      video.play();

      $(this).find('.fa')
        .removeClass('fa-play')
        .addClass('fa-pause')
      .end()
        .find('span')
        .text('Pause');
    }
  }); 
});

// 9th May 2016, GMT-8 timezone 
var signupDate = Date.UTC(2016, 4, 9, -8);

if (signupDate > Date.now()) {
  $('.signup').addClass('disabled');
  
  var updateTime = function () {
    var diff = (signupDate - Date.now()) / 1000,
      s = Math.floor(diff % 60),
      m = Math.floor(diff / 60) % 60,
      h = Math.floor(diff / 3600),
      timeString = [_.padLeft(h, 2), _.padLeft(m, 2), _.padLeft(s, 2)].join(':');

    $('.signup').text('Sign Ups Open In ' + timeString);
  };
  
  setInterval(updateTime, 1000);
  updateTime();
}