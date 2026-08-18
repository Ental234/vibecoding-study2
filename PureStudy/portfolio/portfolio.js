(function(){
  var track = document.getElementById('hobbyTrack');
  var dotsWrap = document.getElementById('hobbyDots');
  if(!track || !dotsWrap) return;

  var realCards = Array.prototype.slice.call(track.children);
  var count = realCards.length;
  if(count === 0) return;

  realCards.forEach(function(_, i){
    var dot = document.createElement('span');
    dot.className = 'hobby-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', function(){
      goToReal(i);
      resetAuto();
    });
    dotsWrap.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  // 첫 카드/마지막 카드를 양 끝에 복제해 순환 시 같은 방향으로 한 칸만 슬라이드되도록 함
  var firstClone = realCards[0].cloneNode(true);
  var lastClone = realCards[count - 1].cloneNode(true);
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);

  // pos: 0=마지막 복제, 1..count=실제 카드, count+1=첫 복제
  var pos = 1;
  var animating = false;
  var autoDelay = 4000;
  var timer = null;

  function render(animate){
    track.style.transition = animate ? '' : 'none';
    track.style.transform = 'translateX(-' + (pos * 100) + '%)';
  }

  function updateDots(){
    var real = (pos - 1 + count) % count;
    dots.forEach(function(dot, i){
      dot.classList.toggle('active', i === real);
    });
  }

  function step(delta){
    if(animating) return;
    animating = true;
    pos += delta;
    render(true);
    updateDots();
  }

  function next(){ step(1); }
  function prevSlide(){ step(-1); }

  function goToReal(i){
    if(animating) return;
    animating = true;
    pos = i + 1;
    render(true);
    updateDots();
  }

  track.addEventListener('transitionend', function(e){
    if(e.propertyName !== 'transform') return;
    animating = false;
    if(pos === count + 1){
      pos = 1;
      render(false);
    } else if(pos === 0){
      pos = count;
      render(false);
    }
  });

  function startAuto(){
    timer = setInterval(next, autoDelay);
  }
  function resetAuto(){
    clearInterval(timer);
    startAuto();
  }

  // ---- drag / swipe ----
  var dragging = false;
  var startX = 0;
  var currentX = 0;
  var containerWidth = 0;

  function getX(e){
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function dragStart(e){
    if(animating) return;
    dragging = true;
    currentX = startX = getX(e);
    containerWidth = track.parentElement.getBoundingClientRect().width;
    clearInterval(timer);
    track.classList.add('dragging');
  }

  function dragMove(e){
    if(!dragging) return;
    currentX = getX(e);
    var delta = currentX - startX;
    track.style.transform = 'translateX(calc(-' + (pos * 100) + '% + ' + delta + 'px))';
  }

  function dragEnd(){
    if(!dragging) return;
    dragging = false;
    track.classList.remove('dragging');

    var delta = currentX - startX;
    if(Math.abs(delta) > containerWidth * 0.15){
      delta < 0 ? next() : prevSlide();
    } else {
      render(true);
    }

    startX = currentX = 0;
    resetAuto();
  }

  track.addEventListener('mousedown', dragStart);
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('mouseup', dragEnd);

  track.addEventListener('touchstart', dragStart, {passive:true});
  track.addEventListener('touchmove', dragMove, {passive:true});
  track.addEventListener('touchend', dragEnd);

  // ---- prev / next 버튼 ----
  var prevBtn = document.getElementById('hobbyPrevBtn');
  var nextBtn = document.getElementById('hobbyNextBtn');

  if(prevBtn){
    prevBtn.addEventListener('click', function(){
      prevSlide();
      resetAuto();
    });
  }
  if(nextBtn){
    nextBtn.addEventListener('click', function(){
      next();
      resetAuto();
    });
  }

  // ---- 휠 스크롤 ----
  var wheelCooldown = false;
  var carouselEl = document.getElementById('hobbyCarousel');
  if(carouselEl){
    carouselEl.addEventListener('wheel', function(e){
      e.preventDefault();
      if(wheelCooldown) return;

      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if(Math.abs(delta) < 10) return;

      wheelCooldown = true;
      setTimeout(function(){ wheelCooldown = false; }, 500);

      if(delta > 0){
        next();
      } else {
        prevSlide();
      }
      resetAuto();
    }, {passive:false});
  }

  render(false);
  updateDots();
  startAuto();
})();
